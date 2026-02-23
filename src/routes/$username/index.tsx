import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Package2, PlayCircle } from 'lucide-react'
import type { PublicSocialLink } from '@/components/SocialProfileBlocks'
import type { PublicProfileBlock } from '@/components/dashboard/blocks/PublicProfileBlocks'
import { PublicProfileBlocks } from '@/components/dashboard/blocks/PublicProfileBlocks'
import { SocialProfileBlocks } from '@/components/SocialProfileBlocks'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getPublicProfile } from '@/lib/profile-server'
import NotFound from '@/components/not-found'
import { cn, formatPrice } from '@/lib/utils'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import LiteYouTube from '@/components/LiteYouTube'
import { extractYouTubeVideoId } from '@/lib/lite-youtube'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import {
  getActionBlockRadius,
  getBlockCardBase,
  getBlockRadius,
  getProductSkeletonClass,
} from '@/lib/block-styles'
import {
  getAppearanceBlockStyle,
  getAppearanceFontClass,
  getAppearanceIconBackgroundColor,
  getAppearancePageBackgroundStyle,
  getAppearanceTextColor,
  getAppearanceTextVars,
  isDarkBackground,
} from '@/lib/appearance'

import SiteUserProfileHeader from '@/components/site-user-profile-header'
import PublicMark from '@/components/public-mark'

type PublicBlock = PublicProfileBlock

interface PublicProduct {
  id: string
  title: string
  images?: Array<string> | null
  payWhatYouWant?: boolean | null
  minimumPrice?: number | null
  salePrice?: number | null
  price?: number | null
  totalQuantity?: number | null
  limitPerCheckout?: number | null
}

function runWhenBrowserIdle(callback: () => void, timeout = 1200) {
  if (typeof window === 'undefined') return

  const win = window as any
  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(callback, { timeout })
  } else {
    win.setTimeout(callback, 250)
  }
}

function getVideoMeta(rawUrl?: string | null): {
  embedUrl: string | null
  posterUrl: string | null
  provider: 'youtube' | 'tiktok' | null
  youtubeVideoId: string | null
} {
  if (!rawUrl) {
    return {
      embedUrl: null,
      posterUrl: null,
      provider: null,
      youtubeVideoId: null,
    }
  }

  const youtubeVideoId = extractYouTubeVideoId(rawUrl)
  if (youtubeVideoId) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeVideoId}`,
      posterUrl: `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`,
      provider: 'youtube',
      youtubeVideoId,
    }
  }

  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()

    if (host.includes('tiktok.com')) {
      const parts = url.pathname.split('/').filter(Boolean)
      const videoIndex = parts.findIndex((part) => part === 'video')
      if (videoIndex !== -1 && parts[videoIndex + 1]) {
        return {
          embedUrl: `https://www.tiktok.com/embed/v2/${parts[videoIndex + 1]}`,
          posterUrl: null,
          provider: 'tiktok',
          youtubeVideoId: null,
        }
      }
    }

    return {
      embedUrl: null,
      posterUrl: null,
      provider: null,
      youtubeVideoId: null,
    }
  } catch {
    return {
      embedUrl: null,
      posterUrl: null,
      provider: null,
      youtubeVideoId: null,
    }
  }
}

function getProductPriceLabel(product: PublicProduct) {
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

const LOGO_DARK = '#111827'
const LOGO_LIGHT = '#f8fafc'

function getRelativeLuminanceFromRgb(r: number, g: number, b: number): number {
  const toLinear = (channel: number) => {
    const srgb = channel / 255
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }

  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

async function getReadableLogoColorFromBanner(
  imageUrl: string,
): Promise<string | null> {
  if (typeof window === 'undefined') return null

  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'

    image.onload = () => {
      try {
        const sourceWidth = image.naturalWidth
        const sourceHeight = image.naturalHeight
        if (!sourceWidth || !sourceHeight) {
          resolve(null)
          return
        }

        const sampleSourceWidth = Math.max(1, Math.floor(sourceWidth * 0.45))
        const sampleSourceHeight = Math.max(1, Math.floor(sourceHeight * 0.35))
        const canvas = document.createElement('canvas')
        canvas.width = 72
        canvas.height = 36
        const context = canvas.getContext('2d', {
          willReadFrequently: true,
        })
        if (!context) {
          resolve(null)
          return
        }

        context.drawImage(
          image,
          0,
          0,
          sampleSourceWidth,
          sampleSourceHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        )

        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
        let luminanceTotal = 0
        let pixelCount = 0

        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3]
          if (alpha < 16) continue
          const r = pixels[index]
          const g = pixels[index + 1]
          const b = pixels[index + 2]
          luminanceTotal += getRelativeLuminanceFromRgb(r, g, b)
          pixelCount += 1
        }

        if (!pixelCount) {
          resolve(null)
          return
        }

        const averageLuminance = luminanceTotal / pixelCount
        const contrastWithDark = (averageLuminance + 0.05) / 0.05
        const contrastWithLight = 1.05 / (averageLuminance + 0.05)

        resolve(contrastWithDark >= contrastWithLight ? LOGO_DARK : LOGO_LIGHT)
      } catch {
        resolve(null)
      }
    }

    image.onerror = () => resolve(null)
    image.src = imageUrl
  })
}

function ProductCard({
  product,
  username,
  cardBase,
  radiusClass,
  imageRadiusClass,
  cardStyle,
}: {
  product: PublicProduct
  username: string
  cardBase: string
  radiusClass: string
  imageRadiusClass?: string
  cardStyle?: React.CSSProperties
}) {
  const hasDiscount = !!(product.salePrice && product.price)
  const price = hasDiscount
    ? formatPrice(product.salePrice as number)
    : getProductPriceLabel(product)
  const originalPrice = hasDiscount ? formatPrice(product.price as number) : null
  const productImages = product.images
  const hasImage = !!productImages?.length

  return (
    <Card
      className={cn(
        'group w-full overflow-hidden border border-border bg-background shadow-sm hover:scale-101',
        cardBase,
        radiusClass,

      )}
      style={cardStyle}
      render={
        <Link
          to="/$username/products/$productId"
          params={{
            username,
            productId: product.id,
          }}
        />
      }
    >
      <CardContent className="p-2">
        <div className={cn("aspect-square w-full overflow-hidden bg-muted", imageRadiusClass && 'rounded-md')}>
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


        <div className="space-y-1 mt-2">
          <h3 className="line-clamp-2 text-sm font-semibold">
            {product.title}
          </h3>
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-semibold text-foreground">{price}</p>
            {originalPrice ? (
              <p className="text-foreground/80 text-xs line-through">{originalPrice}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DeferredVideoEmbed({
  block,
  cardClass,
  radiusClass,
  cardStyle,
}: {
  block: PublicBlock
  cardClass: string
  radiusClass: string
  cardStyle?: React.CSSProperties
}) {
  const { embedUrl, posterUrl, provider, youtubeVideoId } = React.useMemo(
    () => getVideoMeta(block.content),
    [block.content],
  )

  return (
    <Card
      className={cn(
        'w-full overflow-hidden p-3 space-y-3',
        cardClass,
        radiusClass,
      )}
      style={cardStyle}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <PlayCircle className="h-4 w-4 text-foreground" />
        {block.title || 'Video'}
      </div>

      {provider === 'youtube' && youtubeVideoId ? (
        // We render a lightweight custom element first and defer iframe creation until interaction.
        // This removes YouTube's third-party JS cost from hydration, reducing TBT and improving Speed Index.
        <LiteYouTube
          videoId={youtubeVideoId}
          title={block.title || 'Embedded video'}
          className="w-full overflow-hidden rounded-lg border"
          playLabel={`Play ${block.title || 'video'}`}
        />
      ) : embedUrl ? (
        <div className="relative w-full overflow-hidden rounded-lg border aspect-video">
          <iframe
            src={embedUrl}
            title={block.title || 'Embedded video'}
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={block.title || 'Video preview'}
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover -z-10"
            />
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Unsupported video URL. Please use a valid YouTube or TikTok link.
        </p>
      )}
    </Card>
  )
}

export const Route = createFileRoute('/$username/')({
  component: UserProfile,
  loader: async ({ params }) => {
    const data = await getPublicProfile({ data: params.username })
    if (!data) {
      throw notFound()
    }
    return data
  },
  head: ({ loaderData }) => {
    const showBanner = loaderData?.user.appearanceBannerEnabled !== false
    const lcpHref = showBanner ? loaderData?.user.appearanceBgImageUrl : null

    return {
      links: lcpHref
        ? [
          {
            rel: 'preload',
            as: 'image',
            href: lcpHref,
          },
        ]
        : [],
    }
  },
  notFoundComponent: NotFound,
})

function UserProfile() {
  const { user, blocks, products, socialLinks } = Route.useLoaderData()
  const [tab, setTab] = React.useState<'profile' | 'products'>('profile')

  const isBanner =
    user.appearanceBannerEnabled !== false && !!user.appearanceBgImageUrl

  const [areBlocksReady, setAreBlocksReady] = React.useState(false)

  React.useEffect(() => {
    // Batch-switching from placeholders to full blocks avoids incremental churn and improves mobile Speed Index.
    runWhenBrowserIdle(() => setAreBlocksReady(true), 1000)
  }, [])

  const blockStyle = user.appearanceBlockStyle
  const blockRadius = user.appearanceBlockRadius

  // Card base without hover effects for ProfileCard, SocialLinks, ProductCard
  const cardBase = getBlockCardBase(blockStyle, { disableHover: true })
  // Card base with hover effects for interactive link blocks
  const cardBaseWithHover = getBlockCardBase(blockStyle)
  const radiusClass = getBlockRadius(blockRadius)
  const actionRadiusClass = getActionBlockRadius(blockRadius)
  const blockInlineStyle = getAppearanceBlockStyle({
    blockStyle,
    blockColor: user.appearanceBlockColor,
    blockShadowColor: user.appearanceBlockShadowColor,
  })
  const backgroundStyles = getAppearancePageBackgroundStyle({
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
  const defaultHeaderLogoColor = isBanner
    ? getAppearanceTextColor({
      backgroundType: 'image',
      backgroundImageUrl: user.appearanceBgImageUrl,
    }).foreground
    : profileTextColor.foreground
  const [headerLogoColor, setHeaderLogoColor] = React.useState(
    defaultHeaderLogoColor,
  )
  const isDarkBg = isDarkBackground({
    backgroundType: user.appearanceBackgroundType,
    backgroundColor: user.appearanceBackgroundColor,
    backgroundGradientTop: user.appearanceBackgroundGradientTop,
    backgroundGradientBottom: user.appearanceBackgroundGradientBottom,
    backgroundImageUrl: user.appearanceBackgroundImageUrl,
    userImage: user.image,
  })
  const divideClass = isDarkBg ? 'divide-white/10' : 'divide-border'
  const iconBackgroundColor = getAppearanceIconBackgroundColor({
    backgroundType: user.appearanceBackgroundType,
    backgroundColor: user.appearanceBackgroundColor,
  })
  const iconBackgroundType =
    user.appearanceBackgroundType === 'none'
      ? 'flat'
      : user.appearanceBackgroundType

  const productMap = new Map(
    (products as Array<PublicProduct>).map((product) => [product.id, product]),
  )
  const socialItems = socialLinks as Array<PublicSocialLink>

  // Check if user has active products (products exist in the array)
  const hasActiveProducts = React.useMemo(() => {
    return !!(products && products.length > 0)
  }, [products])

  // Render non-product blocks type
  // const nonProductBlocks = React.useMemo(
  //   () => (blocks as Array<PublicBlock>).filter((block) => block.type !== 'product'),
  //   [blocks],
  // )

  // Render all blocks type
  const allBlocks = blocks as Array<PublicBlock>

  React.useEffect(() => {
    setHeaderLogoColor(defaultHeaderLogoColor)
  }, [defaultHeaderLogoColor])

  React.useEffect(() => {
    if (!isBanner || !user.appearanceBgImageUrl) return

    let isCancelled = false

    void getReadableLogoColorFromBanner(user.appearanceBgImageUrl).then((color) => {
      if (isCancelled || !color) return
      setHeaderLogoColor(color)
    })

    return () => {
      isCancelled = true
    }
  }, [isBanner, user.appearanceBgImageUrl])

  React.useEffect(() => {
    const username = user.username
    if (!username) return
    runWhenBrowserIdle(() => {
      void trpcClient.user.trackView.mutate({ username })
    })
  }, [user.username])

  const openBlockUrl = (block: PublicBlock) => {
    if (!block.url) return
    runWhenBrowserIdle(() => {
      void trpcClient.block.trackClick.mutate({ id: block.id })
    })
    window.open(block.url, '_blank', 'noopener,noreferrer')
  }

  const lcpBannerSrc = user.appearanceBgImageUrl
  const profileBlocksSection = (
    <PublicProfileBlocks
      areBlocksReady={areBlocksReady}
      blocks={allBlocks}
      cardBase={cardBase}
      cardBaseWithHover={cardBaseWithHover}
      radiusClass={radiusClass}
      actionRadiusClass={actionRadiusClass}
      cardStyle={blockInlineStyle}
      iconBackgroundColor={iconBackgroundColor}
      backgroundType={iconBackgroundType}
      backgroundGradientTop={user.appearanceBackgroundGradientTop || undefined}
      backgroundGradientBottom={user.appearanceBackgroundGradientBottom || undefined}
      onOpenBlockUrl={openBlockUrl}
      onTrackClick={(blockId) => {
        void trpcClient.block.trackClick.mutate({ id: blockId })
      }}
      renderVideoBlock={(block) => (
        <DeferredVideoEmbed
          key={block.id}
          block={block}
          cardClass={cardBase}
          radiusClass={radiusClass}
          cardStyle={blockInlineStyle}
        />
      )}
      renderProductBlock={(block) => {
        const selectedProduct = block.content ? productMap.get(block.content) : null
        if (!selectedProduct) return null

        return (
          <ProductCard
            key={block.id}
            product={selectedProduct}
            username={user.username || ''}
            cardBase={cardBase}
            radiusClass={radiusClass}
            imageRadiusClass={radiusClass}
            cardStyle={blockInlineStyle}
          />
        )
      }}
    />
  )

  const productsSection = !areBlocksReady ? (
    (products as Array<PublicProduct>).map((product) => (
      <div
        key={`product-skeleton-${product.id}`}
        className={getProductSkeletonClass()}
      />
    ))
  ) : (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {(products as Array<PublicProduct>).map((product) => {
        return (
          <ProductCard
            key={product.id}
            product={product}
            username={user.username || ''}
            cardBase={cardBase}
            radiusClass={radiusClass}
            imageRadiusClass={radiusClass}
            cardStyle={blockInlineStyle}
          />
        )
      })}
    </div>
  )

  return (
    <div
      className={cn('relative min-h-screen text-foreground', textFontClass)}
      style={{ ...backgroundStyles, ...textStyle }}
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
      <SiteUserProfileHeader logoColor={headerLogoColor} backgroundLogoColor={profileTextColor.foreground} />

      <div className={cn('relative z-10 min-h-screen w-full', isDarkBg ? 'border-white/10' : 'border-border/70')}>
        {isBanner && lcpBannerSrc ? (
          <div className="h-[120px] overflow-hidden lg:h-[200px] sm:max-w-2xl md:max-w-3xl sm:mx-auto lg:max-w-full lg:overflow-hidden px-3 lg:px-0">
            <img
              src={lcpBannerSrc}
              alt={`${user.name} banner`}
              width={1440}
              height={200}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover rounded-lg lg:rounded-none"
            />
          </div>
        ) : (
          <div className="h-[160px] w-full lg:h-[150px]" />
        )}

        <div className={cn(
          // 'lg:divide-x',
          divideClass,
          hasActiveProducts
            ? 'sm:max-w-2xl md:max-w-3xl lg:max-w-7xl mx-auto grid grid-cols-1 px-5 lg:grid-cols-2 lg:auto-rows-max lg:px-10'
            : 'sm:max-w-2xl md:max-w-3xl lg:max-w-3xl mx-auto grid grid-cols-1 px-5'
        )}>
          <section className={cn(
            'relative pt-10 lg:pt-[70px]',
            hasActiveProducts && 'lg:pr-6 lg:border-r', isDarkBg ? 'border-white/10' : 'border-border'

          )}>
            <Avatar className="absolute -top-14 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full ring-2 ring-primary/10 lg:-top-[60px] lg:left-0 lg:h-[120px] lg:w-[120px] lg:translate-x-0">
              {/* <Avatar className="absolute -top-14 left-0 h-24 w-24 rounded-full  ring-2 ring-primary/10  lg:-top-[60px] lg:h-[120px] lg:w-[120px]"> */}
              <AvatarImage src={user.image || '/avatar-placeholder.png'} />
              <AvatarFallback className="text-lg font-bold">
                {user.name}
              </AvatarFallback>
            </Avatar>

            <h1
              id="profile-name"
              className="mt-4 text-center text-xl font-bold lg:text-left lg:text-2xl"
              style={{ color: profileTextColor.foreground }}
            >
              {user.name}
            </h1>
            {user.title ? (
              <p
                className="mt-1 text-center text-sm lg:text-left lg:text-base"
                style={{ color: profileTextColor.mutedForeground }}
              >
                {user.title}
              </p>
            ) : null}
            {user.bio ? (
              <p
                className="mt-1  mx-auto text-center text-sm  leading-relaxed lg:text-left lg:text-base"
                style={{ color: profileTextColor.mutedForeground }}
              >
                {user.bio}
              </p>
            ) : null}

            {socialItems.length > 0 ? (
              <SocialProfileBlocks
                links={socialItems}
                iconColor={profileTextColor.foreground}
                className="mt-5 flex lg:block justify-center lg:justify-start lg:-ml-3"
              />
            ) : null}

            {hasActiveProducts && (
              <div className="mt-6 lg:hidden">
                <Tabs
                  value={tab}
                  onValueChange={(val) => setTab(val as 'profile' | 'products')}
                  className="w-full"
                >
                  <TabsList
                    variant='underline'
                    className="grid w-full grid-cols-2 border-b-0"
                    style={{
                      color: profileTextColor.foreground,
                      '--tabs-indicator-color': profileTextColor.foreground,
                    } as React.CSSProperties}
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
                    {profileBlocksSection}
                  </TabsPanel>
                  <TabsPanel value="products" className="mt-4 space-y-3 outline-none">
                    {productsSection}
                  </TabsPanel>
                </Tabs>
              </div>
            )}

            <div className={cn('mt-6', !hasActiveProducts ? 'block space-y-3 outline-none' : 'hidden lg:block space-y-3 outline-none')}>{profileBlocksSection}</div>
          </section>

          {hasActiveProducts && (
            <aside className={cn('pb-6 lg:border-y border-r hidden lg:block h-full', isDarkBg ? 'border-white/10' : 'border-border')}>
              <div className={cn('mb-5 lg:px-6 border-b py-4', isDarkBg ? 'border-white/10' : 'border-border')}>
                <div className="flex  items-center gap-2 text-sm font-semibold">
                  <Package2 className='size-4' style={{ color: profileTextColor.foreground }} />
                  <span style={{ color: profileTextColor.foreground }}>Products</span>
                </div>
              </div>
              <div className="hidden space-y-5 lg:block  lg:px-6">{productsSection}</div>
            </aside>
          )}
        </div>

        <div className="pb-4 pt-10">
          <div className="mx-auto sm:max-w-2xl md:max-w-3xl lg:max-w-7xl">
            <PublicMark textColor={profileTextColor.mutedForeground} logoColor={headerLogoColor} />
          </div>
        </div>
      </div>
    </div >
  )
}
