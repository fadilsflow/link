import { createFileRoute } from '@tanstack/react-router'
import {
  ImageIcon,
  Layout,
  Package,
  PlaySquare,
  Plus,
  User as UserIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import type { PreviewUser } from '@/lib/preview-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { toastManager } from '@/components/ui/toast'
import { usePreview } from '@/lib/preview-context'

export const Route = createFileRoute('/$username/admin/editor/profiles')({
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
  title: z.string().min(1, 'Title is required'),
  content: z.string().url('Invalid image URL'),
  url: z.union([z.literal(''), z.string().url('Invalid URL')]).optional(),
})

const videoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().url('Invalid video URL'),
})

const productSchema = z.object({
  content: z.string().min(1, 'Please select a product'),
})

function AdminDashboard() {
  const queryClient = useQueryClient()
  const { username } = Route.useParams()
  const hasHydratedRef = useRef(false)
  const { setUser, setBlocks } = usePreview()

  const [localBlocks, setLocalBlocks] = useState<Array<any>>([])
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false)

  const isManipulatingRef = useRef(false)
  const blockDebounceRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', username],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  // Sync data to preview context
  useEffect(() => {
    if (dashboardData?.user) {
      setUser(dashboardData.user as unknown as PreviewUser)
    }
  }, [dashboardData?.user, setUser])

  useEffect(() => {
    setBlocks(localBlocks)
  }, [localBlocks, setBlocks])

  useEffect(() => {
    if (hasHydratedRef.current || !dashboardData?.blocks) return

    setLocalBlocks(
      dashboardData.blocks.map((l: any) => ({
        ...l,
        errors: {},
      })),
    )

    hasHydratedRef.current = true
  }, [dashboardData?.blocks])

  const user = dashboardData?.user

  const updateProfile = useMutation({
    mutationKey: ['updateProfile', username],
    mutationFn: (data: {
      userId: string
      name?: string
      title?: string
      bio?: string
      image?: string | null
    }) => trpcClient.user.updateProfile.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
  })

  const createBlock = useMutation({
    mutationKey: ['createBlock', username],
    mutationFn: (data: {
      userId: string
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
    mutationKey: ['reorderBlocks', username],
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
    mutationKey: ['updateBlock', username],
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
    mutationKey: ['deleteBlock', username],
    mutationFn: (data: { id: string }) => trpcClient.block.delete.mutate(data),
    onSuccess: (res, variables) => {
      setLocalBlocks((prev) => prev.filter((l) => l.id !== variables.id))
    },
  })

  const handleProfileSave = async (data: {
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
  }) => {
    return toastManager.promise(
      updateProfile.mutateAsync({
        userId: user!.id,
        name: data.name,
        title: data.title ?? undefined,
        bio: data.bio ?? undefined,
        image: data.image ?? undefined,
      }),
      {
        loading: {
          title: 'Saving profile...',
          description: 'Please wait while we update your profile.',
        },
        success: () => ({
          title: 'Profile saved!',
          description: 'Your profile has been updated successfully.',
        }),
        error: (err: unknown) => ({
          title: 'Failed to save profile',
          description:
            (err as Error).message || 'An unexpected error occurred.',
        }),
      },
    )
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
          title: updatedVal.title,
          content: updatedVal.content || '',
          url: updatedVal.url || '',
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
            userId: user!.id,
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

  const handleAddBlock = (
    type: 'link' | 'text' | 'image' | 'video' | 'product',
  ) => {
    const tempId = 'temp-' + Date.now()
    const newBlock = {
      id: tempId,
      userId: user!.id,
      title: '',
      url: '',
      type,
      content:
        type === 'text' ||
        type === 'image' ||
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
              ? { title: 'Title is required', content: 'Invalid image URL' }
              : type === 'video'
                ? { title: 'Title is required', content: 'Invalid video URL' }
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
          userId={user.id}
          username={username}
          socialLinks={dashboardData.socialLinks}
        />
      </section>

      {/* Blocks Section */}
      <section className="space-y-6">
        {/* Add Block Trigger in Dialog */}
        <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
          <DialogTrigger
            render={
              <Button
                size="lg"
                className="w-full rounded-full flex active:scale-[0.98]"
              />
            }
          >
            <Plus className="h-5 w-5" />
            Add
          </DialogTrigger>
          <DialogContent className="overflow-hidden  border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-heading">Add a Block</DialogTitle>
            </DialogHeader>
            <DialogPanel className="grid grid-cols-2 gap-4">
              <div
                onClick={() => handleAddBlock('link')}
                className="p-6  border border-border/50 rounded-xl flex flex-col items-center gap-3 hover:border-border cursor-pointer group"
              >
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <Layout className="h-6 w-6 text-zinc-400 group-hover:text-zinc-900" />
                </div>
                <span className="text-sm font-bold text-zinc-900">
                  Link Block
                </span>
                <p className="text-[10px] text-zinc-400 text-center leading-tight">
                  Add a link to your website or profile
                </p>
              </div>
              <div
                onClick={() => handleAddBlock('text')}
                className="p-6  border border-border/50 rounded-xl flex flex-col items-center gap-3 hover:border-border cursor-pointer group"
              >
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-zinc-400 group-hover:text-zinc-900" />
                </div>
                <span className="text-sm font-bold text-zinc-900">
                  Text Block
                </span>
                <p className="text-[10px] text-zinc-400 text-center leading-tight">
                  Write a simple message or bio segment
                </p>
              </div>

              <div
                onClick={() => handleAddBlock('image')}
                className="p-6  border border-border/50 rounded-xl flex flex-col items-center gap-3 hover:border-border cursor-pointer group"
              >
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-zinc-400 group-hover:text-zinc-900" />
                </div>
                <span className="text-sm font-bold text-zinc-900">
                  Image Block
                </span>
                <p className="text-[10px] text-zinc-400 text-center leading-tight">
                  Showcase an image with optional click link
                </p>
              </div>
              <div
                onClick={() => handleAddBlock('video')}
                className="p-6  border border-border/50 rounded-xl flex flex-col items-center gap-3 hover:border-border cursor-pointer group"
              >
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <PlaySquare className="h-6 w-6 text-zinc-400 group-hover:text-zinc-900" />
                </div>
                <span className="text-sm font-bold text-zinc-900">
                  Video Block
                </span>
                <p className="text-[10px] text-zinc-400 text-center leading-tight">
                  Embed videos from YouTube, TikTok, and more
                </p>
              </div>
              <div
                onClick={() => handleAddBlock('product')}
                className="p-6  border border-border/50 rounded-xl flex flex-col items-center gap-3 hover:border-border cursor-pointer group"
              >
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-zinc-400 group-hover:text-zinc-900" />
                </div>
                <span className="text-sm font-bold text-zinc-900">
                  Product Block
                </span>
                <p className="text-[10px] text-zinc-400 text-center leading-tight">
                  Feature one product from your existing catalog
                </p>
              </div>
            </DialogPanel>
          </DialogContent>
        </Dialog>

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
