import * as React from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  RefreshCcw,
  TimerReset,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toastManager } from '@/components/ui/toast'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { getPaymentByCheckoutGroup } from '@/lib/payment-server'
import { formatPrice } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/pay/$checkoutGroupId')({
  component: PaymentPage,
  loader: async ({ params }) => {
    const data = await getPaymentByCheckoutGroup({
      data: { checkoutGroupId: params.checkoutGroupId },
    })
    if (!data) throw notFound()
    return data
  },
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

function getStatusDialogCopy(status: string) {
  switch (status) {
    case 'paid':
      return {
        title: 'Purchase successful',
        description:
          'Payment sudah terkonfirmasi. Kamu bisa lanjut akses product yang dibeli.',
        actionLabel: 'Access product',
        icon: CheckCircle2,
      }
    case 'failed':
      return {
        title: 'Payment failed',
        description:
          'Pembayaran gagal diproses. Silakan coba ulangi checkout jika masih ingin melanjutkan.',
        actionLabel: null,
        icon: XCircle,
      }
    case 'cancelled':
      return {
        title: 'Payment cancelled',
        description:
          'Pembayaran dibatalkan. Buat pembayaran baru kalau kamu masih ingin membeli product ini.',
        actionLabel: null,
        icon: XCircle,
      }
    case 'expired':
      return {
        title: 'Payment expired',
        description:
          'Waktu pembayaran sudah habis. Buat pembayaran baru untuk melanjutkan pembelian.',
        actionLabel: null,
        icon: XCircle,
      }
    default:
      return {
        title: 'Payment update',
        description: 'Status pembayaran sudah diperbarui.',
        actionLabel: null,
        icon: CheckCircle2,
      }
  }
}

function formatPaymentDeadline(value: string | null) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date)
}

function formatCountdown(targetTime: string | null, now: number) {
  if (!targetTime) return null

  const target = new Date(targetTime).getTime()
  if (Number.isNaN(target)) return null

  const diff = target - now
  if (diff <= 0) {
    return {
      isExpired: true,
      label: '00:00:00',
    }
  }

  const totalSeconds = Math.floor(diff / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    isExpired: false,
    label: [hours, minutes, seconds]
      .map((value) => value.toString().padStart(2, '0'))
      .join(':'),
  }
}

function PaymentPage() {
  const { checkoutGroupId } = Route.useParams()
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false)
  const [now, setNow] = React.useState(() => Date.now())

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
    onSuccess: () => {
      paymentQuery.refetch()
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
    if (isTerminalPaymentStatus(payment?.status)) {
      setStatusDialogOpen(true)
    }
  }, [checkoutGroupId, payment?.status])

  React.useEffect(() => {
    if (!payment?.expiresAt || isTerminalPaymentStatus(payment.status)) return

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [payment?.expiresAt, payment?.status])

  if (paymentQuery.isLoading || !payment) {
    return (
      <div className="container flex flex-col gap-4 min-h-screen items-center justify-center py-10">
        <Spinner />
        <span className="text-sm">Loading transaction details...</span>
      </div>
    )
  }

  const qrCodeUrl = payment.instructions.qrCodeUrl
  const showQrFallback = !qrCodeUrl && payment.instructions.qrString
  const statusDialogCopy = getStatusDialogCopy(payment.status)
  const StatusDialogIcon = statusDialogCopy.icon
  const paymentDeadline = formatPaymentDeadline(payment.expiresAt)
  const countdown = formatCountdown(payment.expiresAt, now)
  const showPaymentTiming =
    !isTerminalPaymentStatus(payment.status) && !!paymentDeadline && !!countdown

  return (
    <>
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogPopup className="sm:max-w-md">
          <DialogHeader>
            <div
              className={`flex size-12 items-center justify-center rounded-full ${
                payment.status === 'paid'
                  ? 'bg-emerald-500/12 text-emerald-600'
                  : 'bg-rose-500/12 text-rose-600'
              }`}
            >
              <StatusDialogIcon className="size-6" />
            </div>
            <DialogTitle>{statusDialogCopy.title}</DialogTitle>
            <DialogDescription>
              {statusDialogCopy.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {payment.status === 'paid' && payment.deliveryUrl ? (
              <Button render={<a href={payment.deliveryUrl} />}>
                {statusDialogCopy.actionLabel}
              </Button>
            ) : null}
            <Button
              type="button"
              variant={payment.status === 'paid' ? 'outline' : 'default'}
              onClick={() => setStatusDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-5xl space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle>Pay your order</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete the payment with the selected method. Status updates
                  automatically while payment is still pending, and you can
                  still refresh manually if needed.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={getStatusTone(payment.status)}>
                  {payment.status.replace(/_/g, ' ')}
                </Badge>
                {!isTerminalPaymentStatus(payment.status) ? (
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
            <CardContent>
              <div
                className={`grid gap-3 ${
                  showPaymentTiming
                    ? 'md:grid-cols-[1.1fr_0.9fr_0.8fr]'
                    : 'md:grid-cols-1'
                }`}
              >
                <div className="rounded-2xl border bg-muted/30 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Payment method
                  </p>
                  <p className="mt-2 text-base font-medium">
                    {payment.selectedPaymentMethod.title}
                  </p>
                </div>

                {showPaymentTiming ? (
                  <>
                    <div className="rounded-2xl border bg-muted/30 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Expired at
                      </p>
                      <p className="mt-2 text-base font-medium">
                        {paymentDeadline}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl border px-4 py-3 ${
                        countdown.isExpired
                          ? 'border-rose-200 bg-rose-50/80'
                          : 'border-amber-200 bg-amber-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <TimerReset className="size-3.5" />
                        Countdown
                      </div>
                      <p
                        className={`mt-2 font-mono text-3xl font-semibold tracking-[0.12em] ${
                          countdown.isExpired
                            ? 'text-rose-600'
                            : 'text-amber-700'
                        }`}
                      >
                        {countdown.label}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {payment.status === 'paid' ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-200 bg-linear-to-br from-emerald-50 via-background to-emerald-100 px-6 py-12 text-center">
                      <div className="relative mb-6 flex size-36 items-center justify-center rounded-full bg-emerald-500/12 shadow-[0_0_0_18px_rgba(34,197,94,0.08)]">
                        <CheckCircle2 className="size-24 text-emerald-600" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-3xl font-semibold tracking-tight text-emerald-700">
                          Purchase successful
                        </p>
                        <p className="mx-auto max-w-md text-sm text-emerald-800/80">
                          Payment kamu sudah berhasil dikonfirmasi. Product siap
                          diakses sekarang.
                        </p>
                      </div>
                      {payment.deliveryUrl ? (
                        <Button
                          className="mt-8"
                          size="lg"
                          render={<a href={payment.deliveryUrl} />}
                        >
                          Access product
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <>
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
                            <p className="text-sm font-medium">
                              Permata virtual account
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Copy the number below and complete the transfer
                              from your banking app.
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
                                copyToClipboard(
                                  payment.instructions.permataVaNumber!,
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {payment.instructions.vaNumbers.map((va) => (
                        <div
                          key={`${va.bank}-${va.vaNumber}`}
                          className="space-y-3 rounded-lg border p-4"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {va.bank.toUpperCase()} virtual account
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Copy the number below and complete the transfer
                              from your banking app.
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <code className="text-sm font-semibold">
                              {va.vaNumber}
                            </code>
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

                      {payment.instructions.billKey &&
                      payment.instructions.billerCode ? (
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
                                  copyToClipboard(
                                    payment.instructions.billerCode!,
                                  )
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
                          Use the selected payment method to complete payment,
                          then refresh the status on this page.
                        </p>
                      ) : null}
                    </>
                  )}
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
                          <p className="text-muted-foreground">
                            Qty {order.quantity}
                          </p>
                        </div>
                        <span>{formatPrice(order.amountPaid)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Product price
                      </span>
                      <span>
                        {formatPrice(payment.amountBreakdown.subtotalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Service fee</span>
                      <span>
                        {formatPrice(payment.amountBreakdown.serviceFeeAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Gateway fee</span>
                      <span>
                        {formatPrice(payment.amountBreakdown.gatewayFeeAmount)}
                      </span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between font-medium">
                    <span>Total payment</span>
                    <span>
                      {formatPrice(payment.amountBreakdown.totalAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Keep this link if you want to return later and check the
                    payment status again.
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
    </>
  )
}
