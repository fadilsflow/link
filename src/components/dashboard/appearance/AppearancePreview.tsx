import * as React from 'react'
import { Package2, PlayCircle } from 'lucide-react'
import type { PreviewSocialLink } from '@/lib/preview-context'
import type {
  AppearanceBackgroundType,
  AppearanceTextFont,
} from '@/lib/appearance'
import type { BlockRadius, BlockStyle } from '@/lib/block-styles'
import { SocialProfileBlocks } from '@/components/SocialProfileBlocks'
import { PublicProfileBlocks } from '@/components/dashboard/blocks/PublicProfileBlocks'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import {
  getAppearanceBlockStyle,
  getAppearanceFontClass,
  getAppearanceIconBackgroundColor,
  getAppearancePageBackgroundStyle,
  getAppearanceTextColor,
  getAppearanceTextVars,
  isDarkBackground,
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
  socialLinks?: Array<PreviewSocialLink>
}

export function AppearancePreview({ user, blocks, socialLinks = [] }: AppearancePreviewProps) {
  const [tab, setTab] = React.useState<'profile' | 'products'>('profile')

  const blockStyle = user.appearanceBlockStyle || 'basic'
  const blockRadius = user.appearanceBlockRadius || 'rounded'
  const cardBase = getBlockCardBase(blockStyle, { disableHover: true })
  const cardBaseWithHover = getBlockCardBase(blockStyle)
  const radiusClass = getBlockRadius(blockRadius)
  const actionRadiusClass = getActionBlockRadius(blockRadius)
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
  const profileTextColor = getAppearanceTextColor({
    backgroundType: user.appearanceBackgroundType,
    backgroundColor: user.appearanceBackgroundColor,
    backgroundGradientTop: user.appearanceBackgroundGradientTop,
    backgroundGradientBottom: user.appearanceBackgroundGradientBottom,
    backgroundImageUrl: user.appearanceBackgroundImageUrl,
    userImage: user.image,
  })
  const isDarkBg = isDarkBackground({
    backgroundType: user.appearanceBackgroundType,
    backgroundColor: user.appearanceBackgroundColor,
    backgroundGradientTop: user.appearanceBackgroundGradientTop,
    backgroundGradientBottom: user.appearanceBackgroundGradientBottom,
    backgroundImageUrl: user.appearanceBackgroundImageUrl,
    userImage: user.image,
  })
  const iconBackgroundColor = getAppearanceIconBackgroundColor({
    backgroundType: user.appearanceBackgroundType,
    backgroundColor: user.appearanceBackgroundColor,
  })
  const iconBackgroundType =
    user.appearanceBackgroundType === 'none' || !user.appearanceBackgroundType
      ? 'flat'
      : user.appearanceBackgroundType
  const hasBanner =
    user.appearanceBannerEnabled !== false && !!user.appearanceBgImageUrl

  const enabledBlocks = React.useMemo(
    () => blocks.filter((block) => block.isEnabled),
    [blocks],
  )
  const nonProductBlocks = React.useMemo(
    () => enabledBlocks.filter((block) => block.type !== 'product'),
    [enabledBlocks],
  )
  const productBlocks = React.useMemo(
    () => enabledBlocks.filter((block) => block.type === 'product'),
    [enabledBlocks],
  )

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
        <div className="h-full w-full no-scrollbar overflow-y-auto overflow-x-hidden relative z-10">
          <div
            className={cn('relative min-h-full text-foreground', textFontClass)}
            style={{ ...pageBackgroundStyle, ...textStyle }}
          >
            {hasBanner ? (
              <div className="h-[160px] w-full overflow-hidden">
                <img
                  src={user.appearanceBgImageUrl || ''}
                  alt={`${user.name} banner`}
                  width={800}
                  height={160}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-[160px] w-full" />
            )}

            <section className="relative px-2 pt-14 pb-6">
              <Avatar className="absolute -top-14 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full ring-2 ring-primary/10">
                <AvatarImage src={user.image || '/avatar-placeholder.png'} />
                <AvatarFallback className="text-lg font-bold">
                  {user.name.slice(0, 2).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              <h1
                className="pt-4 text-center text-xl font-heading"
                style={{ color: profileTextColor.foreground }}
              >
                {user.name}
              </h1>
              {user.title ? (
                <p
                  className="mt-1 text-center text-sm"
                  style={{ color: profileTextColor.mutedForeground }}
                >
                  {user.title}
                </p>
              ) : null}
              {user.bio ? (
                <p
                  className="mt-1 text-center text-sm leading-relaxed line-clamp-3"
                  style={{ color: profileTextColor.mutedForeground }}
                >
                  {user.bio}
                </p>
              ) : null}

              {socialLinks.length > 0 ? (
                <SocialProfileBlocks
                  links={socialLinks}
                  iconColor={profileTextColor.foreground}
                  className="mt-5 justify-center"
                />
              ) : null}

              <div className="mt-6">
                <Tabs
                  value={tab}
                  onValueChange={(val) => setTab(val as 'profile' | 'products')}
                  className="w-full"
                >
                  <TabsList
                    className="grid w-full grid-cols-2"
                    style={{ color: profileTextColor.foreground }}
                  >
                    <TabsTab
                      value="profile"
                      style={{ color: profileTextColor.foreground }}
                    >
                      Profile
                    </TabsTab>
                    <TabsTab
                      value="products"
                      style={{ color: profileTextColor.foreground }}
                    >
                      Products
                    </TabsTab>
                  </TabsList>

                  <TabsPanel value="profile" className="mt-4 space-y-3 outline-none">
                    <PublicProfileBlocks
                      areBlocksReady
                      blocks={nonProductBlocks}
                      cardBase={cardBase}
                      cardBaseWithHover={cardBaseWithHover}
                      radiusClass={radiusClass}
                      actionRadiusClass={actionRadiusClass}
                      isInteractive={false}
                      cardStyle={blockInlineStyle}
                      iconBackgroundColor={iconBackgroundColor}
                      backgroundType={iconBackgroundType}
                      backgroundGradientTop={
                        user.appearanceBackgroundGradientTop || undefined
                      }
                      backgroundGradientBottom={
                        user.appearanceBackgroundGradientBottom || undefined
                      }
                      onOpenBlockUrl={() => { }}
                      onTrackClick={() => { }}
                      renderVideoBlock={(block) => (
                        <div
                          key={block.id}
                          className={cn(
                            'w-full overflow-hidden p-3 space-y-3',
                            cardBase,
                            radiusClass,
                          )}
                          style={blockInlineStyle}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <PlayCircle className="h-4 w-4 text-foreground" />
                            {block.title || 'Video'}
                          </div>
                          <div className={cn('w-full rounded-lg border aspect-video', isDarkBg ? 'bg-white/10 border-white/20' : 'bg-muted border-border')} />
                        </div>
                      )}
                      renderProductBlock={() => null}
                    />
                  </TabsPanel>

                  <TabsPanel value="products" className="mt-4 space-y-3 outline-none">
                    {productBlocks.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {productBlocks.map((productBlock) => (
                          <div
                            key={productBlock.id}
                            className={cn(
                              'w-full overflow-hidden border border-border bg-background shadow-sm',
                              cardBase,
                              radiusClass,
                            )}
                            style={blockInlineStyle}
                          >
                            <div className="p-2">
                              <div className="aspect-square w-full overflow-hidden rounded-xl bg-muted" />
                              <div className="space-y-1 mt-2">
                                <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                                  {productBlock.title || 'Product'}
                                </h3>
                                <p className="text-sm font-semibold text-foreground">$0.00</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'w-full p-4 text-sm flex items-center gap-2 justify-center',
                          cardBase,
                          actionRadiusClass,
                        )}
                        style={blockInlineStyle}
                      >
                        <Package2 className="size-4" />
                        <span>No products yet</span>
                      </div>
                    )}
                  </TabsPanel>
                </Tabs>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
