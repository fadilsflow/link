import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import {
  Copy,
  LayoutTemplate,
  Palette,
  BarChart3,
  Settings,
  Plus,
  Loader2,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import { z } from 'zod'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { checkOnboardingStatus } from '@/lib/onboarding-server'
import { getDashboardData } from '@/lib/profile-server'

import { LinkList } from '@/components/dashboard/LinkList'
import { ProfileEditor } from '@/components/dashboard/ProfileEditor'

const linkSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Invalid URL'),
})

export const Route = createFileRoute('/$username/admin')({
  component: Dashboard,
  loader: async () => {
    const status = await checkOnboardingStatus()
    if (!status.isLoggedIn) return { status, dashboardData: null }

    try {
      const dashboardData = await getDashboardData()
      return { status, dashboardData }
    } catch (e) {
      return { status, dashboardData: null }
    }
  },
  notFoundComponent: () => <AccessDenied />,
})

function AccessDenied() {
  const { username } = Route.useParams()
  const { status } = Route.useLoaderData()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <div className="relative flex items-center justify-center w-24 h-24 bg-muted/30 rounded-2xl mb-2">
          <div className="absolute inset-4 border border-border/40 rounded-lg bg-background" />
          <div className="relative z-10 p-3 bg-emerald-50 rounded-xl">
            <div className="bg-emerald-500 rounded-md p-1">
              <Lock className="w-6 h-6 text-white leading-none" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          You have no access to visit this page
        </h1>

        <div className="flex items-center gap-3 w-full justify-center mt-2">
          <Link
            to="/$username"
            params={{ username }}
            className={cn(
              buttonVariants({ variant: 'default' }),
              'min-w-[140px]',
            )}
          >
            View this profile
          </Link>

          {status.user?.username && (
            <Link
              to="/$username"
              params={{ username: status.user.username }}
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'min-w-[140px]',
              )}
            >
              Go to my profile
            </Link>
          )}

          {!status.user?.username && (
            <Link
              to="/"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'min-w-[140px]',
              )}
            >
              Go Home
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  const { username } = Route.useParams()
  const { status, dashboardData: initialData } = Route.useLoaderData()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Access Control
  if (!status.isLoggedIn || status.user?.username !== username) {
    return <AccessDenied />
  }

  const [activeTab, setActiveTab] = useState('profile')
  const [localLinks, setLocalLinks] = useState<any[]>([])
  const [profileStatus, setProfileStatus] = useState<
    'saved' | 'saving' | 'error' | undefined
  >(undefined)

  // Track if we are currently manipulating items to prevent sync overwrites
  const isManipulatingRef = useRef(false)

  // Debounce timers
  const profileDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const linkDebounceRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Realtime Data
  const { data: dashboardData, isFetching: isQueryFetching } = useQuery({
    queryKey: ['dashboard', username],
    queryFn: () => trpcClient.user.getDashboard.query({ username }),
    initialData: initialData,
    refetchOnWindowFocus: false,
  })

  // Sync localLinks with dashboardData only when NOT fetching and not continuously refetching
  useEffect(() => {
    // Only sync if we are not in the middle of a drag/drop or optimistic update sequence
    // AND if we are not awaiting a reorder confirmation (optimistic reorder should persist)
    if (
      dashboardData?.links &&
      !isQueryFetching &&
      !isManipulatingRef.current
    ) {
      setLocalLinks(
        dashboardData.links.map((l: any) => ({
          ...l,
          // Don't set syncStatus on initial load - let it be undefined
          errors: {},
        })),
      )
    }
  }, [dashboardData?.links, isQueryFetching])

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
    onMutate: () => {
      setProfileStatus('saving')
    },
    onSuccess: () => {
      setProfileStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
      router.invalidate()
    },
    onError: () => {
      setProfileStatus('error')
    },
  })

  const createLink = useMutation({
    mutationKey: ['createLink', username],
    mutationFn: (data: { userId: string; title: string; url: string }) =>
      trpcClient.link.create.mutate(data),
    onSuccess: (newLink) => {
      // Replace temp link with real link from server
      setLocalLinks((prev) =>
        prev.map((l) =>
          l.id.startsWith('temp-') &&
          l.title === newLink.title &&
          l.url === newLink.url
            ? { ...newLink, syncStatus: 'saved', errors: {} }
            : l,
        ),
      )
      isManipulatingRef.current = false
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
    onError: (err, variables) => {
      // Mark as error but keep the link
      setLocalLinks((prev) =>
        prev.map((l) =>
          l.title === variables.title && l.url === variables.url
            ? { ...l, syncStatus: 'error' }
            : l,
        ),
      )
      isManipulatingRef.current = false
    },
  })

  const reorderLinks = useMutation({
    mutationKey: ['reorderLinks', username],
    mutationFn: (data: { items: { id: string; order: number }[] }) =>
      trpcClient.link.reorder.mutate(data),
    onMutate: async () => {
      isManipulatingRef.current = true
      // Stop background refetches immediately
      await queryClient.cancelQueries({ queryKey: ['dashboard', username] })
    },
    onSuccess: () => {
      // Update status to saved
      setLocalLinks((prev) =>
        prev.map((l) => ({
          ...l,
          syncStatus: l.syncStatus === 'saving' ? 'saved' : l.syncStatus,
        })),
      )

      // Release lock but DON'T invalidate queries
      // This is local-first: we trust our local state
      setTimeout(() => {
        isManipulatingRef.current = false
      }, 500)
    },
    onError: () => {
      // On error, revert by invalidating
      isManipulatingRef.current = false
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
  })

  const updateLink = useMutation({
    mutationKey: ['updateLink', username],
    mutationFn: (data: {
      id: string
      title?: string
      url?: string
      isEnabled?: boolean
    }) => trpcClient.link.update.mutate(data),
    onMutate: () => {
      // We don't necessarily need to lock unrelated updates, but it's safer
      // isManipulatingRef.current = true
    },
    onSuccess: (updatedLink) => {
      setLocalLinks((prev) =>
        prev.map((l) =>
          l.id === updatedLink.id
            ? { ...l, ...updatedLink, syncStatus: 'saved' }
            : l,
        ),
      )
    },
    onError: (err, variables) => {
      setLocalLinks((prev) =>
        prev.map((l) =>
          l.id === variables.id ? { ...l, syncStatus: 'error' } : l,
        ),
      )
    },
  })

  const deleteLink = useMutation({
    mutationKey: ['deleteLink', username],
    mutationFn: (data: { id: string }) => trpcClient.link.delete.mutate(data),
    onSuccess: (res, variables) => {
      setLocalLinks((prev) => prev.filter((l) => l.id !== variables.id))
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
  })

  // Handlers
  const handleProfileUpdate = (field: string, value: string) => {
    if (!user) return
    // Don't post if value hasn't changed
    if (user[field as keyof typeof user] === value) return

    // Clear existing timer
    if (profileDebounceRef.current) {
      clearTimeout(profileDebounceRef.current)
    }

    // Set status to saving immediately
    setProfileStatus('saving')

    // Debounce: wait 2 seconds after user stops typing
    profileDebounceRef.current = setTimeout(() => {
      updateProfile.mutate({ userId: user.id, [field]: value })
    }, 2000)
  }

  const handleLinkUpdate = (id: string, field: string, value: any) => {
    // 1. Check if value actually changed (Debounce / Anti-spam)
    const targetLink = localLinks.find((l) => l.id === id)
    if (!targetLink) return
    if (targetLink[field] === value) return

    // 2. Update local state immediately
    setLocalLinks((prev) =>
      prev.map((link) => {
        if (link.id !== id) return link
        const updatedLink = { ...link, [field]: value }

        // Validation check
        const errors = { ...link.errors }
        if (field === 'title') {
          if (!value) errors.title = 'Title is required'
          else delete errors.title
        }
        if (field === 'url') {
          const result = linkSchema.safeParse({ title: 'ignore', url: value })
          if (!result.success) errors.url = 'Invalid URL'
          else delete errors.url
        }

        // Check if both title and URL are now valid
        const hasNoErrors = Object.keys(errors).length === 0
        const newStatus = hasNoErrors ? 'saving' : 'unsaved'

        return { ...updatedLink, errors, syncStatus: newStatus }
      }),
    )

    // 3. Clear existing debounce timer for this link
    const existingTimer = linkDebounceRefs.current.get(id)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 4. Get updated link data
    const updatedLink = localLinks.find((l) => l.id === id)
    if (!updatedLink) return

    const updatedData = { ...updatedLink, [field]: value }

    // Validate both fields
    const result = linkSchema.safeParse({
      title: updatedData.title,
      url: updatedData.url,
    })

    // 5. Only POST if both title and URL are valid, with 2-second debounce
    if (result.success) {
      const timer = setTimeout(() => {
        // If this is a temp link, create it on server
        if (id.startsWith('temp-')) {
          createLink.mutate({
            userId: user!.id,
            title: updatedData.title,
            url: updatedData.url,
          })
        } else {
          // Otherwise update existing link
          updateLink.mutate({ id, [field]: value })
        }
        linkDebounceRefs.current.delete(id)
      }, 2000)

      linkDebounceRefs.current.set(id, timer)
    }
  }

  const handleDeleteLink = (id: string) => {
    setLocalLinks((prev) => prev.filter((link) => link.id !== id))
    // Only delete from server if it's not a temp link
    if (!id.startsWith('temp-')) {
      deleteLink.mutate({ id })
    }
  }

  const handleReorder = (newLinks: any[]) => {
    isManipulatingRef.current = true

    // 1. Calculate new orders (1 is top)
    const updates: { id: string; order: number }[] = []
    const updatedLocalLinks = newLinks.map((link, index) => {
      const newOrder = index + 1
      if (link.order !== newOrder) {
        // Only add to updates if it's not a temp link
        if (!link.id.startsWith('temp-')) {
          updates.push({ id: link.id, order: newOrder })
        }
        return { ...link, order: newOrder, syncStatus: 'saving' } // Mark moved items as saving
      }
      return link
    })

    // 2. Update local state
    setLocalLinks(updatedLocalLinks)

    // 3. Trigger mutation if there are changes (only for real links)
    if (updates.length > 0) {
      reorderLinks.mutate({ items: updates })
    } else {
      isManipulatingRef.current = false
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <span className="font-bold text-2xl tracking-tighter">
              LIN<span className="rotate-180 inline-block">K</span>E
            </span>
          </div>

          <Card className="overflow-hidden border-none shadow-sm">
            <CardContent className="p-0">
              <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage
                        src={user.image || '/avatar-placeholder.png'}
                      />
                      <AvatarFallback>
                        {user.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{user.username}</span>
                      <span className="text-xs text-muted-foreground">
                        Personal Account
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={`linke.to/${user.username}`}
                      readOnly
                      className="bg-muted/50 h-9 text-xs pr-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-8 text-muted-foreground hover:bg-transparent"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/${user.username}`,
                        )
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="py-2.5">
                <nav className="flex flex-col gap-0.5 px-2">
                  {['profile', 'appearance', 'analytics', 'settings'].map(
                    (tab) => (
                      <Button
                        key={tab}
                        variant={activeTab === tab ? 'secondary' : 'ghost'}
                        className={`justify-start gap-3 h-10 px-3 font-medium capitalize ${activeTab === tab ? 'bg-muted font-semibold' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab === 'profile' && (
                          <LayoutTemplate className="h-4.5 w-4.5" />
                        )}
                        {tab === 'appearance' && (
                          <Palette className="h-4.5 w-4.5" />
                        )}
                        {tab === 'analytics' && (
                          <BarChart3 className="h-4.5 w-4.5" />
                        )}
                        {tab === 'settings' && (
                          <Settings className="h-4.5 w-4.5" />
                        )}
                        {tab}
                      </Button>
                    ),
                  )}
                </nav>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <ProfileEditor
            user={user}
            status={profileStatus}
            onUpdate={handleProfileUpdate}
          />

          {/* Block Controls */}
          <Button
            className="w-full h-12 font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
            onClick={() => {
              // Create local-only link, don't POST until title and URL are filled
              const tempId = 'temp-' + Date.now()
              const newLink = {
                id: tempId,
                userId: user.id,
                title: '',
                url: '',
                isEnabled: true,
                order: (localLinks?.[localLinks.length - 1]?.order || 0) + 1,
                syncStatus: 'unsaved' as const,
                errors: { title: 'Title is required', url: 'Invalid URL' },
              }
              setLocalLinks((prev) => [...prev, newLink])
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add a Block
          </Button>

          {/* Links List */}
          <LinkList
            links={localLinks}
            onUpdate={handleLinkUpdate}
            onDelete={handleDeleteLink}
            onReorder={handleReorder}
          />
        </div>
      </div>
    </div>
  )
}
