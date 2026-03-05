import * as React from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { Share2, ShoppingBag, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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
      <div className="flex aspect-video items-center justify-center rounded-md border bg-muted">
        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="aspect-video overflow-hidden rounded-md border">
      <img
        src={images[0]}
        alt={title}
        width={1200}
        height={675}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  )
}

function ProductDetailPage() {
  const { username, productId } = Route.useParams()
  const { user, product } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isCartOpen, setIsCartOpen] = React.useState(false)
  const [isSubmittingBuy, setIsSubmittingBuy] = React.useState(false)
  const { addItem, getTotalItems } = useCartStore()

  const productHref = `${BASE_URL.replace(/\/$/, '')}/${username}/products/${productId}`
  const productImages = product.images || []
  const originalPrice = getOriginalPrice(product)
  const productVideoId = extractYouTubeVideoIdFromText(product.description)
  const totalItems = getTotalItems()
  const creatorName = user.username || user.name || 'creator'
  const creatorInitial = creatorName.charAt(0).toUpperCase()

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

  const handleBuyNowSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (isSubmittingBuy) return
    const formData = new FormData(e.currentTarget)
    const trimmedName = String(formData.get('name') || '').trim()
    const trimmedEmail = String(formData.get('email') || '').trim()

    try {
      setIsSubmittingBuy(true)
      await Promise.resolve(
        navigate({
          to: '/$username/products/$productId/checkout',
          params: { username, productId },
          search: {
            name: trimmedName,
            email: trimmedEmail,
          },
        }),
      )
    } catch {
      setIsSubmittingBuy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full space-y-4 ">
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <Link
            to="/$username"
            params={{ username }}
            className="flex items-center gap-3"
          >
            <Avatar className="size-10 border">
              <AvatarImage
                src={user.image || '/avatar-placeholder.png'}
                alt={creatorName}
              />
              <AvatarFallback>{creatorInitial}</AvatarFallback>
            </Avatar>
            <p className="text-xl font-semibold">{creatorName}</p>
          </Link>

          <div className="flex items-center gap-3">
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

            <ShareProfileModal url={productHref}>
              <Button variant="outline" size="icon" aria-label="Share product">
                <Share2 />
              </Button>
            </ShareProfileModal>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start pb-4 px-4">
          <div className="space-y-6 lg:col-span-2">
            <ProductImage images={productImages} title={product.title} />

            <div className="space-y-4 pb-2">
              <h1 className="text-3xl font-bold">{product.title}</h1>

              {product.description ? (
                <p className="whitespace-pre-line text-muted-foreground">
                  {product.description}
                </p>
              ) : null}
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

          <div className="lg:sticky lg:top-6">
            <Form className="space-y-4 pt-6" onSubmit={handleBuyNowSubmit}>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold">{priceLabel(product)}</p>
                {originalPrice && (
                  <p className="text-sm text-muted-foreground line-through">
                    {originalPrice}
                  </p>
                )}
              </div>
              <Field name="name">
                <FieldLabel>Name</FieldLabel>
                <Input
                  name="name"
                  id="buyer-name"
                  placeholder="Nama kamu"
                  required
                  disabled={isSubmittingBuy}
                />
                <FieldError>Please enter your name.</FieldError>
              </Field>
              <Field name="email">
                <FieldLabel>Email</FieldLabel>
                <Input
                  name="email"
                  id="buyer-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={isSubmittingBuy}
                />
                <FieldError>Please enter a valid email.</FieldError>
              </Field>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddToCart}
              >
                <ShoppingCart />
                Add to cart
              </Button>
              <Button type="submit" className="w-full" loading={isSubmittingBuy}>
                Beli
              </Button>
            </Form>
          </div>
        </div>
      </div>

      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}
