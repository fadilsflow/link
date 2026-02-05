import type { BgMode, BlockRadius, BlockStyle, WallpaperStyle } from './types'
import { cn } from '@/lib/utils'

interface AppearancePreviewProps {
  user: {
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
    appearanceBgType: BgMode
    appearanceBgWallpaperStyle: WallpaperStyle
    appearanceBgColor?: string
    appearanceBgImageUrl?: string
    appearanceBlockStyle: BlockStyle
    appearanceBlockRadius: BlockRadius
    appearanceBlockColor?: string
  }
}

export function AppearancePreview(props: AppearancePreviewProps) {
  const {
    appearanceBgType,
    appearanceBgWallpaperStyle,
    appearanceBgColor,
    appearanceBgImageUrl,
    appearanceBlockStyle,
    appearanceBlockRadius,
    appearanceBlockColor,
  } = props.user

  const bgStyle =
    appearanceBgType === 'banner'
      ? {
          backgroundImage: appearanceBgImageUrl
            ? `url('${appearanceBgImageUrl}')`
            : undefined,
          backgroundColor: appearanceBgColor || undefined,
          backgroundSize: appearanceBgImageUrl ? 'cover' : undefined,
          backgroundPosition: appearanceBgImageUrl ? 'center' : undefined,
        }
      : appearanceBgWallpaperStyle === 'image'
        ? {
            backgroundImage: appearanceBgImageUrl
              ? `url('${appearanceBgImageUrl}')`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : appearanceBgWallpaperStyle === 'avatar'
          ? {
              background:
                'radial-gradient(circle at center, rgba(15,23,42,0.1), #020617)',
            }
          : {
              background:
                appearanceBgColor ||
                (appearanceBgWallpaperStyle === 'gradient'
                  ? 'linear-gradient(135deg,#22c55e,#3b82f6,#a855f7)'
                  : '#FAFAFA'),
            }

  const cardBase =
    appearanceBlockStyle === 'flat'
      ? 'bg-zinc-50 border-transparent shadow-none'
      : appearanceBlockStyle === 'shadow'
        ? 'bg-white border border-zinc-900/80 shadow-[0_4px_0_rgba(0,0,0,0.9)]'
        : 'bg-white border border-zinc-200 shadow-sm'

  const radiusClass =
    appearanceBlockRadius === 'rounded' ? 'rounded-2xl' : 'rounded-md'

  return (
    <div className="w-full bg-slate-900/5 p-4">
      <div className="mx-auto aspect-9/16 w-full max-w-[260px] overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-xl">
        <div className="relative h-32 w-full" style={bgStyle}>
          <div className="absolute inset-0 bg-black/15" />
        </div>
        <div className="px-4 -mt-8 pb-4 space-y-3">
          <div
            className={cn(
              'inline-flex h-14 w-14 items-center justify-center border-4 border-white bg-zinc-900 text-white text-lg font-bold shadow-md',
              'rounded-full',
            )}
          >
            {props.user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900">
              {props.user.name}
            </p>
            {props.user.title && (
              <p className="text-xs text-zinc-500">{props.user.title}</p>
            )}
          </div>
          <div className="space-y-2 pt-2">
            <div
              className={cn(
                'px-4 py-3 text-xs font-medium text-zinc-900 flex items-center justify-between',
                cardBase,
                radiusClass,
              )}
              style={{
                backgroundColor: appearanceBlockColor || undefined,
              }}
            >
              <span>My portfolio</span>
            </div>
            <div
              className={cn(
                'px-4 py-3 text-xs font-medium text-zinc-900 flex items-center justify-between',
                cardBase,
                radiusClass,
              )}
              style={{
                backgroundColor: appearanceBlockColor || undefined,
              }}
            >
              <span>Contact</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
