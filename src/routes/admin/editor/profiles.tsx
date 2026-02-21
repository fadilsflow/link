import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PreviewUser } from '@/lib/preview-context'
import type { BlockType } from '@/components/dashboard/BlockTypeSelector'
import type { BlockFormValues } from '@/lib/block-form'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { ProfileEditor } from '@/components/dashboard/ProfileEditor'
import { BlockList } from '@/components/dashboard/BlockList'
import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import SocialEditor from '@/components/dashboard/SocialEditor'
import { usePreview } from '@/lib/preview-context'
import { BlockTypeSelector } from '@/components/dashboard/BlockTypeSelector'
import { BlockFormDialog } from '@/components/dashboard/BlockFormDialog'
import { blockCreateInputSchema, getDefaultBlockValues } from '@/lib/block-form'

export const Route = createFileRoute('/admin/editor/profiles')({
  component: AdminDashboard,
  loader: async () => {
    return await getDashboardData()
  },
})

type BlockRecord = {
  id: string
  title: string
  url: string
  type?: string
  content?: string
  isEnabled: boolean
  order: number
  syncStatus?: 'saved' | 'saving' | 'unsaved' | 'error'
  errors?: { title?: string; url?: string; content?: string }
}

type BlockFormState = {
  mode: 'create' | 'edit'
  blockId?: string
  values: BlockFormValues
}

function mapBlockToFormValues(block: BlockRecord): BlockFormValues {
  return {
    type: (block.type || 'link') as BlockFormValues['type'],
    title: block.title || '',
    url: block.url || '',
    content: block.content || '',
    isEnabled: block.isEnabled,
  }
}

function AdminDashboard() {
  const queryClient = useQueryClient()
  const hasHydratedRef = useRef(false)
  const { user: previewUser, setUser, setBlocks, updateUser } = usePreview()

  const [localBlocks, setLocalBlocks] = useState<Array<BlockRecord>>([])
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false)
  const [blockFormState, setBlockFormState] = useState<BlockFormState | null>(
    null,
  )

  const queryKey = ['dashboard']

  const { data: dashboardData } = useQuery({
    queryKey,
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!dashboardData?.user) return
    if (!previewUser) {
      setUser(dashboardData.user as unknown as PreviewUser)
    } else {
      updateUser({
        name: dashboardData.user.name,
        title: dashboardData.user.title,
        bio: dashboardData.user.bio,
        image: dashboardData.user.image,
      })
    }
  }, [dashboardData?.user])

  useEffect(() => {
    setBlocks(localBlocks)
  }, [localBlocks, setBlocks])

  useEffect(() => {
    if (hasHydratedRef.current || !dashboardData?.blocks) return

    setLocalBlocks(
      dashboardData.blocks.map((l: any) => ({
        ...l,
        errors: l.errors ?? {},
        syncStatus: l.syncStatus ?? undefined,
      })),
    )

    hasHydratedRef.current = true
  }, [dashboardData?.blocks])

  useEffect(() => {
    if (!hasHydratedRef.current) return
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old
      return { ...old, blocks: localBlocks }
    })
  }, [localBlocks, queryClient])

  const user = dashboardData?.user

  const updateProfile = useMutation({
    mutationKey: ['updateProfile'],
    mutationFn: (data: {
      name?: string
      title?: string
      bio?: string
      image?: string | null
    }) => trpcClient.user.updateProfile.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const createBlock = useMutation({
    mutationKey: ['createBlock'],
    mutationFn: (data: BlockFormValues) => trpcClient.block.create.mutate(data),
  })

  const updateBlockMutation = useMutation({
    mutationKey: ['updateBlock'],
    mutationFn: (data: BlockFormValues & { id: string }) =>
      trpcClient.block.update.mutate(data),
  })

  const reorderBlocks = useMutation({
    mutationKey: ['reorderBlocks'],
    mutationFn: (data: { items: Array<{ id: string; order: number }> }) =>
      trpcClient.block.reorder.mutate(data),
    onSuccess: () => {
      setLocalBlocks((prev) =>
        prev.map((l) => ({
          ...l,
          syncStatus: l.syncStatus === 'saving' ? 'saved' : l.syncStatus,
        })),
      )
    },
  })

  const deleteBlockMutation = useMutation({
    mutationKey: ['deleteBlock'],
    mutationFn: (data: { id: string }) => trpcClient.block.delete.mutate(data),
    onSuccess: (_res, variables) => {
      setLocalBlocks((prev) => prev.filter((l) => l.id !== variables.id))
    },
  })

  const handleProfileSave = async (data: {
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
  }) => {
    updateUser({
      name: data.name,
      title: data.title,
      bio: data.bio,
      image: data.image,
    })

    await updateProfile.mutateAsync({
      name: data.name,
      title: data.title ?? undefined,
      bio: data.bio ?? undefined,
      image: data.image ?? undefined,
    })
  }

  const productOptions = (dashboardData?.products || []).map((product: any) => ({
    id: product.id,
    title: product.title,
  }))

  const withProductTitle = (values: BlockFormValues): BlockFormValues => {
    if (values.type !== 'product') return values
    const selectedProduct = productOptions.find((p) => p.id === values.content)
    return {
      ...values,
      title: selectedProduct?.title || values.title,
    }
  }

  const handleBlockFormSubmit = async (values: BlockFormValues) => {
    const parsed = blockCreateInputSchema.safeParse(withProductTitle(values))
    if (!parsed.success) return

    if (blockFormState?.mode === 'create') {
      const newBlock = await createBlock.mutateAsync(parsed.data)
      setLocalBlocks((prev) => [
        ...prev,
        {
          ...newBlock,
          url: newBlock.url || '',
          content: newBlock.content || '',
          errors: {},
          syncStatus: 'saved',
        },
      ])
      setIsAddBlockOpen(false)
    }

    if (blockFormState?.mode === 'edit' && blockFormState.blockId) {
      const updated = await updateBlockMutation.mutateAsync({
        id: blockFormState.blockId,
        ...parsed.data,
      })

      setLocalBlocks((prev) =>
        prev.map((block) =>
          block.id === updated.id
            ? {
              ...block,
              ...updated,
              url: updated.url || '',
              content: updated.content || '',
              syncStatus: 'saved',
              errors: {},
            }
            : block,
        ),
      )
    }

    setBlockFormState(null)
  }

  const handleToggleBlockEnabled = async (id: string, isEnabled: boolean) => {
    const target = localBlocks.find((block) => block.id === id)
    if (!target) return

    setLocalBlocks((prev) =>
      prev.map((block) =>
        block.id === id ? { ...block, isEnabled, syncStatus: 'saving' } : block,
      ),
    )

    const payload = {
      id,
      ...mapBlockToFormValues({ ...target, isEnabled }),
    }

    try {
      const updated = await updateBlockMutation.mutateAsync(payload)
      setLocalBlocks((prev) =>
        prev.map((block) =>
          block.id === updated.id
            ? {
              ...block,
              ...updated,
              url: updated.url || '',
              content: updated.content || '',
              syncStatus: 'saved',
              errors: {},
            }
            : block,
        ),
      )
    } catch {
      setLocalBlocks((prev) =>
        prev.map((block) =>
          block.id === id ? { ...block, isEnabled: target.isEnabled, syncStatus: 'error' } : block,
        ),
      )
    }
  }

  const handleReorder = (newBlocks: Array<BlockRecord>) => {
    const updates: Array<{ id: string; order: number }> = []
    const updatedLocalBlocks = newBlocks.map((block, index) => {
      const newOrder = index + 1
      if (block.order !== newOrder) {
        updates.push({ id: block.id, order: newOrder })
        return { ...block, order: newOrder }
      }
      return block
    })

    setLocalBlocks(updatedLocalBlocks)
    if (updates.length > 0) {
      reorderBlocks.mutate({ items: updates })
    }
  }

  const handleAddBlockTypeSelect = (type: BlockType) => {
    setBlockFormState({
      mode: 'create',
      values: getDefaultBlockValues(type),
    })
  }

  const handleEditBlock = (id: string) => {
    setIsAddBlockOpen(false)
    const target = localBlocks.find((block) => block.id === id)
    if (!target) return

    setBlockFormState({
      mode: 'edit',
      blockId: id,
      values: mapBlockToFormValues(target),
    })
  }

  if (!user) return null

  return (
    <div className="space-y-4 pb-20">
      <AppHeader>
        <AppHeaderContent title="My Page">
          <AppHeaderDescription>
            Manage the products that appear on your public profile.
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>
      <section>
        <ProfileEditor user={user} onSave={handleProfileSave} />
      </section>

      <section>
        <SocialEditor
          username={user.username ?? ''}
          socialLinks={dashboardData.socialLinks}
        />
      </section>

      <section className="space-y-6">
        <BlockTypeSelector
          open={isAddBlockOpen}
          onOpenChange={(open) => {
            setIsAddBlockOpen(open)
            if (!open && blockFormState?.mode === 'create') {
              setBlockFormState(null)
            }
          }}
          onSelect={handleAddBlockTypeSelect}
        />

        <BlockList
          blocks={localBlocks}
          products={productOptions}
          onEdit={handleEditBlock}
          onToggleEnabled={handleToggleBlockEnabled}
          onReorder={handleReorder}
        />
      </section>

      <BlockFormDialog
        open={!!blockFormState}
        onOpenChange={(open) => {
          if (!open) setBlockFormState(null)
        }}
        mode={blockFormState?.mode || 'create'}
        values={
          blockFormState?.values || getDefaultBlockValues('link')
        }
        products={productOptions}
        submitting={createBlock.isPending || updateBlockMutation.isPending}
        deleting={deleteBlockMutation.isPending}
        onDelete={async () => {
          if (blockFormState?.mode !== 'edit' || !blockFormState.blockId) return
          await deleteBlockMutation.mutateAsync({ id: blockFormState.blockId })
          setBlockFormState(null)
        }}
        onSubmit={handleBlockFormSubmit}
      />
    </div>
  )
}
