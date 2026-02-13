import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Link as LinkIcon,
  PlayCircle,
  ShoppingCart,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPublicProfile } from '@/lib/profile-server'
import NotFound from '@/components/not-found'
import { cn, formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import { toastManager } from '@/components/ui/toast'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import LiteYouTube from '@/components/LiteYouTube'
import { extractYouTubeVideoId } from '@/lib/lite-youtube'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'

import SiteUserProfileHeader, {
  ProfileCard,
  SocialLinks,
} from '@/components/site-user-profile-header'

interface PublicBlock {
  id: string
  title: string
  url?: string | null
  type?: string | null
  content?: string | null
}

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

const DEFAULT_BANNER =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop'

function runWhenBrowserIdle(callback: () => void, timeout = 1200) {
  if (typeof window === 'undefined') return
  if ('requestIdleCallback' in window) {
    ;(
      window as Window & {
        requestIdleCallback: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number
      }
    ).requestIdleCallback(callback, {
      timeout,
    })
    return
  }
  window.setTimeout(callback, 250)
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
  onAddToCart,
}: {
  product: PublicProduct
  username: string
  cardBase: string
  radiusClass: string
  onAddToCart?: (e: React.MouseEvent) => void
}) {
  const price = getProductPriceLabel(product)
  const productImages = product.images
  const hasImage = !!productImages?.length

  return (
    <Card
      className={cn(
        'group w-full overflow-hidden transition-all hover:-translate-y-0.5',
        cardBase,
        radiusClass,
      )}
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
      <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
        {hasImage ? (
          <img
            loading="lazy"
            decoding="async"
            width={640}
            height={360}
            src={productImages[0]}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-8 w-8 opacity-50" />
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-sm font-semibold">
            {product.title}
          </h3>
          <p className="text-sm font-medium text-muted-foreground">{price}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            View
          </Button>
          {onAddToCart ? (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={onAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function BlockSkeleton({ block }: { block: PublicBlock }) {
  // Image/video blocks previously shifted desktop CLS due to unknown media height; fixed aspect placeholders stabilize first layout.
  if (block.type === 'image') {
    return (
      <div className="w-full rounded-2xl bg-slate-200/70 aspect-[4/3] animate-pulse" />
    )
  }

  if (block.type === 'video') {
    return (
      <div className="w-full rounded-2xl bg-slate-200/70 aspect-video animate-pulse" />
    )
  }

  if (block.type === 'text') {
    return (
      <div className="w-full rounded-2xl bg-slate-200/60 p-6 space-y-3 animate-pulse">
        <div className="h-6 w-2/3 mx-auto rounded bg-slate-300/70" />
        <div className="h-4 w-5/6 mx-auto rounded bg-slate-300/60" />
      </div>
    )
  }

  return (
    <div className="h-20 w-full rounded-2xl bg-slate-200/70 animate-pulse" />
  )
}

function DeferredVideoEmbed({
  block,
  cardClass,
  radiusClass,
}: {
  block: PublicBlock
  cardClass: string
  radiusClass: string
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
        <div className="relative w-full overflow-hidden rounded-lg border bg-slate-100 aspect-video">
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
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab: (search.tab as string) || 'profile',
    }
  },
  head: ({ loaderData }) => {
    const lcpHref =
      loaderData?.user.appearanceBgImageUrl ||
      loaderData?.user.image ||
      DEFAULT_BANNER

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
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()

  const isBanner = true
  const isFullPageBg = false

  const [areBlocksReady, setAreBlocksReady] = React.useState(false)

  React.useEffect(() => {
    // Batch-switching from placeholders to full blocks avoids incremental churn and improves mobile Speed Index.
    runWhenBrowserIdle(() => setAreBlocksReady(true), 1000)
  }, [])

  const cardBase = 'bg-card border border-slate-100 shadow-sm'
  const radiusClass = 'rounded-2xl'
  const backgroundStyles = {
    backgroundColor: '#f8fafc',
  }

  const productMap = new Map(
    (products as Array<PublicProduct>).map((product) => [product.id, product]),
  )

  const { addItem } = useCartStore()

  React.useEffect(() => {
    if (!user.username) return
    runWhenBrowserIdle(() => {
      void trpcClient.user.trackView.mutate({ username: user.username })
    })
  }, [user.username])

  const openBlockUrl = (block: PublicBlock) => {
    if (!block.url) return
    runWhenBrowserIdle(() => {
      void trpcClient.block.trackClick.mutate({ id: block.id })
    })
    window.open(block.url, '_blank', 'noopener,noreferrer')
  }

  const lcpBannerSrc = user.appearanceBgImageUrl || DEFAULT_BANNER

  return (
    <div
      className="relative min-h-screen font-sans text-slate-900"
      style={backgroundStyles}
    >
      <SiteUserProfileHeader
        avatarUrl={user.image || '/avatar-placeholder.png'}
        username={user.name}
      />

      {isBanner ? (
        <div
          className="relative h-[180px] w-full overflow-hidden"
          style={backgroundStyles}
        >
          <img
            src={lcpBannerSrc}
            alt={`${user.name} banner`}
            width={1920}
            height={540}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
      ) : null}

      <div
        className={cn(
          'relative z-20 mx-auto flex max-w-[680px] flex-col items-center gap-6 px-4 pb-16',
          isBanner ? '-mt-24' : 'pt-20',
        )}
      >
        <ProfileCard
          user={user}
          isFullPageBg={isFullPageBg}
          id="profile-card-section"
        />

        <SocialLinks socialLinks={socialLinks} isFullPageBg={isFullPageBg} />
        <div className="flex-1 justify-start w-full mt-4">
          <Tabs
            value={tab}
            onValueChange={(val) =>
              navigate({
                search: (prev) => ({ ...prev, tab: val }),
                replace: true,
              })
            }
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTab value="profile">Profile</TabsTab>
              <TabsTab value="products">Products</TabsTab>
            </TabsList>
            <TabsPanel value="profile" className="mt-4 space-y-3 outline-none">
              {!areBlocksReady
                ? (blocks as Array<PublicBlock>).map((block) => (
                    <BlockSkeleton key={block.id} block={block} />
                  ))
                : (blocks as Array<PublicBlock>).map((block) => {
                    if (block.type === 'text') {
                      return (
                        <div
                          key={block.id}
                          className="w-full space-y-1 py-2 text-center min-h-16"
                        >
                          <h2
                            className={cn(
                              'text-2xl font-bold',
                              'text-slate-800',
                            )}
                          >
                            {block.title}
                          </h2>
                          {block.content && (
                            <p
                              className={cn(
                                'text-sm',
                                'text-slate-600',
                              )}
                            >
                              {block.content}
                            </p>
                          )}
                        </div>
                      )
                    }

                    if (block.type === 'image') {
                      return (
                        <Card
                          key={block.id}
                          className={cn(
                            'w-full overflow-hidden',
                            cardBase,
                            radiusClass,
                          )}
                        >
                          {block.content && (
                            <div className="relative w-full overflow-hidden bg-slate-100 aspect-[4/3]">
                              <img
                                loading="lazy"
                                decoding="async"
                                width={1200}
                                height={900}
                                src={block.content}
                                alt={block.title || 'Image block'}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            </div>
                          )}
                          {block.title && (
                            <p className="p-3 text-sm font-semibold">
                              {block.title}
                            </p>
                          )}
                          {block.url && (
                            <div className="px-3 pb-3">
                              <Button
                                className="w-full"
                                onClick={() => openBlockUrl(block)}
                              >
                                Open link
                              </Button>
                            </div>
                          )}
                        </Card>
                      )
                    }

                    if (block.type === 'video') {
                      return (
                        <DeferredVideoEmbed
                          key={block.id}
                          block={block}
                          cardClass={cardBase}
                          radiusClass={radiusClass}
                        />
                      )
                    }

                    if (block.type === 'product') {
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
                        />
                      )
                    }

                    return (
                      <Card
                        key={block.id}
                        className={cn(
                          'group w-full cursor-pointer overflow-hidden transition-all hover:scale-[1.01] min-h-20',
                          cardBase,
                          radiusClass,
                        )}
                        onClick={() => openBlockUrl(block)}
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-muted/80">
                              <LinkIcon className="h-5 w-5 text-slate-600" />
                            </div>
                            <span className="text-sm font-semibold">
                              {block.title}
                            </span>
                          </div>
                          <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </div>
                      </Card>
                    )
                  })}
            </TabsPanel>

            <TabsPanel value="products" className="mt-4 space-y-3 outline-none">
              {!areBlocksReady ? (
                (products as Array<PublicProduct>).map((product) => (
                  <div
                    key={`product-skeleton-${product.id}`}
                    className="h-64 w-full rounded-2xl bg-slate-200/70 animate-pulse"
                  />
                ))
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(products as Array<PublicProduct>).map((product) => {
                    const handleAddToCart = (e: React.MouseEvent) => {
                      e.preventDefault()
                      e.stopPropagation()

                      const cartPrice = product.payWhatYouWant
                        ? product.minimumPrice || 0
                        : product.salePrice || product.price || 0

                      addItem({
                        productId: product.id,
                        title: product.title,
                        price: cartPrice,
                        image: product.images?.[0] || null,
                        maxQuantity: product.totalQuantity,
                        limitPerCheckout: product.limitPerCheckout,
                      })

                      toastManager.add({
                        title: 'Added to cart',
                        description: `${product.title} added to your cart`,
                      })
                    }

                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        username={user.username || ''}
                        cardBase={cardBase}
                        radiusClass={radiusClass}
                        onAddToCart={handleAddToCart}
                      />
                    )
                  })}
                </div>
              )}
            </TabsPanel>
          </Tabs>
        </div>

        <div className="mb-4 mt-8">
          <div
            className="flex items-center gap-1.5 text-slate-500"
          >
            <span className="text-xs font-medium">Powered by</span>
            <span
              className="text-lg font-bold tracking-tighter text-slate-900"
            >
              BLOCKS
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
