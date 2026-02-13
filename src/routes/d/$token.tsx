import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileIcon,
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

  const productFiles = product.productFiles
  const productImages = product.images as Array<string>

  // Use snapshot title from the order (immutable), fallback to product
  const displayTitle = order.productTitle
  const displayImage = order.productImage || productImages[0]
  const isProductUnavailable = !order.productId || !product.id
  const isCreatorUnavailable = !order.creatorId || !creator.username

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 sm:items-center">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-100 shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Thanks for your order!
                </h1>
                <p className="text-sm text-muted-foreground">
                  You now have access to <strong>{displayTitle}</strong>. A
                  receipt was sent to <strong>{order.buyerEmail}</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-start gap-4">
                {displayImage ? (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                    <img
                      src={displayImage}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-8 w-8 text-slate-300" />
                  </div>
                )}

                <div className="space-y-2 min-w-0">
                  <Badge variant="secondary" className="w-fit">
                    Purchased
                  </Badge>
                  <CardTitle className="text-xl sm:text-2xl leading-tight">
                    {displayTitle}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={creator.image || '/avatar-placeholder.png'}
                      />
                      <AvatarFallback className="text-[9px]">
                        {(creator.name || 'C').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    by {creator.name || 'Creator'}
                  </div>
                </div>
              </div>

              {(isProductUnavailable || isCreatorUnavailable) && (
                <CardDescription className="text-xs">
                  {isProductUnavailable
                    ? 'Product is no longer active, but your purchase remains valid via order snapshot data.'
                    : 'Creator profile may be unavailable. Your order access remains valid.'}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Download className="h-4 w-4 text-muted-foreground" />
                Your Content
              </div>

              {product.productUrl && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Access link</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {product.productUrl}
                        </p>
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
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {productFiles.length > 0 && (
                <div className="space-y-3">
                  {productFiles.map((file: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <FileIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
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
                          >
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!product.productUrl && productFiles.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                      This product has no digital content attached.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contact the creator if this is a mistake.
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono">{order.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold">
                  {formatPrice(order.amountPaid)}
                </span>
              </div>

              {creator.username && (
                <Button
                  variant="outline"
                  className="w-full"
                  render={
                    <Link
                      to="/$username"
                      params={{ username: creator.username }}
                    />
                  }
                >
                  More from {creator.name}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
