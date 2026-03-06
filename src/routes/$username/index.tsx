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
import { Button } from '@/components/ui/button'
import { ShareProfileModal } from '@/components/share-profile-modal'
import { BASE_URL } from '@/lib/constans'
import PublicProfileFooter from '@/components/public-profile-footer'

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

        const pixels = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data
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
  const originalPrice = hasDiscount
    ? formatPrice(product.price as number)
    : null
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
      <CardContent className="p-0">
        <div
          className={cn(
            'aspect-video w-full overflow-hidden bg-muted',
            // imageRadiusClass && 'rounded-md',
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

        <div className="space-y-1  p-2">
          <h3 className="line-clamp-2 text-sm font-semibold">
            {product.title}
          </h3>
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-semibold text-foreground">{price}</p>
            {originalPrice ? (
              <p className="text-foreground/80 text-xs line-through">
                {originalPrice}
              </p>
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

    void getReadableLogoColorFromBanner(user.appearanceBgImageUrl).then(
      (color) => {
        if (isCancelled || !color) return
        setHeaderLogoColor(color)
      },
    )

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

  const trackBlockClick = React.useCallback((blockId: string) => {
    void trpcClient.block.trackClick.mutate({ id: blockId })
  }, [])

  const openBlockUrl = (block: PublicBlock) => {
    if (!block.url) return
    runWhenBrowserIdle(() => {
      trackBlockClick(block.id)
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
      backgroundGradientBottom={
        user.appearanceBackgroundGradientBottom || undefined
      }
      onOpenBlockUrl={openBlockUrl}
      onTrackClick={trackBlockClick}
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
        const selectedProduct = block.content
          ? productMap.get(block.content)
          : null
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      <SiteUserProfileHeader />

      <div
        className={cn(
          'relative z-10 min-h-screen w-full',
          isDarkBg ? 'border-white/10' : 'border-border/70',
        )}
      >
        {isBanner && lcpBannerSrc ? (
          <div className="h-[120px] overflow-hidden  sm:max-w-2xl md:max-w-3xl sm:mx-auto  px-3 ">
            <img
              src={lcpBannerSrc}
              alt={`${user.name} banner`}
              width={1440}
              height={200}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover rounded-lg"
            />
          </div>
        ) : (
          // <div className="h-[160px] w-full " />
          null
        )}

        <div
          className={cn(
            // 'lg:divide-x',
            divideClass,
            hasActiveProducts
              ? 'sm:max-w-2xl md:max-w-3xl  mx-auto grid grid-cols-1 px-5 '
              : 'sm:max-w-2xl md:max-w-3xl mx-auto grid grid-cols-1 px-5',
          )}
        >
          <section
            className={cn(
              'relative pt-6  ',
              isDarkBg ? 'border-white/10' : 'border-border',
            )}
          >
            <ShareProfileModal url={user.username ? `${BASE_URL}/${user.username}` : BASE_URL}>
              <Button variant='link' className='hover:opacity-80 absolute top-6 right-0' style={{ color: profileTextColor.foreground }}><svg className='size-4' viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.6875 6.8752H10.625V12.5393C10.625 12.705 10.5592 12.864 10.4419 12.9812C10.3247 13.0984 10.1658 13.1643 10 13.1643C9.83424 13.1643 9.67527 13.0984 9.55806 12.9812C9.44085 12.864 9.375 12.705 9.375 12.5393V6.8752H5.3125C4.73253 6.87582 4.17649 7.10649 3.76639 7.51659C3.35629 7.92669 3.12562 8.48273 3.125 9.0627V16.5627C3.12562 17.1427 3.35629 17.6987 3.76639 18.1088C4.17649 18.5189 4.73253 18.7496 5.3125 18.7502H14.6875C15.2675 18.7496 15.8235 18.5189 16.2336 18.1088C16.6437 17.6987 16.8744 17.1427 16.875 16.5627V9.0627C16.8744 8.48273 16.6437 7.92669 16.2336 7.51659C15.8235 7.10649 15.2675 6.87582 14.6875 6.8752ZM10.625 3.38418L12.6832 5.442C12.8014 5.55426 12.9587 5.61592 13.1217 5.61383C13.2847 5.61175 13.4404 5.54608 13.5556 5.43083C13.6709 5.31557 13.7365 5.15986 13.7386 4.99689C13.7407 4.83391 13.6791 4.67657 13.5668 4.5584L10.4418 1.4334C10.3246 1.31628 10.1657 1.25049 10 1.25049C9.83431 1.25049 9.6754 1.31628 9.5582 1.4334L6.4332 4.5584C6.32094 4.67657 6.25928 4.83391 6.26137 4.99689C6.26345 5.15986 6.32912 5.31557 6.44437 5.43083C6.55962 5.54608 6.71534 5.61175 6.87831 5.61383C7.04129 5.61592 7.19863 5.55426 7.3168 5.442L9.375 3.38418V6.8752H10.625V3.38418Z" fill="currentColor"></path></svg></Button>
            </ShareProfileModal>
            <div className="flex gap-4">
              <Avatar className="h-24 w-24 rounded-full ring-1 ring-foreground/10 border-2 border-background ">
                {/* <Avatar className="absolute -top-14 left-0 h-24 w-24 rounded-full  ring-2 ring-primary/10  lg:-top-[60px] lg:h-[120px] lg:w-[120px]"> */}
                <AvatarImage src={user.image || '/avatar-placeholder.png'} />
                <AvatarFallback className="text-lg font-bold">
                  {user.name}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">

                <h1
                  id="profile-name"
                  className=" text-3xl font-bold "
                  style={{ color: profileTextColor.foreground }}
                >
                  {user.name}
                </h1>
                {user.title ? (
                  <p
                    className="text-sm "
                    style={{ color: profileTextColor.mutedForeground }}
                  >
                    {user.title}
                  </p>
                ) : null}

                {socialItems.length > 0 ? (
                  <SocialProfileBlocks
                    links={socialItems}
                    iconColor={profileTextColor.foreground}
                    className="flex mt-5"
                  />
                ) : null}
              </div>
            </div>
            {user.bio ? (
              <p
                className="mt-7 mx-auto text-md leading-relaxed "
                style={{ color: profileTextColor.mutedForeground }}
              >
                {user.bio}
              </p>
            ) : null}
            {/* TODO: MAKE USER CAN SET THIS CTA ON  admin/editor/profiles.tsx */}
            <Button variant='neutral' className='mt-7 w-full py-6' size='lg'>Join Discord Sekarang!</Button>
            {hasActiveProducts && (
              <div className="mt-6">
                <Tabs
                  value={tab}
                  onValueChange={(val) => setTab(val as 'profile' | 'products')}
                  className="w-full"
                >
                  <TabsList
                    variant="underline"
                    className="grid w-full grid-cols-2"
                    style={
                      {
                        color: profileTextColor.foreground,
                        '--tabs-indicator-color': profileTextColor.foreground,
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
                    {productsSection}
                  </TabsPanel>
                </Tabs>
              </div>
            )}
          </section>
        </div>

        <div className="pb-4 pt-10">
          <div className="mx-auto sm:max-w-2xl md:max-w-3xl">
            {/* <PublicMark
              textColor={profileTextColor.mutedForeground}
              logoColor={profileTextColor.foreground}
            /> */}
            <PublicProfileFooter />
          </div>
        </div>
      </div>
    </div >
  )
}
