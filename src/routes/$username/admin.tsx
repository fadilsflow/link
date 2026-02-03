import { createFileRoute } from '@tanstack/react-router'
import {
  Plus,
  Settings,
  User as UserIcon,
  Layout,
  Copy,
  ChevronRight,
  Share2,
  Eye,
  BarChart3,
  Grid,
  Menu,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPanel,
} from '@/components/ui/dialog'
import { getDashboardData } from '@/lib/profile-server'
import React, { useEffect, useState, useRef } from 'react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { ProfileEditor } from '@/components/dashboard/ProfileEditor'
import { BlockList } from '@/components/dashboard/BlockList'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const Route = createFileRoute('/$username/admin')({
  component: AdminDashboard,
  loader: async () => {
    return await getDashboardData()
  },
})

const linkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.union([z.literal(''), z.string().url('Invalid URL')]),
})

const textBlockSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
})

function AdminDashboard() {
  const queryClient = useQueryClient()
  const { username } = Route.useParams()
  const hasHydratedRef = useRef(false)

  const [localBlocks, setLocalBlocks] = useState<any[]>([])
  const [profileStatus, setProfileStatus] = useState<
    'saved' | 'saving' | 'error' | 'unsaved' | undefined
  >(undefined)
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false)

  // Track if we are currently manipulating items to prevent sync overwrites
  const isManipulatingRef = useRef(false)

  // Debounce timers
  const profileDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const blockDebounceRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Realtime Data
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

  // Mutations
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
    mutationFn: (data: { items: { id: string; order: number }[] }) =>
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
    setProfileStatus('saving')
    if (profileDebounceRef.current) {
      clearTimeout(profileDebounceRef.current)
    }

    profileDebounceRef.current = setTimeout(() => {
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
        const newStatus = hasNoErrors ? 'saving' : 'unsaved'

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

  const handleReorder = (newBlocks: any[]) => {
    isManipulatingRef.current = true
    const updates: { id: string; order: number }[] = []
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
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans selection:bg-zinc-900 selection:text-white">
      {/* SIDEBAR */}
      <aside className="w-[320px] bg-white border-r border-[#E5E7EB] p-8 hidden lg:flex flex-col sticky top-0 h-screen">
        <span className="mb-10 text-2xl font-heading">link</span>

        {/* User Switcher Card */}
        <div className="bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl p-4 mb-6 flex items-center gap-3 group cursor-pointer hover:bg-white hover:shadow-sm transition-all duration-300">
          <Avatar className="h-10 w-10 border-2 border-white ring-1 ring-zinc-100 shadow-sm">
            <AvatarImage src={user.image || ''} />
            <AvatarFallback className="bg-zinc-900 text-white text-xs font-bold">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-zinc-900 truncate">
              {user.username}
            </h3>
            <p className="text-[11px] font-medium text-zinc-400">
              Personal Account
            </p>
          </div>
          <ArrowRightLeft className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        </div>

        {/* Profile Link Card */}
        <div className="space-y-3 mb-10">
          <div className="bg-white border border-[#F3F4F6] rounded-2xl p-1 flex items-center shadow-sm">
            <div className="flex-1 px-4 py-2 text-xs font-medium text-zinc-500 bg-[#F9FAFB] rounded-xl truncate">
              link3.to/{user.username}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-zinc-400 hover:text-zinc-900"
              onClick={() => {
                navigator.clipboard.writeText(`link3.to/${user.username}`)
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button className="w-full h-11 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl text-xs font-bold shadow-md shadow-zinc-200 transition-all active:scale-[0.98]">
            Customize Profile Link
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <NavItem icon={<UserIcon />} label="Profile" active />
          <NavItem icon={<Grid />} label="Appearance" />
          <NavItem icon={<BarChart3 />} label="Analytics" />
          <NavItem icon={<Settings />} label="Setting" />
        </nav>

        {/* Bottom Card */}
        <div className="mt-auto bg-white border-2 border-dashed border-zinc-100 rounded-2xl p-5 group cursor-pointer hover:border-zinc-200 hover:bg-[#F9FAFB] transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[13px] font-bold text-zinc-900">
              Create your own organization
            </h4>
            <div className="w-7 h-7 bg-zinc-50 rounded-full flex items-center justify-center group-hover:bg-zinc-900 transition-colors">
              <Plus className="h-4 w-4 text-zinc-400 group-hover:text-white" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Create your organization and let it grow
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 lg:p-12 overflow-y-auto max-w-[1200px] mx-auto w-full">
        <div className="space-y-10">
          {/* Top Actions for Mobile */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <span className="mb-10 text-2xl font-heading">link</span>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {/* Profile Section */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer">
                  <Avatar className="h-20 w-20 ring-4 ring-white shadow-xl shadow-zinc-100">
                    <AvatarImage src={user.image || ''} />
                    <AvatarFallback className="bg-zinc-900 text-white text-xl font-bold">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white p-2 rounded-full shadow-lg scale-90 group-hover:scale-100 transition-transform">
                      <Settings className="h-4 w-4 text-zinc-900" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl px-5 h-11 border-zinc-200 text-zinc-600 font-bold text-xs gap-2 hover:bg-zinc-50"
                  render={<a href={`/${user.username}`} target="_blank" />}
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl px-5 h-11 border-zinc-200 text-zinc-600 font-bold text-xs gap-2 hover:bg-zinc-50"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>

            <ProfileEditor
              user={user}
              onUpdate={handleProfileUpdate}
              status={profileStatus}
            />
          </section>

          {/* Social Icons Placeholder */}
          <div className="flex justify-center items-center gap-4">
            <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <span className="text-lg">𝕏</span>
            </div>
            <div className="w-12 h-12 rounded-full border border-zinc-200 flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer text-zinc-400">
              <Settings className="h-5 w-5" />
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-200 flex items-center justify-center bg-zinc-50 hover:bg-white hover:border-zinc-300 transition-all cursor-pointer">
              <Plus className="h-5 w-5 text-zinc-400" />
            </div>
          </div>

          {/* Blocks Section */}
          <section className="space-y-6">
            {/* Add Block Trigger in Dialog */}
            <Dialog open={isAddBlockOpen} onOpenChange={setIsAddBlockOpen}>
              <DialogTrigger
                render={
                  <Button className="w-full h-14 bg-zinc-900 text-white hover:bg-zinc-800 rounded-2xl text-sm font-bold shadow-xl shadow-zinc-200 transition-all active:scale-[0.99] flex items-center justify-center gap-2" />
                }
              >
                <Plus className="h-5 w-5" />
                Add a Block
              </DialogTrigger>
              <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
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
        </div>
      </main>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300',
        active
          ? 'bg-[#F3F4F6] text-zinc-900 shadow-sm'
          : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50',
      )}
    >
      <div
        className={cn(
          'p-0 transition-colors group-hover:text-zinc-900',
          active ? 'text-zinc-900' : 'text-zinc-300',
        )}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: 'h-5 w-5',
        })}
      </div>
      <span className="text-[14px] font-bold tracking-tight">{label}</span>
      {active && <ChevronRight className="ml-auto h-4 w-4 text-zinc-300" />}
    </div>
  )
}
