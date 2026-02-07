import { ArrowUpRight, Globe, Link as LinkIcon, X as XIcon } from 'lucide-react'
import type { BgMode, BlockRadius, BlockStyle, WallpaperStyle } from './types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AppearancePreviewProps {
  user: {
    username: string | null
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
    appearanceBgType?: BgMode | 'color' | 'image'
    appearanceBgWallpaperStyle?: WallpaperStyle | null
    appearanceBgColor?: string | null
    appearanceBgImageUrl?: string | null
    appearanceWallpaperImageUrl?: string | null
    appearanceWallpaperColor?: string | null
    appearanceWallpaperGradientTop?: string | null
    appearanceWallpaperGradientBottom?: string | null
    appearanceBlockStyle?: BlockStyle | null
    appearanceBlockRadius?: BlockRadius | null
    appearanceBlockColor?: string | null
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
  const {
    appearanceBgType,
    appearanceBgWallpaperStyle,
    appearanceBgColor,
    appearanceBgImageUrl,
    appearanceWallpaperImageUrl,
    appearanceWallpaperColor,
    appearanceWallpaperGradientTop,
    appearanceWallpaperGradientBottom,
    appearanceBlockStyle,
    appearanceBlockRadius,
    appearanceBlockColor,
  } = user

  const bgType = (appearanceBgType as BgMode) ?? 'banner'
  const wallpaperStyle =
    (appearanceBgWallpaperStyle as WallpaperStyle) ?? 'flat'
  const isBanner = bgType === 'banner' || !bgType

  const getImageUrl = (imageUrl?: string | null, fallback?: string) => {
    if (imageUrl) {
      return imageUrl.startsWith('/') ? imageUrl : imageUrl
    }
    return fallback
  }

  // Separate styles for banner (image only) and wallpaper (image + color)
  const bannerImageStyle = {
    backgroundImage: appearanceBgImageUrl
      ? `url('${getImageUrl(appearanceBgImageUrl)}')`
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  const wallpaperImageStyle = {
    backgroundImage: appearanceWallpaperImageUrl
      ? `url('${getImageUrl(appearanceWallpaperImageUrl)}')`
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }

  const wallpaperFlatColorStyle = {
    backgroundColor: appearanceWallpaperColor || '#F8FAFC',
  }

  const wallpaperGradientStyle = {
    background: `linear-gradient(180deg, ${appearanceWallpaperGradientTop || '#ffffff'} 0%, ${appearanceWallpaperGradientBottom || '#000000'} 100%)`,
  }

  const avatarGradient = {
    background:
      'radial-gradient(circle at center, rgba(15,23,42,0.1), #020617)',
  }

  // Determine container style (full page) vs header style (banner only)
  let containerStyle = {}
  let headerStyle = {}

  if (isBanner) {
    headerStyle = bannerImageStyle
    // key change: Use appearanceBgColor for container in banner mode
    containerStyle = { backgroundColor: appearanceBgColor || '#F8FAFC' }
  } else {
    // Wallpaper mode
    if (wallpaperStyle === 'image') {
      containerStyle = wallpaperImageStyle
    } else if (wallpaperStyle === 'flat') {
      containerStyle = wallpaperFlatColorStyle
    } else if (wallpaperStyle === 'avatar') {
      containerStyle = avatarGradient
    } else {
      // gradient
      containerStyle = wallpaperGradientStyle
    }
  }

  const blockStyle = (appearanceBlockStyle as BlockStyle) ?? 'basic'
  const blockRadius = (appearanceBlockRadius as BlockRadius) ?? 'rounded'

  const cardBase =
    blockStyle === 'flat'
      ? 'bg-white border border-slate-200'
      : blockStyle === 'shadow'
        ? 'bg-white border-none shadow-md'
        : 'bg-white border border-slate-100 shadow-sm'

  const radiusClass = blockRadius === 'rounded' ? 'rounded-xl' : 'rounded-sm'

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className="aspect-9/18 w-full max-w-[280px] overflow-hidden rounded-[32px] border-3 bg-muted relative">
        {/* Scrollable Content Area - Applies wallpaper here if active */}
        <div
          className="h-full w-full overflow-y-auto overflow-x-hidden thin-scrollbar transition-all duration-300"
          style={containerStyle}
        >
          <div className="min-h-full pb-8">
            {/* Header/Banner - Only visible/styled if isBanner */}
            {isBanner && (
              <div
                className="relative h-32 w-full transition-all duration-300"
                style={headerStyle}
              >
                <div className="absolute inset-0 bg-black/5" />
              </div>
            )}

            {/* Spacer for wallpaper mode to push content down a bit if needed, or simply rely on padding */}
            {!isBanner && <div className="h-24 w-full" />}

            {/* Profile Section */}
            <div className="px-4 -mt-10 mb-6 flex flex-col items-center relative z-10">
              <Avatar className="h-20 w-20 ring-4 ring-white shadow-md bg-white">
                <AvatarImage src={user.image || ''} />
                <AvatarFallback className="bg-zinc-900 text-white text-lg font-bold">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="mt-3 text-center space-y-1 w-full">
                <h3 className="font-bold text-zinc-900 text-lg leading-tight truncate px-2">
                  {user.name}
                </h3>
                {user.title && (
                  <p className="text-xs text-zinc-500 font-medium truncate px-4">
                    {user.title}
                  </p>
                )}
                {user.bio && (
                  <p className="text-[10px] items-center text-zinc-400 leading-relaxed mt-2 line-clamp-3 px-2">
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Socials Placeholder */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="h-8 w-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-zinc-400" />
                </div>
              </div>
            </div>

            {/* Blocks List */}
            <div className="px-4 space-y-3">
              {blocks
                .filter((b) => b.isEnabled !== false)
                .map((block) => {
                  if (block.type === 'text') {
                    return (
                      <div
                        key={block.id}
                        className="w-full text-center py-1 space-y-0.5"
                      >
                        <h4 className="font-bold text-sm text-slate-800">
                          {block.title}
                        </h4>
                        {block.content && (
                          <p className="text-[10px] text-slate-600">
                            {block.content}
                          </p>
                        )}
                      </div>
                    )
                  }

                  return (
                    <div
                      key={block.id}
                      className={cn(
                        'w-full p-3 flex items-center justify-between transition-all bg-white',
                        cardBase,
                        radiusClass,
                      )}
                      style={{
                        backgroundColor: appearanceBlockColor || undefined,
                      }}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-zinc-100 h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                          <LinkIcon className="h-3.5 w-3.5 text-zinc-500" />
                        </div>
                        <span className="font-semibold text-xs truncate max-w-[120px] text-zinc-800">
                          {block.title}
                        </span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
                    </div>
                  )
                })}

              {blocks.length === 0 && (
                <div className="text-center py-8 opacity-50">
                  <p className="text-xs text-zinc-400">No blocks added yet</p>
                </div>
              )}
            </div>

            <div className="mt-8 mb-4 flex justify-center pb-4">
              <span className="text-[10px] font-bold text-zinc-300">link.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
