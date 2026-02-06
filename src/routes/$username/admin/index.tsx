import { createFileRoute } from '@tanstack/react-router'
import { Eye, Layout, Menu, Plus, User as UserIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
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
  AppHeaderActions,
  AppHeaderContent,
} from '@/components/app-header'
import { AppearancePreview } from '@/components/dashboard/appearance/AppearancePreview'
import { ShareProfileModal } from '@/components/share-profile-modal'
import { BASE_URL } from '@/lib/constans'
import SocialEditor from '@/components/dashboard/SocialEditor'
import { toastManager } from '@/components/ui/toast'

export const Route = createFileRoute('/$username/admin/')({
  component: AdminDashboard,
  loader: async () => {
    return await getDashboardData()
  },
})

const linkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.union([z.literal(''), z.string().url('Invalid URL')]),
})

function AdminDashboard() {
  const queryClient = useQueryClient()
  const { username } = Route.useParams()
  const hasHydratedRef = useRef(false)

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
        title: data.title || undefined,
        bio: data.bio || undefined,
        image: data.image || undefined,
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
            (err as Error)?.message || 'An unexpected error occurred.',
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

  const handleAddBlock = (type: 'link' | 'text') => {
    const tempId = 'temp-' + Date.now()
    const newBlock = {
      id: tempId,
      userId: user!.id,
      title: '',
      url: '',
      type,
      content: type === 'text' ? '' : undefined,
      isEnabled: true,
      order: (localBlocks?.[localBlocks.length - 1]?.order || 0) + 1,
      syncStatus: 'unsaved' as const,
      errors:
        type === 'link'
          ? { title: 'Title is required', url: 'Invalid URL' }
          : { title: 'Title is required' },
    }
    setLocalBlocks((prev) => [...prev, newBlock])
    setIsAddBlockOpen(false)
  }

  if (!user) return null

  return (
    <>
      <AppHeader>
        <AppHeaderContent title="Profile">
          {/* <AppHeaderDescription>
            Manage the products that appear on your public profile.
          </AppHeaderDescription> */}
        </AppHeaderContent>
        <AppHeaderActions>
          <Button
            variant="secondary"
            render={<a href={`/${user.username}`} target="_blank" />}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <ShareProfileModal url={`${BASE_URL}/${user.username}`} />
        </AppHeaderActions>
      </AppHeader>
      {/* left */}
      <main className="grid grid-cols-1 lg:grid-cols-[2.2fr_1.4fr]">
        <div className=" space-y-4 min-h-screen pr-6">
          {/* Top Actions for Mobile */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <span className="text-2xl font-bold font-heading text-zinc-900 focus:outline-none">
              link.
            </span>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {/* Profile Section */}
          <section>
            <ProfileEditor user={user} onSave={handleProfileSave} />
          </section>

          <section>
            <SocialEditor
              userId={user.id}
              username={username}
              socialLinks={dashboardData?.socialLinks || []}
            />
          </section>
          {/* Blocks Section */}
          <section className="space-y-6">
            {/* Add Block Trigger in Dialog */}
            <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
              <DialogTrigger
                render={
                  <Button
                    size={'lg'}
                    className="w-full flex active:scale-[0.98]"
                  />
                }
              >
                <Plus className="h-5 w-5" />
                Add
              </DialogTrigger>
              <DialogContent className="overflow-hidden  border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="font-heading">
                    Add a Block
                  </DialogTitle>
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
                </DialogPanel>
              </DialogContent>
            </Dialog>

            <BlockList
              blocks={localBlocks}
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

        {/* PREVIEW Section */}
        <div className="hidden lg:block min-h-screen bg-muted/30 border-l border-zinc-200">
          <div className="sticky top-24 pt-8">
            <div className="flex flex-col items-center">
              <span className="text-xs font-semibold text-zinc-400 mb-6 uppercase tracking-wider">
                Live Preview
              </span>
              <AppearancePreview user={user} blocks={localBlocks} />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
