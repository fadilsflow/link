import * as React from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { Bookmark, Minus, Plus, ShoppingBag } from 'lucide-react'
import type { CarouselApi } from '@/components/ui/carousel'
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
import { SavedDrawer } from '@/components/saved-drawer'
import { useSavedStore } from '@/store/saved-store'
import { BASE_URL } from '@/lib/constans'
import { Separator } from '@/components/ui/separator'
import PublicProfileFooter from '@/components/public-profile-footer'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { SimpleTooltip } from '@/components/ui/tooltip'
import {
  createMetaEventId,
  getMetaAttributionData,
  MetaPixel,
  trackMetaPixelEvent,
} from '@/lib/meta-pixel'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import NotFound from '@/components/not-found'

export const Route = createFileRoute('/$username/$productId/')({
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
  notFoundComponent: NotFound
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
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    onSelect()
    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-md border bg-muted">
        <ShoppingBag className="h-10 w-10 text-muted-foreground" />
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md border">
        <img
          src={images[0]}
          alt={title}
          width={1200}
          height={675}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-md border">
      <Carousel
        setApi={setApi}
        className="group aspect-video"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent className="-ml-0">
          {images.map((image, index) => (
            <CarouselItem key={`${image}-${index}`} className="pl-0">
              <div className="flex aspect-video items-center justify-center">
                <img
                  src={image}
                  alt={`${title} image ${index + 1}`}
                  width={1200}
                  height={675}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          size={'icon-lg'}
          className="pointer-events-none left-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
        />
        <CarouselNext
          size={'icon-lg'}
          className="pointer-events-none right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
        />
      </Carousel>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
        {images.map((_, index) => {
          const isCurrent = index === current
          return (
            <span
              key={index}
              aria-hidden="true"
              className={
                isCurrent
                  ? 'border h-2 w-2 rounded-full transition-colors bg-muted-foreground'
                  : 'border h-2 w-2 rounded-full transition-colors bg-background'
              }
            />
          )
        })}
      </div>
    </div>
  )
}

function ProductDetailPage() {
  const { username, productId } = Route.useParams()
  const { user, product, metaPixelConfig } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isSavedOpen, setIsSavedOpen] = React.useState(false)
  const [isSubmittingBuy, setIsSubmittingBuy] = React.useState(false)
  const { toggleItem, isSaved } = useSavedStore()
  const hasTrackedViewContent = React.useRef(false)

  const productHref = `${BASE_URL.replace(/\/$/, '')}/${username}/${productId}`
  const productImages = product.images || []
  const originalPrice = getOriginalPrice(product)
  const productVideoId = extractYouTubeVideoIdFromText(product.description)
  const isCurrentProductSaved = isSaved(product.id)
  const creatorName = user.username || user.name || 'creator'
  const creatorInitial = creatorName.charAt(0).toUpperCase()
  const limitPerCheckout = product.limitPerCheckout ?? 1
  const maxQuantity = Math.max(
    1,
    product.totalQuantity != null
      ? Math.min(limitPerCheckout, product.totalQuantity)
      : limitPerCheckout,
  )
  const canAdjustQuantity = maxQuantity > 1
  const [quantity, setQuantity] = React.useState(1)

  React.useEffect(() => {
    if (quantity > maxQuantity) {
      setQuantity(maxQuantity)
    }
  }, [maxQuantity, quantity])

  React.useEffect(() => {
    if (!metaPixelConfig?.pixelId || hasTrackedViewContent.current) return

    hasTrackedViewContent.current = true
    const eventId = createMetaEventId('view_content')
    const attribution = getMetaAttributionData()

    trackMetaPixelEvent(
      'ViewContent',
      {
        content_ids: [product.id],
        content_name: product.title,
        content_type: 'product',
        currency: 'IDR',
        value: product.salePrice ?? product.price ?? 0,
      },
      eventId,
    )

    void trpcClient.metaTracking.track.mutate({
      productId: product.id,
      eventName: 'ViewContent',
      eventId,
      sourceUrl: attribution.sourceUrl,
      fbp: attribution.fbp,
      fbc: attribution.fbc,
      value: product.salePrice ?? product.price ?? 0,
      currency: 'IDR',
    })
  }, [
    metaPixelConfig?.pixelId,
    product.id,
    product.price,
    product.salePrice,
    product.title,
  ])

  const handleToggleSaved = () => {
    const savedPrice = product.payWhatYouWant
      ? (product.suggestedPrice ?? product.minimumPrice ?? 0)
      : (product.salePrice ?? product.price ?? 0)

    toggleItem({
      productId: product.id,
      username,
      title: product.title,
      price: savedPrice,
      image: product.images?.[0] ?? null,
    })
  }

  const handleBuyNowSubmit: React.FormEventHandler<HTMLFormElement> = async (
    e,
  ) => {
    e.preventDefault()
    if (isSubmittingBuy) return
    const formData = new FormData(e.currentTarget)
    const trimmedName = String(formData.get('name') || '').trim()
    const trimmedEmail = String(formData.get('email') || '').trim()

    try {
      setIsSubmittingBuy(true)
      await Promise.resolve(
        navigate({
          to: '/$username/$productId/checkout',
          params: { username, productId },
          search: {
            name: trimmedName,
            email: trimmedEmail,
            quantity,
          },
        }),
      )
    } catch {
      setIsSubmittingBuy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MetaPixel pixelId={metaPixelConfig?.pixelId} />
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
            <Button
              variant="outline"
              onClick={() => setIsSavedOpen(true)}
              aria-label="Open saved products"
            >
              <Bookmark className="h-4 w-4 fill-current" /> Library
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] md:items-start gap-6 pb-4 px-4">
          <div className="space-y-6 lg:col-span-1">
            <ProductImage images={productImages} title={product.title} />

            <div className="space-y-4 pb-2 relative pr-15">
              <h1 className="text-xl md:text-3xl font-bold">{product.title}</h1>

              <div className="flex absolute top-0 right-0 gap-1">
                <SimpleTooltip content="Save Product">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant={'ghost'}
                    onClick={handleToggleSaved}
                    disabled={isSubmittingBuy}
                    aria-label={
                      isCurrentProductSaved
                        ? 'Remove from saved'
                        : 'Save product'
                    }
                  >
                    <Bookmark
                      className={
                        isCurrentProductSaved
                          ? 'fill-primary text-foreground'
                          : ''
                      }
                    />
                  </Button>
                </SimpleTooltip>
              </div>

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
          <div className="sticky md:hidden bg-background flex bottom-0 py-2">
            <Button
              className="w-full"
              size="lg"
              render={
                <Link
                  to="/$username/$productId/checkout"
                  params={{ username, productId }}
                  search={{ quantity }}
                />
              }
            >
              Beli
            </Button>
          </div>

          <div className="md:sticky md:top-6 hidden md:block">
            <Form onSubmit={handleBuyNowSubmit}>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold">{priceLabel(product)}</p>
                {originalPrice && (
                  <p className="text-sm text-muted-foreground line-through">
                    {originalPrice}
                  </p>
                )}
              </div>
              <Separator />
              {canAdjustQuantity ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">Quantity</div>
                  <div className="flex items-center gap-2 rounded-full border border-input bg-background px-2 py-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-full"
                      onClick={() =>
                        setQuantity((prev) => Math.max(1, prev - 1))
                      }
                      disabled={quantity <= 1 || isSubmittingBuy}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-6 text-center text-sm font-medium">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-full"
                      onClick={() =>
                        setQuantity((prev) => Math.min(maxQuantity, prev + 1))
                      }
                      disabled={quantity >= maxQuantity || isSubmittingBuy}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
              <Field name="name">
                <FieldLabel>Name</FieldLabel>
                <Input
                  name="name"
                  id="buyer-name"
                  placeholder="Nama kamu"
                  required
                  disabled={isSubmittingBuy}
                  size={'lg'}
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
                  size={'lg'}
                />
                <FieldError>Please enter a valid email.</FieldError>
              </Field>
              <div className="flex items-center gap-2 w-full">
                <Button
                  size="lg"
                  type="submit"
                  className="py-6 flex-1"
                  loading={isSubmittingBuy}
                >
                  Beli
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
      <SavedDrawer open={isSavedOpen} onClose={() => setIsSavedOpen(false)} />
      <div className="border-t py-4">
        <PublicProfileFooter />
      </div>
    </div>
  )
}
