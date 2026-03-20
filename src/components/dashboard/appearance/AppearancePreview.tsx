import * as React from 'react'
import { Package2, PlayCircle } from 'lucide-react'
import type { PreviewProduct, PreviewSocialLink } from '@/lib/preview-context'
import type {
  AppearanceBackgroundType,
  AppearanceTextFont,
} from '@/lib/appearance'
import type { BlockRadius, BlockStyle } from '@/lib/block-styles'
import { SocialProfileBlocks } from '@/components/SocialProfileBlocks'
import { PublicProfileBlocks } from '@/components/dashboard/blocks/PublicProfileBlocks'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import VerifiedIcon from '@/components/icon/verified-badge'
import { SimpleTooltip } from '@/components/ui/tooltip'
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
import { cn, formatPrice } from '@/lib/utils'

function getProductPriceLabel(product: PreviewProduct) {
  if (product.payWhatYouWant) {
    return product.minimumPrice
      ? `From ${formatPrice(product.minimumPrice)}`
      : 'Pay what you want'
  }

  if (product.salePrice && product.price) {
    return formatPrice(product.salePrice)
  }

  return product.price ? formatPrice(product.price) : 'Free'
}

function PreviewProductCard({
  product,
  username,
  cardBase,
  radiusClass,
  cardStyle,
  horizontalOnMd = false,
}: {
  product: PreviewProduct
  username: string
  cardBase: string
  radiusClass: string
  cardStyle?: React.CSSProperties
  horizontalOnMd?: boolean
}) {
  const hasDiscount = !!(product.salePrice && product.price)
  const price = hasDiscount
    ? formatPrice(product.salePrice as number)
    : getProductPriceLabel(product)
  const originalPrice = hasDiscount
    ? formatPrice(product.price as number)
    : null
  const productImages = product.images
  const hasImage = !!productImages?.length

  return (
    <div
      className={cn(
        'group w-full overflow-hidden border border-border bg-background shadow-sm hover:scale-101 cursor-pointer',
        cardBase,
        radiusClass,
      )}
      style={cardStyle}
      onClick={() =>
        window.open(
          `/${username}/${product.id}`,
          '_blank',
          'noopener,noreferrer',
        )
      }
    >
      <div className={cn('p-0', horizontalOnMd && ' flex flex-col')}>
        <div
          className={cn(
            'aspect-video w-full overflow-hidden bg-muted',
            horizontalOnMd && 'shrink-0',
          )}
        >
          {hasImage ? (
            <img
              loading="lazy"
              decoding="async"
              width={640}
              height={640}
              src={productImages[0]}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>

        <div className={cn('space-y-2 p-4')}>
          <h3 className="line-clamp-2 text-lg font-medium">{product.title}</h3>
          <div className="flex items-center gap-1">
            <p className="text-foreground text-sm">{price}</p>
            {originalPrice ? (
              <p className="text-foreground/80 text-[10px] line-through">
                {originalPrice}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

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
  products?: Array<PreviewProduct>
}

export function AppearancePreview({
  user,
  blocks,
  socialLinks = [],
  products = [],
}: AppearancePreviewProps) {
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
  const divideClass = isDarkBg ? 'divide-white/10' : 'divide-border'

  const enabledBlocks = React.useMemo(
    () => blocks.filter((block) => block.isEnabled),
    [blocks],
  )

  const productMap = React.useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  )

  const hasActiveProducts = products.length > 0

  const profileBlocksSection = (
    <PublicProfileBlocks
      areBlocksReady
      blocks={enabledBlocks}
      cardBase={cardBase}
      cardBaseWithHover={cardBaseWithHover}
      radiusClass={radiusClass}
      actionRadiusClass={actionRadiusClass}
      isInteractive={true}
      cardStyle={blockInlineStyle}
      iconBackgroundColor={iconBackgroundColor}
      backgroundType={iconBackgroundType}
      backgroundGradientTop={user.appearanceBackgroundGradientTop || undefined}
      backgroundGradientBottom={
        user.appearanceBackgroundGradientBottom || undefined
      }
      textForegroundColor={profileTextColor.foreground}
      onOpenBlockUrl={() => {}}
      onTrackClick={() => {}}
      renderVideoBlock={(block) => (
        <div
          key={block.id}
          className={cn('w-full overflow-hidden space-y-3 mt-6', radiusClass)}
        >
          <div
            style={{ color: profileTextColor.foreground }}
            className="flex items-center gap-2 text-md font-medium"
          >
            {block.title || 'YouTube Video'}
          </div>
          <div
            className={cn(
              'w-full rounded-lg border aspect-video',
              isDarkBg
                ? 'bg-white/10 border-white/20'
                : 'bg-muted border-border',
            )}
          >
            <div className="w-full h-full flex items-center justify-center">
              <PlayCircle className="h-10 w-10 text-muted-foreground/50" />
            </div>
          </div>
        </div>
      )}
      renderProductBlock={(block) => {
        const selectedProduct = block.content
          ? productMap.get(block.content)
          : null
        if (!selectedProduct) return null

        return (
          <PreviewProductCard
            key={block.id}
            product={selectedProduct}
            username={user.username || ''}
            cardBase={cardBase}
            radiusClass={radiusClass}
            cardStyle={blockInlineStyle}
            horizontalOnMd
          />
        )
      }}
    />
  )

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div
        className={cn(
          'aspect-9/18 w-full max-w-[310px] overflow-hidden rounded-[32px] border-3 border-border bg-background relative',
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
            <div
              className={cn(
                'relative z-10 min-h-screen w-full',
                isDarkBg ? 'border-white/10' : 'border-border/70',
              )}
            >
              {hasBanner ? (
                <div className="h-[60px] overflow-hidden">
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
              ) : null}

              <div
                className={cn(
                  divideClass,
                  'mx-auto grid grid-cols-1 px-5 pb-5',
                )}
              >
                <section
                  className={cn(
                    'relative pt-6',
                    isDarkBg ? 'border-white/10' : 'border-border',
                  )}
                >
                  <div className="flex gap-4">
                    <div className="relative w-11 h-11">
                      <Avatar
                        className={cn(
                          'absolute top-0 w-11 h-11 b border-background ring-3 ring-foreground/10',
                          isDarkBg ? ' ring-white/10' : 'ring-border',
                        )}
                      >
                        <AvatarImage
                          src={user.image || '/avatar-placeholder.png'}
                        />
                        <AvatarFallback className="text-lg font-bold">
                          {user.name.slice(0, 2).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex flex-col justify-end">
                      <h1
                        id="profile-name"
                        className="text-xl font-bold flex items-center gap-2"
                        style={{ color: profileTextColor.foreground }}
                      >
                        {user.name}
                        <SimpleTooltip content="Verified">
                          <VerifiedIcon className="size-4 text-blue-500" />
                        </SimpleTooltip>
                      </h1>
                      {user.title ? (
                        <p
                          className="text-xs"
                          style={{ color: profileTextColor.mutedForeground }}
                        >
                          {user.title}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {user.bio ? (
                    <p
                      className="mt-3 mx-auto text-sm leading-relaxed"
                      style={{ color: profileTextColor.mutedForeground }}
                    >
                      {user.bio}
                    </p>
                  ) : null}

                  {socialLinks.length > 0 ? (
                    <SocialProfileBlocks
                      links={socialLinks}
                      iconColor={profileTextColor.foreground}
                      className="flex mt-4"
                    />
                  ) : null}

                  {hasActiveProducts ? (
                    <div className="mt-6">
                      <Tabs
                        value={tab}
                        onValueChange={(val) =>
                          setTab(val as 'profile' | 'products')
                        }
                        className="w-full"
                      >
                        <TabsList
                          variant="underline"
                          className="grid w-full grid-cols-2"
                          style={
                            {
                              color: profileTextColor.foreground,
                              '--tabs-indicator-color':
                                profileTextColor.foreground,
                            } as React.CSSProperties
                          }
                        >
                          <TabsTab
                            value="profile"
                            style={{ color: profileTextColor.foreground }}
                          >
                            Beranda
                          </TabsTab>
                          <TabsTab
                            value="products"
                            style={{ color: profileTextColor.foreground }}
                          >
                            Toko
                          </TabsTab>
                        </TabsList>

                        <TabsPanel
                          value="profile"
                          className="mt-4 space-y-3 outline-none"
                        >
                          {profileBlocksSection}
                        </TabsPanel>

                        <TabsPanel
                          value="products"
                          className="mt-4 space-y-3 outline-none"
                        >
                          {products.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                              {products.map((product) => (
                                <PreviewProductCard
                                  key={product.id}
                                  product={product}
                                  username={user.username || ''}
                                  cardBase={cardBase}
                                  radiusClass={radiusClass}
                                  cardStyle={blockInlineStyle}
                                />
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
                  ) : (
                    <div className="mt-6">{profileBlocksSection}</div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
