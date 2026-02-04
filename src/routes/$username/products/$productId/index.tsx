import { createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getPublicProduct } from '@/lib/profile-server'
import { cn, formatPrice } from '@/lib/utils'

export const Route = createFileRoute(
  '/$username/products/$productId/',
)({
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
  const {
    payWhatYouWant,
    price,
    salePrice,
    minimumPrice,
    suggestedPrice,
  } = product

  if (payWhatYouWant) {
    if (minimumPrice) {
      return `Pay what you want · minimum ${formatPrice(minimumPrice)}`
    }
    if (suggestedPrice) {
      return `Pay what you want · suggested ${formatPrice(suggestedPrice)}`
    }
    return 'Pay what you want'
  }
  if (salePrice && price && salePrice < price) {
    return `${formatPrice(salePrice)} (sale · regular ${formatPrice(price)})`
  }
  if (price) return formatPrice(price)
  return 'No price set'
}

function ProductDetailPage() {
  const { username, productId } = Route.useParams()
  const { user, product } = Route.useLoaderData()

  const checkoutHref = `/${username}/products/${productId}/checkout`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
          <span className="text-[11px] text-slate-500">
            @{user.username}
          </span>
        </div>

        <Card className="shadow-md border border-slate-200 rounded-2xl overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <span className="inline-flex text-[11px] px-2 py-0.5 rounded-full bg-slate-900 text-white font-medium">
                Digital product
              </span>
              <h1 className="text-xl font-semibold text-slate-900 mt-1">
                {product.title}
              </h1>
              {product.description && (
                <p className="text-sm text-slate-600 whitespace-pre-line">
                  {product.description}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                Price
              </p>
              <p className="text-sm font-medium text-slate-900">
                {priceLabel(product)}
              </p>
            </div>

            <Button
              className={cn(
                'w-full rounded-full text-sm font-semibold mt-2 flex items-center justify-center gap-1.5',
              )}
              render={
                <a href={checkoutHref} />
              }
            >
              Buy now
              <ArrowUpRight className="h-4 w-4" />
            </Button>

            <p className="text-[11px] text-slate-400 pt-1">
              Secure checkout will be added soon. For now this is a mock flow.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

