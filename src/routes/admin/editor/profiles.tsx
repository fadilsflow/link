import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import type { PreviewUser } from '@/lib/preview-context'
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
import {
  BlockTypeSelector,
  type BlockType,
} from '@/components/dashboard/BlockTypeSelector'

export const Route = createFileRoute('/admin/editor/profiles')({
  component: AdminDashboard,
  loader: async () => {
    return await getDashboardData()
  },
})

const linkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.union([z.literal(''), z.string().url('Invalid URL')]),
})

const imageSchema = z.object({
  content: z.string().url('Invalid image URL'),
  url: z.union([z.literal(''), z.string().url('Invalid URL')]).optional(),
})

const videoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().url('Invalid video URL'),
})

const discordSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Invalid URL'),
})

const telegramSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z
    .string()
    .regex(/^[a-zA-Z0-9_]{5,32}$/, 'Invalid Telegram username'),
})

const productSchema = z.object({
  content: z.string().min(1, 'Please select a product'),
})

function AdminDashboard() {
  const queryClient = useQueryClient()
  const hasHydratedRef = useRef(false)
  const { user: previewUser, setUser, setBlocks, updateUser } = usePreview()

  // Local-first state — stable object references, no DnD flicker
  const [localBlocks, setLocalBlocks] = useState<Array<any>>([])
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false)

  const isManipulatingRef = useRef(false)
  const blockDebounceRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const queryKey = ['dashboard']

  const { data: dashboardData } = useQuery({
    queryKey,
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  // Sync user data to preview context.
  // Only do a full setUser() on first load (preview is null).
  // After that, use updateUser() to merge profile-specific fields only —
  // this preserves appearance fields that may have been set by the appearance page.
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

  // Sync blocks to preview context
  useEffect(() => {
    setBlocks(localBlocks)
  }, [localBlocks, setBlocks])

  // One-time hydration from cache on mount.
  // hasHydratedRef prevents server data from overwriting local state (DnD fix per DRAG_AND_DROP_FIX.md).
  // On remount, hasHydratedRef resets to false, but the cache already has our latest
  // local changes (synced below), so hydrating from it is correct.
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

  // Sync local blocks back to query cache so navigating away and back preserves changes.
  // This is the fix for the "state reset on navigation" bug — the cache always has the
  // latest local state, so the one-time hydration above reads correct data on remount.
  useEffect(() => {
    if (!hasHydratedRef.current) return // Don't sync before initial hydration
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
    mutationFn: (data: {
      title: string
      url: string
      type?: string
      content?: string
    }) => trpcClient.block.create.mutate(data),
    onSuccess: (newBlock) => {
      setLocalBlocks((prev) =>
        prev.map((b) =>
          b.id.startsWith('temp-') &&
          b.title === newBlock.title &&
          b.url === newBlock.url &&
          b.type === newBlock.type
            ? { ...newBlock, syncStatus: 'saved', errors: {} }
            : b,
        ),
      )
      isManipulatingRef.current = false
    },
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
      isManipulatingRef.current = false
    },
  })

  const updateBlockMutation = useMutation({
    mutationKey: ['updateBlock'],
    mutationFn: (data: {
      id: string
      title?: string
      url?: string
      type?: string
      content?: string
      isEnabled?: boolean
    }) => trpcClient.block.update.mutate(data),
    onSuccess: (updatedBlock) => {
      setLocalBlocks((prev) =>
        prev.map((l) =>
          l.id === updatedBlock.id
            ? { ...l, ...updatedBlock, syncStatus: 'saved' }
            : l,
        ),
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
    // Update preview context immediately for instant visual feedback
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

  const handleBlockUpdate = (id: string, field: string, value: any) => {
    const targetBlock = localBlocks.find((l) => l.id === id)
    if (!targetBlock) return
    if (targetBlock[field] === value) return

    setLocalBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== id) return block
        const updatedBlock = { ...block, [field]: value }

        const errors = { ...block.errors }
        if (field === 'title') {
          if (!value) errors.title = 'Title is required'
          else delete errors.title
        }

        if (field === 'url' && block.type === 'link') {
          const result = linkSchema.safeParse({ title: 'ignore', url: value })
          if (!result.success) errors.url = 'Invalid URL'
          else delete errors.url
        }

        if (field === 'content' && block.type === 'image') {
          const result = z
            .string()
            .url()
            .safeParse(value || '')
          if (!result.success) errors.content = 'Invalid image URL'
          else delete errors.content
        }

        if (field === 'url' && block.type === 'image') {
          const result = z
            .union([z.literal(''), z.string().url()])
            .safeParse(value || '')
          if (!result.success) errors.url = 'Invalid URL'
          else delete errors.url
        }

        if (field === 'url' && block.type === 'discord') {
          const result = z
            .string()
            .url()
            .safeParse(value || '')
          if (!result.success) errors.url = 'Invalid URL'
          else delete errors.url
        }

        if (field === 'content' && block.type === 'telegram') {
          const result = z
            .string()
            .regex(/^[a-zA-Z0-9_]{5,32}$/)
            .safeParse(value || '')
          if (!result.success) errors.content = 'Invalid Telegram username'
          else delete errors.content
        }

        if (field === 'content' && block.type === 'video') {
          const result = z
            .string()
            .url()
            .safeParse(value || '')
          if (!result.success) errors.content = 'Invalid video URL'
          else delete errors.content
        }

        if (field === 'content' && block.type === 'product') {
          if (!value) errors.content = 'Please select a product'
          else delete errors.content
        }

        const hasNoErrors = Object.keys(errors).length === 0
        const newStatus = hasNoErrors ? undefined : 'unsaved'

        return { ...updatedBlock, errors, syncStatus: newStatus }
      }),
    )

    const existingTimer = blockDebounceRefs.current.get(id)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      const currentBlock = localBlocks.find((l) => l.id === id)
      if (!currentBlock) return

      const updatedVal = { ...currentBlock, [field]: value }

      let isValid = true
      if (updatedVal.type === 'link') {
        isValid = linkSchema.safeParse({
          title: updatedVal.title,
          url: updatedVal.url,
        }).success
      } else if (updatedVal.type === 'text') {
        isValid = !!updatedVal.title
      } else if (updatedVal.type === 'image') {
        isValid = imageSchema.safeParse({
          content: updatedVal.content || '',
          url: updatedVal.url || '',
        }).success
      } else if (updatedVal.type === 'discord') {
        isValid = discordSchema.safeParse({
          title: updatedVal.title,
          url: updatedVal.url || '',
        }).success
      } else if (updatedVal.type === 'telegram') {
        isValid = telegramSchema.safeParse({
          title: updatedVal.title,
          content: updatedVal.content || '',
        }).success
      } else if (updatedVal.type === 'video') {
        isValid = videoSchema.safeParse({
          title: updatedVal.title,
          content: updatedVal.content || '',
        }).success
      } else if (updatedVal.type === 'product') {
        isValid = productSchema.safeParse({
          content: updatedVal.content || '',
        }).success
      }

      if (isValid) {
        setLocalBlocks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, syncStatus: 'saving' } : b)),
        )
        if (id.startsWith('temp-')) {
          createBlock.mutate({
            title: updatedVal.title,
            url: updatedVal.url || '',
            type: updatedVal.type,
            content: updatedVal.content,
          })
        } else {
          updateBlockMutation.mutate({ id, [field]: value })
        }
      }
      blockDebounceRefs.current.delete(id)
    }, 1000)

    blockDebounceRefs.current.set(id, timer)
  }

  const handleDeleteBlock = (id: string) => {
    setLocalBlocks((prev) => prev.filter((block) => block.id !== id))
    if (!id.startsWith('temp-')) {
      deleteBlockMutation.mutate({ id })
    }
  }

  const handleReorder = (newBlocks: Array<any>) => {
    isManipulatingRef.current = true
    const updates: Array<{ id: string; order: number }> = []
    const updatedLocalBlocks = newBlocks.map((block, index) => {
      const newOrder = index + 1
      if (block.order !== newOrder) {
        if (!block.id.startsWith('temp-')) {
          updates.push({ id: block.id, order: newOrder })
        }
        return { ...block, order: newOrder }
      }
      return block
    })

    setLocalBlocks(updatedLocalBlocks)
    if (updates.length > 0) {
      reorderBlocks.mutate({ items: updates })
    } else {
      isManipulatingRef.current = false
    }
  }

  const handleAddBlock = (type: BlockType) => {
    const tempId = 'temp-' + Date.now()
    const defaultTitle =
      type === 'discord' ? 'Discord' : type === 'telegram' ? 'Telegram' : ''
    const newBlock = {
      id: tempId,
      title: defaultTitle,
      url: '',
      type,
      content:
        type === 'text' ||
        type === 'image' ||
        type === 'telegram' ||
        type === 'video' ||
        type === 'product'
          ? ''
          : undefined,
      isEnabled: true,
      order: (localBlocks[localBlocks.length - 1]?.order || 0) + 1,
      syncStatus: 'unsaved' as const,
      errors:
        type === 'link'
          ? { title: 'Title is required', url: 'Invalid URL' }
          : type === 'text'
            ? { title: 'Title is required' }
            : type === 'image'
              ? { content: 'Invalid image URL' }
              : type === 'discord'
                ? { url: 'Invalid URL' }
                : type === 'telegram'
                  ? { content: 'Invalid Telegram username' }
                  : type === 'video'
                    ? {
                        title: 'Title is required',
                        content: 'Invalid video URL',
                      }
                    : { content: 'Please select a product' },
    }
    setLocalBlocks((prev) => [...prev, newBlock])
    setIsAddBlockOpen(false)
  }

  if (!user) return null

  return (
    <div className="space-y-4 pb-20">
      <AppHeader>
        <AppHeaderContent title="Profile">
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

      {/* Blocks Section */}
      <section className="space-y-6">
        <BlockTypeSelector
          open={isAddBlockOpen}
          onOpenChange={setIsAddBlockOpen}
          onSelect={handleAddBlock}
        />

        <BlockList
          blocks={localBlocks}
          products={dashboardData.products.map((product: any) => ({
            id: product.id,
            title: product.title,
          }))}
          onUpdate={handleBlockUpdate}
          onDelete={handleDeleteBlock}
          onReorder={handleReorder}
          onDragStart={() => {
            isManipulatingRef.current = true
          }}
          onDragCancel={() => {
            isManipulatingRef.current = false
          }}
        />
      </section>
    </div>
  )
}
