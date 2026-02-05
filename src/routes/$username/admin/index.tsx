import { createFileRoute } from '@tanstack/react-router'
import {
  ChevronRight,
  Eye,
  Layout,
  Menu,
  Plus,
  Settings,
  Share2,
  User as UserIcon,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AppHeader,
  AppHeaderActions,
  AppHeaderContent,
} from '@/components/app-header'
import { ShareProfileModal } from '@/components/share-profile-modal'
import { BASE_URL } from '@/lib/constans'

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
  const [profileStatus, setProfileStatus] = useState<
    'saved' | 'saving' | 'error' | 'unsaved' | undefined
  >(undefined)
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false)

  const isManipulatingRef = useRef(false)
  const profileDebounceRef = useRef<NodeJS.Timeout | null>(null)
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
    }) => trpcClient.user.updateProfile.mutate(data),
    onSuccess: () => {
      setProfileStatus('saved')
    },
    onError: () => {
      setProfileStatus('error')
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

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileStatus(undefined)

    if (profileDebounceRef.current) {
      clearTimeout(profileDebounceRef.current)
    }

    profileDebounceRef.current = setTimeout(() => {
      setProfileStatus('saving')
      updateProfile.mutate({ userId: user!.id, [field]: value })
    }, 1000)
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
      <main className="space-y-8">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer transition-transform active:scale-95">
                <Avatar className="h-24 w-24 ring-4 ring-white shadow-2xl shadow-zinc-200">
                  <AvatarImage src={user.image || ''} />
                  <AvatarFallback className="bg-zinc-900 text-white text-2xl font-bold">
                    {user.name?.slice(0, 2).toUpperCase() || 'US'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white p-2 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                    <Settings className="h-4 w-4 text-zinc-900" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900">
                  {user.name}
                </h1>
                <p className="text-zinc-500 font-medium">@{user.username}</p>
              </div>
            </div>
          </div>

          <ProfileEditor
            user={user}
            onUpdate={handleProfileUpdate}
            status={profileStatus}
          />
        </section>

        {/* Social Icons Placeholder */}
        <div className="flex justify-center items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-full border border-zinc-100 flex items-center justify-center bg-white shadow-sm hover:shadow-md hover:border-zinc-200 transition-all cursor-pointer group">
            <span className="text-lg font-bold text-zinc-900 group-hover:scale-110 transition-transform">
              𝕏
            </span>
          </div>
          <div className="w-12 h-12 rounded-full border border-zinc-100 flex items-center justify-center bg-white shadow-sm hover:shadow-md hover:border-zinc-200 transition-all cursor-pointer group text-zinc-400">
            <Settings className="h-5 w-5 group-hover:text-zinc-900 group-hover:rotate-45 transition-all" />
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-200 flex items-center justify-center bg-zinc-50/50 hover:bg-white hover:border-zinc-300 transition-all cursor-pointer">
            <Plus className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
          </div>
        </div>

        {/* Blocks Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
              Blocks
            </h2>
          </div>

          {/* Add Block Trigger in Dialog */}
          <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
            <DialogTrigger
              render={
                <Button className="w-full h-14 bg-zinc-900 text-white hover:bg-zinc-800 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-xl shadow-zinc-200 transition-all active:scale-[0.98]" />
              }
            >
              <Plus className="h-5 w-5" />
              Add a Block
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
              <DialogHeader className="p-8 pb-4">
                <DialogTitle className="text-2xl font-black text-zinc-900 tracking-tight">
                  Add a Block
                </DialogTitle>
              </DialogHeader>
              <DialogPanel className="p-8 pt-2 grid grid-cols-2 gap-4">
                <div
                  onClick={() => handleAddBlock('link')}
                  className="p-6 bg-white border border-zinc-100 rounded-3xl flex flex-col items-center gap-3 hover:border-zinc-900/10 hover:bg-zinc-50 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center group-hover:bg-zinc-900 transition-colors">
                    <Layout className="h-6 w-6 text-zinc-400 group-hover:text-white" />
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
                  className="p-6 bg-white border border-zinc-100 rounded-3xl flex flex-col items-center gap-3 hover:border-zinc-900/10 hover:bg-zinc-50 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center group-hover:bg-zinc-900 transition-colors">
                    <UserIcon className="h-6 w-6 text-zinc-400 group-hover:text-white" />
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
      </main>
    </>
  )
}
