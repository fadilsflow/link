import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getOrderByToken } from '@/lib/profile-server'
import { formatPrice } from '@/lib/utils'
import {
  consumePendingMetaPurchase,
  MetaPixel,
  trackMetaPixelEvent,
} from '@/lib/meta-pixel'
import NotFound from '@/components/not-found'
import { ProductContentRenderer } from '@/components/products/ProductContentRenderer'

export const Route = createFileRoute('/d/$token/')({
  component: OrderDeliveryPage,
  loader: async ({ params }) => {
    const data = await getOrderByToken({ data: { token: params.token } })
    if (!data) throw notFound()
    return data
  },
  notFoundComponent: NotFound,
})

function OrderDeliveryPage() {
  const {
    order,
    items,
    groupOrders,
    creator,
    paymentSummary,
    metaPixelConfig,
  } = Route.useLoaderData()

  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!metaPixelConfig?.pixelId) return

    const pendingPurchase = consumePendingMetaPurchase(order.id)
    if (!pendingPurchase) return

    trackMetaPixelEvent(
      'Purchase',
      {
        content_ids: pendingPurchase.contentIds,
        content_type: 'product',
        content_name: pendingPurchase.contentName,
        currency: pendingPurchase.currency,
        order_id: pendingPurchase.orderId,
        value: pendingPurchase.value,
      },
      pendingPurchase.eventId,
    )
  }, [metaPixelConfig?.pixelId, order.id])

  return (
    <div className="min-h-screen bg-background ">
      <MetaPixel pixelId={metaPixelConfig?.pixelId} />
      <div className="space-y-6 lg:space-y-10 py-6 px-4">
        <header className="flex items-center justify-between pb-4 border-b">
          <h1 className="text-xl font-semibold">
            {items.map((item: any) => item.title).join(', ')}
          </h1>
        </header>

        <div className="flex flex-col-reverse lg:grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start lg:gap-10">
          <div className="space-y-4 flex flex-col lg:sticky lg:top-10">
            {items.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="font-medium text-sm">{items[0].title}</div>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={creator?.image || '/avatar-placeholder.png'}
                      />
                      <AvatarFallback className="text-[10px]">
                        {(creator?.name || 'C').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {creator.username ? (
                      <Link
                        to="/$username"
                        params={{ username: creator.username }}
                      >
                        By {creator.name || 'Creator'}
                      </Link>
                    ) : (
                      <span>By {creator.name || 'Creator'}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Accordion className="w-full bg-card border rounded-xl">
              <AccordionItem value="receipt" className="border-b-0 px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  Receipt
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Order ID</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {order.id.slice(0, 8)}...
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 hover:bg-transparent"
                          onClick={() => {
                            navigator.clipboard.writeText(order.id)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          }}
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                          )}
                          <span className="sr-only">Copy Order ID</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Buyer</span>
                      <span className="truncate max-w-[150px] text-right">
                        {order.buyerEmail}
                      </span>
                    </div>
                    {paymentSummary ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <span className="capitalize">
                            {paymentSummary.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Method</span>
                          <span className="text-right">
                            {paymentSummary.selectedPaymentMethod?.title ??
                              paymentSummary.paymentType ??
                              '-'}
                          </span>
                        </div>
                      </>
                    ) : null}

                    <Separator />

                    <div className="space-y-2">
                      {groupOrders.map((groupOrder: any) => (
                        <div
                          key={groupOrder.id}
                          className="flex justify-between text-sm gap-2"
                        >
                          <span className="text-muted-foreground truncate">
                            {groupOrder.productTitle} × {groupOrder.quantity}
                          </span>
                          <span>{formatPrice(groupOrder.amountPaid)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {paymentSummary ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Subtotal
                          </span>
                          <span>
                            {formatPrice(
                              paymentSummary.amountBreakdown.subtotalAmount,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Service fee
                          </span>
                          <span>
                            {formatPrice(
                              paymentSummary.amountBreakdown.serviceFeeAmount,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Gateway fee
                          </span>
                          <span>
                            {formatPrice(
                              paymentSummary.amountBreakdown.gatewayFeeAmount,
                            )}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total payment</span>
                          <span>
                            {formatPrice(
                              paymentSummary.amountBreakdown.totalAmount,
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm mt-3 pt-3 border-t">
                        <span className="text-muted-foreground">
                          Total Paid
                        </span>
                        <span className="font-semibold">
                          {formatPrice(order.amountPaid)}
                        </span>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="space-y-6">
            {items.map((item: any) => {
              const productContent = item.productContent
              const hasContent =
                productContent &&
                typeof productContent === 'object' &&
                Object.keys(productContent).length > 0

              return (
                <div key={item.id} className="space-y-4">
                  {hasContent ? (
                    <ProductContentRenderer content={productContent} />
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center space-y-1">
                        <p className="text-sm text-muted-foreground">
                          This product currently has no attached delivery
                          content.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
