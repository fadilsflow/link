import {
  ArrowUpRight,
  Globe,
  Link2 as LinkIcon,
  PlayCircle,
  X as XIcon,
} from 'lucide-react'
import type {
  AppearanceBackgroundType,
  AppearanceTextFont,
} from '@/lib/appearance'
import type { BlockRadius, BlockStyle } from '@/lib/block-styles'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  getAppearanceBlockStyle,
  getAppearanceFontClass,
  getAppearancePageBackgroundStyle,
  getAppearanceTextVars,
  getReadableTextTokensForBackground,
} from '@/lib/appearance'
import {
  getActionBlockRadius,
  getBlockCardBase,
  getBlockRadius,
} from '@/lib/block-styles'
import { cn } from '@/lib/utils'

interface AppearancePreviewProps {
  user: {
    username: string | null
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
    appearanceBannerEnabled?: boolean | null
    appearanceBgImageUrl?: string | null
    appearanceBackgroundType?: AppearanceBackgroundType | null
    appearanceBackgroundColor?: string | null
    appearanceBackgroundGradientTop?: string | null
    appearanceBackgroundGradientBottom?: string | null
    appearanceBackgroundImageUrl?: string | null
    appearanceBlockStyle?: BlockStyle | null
    appearanceBlockRadius?: BlockRadius | null
    appearanceBlockColor?: string | null
    appearanceBlockShadowColor?: string | null
    appearanceTextColor?: string | null
    appearanceTextFont?: AppearanceTextFont | null
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
  const blockStyle = user.appearanceBlockStyle || 'basic'
  const blockRadius = user.appearanceBlockRadius || 'rounded'
  const blockInlineStyle = getAppearanceBlockStyle({
    blockStyle,
    blockColor: user.appearanceBlockColor,
    blockShadowColor: user.appearanceBlockShadowColor,
  })
  const pageBackgroundStyle = getAppearancePageBackgroundStyle({
    backgroundType: user.appearanceBackgroundType,
    backgroundColor: user.appearanceBackgroundColor,
    backgroundGradientTop: user.appearanceBackgroundGradientTop,
    backgroundGradientBottom: user.appearanceBackgroundGradientBottom,
    backgroundImageUrl: user.appearanceBackgroundImageUrl,
  })
  const textStyle = getAppearanceTextVars(user.appearanceTextColor)
  const textFontClass = getAppearanceFontClass(user.appearanceTextFont)
  const hasBanner =
    user.appearanceBannerEnabled !== false && !!user.appearanceBgImageUrl

  const cardBase = getBlockCardBase(blockStyle)
  const radiusClass = getBlockRadius(blockRadius)
  const actionRadiusClass = getActionBlockRadius(blockRadius)
  const iconTokens = getReadableTextTokensForBackground(
    user.appearanceBackgroundColor,
  )
  const iconWrapperStyle = user.appearanceBackgroundColor
    ? ({
      backgroundColor: user.appearanceBackgroundColor,
      '--foreground': iconTokens.foreground,
      '--muted-foreground': iconTokens.mutedForeground,
    } as React.CSSProperties)
    : undefined

  const isActionBlockType = (type?: string) =>
    !type || type === 'link' || type === 'telegram' || type === 'discord'

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div
        className={cn(
          'aspect-9/18 w-full max-w-[280px] overflow-hidden rounded-[32px] border-3 border-border bg-muted relative',
          textFontClass,
        )}
      >
        {user.appearanceBackgroundType === 'avatar-blur' && user.image ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={user.image}
              alt=""
              className="h-full w-full object-cover scale-125 blur-3xl"
            />
            <div className="absolute inset-0 bg-background/45" />
          </div>
        ) : null}
        <div
          className="h-full w-full no-scrollbar overflow-y-auto overflow-x-hidden relative z-10"
          style={{
            ...textStyle,
            ...pageBackgroundStyle,
          }}
        >
          <div className="min-h-full pb-8">
            {hasBanner ? (
              <div
                className="relative h-32 w-full"
                style={{
                  backgroundImage: `url('${user.appearanceBgImageUrl}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-black/5" />
              </div>
            ) : (
              <div className="h-32 w-full" />
            )}

            <div className="px-4 -mt-10 mb-6 flex flex-col relative z-10">
              <Avatar className="h-20 w-20 ring-4 ring-background shadow-md bg-background">
                <AvatarImage src={user.image || ''} />
                <AvatarFallback className="bg-muted text-foreground">
                  {user.name.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-sm text-foreground font-semibold mt-3">
                {user.name}
              </h3>
              {user.title ? (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.title}
                </p>
              ) : null}
              {user.bio ? (
                <p className="text-xs text-foreground mt-2  line-clamp-3">
                  {user.bio}
                </p>
              ) : null}
            </div>

            <div className="px-3 space-y-3">
              {blocks
                .filter((b) => b.isEnabled)
                .map((block) => (
                  <div
                    key={block.id}
                    className={cn(
                      'w-full bg-card',
                      cardBase,
                      isActionBlockType(block.type) ? actionRadiusClass : radiusClass,
                      block.type === 'image' ? 'p-0 overflow-hidden' : 'p-3',
                    )}
                    style={blockInlineStyle}
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
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/80"
                          style={iconWrapperStyle}
                        >
                          <LinkIcon className="-rotate-45 h-4 w-4 text-foreground" />
                        </div>
                        <p className="text-xs text-foreground font-medium truncate">
                          {block.type === 'image'
                            ? 'Image'
                            : block.type === 'discord'
                              ? block.title || 'Discord'
                              : block.type === 'telegram'
                                ? block.title || 'Telegram'
                                : block.title}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}

              <button
                className={cn(
                  'w-full bg-card px-3 py-3 text-left',
                  cardBase,
                  actionRadiusClass,
                )}
                style={blockInlineStyle}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-foreground *:font-medium truncate">
                    Sample Button
                  </span>
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
