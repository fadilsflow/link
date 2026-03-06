import * as React from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { Bookmark, ShoppingBag } from 'lucide-react'
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
import { ShareProfileModal } from '@/components/share-profile-modal'
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
                  ? 'h-2 w-2 rounded-full transition-colors bg-muted-foreground'
                  : 'h-2 w-2 rounded-full transition-colors bg-background'
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
  const { user, product } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isSavedOpen, setIsSavedOpen] = React.useState(false)
  const [isSubmittingBuy, setIsSubmittingBuy] = React.useState(false)
  const { toggleItem, isSaved } = useSavedStore()

  const productHref = `${BASE_URL.replace(/\/$/, '')}/${username}/products/${productId}`
  const productImages = product.images || []
  const originalPrice = getOriginalPrice(product)
  const productVideoId = extractYouTubeVideoIdFromText(product.description)
  const isCurrentProductSaved = isSaved(product.id)
  const creatorName = user.username || user.name || 'creator'
  const creatorInitial = creatorName.charAt(0).toUpperCase()

  const handleToggleSaved = () => {
    const savedPrice = product.payWhatYouWant
      ? product.suggestedPrice ?? product.minimumPrice ?? 0
      : product.salePrice ?? product.price ?? 0

    toggleItem({
      productId: product.id,
      username,
      title: product.title,
      price: savedPrice,
      image: product.images?.[0] ?? null,
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSavedOpen(true)}
              aria-label="Open saved products"
            >
              <Bookmark />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] md:items-start gap-6 pb-4 px-4">
          <div className="space-y-6 lg:col-span-1">
            <ProductImage images={productImages} title={product.title} />

            <div className="space-y-4 pb-2 relative pr-15">
              <h1 className="text-xl md:text-3xl font-bold">{product.title}</h1>

              <div className="flex absolute top-0 right-0 gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant={'ghost'}
                  onClick={handleToggleSaved}
                  disabled={isSubmittingBuy}
                  aria-label={isCurrentProductSaved ? 'Remove from saved' : 'Save product'}
                >
                  <Bookmark className={isCurrentProductSaved ? 'fill-primary text-foreground' : ''} />
                </Button>

                <ShareProfileModal url={productHref}>
                  <Button variant="ghost" size="icon-sm" aria-label="Share product">
                    <svg className='size-4' viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.6875 6.8752H10.625V12.5393C10.625 12.705 10.5592 12.864 10.4419 12.9812C10.3247 13.0984 10.1658 13.1643 10 13.1643C9.83424 13.1643 9.67527 13.0984 9.55806 12.9812C9.44085 12.864 9.375 12.705 9.375 12.5393V6.8752H5.3125C4.73253 6.87582 4.17649 7.10649 3.76639 7.51659C3.35629 7.92669 3.12562 8.48273 3.125 9.0627V16.5627C3.12562 17.1427 3.35629 17.6987 3.76639 18.1088C4.17649 18.5189 4.73253 18.7496 5.3125 18.7502H14.6875C15.2675 18.7496 15.8235 18.5189 16.2336 18.1088C16.6437 17.6987 16.8744 17.1427 16.875 16.5627V9.0627C16.8744 8.48273 16.6437 7.92669 16.2336 7.51659C15.8235 7.10649 15.2675 6.87582 14.6875 6.8752ZM10.625 3.38418L12.6832 5.442C12.8014 5.55426 12.9587 5.61592 13.1217 5.61383C13.2847 5.61175 13.4404 5.54608 13.5556 5.43083C13.6709 5.31557 13.7365 5.15986 13.7386 4.99689C13.7407 4.83391 13.6791 4.67657 13.5668 4.5584L10.4418 1.4334C10.3246 1.31628 10.1657 1.25049 10 1.25049C9.83431 1.25049 9.6754 1.31628 9.5582 1.4334L6.4332 4.5584C6.32094 4.67657 6.25928 4.83391 6.26137 4.99689C6.26345 5.15986 6.32912 5.31557 6.44437 5.43083C6.55962 5.54608 6.71534 5.61175 6.87831 5.61383C7.04129 5.61592 7.19863 5.55426 7.3168 5.442L9.375 3.38418V6.8752H10.625V3.38418Z" fill="currentColor"></path></svg>
                  </Button>
                </ShareProfileModal>
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
            <Button className='w-full' size='lg' render={<Link to='/$username/products/$productId/checkout' params={{ username, productId }} />}>Beli</Button >
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
    </div >
  )
}
