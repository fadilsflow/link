import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Link as LinkIcon,
  PlayCircle,
  ShoppingCart,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPublicProfile } from '@/lib/profile-server'
import NotFound from '@/components/not-found'
import { cn, formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cart-store'
import { toastManager } from '@/components/ui/toast'

import SiteUserProfileHeader, {
  ProfileBanner,
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

function getVideoEmbedUrl(rawUrl?: string | null) {
  if (!rawUrl) return null

  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()

    if (host.includes('youtube.com')) {
      const id = url.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host.includes('youtu.be')) {
      const id = url.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (host.includes('tiktok.com')) {
      const parts = url.pathname.split('/').filter(Boolean)
      const videoIndex = parts.findIndex((part) => part === 'video')
      if (videoIndex !== -1 && parts[videoIndex + 1]) {
        return `https://www.tiktok.com/embed/v2/${parts[videoIndex + 1]}`
      }
    }

    return null
  } catch {
    return null
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

export const Route = createFileRoute('/$username/')({
  component: UserProfile,
  loader: async ({ params }) => {
    const data = await getPublicProfile({ data: params.username })
    if (!data) {
      throw notFound()
    }
    return data
  },
  notFoundComponent: NotFound,
})

function UserProfile() {
  const { user, blocks, products, socialLinks } = Route.useLoaderData()

  type BgMode = 'banner' | 'wallpaper' | 'color' | 'image'
  type WallpaperStyle = 'flat' | 'gradient' | 'avatar' | 'image'

  const bgType = (user.appearanceBgType as BgMode) || 'banner'
  const wallpaperStyle = user.appearanceBgWallpaperStyle as WallpaperStyle
  const bgColor = user.appearanceBgColor
  const isBanner = bgType === 'banner'

  const blockStyle = user.appearanceBlockStyle as 'basic' | 'flat' | 'shadow'
  const blockRadius = user.appearanceBlockRadius as 'rounded' | 'square'
  const isFullPageBg = !isBanner

  const cardBase =
    blockStyle === 'flat'
      ? 'bg-white/95 backdrop-blur-sm border border-slate-200/50'
      : blockStyle === 'shadow'
        ? 'bg-white/95 backdrop-blur-sm border-none shadow-lg'
        : 'bg-white border border-slate-100 shadow-sm'

  const radiusClass = blockRadius === 'rounded' ? 'rounded-2xl' : 'rounded-md'
  const isDarkBg =
    isFullPageBg &&
    (wallpaperStyle === 'gradient' ||
      wallpaperStyle === 'avatar' ||
      wallpaperStyle === 'image' ||
      (bgType === 'color' &&
        bgColor &&
        (bgColor.includes('#0') || bgColor.includes('rgb(0'))))

  const getImageUrl = (imageUrl?: string | null, fallback?: string) => {
    if (imageUrl) return imageUrl
    return fallback
  }

  const backgroundStyles = (() => {
    if (isBanner) {
      return {
        backgroundImage: user.appearanceBgImageUrl
          ? `url('${getImageUrl(user.appearanceBgImageUrl)}')`
          : `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: bgColor || undefined,
      }
    }

    if (isFullPageBg) {
      if (
        wallpaperStyle === 'gradient' &&
        user.appearanceWallpaperGradientTop
      ) {
        return {
          background: `linear-gradient(180deg, ${user.appearanceWallpaperGradientTop}, ${user.appearanceWallpaperGradientBottom || user.appearanceWallpaperGradientTop})`,
        }
      }

      if (
        (wallpaperStyle === 'flat' && user.appearanceWallpaperColor) ||
        (bgType === 'color' && bgColor)
      ) {
        return {
          backgroundColor:
            user.appearanceWallpaperColor || bgColor || undefined,
        }
      }

      if (wallpaperStyle === 'avatar') {
        return {
          background:
            'radial-gradient(circle at center, rgba(15,23,42,0.1), #020617)',
        }
      }

      // Default to image if style is 'image' or if it's legacy 'image' mode or generic 'wallpaper' mode
      return {
        backgroundImage: user.appearanceWallpaperImageUrl
          ? `url('${getImageUrl(user.appearanceWallpaperImageUrl)}')`
          : user.appearanceBgImageUrl
            ? `url('${getImageUrl(user.appearanceBgImageUrl)}')`
            : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }

    return {
      background: 'radial-gradient(circle at top, #1f2937, #020617)',
    }
  })()

  const productMap = new Map(
    (products as Array<PublicProduct>).map((product) => [product.id, product]),
  )

  const { addItem } = useCartStore()

  return (
    <div
      className="relative min-h-screen font-sans text-slate-900"
      style={isFullPageBg ? backgroundStyles : { backgroundColor: '#f8fafc' }}
    >
      <SiteUserProfileHeader
        avatarUrl={user.image || '/avatar-placeholder.png'}
        username={user.name}
      />
      <ProfileBanner isBanner={isBanner} backgroundStyles={backgroundStyles} />

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

        {(blocks as Array<PublicBlock>).map((block) => {
          if (block.type === 'text') {
            return (
              <div key={block.id} className="w-full space-y-1 py-2 text-center">
                <h2
                  className={cn(
                    'text-2xl font-bold',
                    isFullPageBg && isDarkBg ? 'text-white' : 'text-slate-800',
                  )}
                >
                  {block.title}
                </h2>
                {block.content && (
                  <p
                    className={cn(
                      'text-sm',
                      isFullPageBg && isDarkBg
                        ? 'text-white/70'
                        : 'text-slate-600',
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
                className={cn('w-full overflow-hidden', cardBase, radiusClass)}
                style={{
                  backgroundColor: user.appearanceBlockColor || undefined,
                }}
              >
                {block.content && (
                  <img
                    loading="lazy"
                    src={block.content}
                    alt={block.title || 'Image block'}
                    className="h-auto max-h-[480px] w-full object-cover"
                  />
                )}
                {block.title && (
                  <p className="p-3 text-sm font-semibold">{block.title}</p>
                )}
                {block.url && (
                  <div className="px-3 pb-3">
                    <Button
                      className="w-full"
                      onClick={() =>
                        block.url &&
                        window.open(block.url, '_blank', 'noopener,noreferrer')
                      }
                    >
                      Open link
                    </Button>
                  </div>
                )}
              </Card>
            )
          }

          if (block.type === 'video') {
            const embedUrl = getVideoEmbedUrl(block.content)
            return (
              <Card
                key={block.id}
                className={cn(
                  'w-full overflow-hidden p-3 space-y-3',
                  cardBase,
                  radiusClass,
                )}
                style={{
                  backgroundColor: user.appearanceBlockColor || undefined,
                }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <PlayCircle className="h-4 w-4" />
                  {block.title || 'Video'}
                </div>
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="h-64 w-full rounded-lg border"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Unsupported video URL. Please use a valid YouTube or TikTok
                    link.
                  </p>
                )}
              </Card>
            )
          }

          if (block.type === 'product') {
            const selectedProduct = block.content
              ? productMap.get(block.content)
              : null
            if (!selectedProduct) return null

            const price = getProductPriceLabel(selectedProduct)
            const selectedImages = selectedProduct.images
            const hasImage = !!selectedImages?.length

            return (
              <Card
                key={block.id}
                className={cn(
                  'group w-full cursor-pointer overflow-hidden transition-all hover:scale-[1.01]',
                  cardBase,
                  radiusClass,
                )}
                style={{
                  backgroundColor: user.appearanceBlockColor || undefined,
                }}
                render={
                  <Link
                    to="/$username/products/$productId"
                    params={{
                      username: user.username || '',
                      productId: selectedProduct.id,
                    }}
                  />
                }
              >
                <div className="flex items-stretch">
                  {hasImage && (
                    <div className="h-20 w-20 shrink-0 overflow-hidden bg-slate-100 sm:h-24 sm:w-24">
                      <img
                        loading="lazy"
                        src={selectedImages[0]}
                        alt={selectedProduct.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {selectedProduct.title}
                      </span>
                      <span className="mt-0.5 text-xs text-slate-500">
                        {price}
                      </span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            )
          }

          return (
            <Card
              key={block.id}
              className={cn(
                'group w-full cursor-pointer overflow-hidden transition-all hover:scale-[1.01]',
                cardBase,
                radiusClass,
              )}
              style={{
                backgroundColor: user.appearanceBlockColor || undefined,
              }}
              onClick={() =>
                block.url &&
                window.open(block.url, '_blank', 'noopener,noreferrer')
              }
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-muted/80">
                    <LinkIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <span className="text-sm font-semibold">{block.title}</span>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </Card>
          )
        })}

        {products.length > 0 && (
          <div className="mt-4 w-full space-y-3">
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                isFullPageBg && isDarkBg ? 'text-white/60' : 'text-slate-500',
              )}
            >
              Digital Products
            </p>
            <div className="grid gap-3">
              {(products as Array<PublicProduct>).map((product) => {
                const price = getProductPriceLabel(product)
                const productImages = product.images
                const hasImage = !!productImages?.length

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
                    image: hasImage ? productImages[0] : null,
                    maxQuantity: product.totalQuantity,
                    limitPerCheckout: product.limitPerCheckout,
                  })

                  toastManager.add({
                    title: 'Added to cart',
                    description: `${product.title} added to your cart`,
                  })
                }

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      'group w-full cursor-pointer overflow-hidden transition-all hover:scale-[1.01]',
                      cardBase,
                      radiusClass,
                    )}
                    style={{
                      backgroundColor: user.appearanceBlockColor || undefined,
                    }}
                    render={
                      <Link
                        to="/$username/products/$productId"
                        params={{
                          username: user.username || '',
                          productId: product.id,
                        }}
                      />
                    }
                  >
                    <div className="flex items-stretch">
                      {hasImage && (
                        <div className="h-20 w-20 shrink-0 overflow-hidden bg-slate-100 sm:h-24 sm:w-24">
                          <img
                            loading="lazy"
                            src={productImages[0]}
                            alt={product.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="flex flex-1 items-center justify-between gap-3 p-4">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold">
                            {product.title}
                          </span>
                          <span className="mt-0.5 text-xs text-slate-500">
                            {price}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full shadow-sm hover:scale-110 transition-transform md:h-9 md:w-9"
                            onClick={handleAddToCart}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span className="sr-only">Add to Cart</span>
                          </Button>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        <div className="mb-4 mt-8">
          <div
            className={cn(
              'flex items-center gap-1.5',
              isFullPageBg && isDarkBg ? 'text-white/50' : 'text-slate-500',
            )}
          >
            <span className="text-xs font-medium">Powered by</span>
            <span
              className={cn(
                'text-lg font-bold tracking-tighter',
                isFullPageBg && isDarkBg ? 'text-white' : 'text-slate-900',
              )}
            >
              BLOCKS
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
