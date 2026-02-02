import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Camera,
  Copy,
  Globe,
  GripVertical,
  LayoutTemplate,
  Link as LinkIcon,
  Palette,
  Plus,
  Settings,
  Share2,
  Trash2,
  BarChart3,
  X,
  Eye,
  Pencil,
  Lock,
  Loader2,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { checkOnboardingStatus } from '@/lib/onboarding-server'

import { getDashboardData } from '@/lib/profile-server'

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
          {/* Document shape hint */}
          <div className="absolute inset-4 border border-border/40 rounded-lg bg-background" />
          {/* Lock Icon */}
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

import { useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

// ... existing AccessDenied ...

function Dashboard() {
  const { username } = Route.useParams()
  const { status, dashboardData } = Route.useLoaderData()
  const router = useRouter()
  // const utils = trpc.useUtils() // Not available

  // Access Control
  if (!status.isLoggedIn || status.user?.username !== username) {
    return <AccessDenied />
  }

  const [activeTab, setActiveTab] = useState('profile')

  const links = dashboardData?.links || []
  const user = dashboardData?.user

  // Mutations
  const updateProfile = useMutation({
    mutationFn: (data: {
      userId: string
      name?: string
      title?: string
      bio?: string
    }) => trpcClient.user.updateProfile.mutate(data),
    onSuccess: () => router.invalidate(),
  })

  const createLink = useMutation({
    mutationFn: (data: { userId: string }) =>
      trpcClient.link.create.mutate(data),
    onSuccess: () => router.invalidate(),
  })

  const updateLink = useMutation({
    mutationFn: (data: {
      id: string
      title?: string
      url?: string
      isEnabled?: boolean
    }) => trpcClient.link.update.mutate(data),
    onSuccess: () => router.invalidate(),
  })

  const deleteLink = useMutation({
    mutationFn: (data: { id: string }) => trpcClient.link.delete.mutate(data),
    onSuccess: () => router.invalidate(),
  })

  // Handlers
  const handleProfileUpdate = (field: string, value: string) => {
    if (!user) return
    updateProfile.mutate({ userId: user.id, [field]: value })
  }

  const handleAddLink = () => {
    if (!user) return
    createLink.mutate({ userId: user.id })
  }

  const handleLinkUpdate = (id: string, field: string, value: string) => {
    updateLink.mutate({ id, [field]: value })
  }

  const handleDeleteLink = (id: string) => {
    deleteLink.mutate({ id })
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
          {/* Top Profile Card */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="relative group cursor-pointer">
                  <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
                    <AvatarImage
                      src={user.image || '/avatar-placeholder.png'}
                    />
                    <AvatarFallback className="bg-black text-white text-xl">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Image upload placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/$username"
                    params={{ username }}
                    // (session.user as any).username
                    target="_blank"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 text-xs font-medium"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-4 max-w-lg">
                <div className="relative">
                  <Input
                    defaultValue={user.name}
                    className="font-medium pr-10"
                    onBlur={(e) => handleProfileUpdate('name', e.target.value)}
                  />
                  <Pencil className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      defaultValue={user.title || ''}
                      placeholder="Job Title (e.g. Software Engineer)"
                      className="pr-16"
                      onBlur={(e) =>
                        handleProfileUpdate('title', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Textarea
                      className="min-h-[100px] resize-none pr-16 text-sm"
                      placeholder="Bio"
                      defaultValue={user.bio || ''}
                      onBlur={(e) => handleProfileUpdate('bio', e.target.value)}
                    />
                  </div>
                </div>

                {updateProfile.isPending && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Block Controls */}
          <Button
            className="w-full h-12 font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
            onClick={handleAddLink}
            disabled={createLink.isPending}
          >
            {createLink.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add a Block
          </Button>

          {/* Links List */}
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3">
                {links.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No links yet. Add one to get started!
                  </div>
                )}

                {links.map((link) => (
                  <div
                    key={link.id}
                    className="group relative flex flex-col gap-3 bg-background border border-border/60 rounded-xl p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Link
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="pl-7 space-y-3">
                      <div className="grid gap-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Title
                        </label>
                        <Input
                          defaultValue={link.title}
                          className="h-9"
                          onBlur={(e) =>
                            handleLinkUpdate(link.id, 'title', e.target.value)
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          URL
                        </label>
                        <Input
                          defaultValue={link.url}
                          className="h-9"
                          placeholder="https://..."
                          onBlur={(e) =>
                            handleLinkUpdate(link.id, 'url', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
