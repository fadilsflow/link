import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileIcon,
  ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getOrderByToken } from '@/lib/profile-server'
import { formatPrice } from '@/lib/utils'

export const Route = createFileRoute('/d/$token')({
  component: OrderDeliveryPage,
  loader: async ({ params }) => {
    const data = await getOrderByToken({ data: { token: params.token } })
    if (!data) throw notFound()
    return data
  },
})

function OrderDeliveryPage() {
  const { order, product, creator } = Route.useLoaderData()

  const productFiles = (product.productFiles) || []
  const productImages = (product.images as Array<string>) || []

  // Use snapshot title from the order (immutable), fallback to product
  const displayTitle = order.productTitle ?? product.title ?? 'Product'
  const displayImage = order.productImage ?? productImages[0] ?? null
  const isProductUnavailable = !order.productId || !product?.id
  const isCreatorUnavailable = !order.creatorId || !creator?.username

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Thanks for your order!
          </h1>
          <p className="text-slate-500 max-w-md mx-auto">
            You now have access to <strong>{displayTitle}</strong>. We've also
            sent a confirmation email to <strong>{order.buyerEmail}</strong>.
          </p>
        </div>

        {/* Product Access Card */}
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-8 pt-8 px-6 md:px-10">
            <div className="flex items-start gap-6">
              {displayImage ? (
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
                  <img
                    src={displayImage}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-10 w-10 text-slate-300" />
                </div>
              )}
              <div className="flex-1 min-w-0 py-1">
                <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium mb-2">
                  Purchased
                </span>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                  {displayTitle}
                </h2>
                <div className="flex items-center gap-2 mt-3">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={creator.image || '/avatar-placeholder.png'}
                    />
                    <AvatarFallback className="text-[9px]">
                      {(creator.name ?? 'C').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-500">
                    by {creator.name || 'Creator'}
                  </span>
                </div>
                {isProductUnavailable && (
                  <p className="text-xs text-amber-600 mt-2">
                    Product is no longer active, but this purchase remains valid
                    via order snapshot data.
                  </p>
                )}
                {isCreatorUnavailable && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Creator profile may be unavailable. Your order access
                    remains valid.
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-10 space-y-8">
            {/* Access Content */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Download className="h-5 w-5 text-slate-400" />
                Your Content
              </h3>

              {/* Product URL — uses live product data if available */}
              {product.productUrl && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <ExternalLink className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          Access Link
                        </p>
                        <p className="text-sm text-slate-500 truncate max-w-[200px] md:max-w-xs">
                          {product.productUrl}
                        </p>
                      </div>
                    </div>
                    <Button
                      render={
                        <a
                          href={product.productUrl}
                          target="_blank"
                          rel="noreferrer"
                        />
                      }
                      size="sm"
                      className="rounded-lg"
                    >
                      Open
                    </Button>
                  </div>
                </div>
              )}

              {/* Product Files */}
              {productFiles.length > 0 && (
                <div className="space-y-3">
                  {productFiles.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0">
                          <FileIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {file.size
                              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                              : 'File'}
                          </p>
                        </div>
                      </div>
                      <Button
                        render={
                          <a
                            href={file.url}
                            download
                            target="_blank"
                            rel="noreferrer"
                          />
                        }
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!product.productUrl && productFiles.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500">
                    This product has no digital content attached.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Contact the creator if this is a mistake.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Order Details — uses snapshot data for immutability */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Order Summary
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Order ID</span>
                <span className="font-mono text-slate-700">
                  {order.id.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="text-slate-700">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(order.amountPaid)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-center gap-4">
          {creator.username && (
            <Button
              variant="ghost"
              render={
                <Link to="/$username" params={{ username: creator.username }} />
              }
            >
              More from {creator.name}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
