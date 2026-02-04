import { createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowUpRight, Globe, Link as LinkIcon, X as XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getPublicProfile } from '@/lib/profile-server'
import NotFound from '@/components/NotFound'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/$username/')({
  component: UserProfile,
  loader: async ({ params }) => {
    const data = await getPublicProfile({ data: params.username })
    if (!data) {
      throw notFound()
    }
    return data
  },
  notFoundComponent: NotFound,
})

function UserProfile() {  
  const { user, blocks } = Route.useLoaderData()

  type BgMode = 'banner' | 'wallpaper' | 'color' | 'image'
  type WallpaperStyle = 'flat' | 'gradient' | 'avatar' | 'image'

  const bgType = (user.appearanceBgType as BgMode) ?? 'banner'
  const wallpaperStyle =
    (user.appearanceBgWallpaperStyle as WallpaperStyle) ?? 'flat'
  const bgColor = user.appearanceBgColor
  const bgImage = user.appearanceBgImageUrl

  const isBanner = bgType === 'banner' || !bgType

  const backgroundStyles = isBanner
    ? {
      backgroundImage:
        "url('" +
        (bgImage ||
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop') +
        "')",
    }
    : wallpaperStyle === 'image' || bgType === 'image'
      ? {
        backgroundImage:
          "url('" +
          (bgImage ||
            'https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=1200&auto=format&fit=crop') +
          "')",
      }
      : wallpaperStyle === 'avatar'
        ? {
          background:
            'radial-gradient(circle at center, rgba(15,23,42,0.1), #020617)',
        }
        : {
          background:
            bgColor ||
            (wallpaperStyle === 'gradient' || bgType === 'color'
              ? 'linear-gradient(135deg,#22c55e,#3b82f6,#a855f7)'
              : 'radial-gradient(circle at top, #1f2937, #020617)'),
        }

  const blockStyle = (user.appearanceBlockStyle as
    | 'basic'
    | 'flat'
    | 'shadow') ?? 'basic'
  const blockRadius = (user.appearanceBlockRadius as
    | 'rounded'
    | 'square') ?? 'rounded'

  const cardBase =
    blockStyle === 'flat'
      ? 'bg-white border border-slate-200'
      : blockStyle === 'shadow'
        ? 'bg-white border-none shadow-md'
        : 'bg-white border border-slate-100 shadow-sm'

  const radiusClass = blockRadius === 'rounded' ? 'rounded-2xl' : 'rounded-md'

  return (
    <div className="min-h-screen relative font-sans text-slate-900 bg-gray-50">
      {/* Background Image Header */}
      <div
        className="h-[280px] w-full bg-cover bg-center relative"
        style={backgroundStyles}
      >
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Top Right User Badge */}
        <div className="absolute top-6 right-6 z-10">
          <Button
            variant="secondary"
            className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-xs font-semibold h-8 gap-2 shadow-sm border border-black/5"
          >
            <Avatar className="h-4 w-4">
              <AvatarImage src={user.image || '/avatar-placeholder.png'} />
              <AvatarFallback className="bg-black text-white text-[8px]">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {user.username}
          </Button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-[680px] mx-auto px-4 pb-16 -mt-24 relative z-20 flex flex-col items-center gap-6">
        {/* Profile Card */}
        <Card className="w-full shadow-lg border-none rounded-2xl overflow-visible">
          <CardContent className="pt-0 pb-8 px-6 lg:px-8 relative bg-white rounded-2xl">
            {/* Avatar - Overlapping top */}
            <div className="-mt-12 mb-4 flex justify-start">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-black">
                <AvatarImage src={user.image || '/avatar-placeholder.png'} />
                <AvatarFallback className="bg-black text-white text-2xl font-bold">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold leading-tight flex items-center gap-2">
                  {user.name}
                </h1>
                <p className="text-muted-foreground font-medium text-sm mt-1">
                  {user.title || 'Software Engineer'}
                </p>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                {user.bio ||
                  'Full Stack Developer passionate about creating efficient, user-centric web solutions.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-12 w-12 bg-white border-none shadow-sm hover:bg-gray-50 text-slate-700"
          >
            <XIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-12 w-12 bg-white border-none shadow-sm hover:bg-gray-50 text-slate-700"
          >
            <Globe className="h-5 w-5" />
          </Button>
        </div>

        {/* Blocks List */}
        {blocks.map((block: any) => {
          if (block.type === 'text') {
            return (
              <div key={block.id} className="w-full text-center py-2 space-y-1">
                <h2 className="font-bold text-lg text-slate-800">
                  {block.title}
                </h2>
                {block.content && (
                  <p className="text-slate-600 text-sm">{block.content}</p>
                )}
              </div>
            )
          }

          return (
            <Card
              key={block.id}
              className={cn(
                'w-full overflow-hidden hover:scale-[1.01] transition-all cursor-pointer group',
                cardBase,
                radiusClass,
              )}
              style={{
                backgroundColor: user.appearanceBlockColor || undefined,
              }}
              onClick={() => block.url && window.open(block.url, '_blank')}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-muted/80 transition-colors">
                    <LinkIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <span className="font-semibold text-sm">{block.title}</span>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Card>
          )
        })}

        {/* Footer */}
        <div className="mt-8 mb-4">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-xs font-medium">Powered by</span>
            <span className="font-bold text-lg tracking-tighter text-slate-900">
              BLOCKS
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
