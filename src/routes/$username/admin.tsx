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

function Dashboard() {
  const { username } = Route.useParams()
  const { status, dashboardData } = Route.useLoaderData()

  // Access Control: Must be logged in AND current user must match the route username
  if (!status.isLoggedIn || status.user?.username !== username) {
    return <AccessDenied />
  }

  const [activeTab, setActiveTab] = useState('profile')
  const [links, setLinks] = useState(dashboardData?.links || [])

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            {/* Logo Placeholder */}
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
                      <AvatarImage src="/avatar-placeholder.png" />
                      <AvatarFallback>FD</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">fadilsflow</span>
                      <span className="text-xs text-muted-foreground">
                        Personal Account
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <X className="h-4 w-4 rotate-45" />{' '}
                    {/* Using X rotated as a swap icon substitute */}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value="link3.to/CibnMCNM"
                      readOnly
                      className="bg-muted/50 h-9 text-xs pr-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-8 text-muted-foreground hover:bg-transparent"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <Button className="w-full bg-primary/90 hover:bg-primary h-9 text-sm font-medium shadow-none">
                  Customize Profile Link
                </Button>
              </div>

              <div className="py-2.5">
                <nav className="flex flex-col gap-0.5 px-2">
                  <Button
                    variant={activeTab === 'profile' ? 'secondary' : 'ghost'}
                    className={`justify-start gap-3 h-10 px-3 font-medium ${activeTab === 'profile' ? 'bg-muted font-semibold' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <LayoutTemplate className="h-4.5 w-4.5" />
                    Profile
                  </Button>
                  <Button
                    variant={activeTab === 'appearance' ? 'secondary' : 'ghost'}
                    className={`justify-start gap-3 h-10 px-3 font-medium ${activeTab === 'appearance' ? 'bg-muted font-semibold' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTab('appearance')}
                  >
                    <Palette className="h-4.5 w-4.5" />
                    Appearance
                  </Button>
                  <Button
                    variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
                    className={`justify-start gap-3 h-10 px-3 font-medium ${activeTab === 'analytics' ? 'bg-muted font-semibold' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className="h-4.5 w-4.5" />
                    Analytics
                  </Button>
                  <Button
                    variant={activeTab === 'setting' ? 'secondary' : 'ghost'}
                    className={`justify-start gap-3 h-10 px-3 font-medium ${activeTab === 'setting' ? 'bg-muted font-semibold' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTab('setting')}
                  >
                    <Settings className="h-4.5 w-4.5" />
                    Setting
                  </Button>
                </nav>
              </div>

              <div className="mt-8 p-4">
                <div className="rounded-xl border border-dashed border-border p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">
                      Create your own organization
                    </span>
                    <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create your organization and let it grow
                  </p>
                </div>
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
                    <AvatarImage src="/avatar-placeholder.png" />
                    <AvatarFallback className="bg-black text-white text-xl">
                      FD
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-xs font-medium"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 text-xs font-medium"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-w-lg">
                <div className="relative">
                  <Input
                    defaultValue="fadilsflow"
                    className="font-medium pr-10"
                  />
                  <Pencil className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer" />
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Input defaultValue="Software Engineer" className="pr-16" />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                      17/30
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Textarea
                      className="min-h-[100px] resize-none pr-16 text-sm"
                      defaultValue="Full Stack Developer from Indonesia passionate about creating efficient, user-centric web solutions from front-end to back-end."
                    />
                    <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                      127/150
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Block Controls */}
          <div className="flex items-center justify-center gap-4 py-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 shadow-sm bg-background border-muted hover:border-primary/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 shadow-sm bg-background border-muted hover:border-primary/50 transition-colors"
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-12 w-12 shadow-sm bg-background border-muted hover:border-primary/50 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <Button className="w-full h-12 font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add a Block
          </Button>

          {/* Links List */}
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="p-4 space-y-4">
              <div className="bg-background rounded-xl p-4 shadow-sm border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md">
                      <LinkIcon className="h-4 w-4 rotate-45" />
                    </div>
                    <div className="p-1.5 bg-emerald-500 text-white rounded-md">
                      <LayoutTemplate className="h-4 w-4" />
                    </div>
                    <div className="flex items-center bg-muted/50 rounded-md h-8 px-2 relative">
                      <Input
                        defaultValue="Featured Content"
                        className="h-full border-0 bg-transparent shadow-none focus-visible:ring-0 px-1 w-36 text-sm font-medium"
                      />
                      <span className="text-xs text-muted-foreground ml-2">
                        16/50
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    <Trash2 className="h-4 w-4 hover:text-destructive cursor-pointer transition-colors" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-1">
                    <span>Paste link bleow</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>Supported Dapp</span>
                    <div className="flex -space-x-1 items-center">
                      <div className="h-4 w-4 rounded-full bg-black flex items-center justify-center text-[8px] text-white border border-background z-30">
                        X
                      </div>
                      <div className="h-4 w-4 rounded-full bg-blue-500 border border-background z-20"></div>
                      <div className="h-4 w-4 rounded-full bg-red-500 border border-background z-10"></div>
                      <div className="h-4 w-4 rounded-full bg-purple-500 border border-background z-0"></div>
                    </div>
                  </div>

                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="group relative flex items-center gap-3 bg-background border border-border/60 rounded-lg p-2 pl-0 hover:border-primary/50 transition-colors"
                    >
                      <div className="h-8 w-6 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input
                          defaultValue={link.url}
                          className="h-8 text-xs border-0 shadow-none bg-transparent focus-visible:ring-0 px-0 text-muted-foreground/80 w-full"
                        />
                      </div>
                      <div className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
