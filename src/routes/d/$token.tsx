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

type DeliveredFile = {
  name: string
  size?: number | null
  url: string
}

export const Route = createFileRoute('/d/$token')({
  component: OrderDeliveryPage,
  loader: async ({ params }) => {
    const data = await getOrderByToken({ data: { token: params.token } })
    if (!data) throw notFound()
    return data
  },
})

function OrderDeliveryPage() {
  const { order, items, creator } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
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
                  Your checkout includes <strong>{items.length}</strong> product
                  {items.length > 1 ? 's' : ''}. We sent your receipt to{' '}
                  <strong>{order.buyerEmail}</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Your Purchased Content</CardTitle>
              <CardDescription>
                Access links, files, and checkout responses for every item in
                this order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item: any) => (
                <div key={item.id} className="space-y-4 border rounded-xl p-4">
                  <div className="flex items-start gap-4">
                    {item.image ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-8 w-8 text-slate-300" />
                      </div>
                    )}

                    <div className="space-y-2 min-w-0 flex-1">
                      <Badge variant="secondary" className="w-fit">
                        Purchased
                      </Badge>
                      <h3 className="text-lg font-semibold leading-tight">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={
                              item.creator.image || '/avatar-placeholder.png'
                            }
                          />
                          <AvatarFallback className="text-[9px]">
                            {(item.creator.name || 'C')
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        by {item.creator.name || 'Creator'}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatPrice(item.amountPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity}
                      </p>
                    </div>
                  </div>

                  {item.productUrl && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">Access link</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.productUrl}
                            </p>
                          </div>
                          <Button
                            render={
                              <a
                                href={item.productUrl}
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

                  {item.productFiles.length > 0 && (
                    <div className="space-y-3">
                      {(item.productFiles as Array<DeliveredFile>).map(
                        (file, index) => (
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
                                      : 'Download file'}
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
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        ),
                      )}
                    </div>
                  )}

                  {Object.keys(item.checkoutAnswers ?? {}).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Your checkout responses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 pt-0">
                        {Object.entries(item.checkoutAnswers).map(
                          ([key, value]) => (
                            <p key={key} className="text-xs">
                              <span className="font-medium">{key}:</span>{' '}
                              {String(value)}
                            </p>
                          ),
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {!item.productUrl && item.productFiles.length === 0 && (
                    <Card>
                      <CardContent className="pt-6 text-center space-y-1">
                        <p className="text-sm text-muted-foreground">
                          This product currently has no attached delivery
                          content.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Contact the creator if this is unexpected.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Buyer</span>
                <span className="truncate max-w-[180px] text-right">
                  {order.buyerEmail}
                </span>
              </div>
              <Separator />
              <div className="space-y-2">
                {items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm gap-2"
                  >
                    <span className="text-muted-foreground truncate">
                      {item.title} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.amountPaid)}</span>
                  </div>
                ))}
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
