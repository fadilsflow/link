import {
  ArrowUpRight,
  Globe,
  Link as LinkIcon,
  PlayCircle,
  X as XIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AppearancePreviewProps {
  user: {
    username: string | null
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
    appearanceBgImageUrl?: string | null
  }
  blocks: Array<{
    id: string
    title: string
    url: string
    type?: string
    content?: string
    isEnabled: boolean
  }>
}

export function AppearancePreview({ user, blocks }: AppearancePreviewProps) {
  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className="aspect-9/18 w-full max-w-[280px] overflow-hidden rounded-[32px] border-3 bg-muted relative">
        <div className="h-full w-full no-scrollbar overflow-y-auto overflow-x-hidden bg-background">
          <div className="min-h-full pb-8">
            <div
              className="relative h-32 w-full"
              style={
                user.appearanceBgImageUrl
                  ? {
                      backgroundImage: `url('${user.appearanceBgImageUrl}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              <div className="absolute inset-0 bg-black/5" />
            </div>

            <div className="px-4 -mt-10 mb-6 flex flex-col items-center relative z-10">
              <Avatar className="h-20 w-20 ring-4 ring-white shadow-md bg-white">
                <AvatarImage src={user.image || ''} />
                <AvatarFallback className="bg-zinc-900 text-white">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-sm font-semibold mt-3 text-center">{user.name}</h3>
              {user.title ? (
                <p className="text-xs text-muted-foreground mt-0.5 text-center">{user.title}</p>
              ) : null}
              {user.bio ? (
                <p className="text-xs text-muted-foreground mt-2 text-center line-clamp-3">
                  {user.bio}
                </p>
              ) : null}
            </div>

            <div className="px-3 space-y-3">
              {blocks.filter((b) => b.isEnabled).map((block) => (
                <div
                  key={block.id}
                  className={cn(
                    'w-full rounded-2xl border border-slate-100 shadow-sm bg-card',
                    block.type === 'image' ? 'p-0 overflow-hidden' : 'p-3',
                  )}
                >
                  {block.type === 'image' ? (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : block.type === 'video' ? (
                    <div className="aspect-video rounded-xl bg-muted flex items-center justify-center mb-2">
                      <PlayCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <LinkIcon className="h-4 w-4 text-slate-600" />
                      </div>
                      <p className="text-xs font-medium truncate">{block.title}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}

              <button
                className="w-full rounded-2xl border border-slate-100 shadow-sm bg-card px-3 py-3 text-left"
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate">Sample Button</span>
                  <XIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
