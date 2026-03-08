import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  LoaderCircle,
  QrCode,
  RefreshCcw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toastManager } from '@/components/ui/toast'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { formatPrice } from '@/lib/utils'

export const Route = createFileRoute('/pay/$checkoutGroupId')({
  component: PaymentPage,
})

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toastManager.add({
      title: 'Copied',
      description: 'Payment detail copied to clipboard.',
    })
  } catch {
    toastManager.add({
      title: 'Copy failed',
      description: 'Unable to copy payment detail.',
      type: 'error',
    })
  }
}

function getStatusTone(
  status: string,
): React.ComponentProps<typeof Badge>['variant'] {
  switch (status) {
    case 'paid':
      return 'default'
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function isTerminalPaymentStatus(status: string | null | undefined) {
  return (
    status === 'paid' ||
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'expired'
  )
}

function getPaidRedirectKey(checkoutGroupId: string) {
  return `payment-paid-redirected:${checkoutGroupId}`
}

function PaymentPage() {
  const { checkoutGroupId } = Route.useParams()

  const paymentQuery = useQuery({
    queryKey: ['payment-page', checkoutGroupId],
    queryFn: () => trpcClient.order.getPaymentStatus.query({ checkoutGroupId }),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: (query) =>
      isTerminalPaymentStatus(query.state.data?.status) ? false : 5_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  })

  const refreshMutation = useMutation({
    mutationFn: () =>
      trpcClient.order.refreshPaymentStatus.mutate({ checkoutGroupId }),
    onSuccess: (payment) => {
      paymentQuery.refetch()
      if (payment.deliveryUrl) {
        window.location.href = payment.deliveryUrl
      }
    },
    onError: (error) => {
      toastManager.add({
        title: 'Refresh failed',
        description: error.message,
        type: 'error',
      })
    },
  })

  const payment = paymentQuery.data

  React.useEffect(() => {
    if (
      payment?.status === 'paid' &&
      payment.deliveryUrl &&
      typeof window !== 'undefined'
    ) {
      const redirectKey = getPaidRedirectKey(checkoutGroupId)
      if (!window.sessionStorage.getItem(redirectKey)) {
        window.sessionStorage.setItem(redirectKey, payment.deliveryUrl)
        window.location.href = payment.deliveryUrl
      }
    }
  }, [checkoutGroupId, payment?.deliveryUrl, payment?.status])

  if (paymentQuery.isLoading || !payment) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-10">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const qrCodeUrl = payment.instructions.qrCodeUrl
  const showQrFallback = !qrCodeUrl && payment.instructions.qrString

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-5xl space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle>Pay your order</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete the payment with the selected method. Status updates
                automatically while payment is still pending, and you can still
                refresh manually if needed.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={getStatusTone(payment.status)}>
                {payment.status.replace(/_/g, ' ')}
              </Badge>
              {payment.status !== 'paid' ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refreshMutation.mutate()}
                  loading={refreshMutation.isPending}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh status
                </Button>
              ) : null}
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {payment.selectedPaymentMethod.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {payment.selectedPaymentMethod.subtitle}
                  </p>
                </div>

                {qrCodeUrl || showQrFallback ? (
                  <div className="space-y-4">
                    <div className="flex justify-center rounded-lg border p-4">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="Payment QR"
                          className="aspect-square w-full max-w-64 rounded-md"
                        />
                      ) : (
                        <div className="flex aspect-square w-full max-w-64 items-center justify-center rounded-md bg-muted">
                          <QrCode className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {payment.instructions.deeplinkUrl ? (
                      <Button
                        render={
                          <a
                            href={payment.instructions.deeplinkUrl}
                            target="_blank"
                            rel="noreferrer"
                          />
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open payment app
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {payment.instructions.permataVaNumber ? (
                  <div className="space-y-3 rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">Permata virtual account</p>
                      <p className="text-xs text-muted-foreground">
                        Copy the number below and complete the transfer from your
                        banking app.
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-sm font-semibold">
                        {payment.instructions.permataVaNumber}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(payment.instructions.permataVaNumber!)
                        }
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                ) : null}

                {payment.instructions.vaNumbers.map((va) => (
                  <div key={`${va.bank}-${va.vaNumber}`} className="space-y-3 rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">{va.bank.toUpperCase()} virtual account</p>
                      <p className="text-xs text-muted-foreground">
                        Copy the number below and complete the transfer from your
                        banking app.
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-sm font-semibold">{va.vaNumber}</code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(va.vaNumber)}
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                ))}

                {payment.instructions.billKey && payment.instructions.billerCode ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3 rounded-lg border p-4">
                      <p className="text-sm font-medium">Bill key</p>
                      <div className="flex items-center justify-between gap-3">
                        <code className="text-sm font-semibold">
                          {payment.instructions.billKey}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(payment.instructions.billKey!)
                          }
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 rounded-lg border p-4">
                      <p className="text-sm font-medium">Biller code</p>
                      <div className="flex items-center justify-between gap-3">
                        <code className="text-sm font-semibold">
                          {payment.instructions.billerCode}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(payment.instructions.billerCode!)
                          }
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {!qrCodeUrl &&
                !showQrFallback &&
                !payment.instructions.permataVaNumber &&
                payment.instructions.vaNumbers.length === 0 &&
                !payment.instructions.billKey ? (
                  <p className="text-sm text-muted-foreground">
                    Use the selected payment method to complete payment, then
                    refresh the status on this page.
                  </p>
                ) : null}

                {payment.status === 'paid' ? (
                  <div className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5" />
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">Payment confirmed</p>
                          <p className="text-sm text-muted-foreground">
                            Your order is paid. Open the delivery page if you are
                            not redirected automatically.
                          </p>
                        </div>
                        {payment.deliveryUrl ? (
                          <Button render={<a href={payment.deliveryUrl} />}>
                            Open delivery page
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {payment.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{order.productTitle}</p>
                        <p className="text-muted-foreground">Qty {order.quantity}</p>
                      </div>
                      <span>{formatPrice(order.amountPaid)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Product price</span>
                    <span>{formatPrice(payment.amountBreakdown.subtotalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Service fee</span>
                    <span>{formatPrice(payment.amountBreakdown.serviceFeeAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gateway fee</span>
                    <span>{formatPrice(payment.amountBreakdown.gatewayFeeAmount)}</span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span>Total payment</span>
                  <span>{formatPrice(payment.amountBreakdown.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Keep this link if you want to return later and check the payment
                  status again.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(payment.paymentPageUrl)}
                >
                  <Copy className="h-4 w-4" />
                  Copy payment link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
