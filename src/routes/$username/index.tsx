import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { PlayCircle } from 'lucide-react'
import type { PublicProfileBlock } from '@/components/dashboard/blocks/PublicProfileBlocks'
import { PublicProfileBlocks } from '@/components/dashboard/blocks/PublicProfileBlocks'
import {
  SocialProfileBlocks,
  type PublicSocialLink,
} from '@/components/SocialProfileBlocks'
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
  getBlockCardBase,
  getBlockRadius,
  getProductSkeletonClass,
} from '@/lib/block-styles'
import {
  getAppearanceBlockStyle,
  getAppearanceFontClass,
  getAppearancePageBackgroundStyle,
  getAppearanceTextVars,
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

function ProductCard({
  product,
  username,
  cardBase,
  radiusClass,
  cardStyle,
}: {
  product: PublicProduct
  username: string
  cardBase: string
  radiusClass: string
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
        'group w-full overflow-hidden border border-border bg-background shadow-sm transition-all hover:-translate-y-0.5',
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
        <div className="aspect-square w-full overflow-hidden bg-muted">
          {hasImage ? (
            <img
              loading="lazy"
              decoding="async"
              width={640}
              height={640}
              src={productImages[0]}
              alt={product.title}
              className="rounded-xl h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
            <p className="font-semibold text-primary">{price}</p>
            {originalPrice ? (
              <p className="text-muted-foreground text-xs line-through">{originalPrice}</p>
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
        <PlayCircle className="h-4 w-4" />
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

  const productMap = new Map(
    (products as Array<PublicProduct>).map((product) => [product.id, product]),
  )
  const socialItems = socialLinks as Array<PublicSocialLink>
  const nonProductBlocks = React.useMemo(
    () => (blocks as Array<PublicBlock>).filter((block) => block.type !== 'product'),
    [blocks],
  )

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
      blocks={nonProductBlocks}
      cardBase={cardBase}
      cardBaseWithHover={cardBaseWithHover}
      radiusClass={radiusClass}
      cardStyle={blockInlineStyle}
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {(products as Array<PublicProduct>).map((product) => {
        return (
          <ProductCard
            key={product.id}
            product={product}
            username={user.username || ''}
            cardBase={cardBase}
            radiusClass={radiusClass}
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
      <SiteUserProfileHeader />

      <div className="relative z-10 mx-auto min-h-screen w-full border-border/70 bg-background">
        {isBanner && lcpBannerSrc ? (
          <div className="h-[160px] w-full overflow-hidden md:h-[200px]">
            <img
              src={lcpBannerSrc}
              alt={`${user.name} banner`}
              width={1440}
              height={200}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-[160px] w-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 md:h-[200px]" />
        )}

        <div className=" sm:max-w-7xl mx-auto grid grid-cols-1 gap-8 px-5 pb-10 md:grid-cols-2 md:gap-10 md:px-10 md:pb-10">
          <section className="relative pt-14 md:pt-[70px]">
            <Avatar className="absolute -top-14 left-0 h-24 w-24 rounded-full  ring-2 ring-primary/10  md:-top-[60px] md:h-[120px] md:w-[120px]">
              <AvatarImage src={user.image || '/avatar-placeholder.png'} />
              <AvatarFallback className="text-lg font-bold">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <h1 id="profile-name" className="text-xl pt-4 font-heading md:text-2xl">
              {user.name}
            </h1>
            {user.title ? (
              <p className="mt-1 text-sm text-foreground/80 md:text-base">
                {user.title}
              </p>
            ) : null}
            {user.bio ? (
              <p className="mt-1 max-w-[560px] text-sm leading-relaxed text-foreground/90 md:text-base">
                {user.bio}
              </p>
            ) : null}

            {socialItems.length > 0 ? (
              <SocialProfileBlocks
                links={socialItems}
                blockStyle={blockStyle}
                blockRadius={blockRadius}
                cardStyle={blockInlineStyle}
                className="mt-5"
              />
            ) : null}

            <div className="mt-6 md:hidden">
              <Tabs
                value={tab}
                onValueChange={(val) => setTab(val as 'profile' | 'products')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTab value="profile">Profile</TabsTab>
                  <TabsTab value="products">Products</TabsTab>
                </TabsList>
                <TabsPanel value="profile" className="mt-4 space-y-3 outline-none">
                  {profileBlocksSection}
                </TabsPanel>
                <TabsPanel value="products" className="mt-4 space-y-3 outline-none">
                  {productsSection}
                </TabsPanel>
              </Tabs>
            </div>

            <div className="mt-6 hidden space-y-4 md:block">{profileBlocksSection}</div>
          </section>

          <aside className="pt-0 md:pt-10">
            <div className="mb-5 border-b border-border pb-4">
              <div className=" text-xl font-semibold">
                Products
              </div>
            </div>
            <div className="hidden space-y-5 md:block">{productsSection}</div>
          </aside>
        </div>

        <div className="mb-4 mt-10 flex justify-center md:mt-16">
          <div className="flex items-center">
            <PublicMark />
          </div>
        </div>
      </div>
    </div>
  )
}
