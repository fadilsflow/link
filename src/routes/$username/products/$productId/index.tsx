import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getPublicProduct } from '@/lib/profile-server'
import { cn, formatPrice } from '@/lib/utils'

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
  images: string[]
  title: string
}

function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)

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
      {/* Main Image */}
      <div className="relative aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden group">
        <img
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-500"
        />

        {/* Navigation Arrows - Show only if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Strip - Show only if multiple images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 px-0.5">
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
  const productImages = (product.images as string[] | null) || []
  const originalPrice = getOriginalPrice(product)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
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
            to={`/${user.username}`}
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

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Image Carousel */}
          <ImageCarousel images={productImages} title={product.title} />

          {/* Product Info Card */}
          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6 space-y-5">
              {/* Badge & Title */}
              <div className="space-y-2">
                <span className="inline-flex text-[11px] px-2.5 py-1 rounded-full bg-slate-900 text-white font-medium tracking-wide">
                  Digital Product
                </span>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                  {product.title}
                </h1>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              )}

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Price Section */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                    Price
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {priceLabel(product)}
                    </span>
                    {originalPrice && (
                      <span className="text-sm text-slate-400 line-through">
                        {originalPrice}
                      </span>
                    )}
                  </div>
                </div>
                {originalPrice && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    Sale
                  </span>
                )}
              </div>

              {/* CTA Button */}
              <Button
                className="w-full h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-xl hover:shadow-slate-900/15 transition-all"
                render={<Link to={checkoutHref} />}
              >
                Buy Now
                <ArrowUpRight className="h-4 w-4" />
              </Button>

              {/* Seller Info */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-xs text-slate-400">Sold by</span>
                <Link
                  to={`/${user.username}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage
                      src={user.image || '/avatar-placeholder.png'}
                    />
                    <AvatarFallback className="bg-slate-900 text-white text-[8px]">
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
