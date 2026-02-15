import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  ArrowLeft,
  CircleCheck,
  Share2,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPublicProduct } from '@/lib/profile-server'
import { formatPrice } from '@/lib/utils'
import LiteYouTube from '@/components/LiteYouTube'
import { extractYouTubeVideoIdFromText } from '@/lib/lite-youtube'
import { toastManager } from '@/components/ui/toast'
import { useCartStore } from '@/store/cart-store'
import { ShareProfileModal } from '@/components/share-profile-modal'
import { CartDrawer } from '@/components/cart-drawer'
import { BASE_URL } from '@/lib/constans'

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

interface ProductImageProps {
  images: Array<string>
  title: string
}

function ProductImage({ images, title }: ProductImageProps) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-4/3 items-center justify-center border bg-muted">
        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
      </div>
    )
  }

  return (
    <img
      src={images[0]}
      alt={title}
      width={1200}
      height={900}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      className="h-auto w-full rounded-md border object-cover"
    />
  )
}

function ProductDetailPage() {
  const { username, productId } = Route.useParams()
  const { user, product } = Route.useLoaderData()
  const [isCartOpen, setIsCartOpen] = React.useState(false)
  const { addItem, getTotalItems } = useCartStore()

  const checkoutHref = `/${username}/products/${productId}/checkout`
  const productHref = `${BASE_URL.replace(/\/$/, '')}/${username}/products/${productId}`
  const productImages = product.images || []
  const originalPrice = getOriginalPrice(product)
  const productVideoId = extractYouTubeVideoIdFromText(product.description)
  const totalItems = getTotalItems()

  const handleAddToCart = () => {
    const cartPrice = product.payWhatYouWant
      ? product.suggestedPrice ?? product.minimumPrice ?? 0
      : product.salePrice ?? product.price ?? 0

    addItem({
      productId: product.id,
      title: product.title,
      price: cartPrice,
      image: product.images?.[0] ?? null,
      maxQuantity: product.totalQuantity ?? null,
      limitPerCheckout: product.limitPerCheckout ?? null,
    })

    toastManager.add({
      title: 'Added to cart',
      description: `${product.title} added to your cart`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-4 pb-36 sm:py-8 sm:pb-40">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.history.back()}
            aria-label="Back"
          >
            <ArrowLeft />
          </Button>
          <div className="flex items-center gap-3">
            <ShareProfileModal url={productHref}>
              <Button
                variant="outline"
                size="icon"
                aria-label="Share product"
              >
                <Share2 />
              </Button>
            </ShareProfileModal>
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                aria-label="Open cart"
              >
                <ShoppingCart />
              </Button>
              {totalItems > 0 ? (
                <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                  {totalItems}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <ProductImage images={productImages} title={product.title} />

        <div className="space-y-4 pb-2">
          <h1 className="text-3xl font-bold">{product.title}</h1>
          {product.description ? (
            <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>
          ) : null}

          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold">{priceLabel(product)}</p>
            {originalPrice && (
              <p className="text-sm text-muted-foreground line-through">{originalPrice}</p>
            )}
          </div>


          <p className="text-sm text-muted-foreground">
            Sold by{' '}
            <Link
              to="/$username"
              params={{ username }}
              search={{ tab: 'profile' }}
              className="font-semibold text-foreground hover:underline"
            >
              @{user.username}
            </Link>
          </p>
        </div>

        {productVideoId ? (
          <Card>
            <CardHeader>
              <CardTitle>Video preview</CardTitle>
            </CardHeader>
            <CardContent>
              <LiteYouTube
                videoId={productVideoId}
                title={`${product.title} video preview`}
                playLabel="Play product video"
              />
            </CardContent>
          </Card>
        ) : null}

      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-background">
        <div className="mx-auto grid w-full max-w-xl grid-cols-[auto_1fr] items-center gap-3 px-4 py-4">
          <Button size={"icon-lg"} variant="outline" onClick={handleAddToCart}>
            <ShoppingCart />
          </Button>
          <Button size={'lg'} render={<Link to={checkoutHref} />}>Checkout</Button>
        </div>
      </div>

      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}
