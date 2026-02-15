import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getPublicProduct } from '@/lib/profile-server'
import { cn, formatPrice } from '@/lib/utils'
import LiteYouTube from '@/components/LiteYouTube'
import { extractYouTubeVideoIdFromText } from '@/lib/lite-youtube'

export const Route = createFileRoute('/$username/products/$productId/')({
  component: ProductDetailPage,
  loader: async ({ params }) => {
    const data = await getPublicProduct({
      data: {
        username: params.username,
        productId: params.productId,
      },
    })
    if (!data) throw notFound()
    return data
  },
  head: ({ loaderData }) => {
    const heroImage = loaderData?.product.images?.[0]
    return {
      links: heroImage
        ? [
            {
              rel: 'preload',
              as: 'image',
              href: heroImage,
            },
          ]
        : [],
    }
  },
})

function priceLabel(product: any): string {
  const { payWhatYouWant, price, salePrice, minimumPrice, suggestedPrice } =
    product

  if (payWhatYouWant) {
    if (minimumPrice) {
      return `Pay what you want · min ${formatPrice(minimumPrice)}`
    }
    if (suggestedPrice) {
      return `Pay what you want · suggested ${formatPrice(suggestedPrice)}`
    }
    return 'Pay what you want'
  }
  if (salePrice && price && salePrice < price) {
    return `${formatPrice(salePrice)}`
  }
  if (price) return formatPrice(price)
  return 'Free'
}

function getOriginalPrice(product: any): string | null {
  const { payWhatYouWant, price, salePrice } = product
  if (!payWhatYouWant && salePrice && price && salePrice < price) {
    return formatPrice(price)
  }
  return null
}

interface ImageCarouselProps {
  images: Array<string>
  title: string
}

function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [enhancedUi, setEnhancedUi] = React.useState(false)

  React.useEffect(() => {
    // Defers carousel controls + thumbnails until first paint settles, lowering initial hydration pressure (TBT).
    const timer = window.setTimeout(() => setEnhancedUi(true), 500)
    return () => window.clearTimeout(timer)
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
        <ShoppingBag className="h-16 w-16 text-slate-300" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden group">
        {/* Marks the true hero image as eager/high priority so it wins LCP quickly on mobile. */}
        <img
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          width={1200}
          height={900}
          loading={currentIndex === 0 ? 'eager' : 'lazy'}
          fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500"
        />

        {enhancedUi && images.length > 1 && (
          <>
            <Button
              onClick={goToPrevious}
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </Button>
            <Button
              onClick={goToNext}
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </Button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {enhancedUi && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 px-0.5 min-h-16">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ring-2',
                index === currentIndex
                  ? 'ring-slate-900'
                  : 'ring-transparent hover:ring-slate-300 opacity-60 hover:opacity-100',
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductDetailPage() {
  const { username, productId } = Route.useParams()
  const { user, product } = Route.useLoaderData()

  const checkoutHref = `/${username}/products/${productId}/checkout`
  const productImages = product.images || []
  const originalPrice = getOriginalPrice(product)
  const productVideoId = extractYouTubeVideoIdFromText(product.description)

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600 -ml-2 hover:bg-slate-100"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <Link
            to="/$username"
            params={{ username }}
            search={{ tab: 'profile' }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.image || '/avatar-placeholder.png'} />
              <AvatarFallback className="bg-slate-900 text-white text-xs">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-slate-700">
              @{user.username}
            </span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Preview</CardTitle>
                <CardDescription>
                  Browse product images and media.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageCarousel images={productImages} title={product.title} />
              </CardContent>
            </Card>

            {productVideoId ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Video preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <LiteYouTube
                    videoId={productVideoId}
                    title={`${product.title} video preview`}
                    className="rounded-xl border border-slate-200"
                    playLabel="Play product video"
                  />
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card className="lg:sticky lg:top-20">
            <CardHeader className="space-y-3">
              <Badge variant="secondary" className="w-fit">
                Digital Product
              </Badge>
              <CardTitle className="text-2xl leading-tight">
                {product.title}
              </CardTitle>
              {product.description && (
                <CardDescription className="whitespace-pre-line leading-relaxed text-sm">
                  {product.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <Separator />

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Price
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold tracking-tight">
                    {priceLabel(product)}
                  </p>
                  {originalPrice && (
                    <p className="text-sm text-muted-foreground line-through">
                      {originalPrice}
                    </p>
                  )}
                  {originalPrice && <Badge variant="success">Sale</Badge>}
                </div>
              </div>

              <Button
                size="xl"
                className="w-full"
                render={<Link to={checkoutHref} />}
              >
                Buy now
                <ArrowUpRight className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <CircleCheck className="h-4 w-4" />
                Instant digital delivery after purchase
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sold by</span>
                <Link
                  to="/$username"
                  params={{ username }}
                  search={{ tab: 'profile' }}
                  className="inline-flex items-center gap-2 font-medium hover:opacity-80 transition-opacity"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={user.image || '/avatar-placeholder.png'}
                    />
                    <AvatarFallback className="bg-slate-900 text-white text-[10px]">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.name}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
