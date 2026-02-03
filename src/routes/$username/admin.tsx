import { createFileRoute } from '@tanstack/react-router'
import {
  LogOut,
  Plus,
  Settings,
  User as UserIcon,
  Layout,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDashboardData } from '@/lib/profile-server'
import { authClient } from '@/lib/auth-client'
import { useEffect, useState, useRef } from 'react'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { ProfileEditor } from '@/components/dashboard/ProfileEditor'
import { BlockList } from '@/components/dashboard/BlockList'
import { z } from 'zod'

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

  const [activeTab, setActiveTab] = useState('profile')
  const [localBlocks, setLocalBlocks] = useState<any[]>([])
  const [profileStatus, setProfileStatus] = useState<
    'saved' | 'saving' | 'error' | 'unsaved' | undefined
  >(undefined)

  // Track if we are currently manipulating items to prevent sync overwrites
  const isManipulatingRef = useRef(false)
  const [debugLocalReorder, setDebugLocalReorder] = useState(false)

  // Debounce timers
  const profileDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const blockDebounceRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Realtime Data
  const { data: dashboardData, isFetching: isQueryFetching } = useQuery({
    queryKey: ['dashboard', username],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    // If we already hydrated or don't have data, skip
    if (hasHydratedRef.current || !dashboardData?.blocks) return

    setLocalBlocks(
      dashboardData.blocks.map((l: any) => ({
        ...l,
        errors: {},
      })),
    )

    // Mark as hydrated so we never overwrite local state with server data again
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
    onSuccess: (updatedUser) => {
      setProfileStatus('saved')
      // DON'T invalidate Dashboard query because it would reset local profile inputs
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
    onError: (err, variables) => {
      setLocalBlocks((prev) =>
        prev.map((b) =>
          b.id.startsWith('temp-') && b.title === variables.title
            ? { ...b, syncStatus: 'error' }
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
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
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
    onError: (err, variables) => {
      setLocalBlocks((prev) =>
        prev.map((l) =>
          l.id === variables.id ? { ...l, syncStatus: 'error' } : l,
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

    const updatedBlock = localBlocks.find((l) => l.id === id)
    if (!updatedBlock) return

    const updatedData = { ...updatedBlock, [field]: value }

    let isValid = true
    if (updatedData.type === 'link') {
      const result = linkSchema.safeParse({
        title: updatedData.title,
        url: updatedData.url,
      })
      isValid = result.success
    } else if (updatedData.type === 'text') {
      const result = textBlockSchema.safeParse({
        title: updatedData.title,
        content: updatedData.content,
      })
      isValid = result.success
    }

    if (isValid) {
      const timer = setTimeout(() => {
        setLocalBlocks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, syncStatus: 'saving' } : l)),
        )

        if (id.startsWith('temp-')) {
          createBlock.mutate({
            userId: user!.id,
            title: updatedData.title,
            url: updatedData.url || '',
            type: updatedData.type,
            content: updatedData.content,
          })
        } else {
          updateBlockMutation.mutate({ id, [field]: value })
        }
        blockDebounceRefs.current.delete(id)
      }, 1000)

      blockDebounceRefs.current.set(id, timer)
    }
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

    if (updates.length > 0 && !debugLocalReorder) {
      reorderBlocks.mutate({ items: updates })
    } else {
      isManipulatingRef.current = false
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900">
              Admin Dashboard
            </h1>
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'gap-2 rounded-full px-4',
                  activeTab === 'profile' && 'bg-zinc-100 text-zinc-900',
                )}
                onClick={() => setActiveTab('profile')}
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'gap-2 rounded-full px-4',
                  activeTab === 'links' && 'bg-zinc-100 text-zinc-900',
                )}
                onClick={() => setActiveTab('links')}
              >
                <Layout className="h-4 w-4" />
                Blocks
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full hidden sm:flex border-zinc-200"
              render={
                <a href={`/${username}`} target="_blank" rel="noreferrer" />
              }
            >
              <ExternalLink className="h-4 w-4" />
              View Profile
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              onClick={async () => {
                await authClient.signOut()
                window.location.href = '/'
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Manage your profile
            </h2>
            <p className="text-zinc-500">
              Personalize your landing page and manage your blocks.
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-6"
          >
            <TabsList className="bg-white border p-1 rounded-full shadow-sm w-fit">
              <TabsTrigger value="profile" className="rounded-full px-6">
                Profile
              </TabsTrigger>
              <TabsTrigger value="links" className="rounded-full px-6">
                Blocks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-0 outline-none">
              <ProfileEditor
                user={user}
                onUpdate={handleProfileUpdate}
                status={profileStatus}
              />
            </TabsContent>

            <TabsContent value="links" className="mt-0 outline-none space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="h-12 font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm rounded-xl"
                  onClick={() => {
                    const tempId = 'temp-' + Date.now()
                    const newBlock = {
                      id: tempId,
                      userId: user.id,
                      title: '',
                      url: '',
                      type: 'link',
                      isEnabled: true,
                      order:
                        (localBlocks?.[localBlocks.length - 1]?.order || 0) + 1,
                      syncStatus: 'unsaved' as const,
                      errors: {
                        title: 'Title is required',
                        url: 'Invalid URL',
                      },
                    }
                    setLocalBlocks((prev) => [...prev, newBlock])
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
                <Button
                  className="h-12 font-semibold bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 shadow-sm rounded-xl"
                  onClick={() => {
                    const tempId = 'temp-' + Date.now()
                    const newBlock = {
                      id: tempId,
                      userId: user.id,
                      title: '',
                      url: '',
                      type: 'text',
                      content: '',
                      isEnabled: true,
                      order:
                        (localBlocks?.[localBlocks.length - 1]?.order || 0) + 1,
                      syncStatus: 'unsaved' as const,
                      errors: { title: 'Heading is required' },
                    }
                    setLocalBlocks((prev) => [...prev, newBlock])
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Text
                </Button>
              </div>

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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
