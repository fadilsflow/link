import * as React from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  XCircle,
} from 'lucide-react'
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { toastManager } from '@/components/ui/toast'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { getPaymentByCheckoutGroup } from '@/lib/payment-server'
import { formatPrice } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { LogoType } from '@/components/kreasi-logo'

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

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function formatStatusLabel(status: string) {
  return status
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
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
  const navigate = Route.useNavigate()
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
  const paymentStatusLabel = formatStatusLabel(payment.status)
  const instructionBlocks = [
    payment.instructions.permataVaNumber
      ? {
        label: 'Permata virtual account',
        value: payment.instructions.permataVaNumber,
      }
      : null,
    ...payment.instructions.vaNumbers.map((va) => ({
      label: `${va.bank.toUpperCase()} virtual account`,
      value: va.vaNumber,
    })),
    payment.instructions.billKey
      ? {
        label: 'Bill key',
        value: payment.instructions.billKey,
      }
      : null,
    payment.instructions.billerCode
      ? {
        label: 'Biller code',
        value: payment.instructions.billerCode,
      }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item))
  const showInstructionFallback =
    !qrCodeUrl &&
    !showQrFallback &&
    instructionBlocks.length === 0 &&
    !payment.instructions.deeplinkUrl
  const isPaid = payment.status === 'paid'
  const isFailedState =
    payment.status === 'failed' ||
    payment.status === 'cancelled' ||
    payment.status === 'expired'

  return (
    <>
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogPopup className="sm:max-w-md">
          <DialogHeader>
            <div
              className={`flex size-12 items-center justify-center rounded-full ${payment.status === 'paid'
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

      <div className="relative overflow-x-hidden">
        <header className="sticky top-0 z-40 bg-background screen-line-after">
          <div className="mx-auto flex max-w-6xl items-center justify-start px-4 py-4 sm:px-6 lg:px-10">
            <LogoType className="text-foreground" text="Payment" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">
          <div className="grid min-h-screen flex-1 gap-8 md:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)] md:divide-x">
            <div className="space-y-6 pt-12 md:pr-8 screen-line-after">
              <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-heading">
                      Product Purchase
                    </h1>
                    <p className="text-2xl font-heading">
                      {formatPrice(payment.amountBreakdown.totalAmount)}
                    </p>
                  </div>
                  <Badge
                    size="default"
                    variant={
                      isPaid
                        ? "success"
                        : isFailedState
                          ? "error"
                          : "warning"
                    }
                    className="rounded-full px-5 py-3"
                  >
                    {paymentStatusLabel}
                  </Badge>
                </div>

                <div className="border-t border-dashed" />

                <div className="flex items-center justify-between">
                  {paymentDeadline && (
                    <div className="space-y-1">
                      <p className="text-base font-medium">Pay Before</p>
                      <p className="text-sm text-muted-foreground">
                        {paymentDeadline}
                      </p>
                    </div>
                  )}

                  {showPaymentTiming && (
                    <div
                      className={`inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold ${countdown.isExpired
                        ? "bg-rose-100 text-rose-700"
                        : "bg-muted text-foreground"
                        }`}
                    >
                      <span className="font-mono">
                        {countdown.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isPaid ? (
                <div className="flex w-full max-w-xl flex-col items-center rounded-[2rem] border border-success/20 bg-gradient-to-b from-background to-success/5 px-6 py-12 text-center">
                  <div className="flex size-28 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-[0_0_0_18px_rgba(16,185,129,0.10)]">
                    <CheckCircle2 className="size-16" />
                  </div>
                  <h2 className="mt-8 text-3xl font-black tracking-tight text-emerald-700">
                    Purchase successful
                  </h2>
                  <p className="mt-3 max-w-md text-base leading-7 text-emerald-900/70">
                    Payment kamu sudah berhasil dikonfirmasi. Product siap
                    diakses sekarang.
                  </p>
                  {payment.deliveryUrl ? (
                    <Button
                      className="mt-8 rounded-full px-8"
                      size="lg"
                      render={<a href={payment.deliveryUrl} />}
                    >
                      Access product
                    </Button>
                  ) : null}
                </div>
              ) : isFailedState ? (
                <div className="flex w-full max-w-xl flex-col items-center rounded-[2rem] border border-rose-500/20 bg-gradient-to-b from-background to-rose-500/5 px-6 py-12 text-center">
                  <div className="flex size-28 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-[0_0_0_18px_rgba(244,63,94,0.10)]">
                    <XCircle className="size-16" />
                  </div>
                  <h2 className="mt-8 text-3xl font-black tracking-tight text-rose-700">
                    {statusDialogCopy.title}
                  </h2>
                  <p className="mt-3 max-w-md text-base leading-7 text-rose-900/70">
                    {statusDialogCopy.description}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="mx-auto flex w-full max-w-[250px] flex-col items-center">
                    <div className="flex w-full items-center justify-center rounded-md border border-input sm:min-h-[250px]">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="Payment QR"
                          className="aspect-square h-full w-full rounded-md object-contain"
                        />
                      ) : showQrFallback ? (
                        <div className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border border-dashed border-input bg-background px-6 text-center">
                          <QrCode className="size-14 text-muted-foreground" />
                          <p className="mt-4 text-sm text-muted-foreground">
                            QR code is generated by the provider. Open your
                            payment app if it does not appear automatically.
                          </p>
                        </div>
                      ) : (
                        <div className="flex aspect-square w-full flex-col items-center justify-center rounded-xl border border-dashed border-input bg-background px-6 text-center">
                          <QrCode className="size-14 text-muted-foreground" />
                          <p className="mt-4 text-sm text-muted-foreground">
                            Payment details are shown below. Complete the
                            transfer and refresh the status afterwards.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-3">
                      {qrCodeUrl ? (
                        <Button
                          variant="outline"
                          className="rounded-full border-input bg-background px-5 shadow-none hover:bg-background"
                          render={<a href={qrCodeUrl} download />}
                        >
                          <Download className="size-4" />
                          Download QR
                        </Button>
                      ) : null}
                      {payment.instructions.deeplinkUrl ? (
                        <Button
                          variant="outline"
                          className="rounded-full border-input bg-background px-5 shadow-none hover:bg-background"
                          render={
                            <a
                              href={payment.instructions.deeplinkUrl}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          <ExternalLink className="size-4" />
                          Open payment app
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {instructionBlocks.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {instructionBlocks.map((item) => (
                        <div
                          key={`${item.label}-${item.value}`}
                          className="rounded-[1.2rem] border border-input bg-background px-4 py-4"
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {item.label}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <code className="truncate text-sm font-semibold text-foreground">
                              {item.value}
                            </code>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-full border-input bg-background shadow-none hover:bg-background"
                              onClick={() => copyToClipboard(item.value)}
                            >
                              <Copy className="size-4" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {showInstructionFallback ? (
                    <p className="text-center text-sm text-muted-foreground">
                      Use the selected payment method to complete payment, then
                      refresh the status on this page.
                    </p>
                  ) : null}
                </div>
              )}

              <div className="border-t border-dashed">
                <Accordion className="w-full">
                  <AccordionItem value="product-detail" className="border-none">
                    <AccordionTrigger className="text-md font-medium">
                      Product Detail
                    </AccordionTrigger>
                    <AccordionPanel className="space-y-4 pb-2">
                      {payment.orders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-start justify-between gap-4 rounded-[1.2rem] border border-input bg-background px-4 py-4"
                        >
                          <div>
                            <p className="font-semibold text-foreground">
                              {order.productTitle}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Qty {order.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            {formatPrice(order.amountPaid)}
                          </span>
                        </div>
                      ))}
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
                {!isTerminalPaymentStatus(payment.status) ? (
                  <div className="w-full fixed bottom-0 left-0 right-0 z-20 bg-background p-4 md:static md:bg-transparent md:p-0">
                    <Button
                      size="xl"
                      className="w-full py-6 rounded-full text-xl font-semibold md:mt-2"
                      onClick={() => refreshMutation.mutate()}
                      loading={refreshMutation.isPending}
                    >
                      Refresh to Check Status
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-6 pt-12 pb-32 md:pl-8 md:pb-8">
              <span className="text-xs font-medium">Payment method</span>

              <div className="rounded-full border px-3 py-2">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground">
                    QRIS
                  </div>
                  <p className="text-sm font-medium">
                    {payment.selectedPaymentMethod.title}
                  </p>
                </div>
              </div>

              <Accordion defaultValue={["transactions"]} className="w-full">
                <AccordionItem value="transactions" className="border-none">
                  <AccordionTrigger className="text-md font-medium">
                    Detail Transactions
                  </AccordionTrigger>
                  <AccordionPanel>
                    <div className="space-y-3">
                      <div className="space-y-3 text-sm">
                        {payment.orders.map((order) => (
                          <div
                            key={`summary-${order.id}`}
                            className="flex items-start justify-between gap-4"
                          >
                            <div>
                              <p>Product</p>
                            </div>
                            <span>{formatPrice(order.amountPaid)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between font-medium text-foreground">
                          <span>Subtotal</span>
                          <span>
                            {formatPrice(
                              payment.amountBreakdown.subtotalAmount,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Transaction Fee</span>
                          <span>
                            {formatPrice(
                              payment.amountBreakdown.serviceFeeAmount,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Payment Gateway Fee</span>
                          <span>
                            {formatPrice(
                              payment.amountBreakdown.gatewayFeeAmount,
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-base font-medium text-foreground">
                        <span>Total</span>
                        <span>
                          {formatPrice(payment.amountBreakdown.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
