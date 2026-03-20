import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import type {CheckoutPaymentMethod} from '@/lib/payment-methods';
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { getPublicProduct } from '@/lib/profile-server'
import {
  CHECKOUT_PAYMENT_METHOD
  
} from '@/lib/payment-methods'
import { formatPrice, formatPriceInput, parsePriceInput } from '@/lib/utils'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { toastManager } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

import {
  MetaPixel,
  createMetaEventId,
  getMetaAttributionData,
  savePendingMetaPurchase,
  trackMetaPixelEvent,
} from '@/lib/meta-pixel'
import NotFound from '@/components/not-found'

export const Route = createFileRoute('/$username/$productId/checkout')({
  component: CheckoutPage,
  validateSearch: (
    search: Record<string, unknown>,
  ): { name?: string; email?: string; quantity?: number } => ({
    name: typeof search.name === 'string' ? search.name : undefined,
    email: typeof search.email === 'string' ? search.email : undefined,
    quantity:
      typeof search.quantity === 'string'
        ? Number.isFinite(Number(search.quantity))
          ? Number(search.quantity)
          : undefined
        : typeof search.quantity === 'number'
          ? search.quantity
          : undefined,
  }),
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
    const lcpImage = loaderData?.product.images?.[0]
    return {
      links: lcpImage
        ? [
            {
              rel: 'preload',
              as: 'image',
              href: lcpImage,
            },
          ]
        : [],
    }
  },
  notFoundComponent: NotFound,
})

type Question = {
  id: string
  label: string
  required: boolean
}

function parseQuestions(raw: unknown): Array<Question> {
  if (typeof raw !== 'string') return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (q: any) =>
          q &&
          typeof q.id === 'string' &&
          typeof q.label === 'string' &&
          typeof q.required === 'boolean',
      )
      .map((q: any) => ({
        id: q.id,
        label: q.label,
        required: q.required,
      }))
  } catch {
    return []
  }
}

function effectiveUnitPrice(product: any, customAmount: number | null) {
  if (product.payWhatYouWant) {
    if (customAmount != null) return customAmount
    if (product.suggestedPrice) return product.suggestedPrice
    if (product.minimumPrice) return product.minimumPrice
    return 0
  }
  if (product.salePrice && product.price && product.salePrice < product.price) {
    return product.salePrice
  }
  return product.price ?? 0
}

function CheckoutPage() {
  const { product, user, metaPixelConfig } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const questions = React.useMemo(
    () => parseQuestions(product.customerQuestions),
    [product.customerQuestions],
  )
  const productImages = product.images || []
  const hasImage = productImages.length > 0

  const [name, setName] = React.useState(search.name ?? '')
  const [email, setEmail] = React.useState(search.email ?? '')
  const [customAmount, setCustomAmount] = React.useState('')
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [note, setNote] = React.useState('')
  const [paymentMethod, setPaymentMethod] =
    React.useState<CheckoutPaymentMethod>(
      CHECKOUT_PAYMENT_METHOD.GOPAY_DYNAMIC_QRIS,
    )
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isRedirecting, setIsRedirecting] = React.useState(false)

  const limitPerCheckout = product.limitPerCheckout ?? 1
  const maxQuantity = Math.max(
    1,
    product.totalQuantity != null
      ? Math.min(limitPerCheckout, product.totalQuantity)
      : limitPerCheckout,
  )
  const canAdjustQuantity = maxQuantity > 1
  const initialQuantity = Math.min(
    maxQuantity,
    Math.max(1, search.quantity ?? 1),
  )
  const [quantity, setQuantity] = React.useState(initialQuantity)
  const unitPrice = effectiveUnitPrice(
    product,
    customAmount ? parsePriceInput(customAmount) : null,
  )
  const subtotalAmount = unitPrice * quantity
  const paymentQuoteQuery = useQuery({
    queryKey: ['payment-quote', product.id, unitPrice, paymentMethod, quantity],
    queryFn: () =>
      trpcClient.order.quotePayment.query({
        subtotalAmount,
        paymentMethod,
      }),
    staleTime: 30_000,
  })

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const amount = unitPrice
    if (product.payWhatYouWant && amount <= 0) {
      alert('Please enter a valid amount.')
      return
    }
    if (product.payWhatYouWant && product.minimumPrice) {
      if (amount < product.minimumPrice) {
        alert(
          `Minimum price is ${formatPrice(
            product.minimumPrice,
          )}. Please increase your amount.`,
        )
        return
      }
    }

    for (const q of questions) {
      if (q.required && !(answers[q.id] || '').trim()) {
        alert('Please answer all required questions.')
        return
      }
    }

    const payload = {
      productId: product.id,
      buyerEmail: email,
      buyerName: name,
      amountPaid: unitPrice,
      quantity,
      paymentMethod,
      answers,
      note,
      purchaseEventId: createMetaEventId('purchase'),
      ...getMetaAttributionData(),
    }

    try {
      setIsSubmitting(true)
      if (metaPixelConfig?.pixelId) {
        const eventId = createMetaEventId('initiate_checkout')
        const attribution = getMetaAttributionData()

        trackMetaPixelEvent(
          'InitiateCheckout',
          {
            content_ids: [product.id],
            content_type: 'product',
            content_name: product.title,
            currency: 'IDR',
            value: subtotalAmount,
            payment_method: paymentMethod,
          },
          eventId,
        )

        void trpcClient.metaTracking.track.mutate({
          productId: product.id,
          eventName: 'InitiateCheckout',
          eventId,
          sourceUrl: attribution.sourceUrl,
          fbp: attribution.fbp,
          fbc: attribution.fbc,
          buyerEmail: email || undefined,
          value: subtotalAmount,
          currency: 'IDR',
          paymentMethod: paymentMethod,
        })
      }

      const data = await trpcClient.order.create.mutate(payload)

      savePendingMetaPurchase({
        orderId: data.id,
        eventId: payload.purchaseEventId,
        contentIds: [product.id],
        contentName: product.title,
        currency: 'IDR',
        value: subtotalAmount,
      })
      setIsRedirecting(true)
      await navigate({
        to: '/pay/$checkoutGroupId',
        params: { checkoutGroupId: data.payment.checkoutGroupId },
        replace: true,
      })
    } catch (error: any) {
      toastManager.add({
        title: 'Checkout Failed',
        description: error.message || 'Something went wrong',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  React.useEffect(() => {
    if (quantity > maxQuantity) {
      setQuantity(maxQuantity)
    }
  }, [maxQuantity, quantity])

  if (isRedirecting) {
    return null
  }

  return (
    <>
      <MetaPixel pixelId={metaPixelConfig?.pixelId} />
      <CheckoutForm
        email={email}
        name={name}
        note={note}
        onEmailChange={setEmail}
        onNameChange={setName}
        onNoteChange={setNote}
        additionalContactFields={
          <>
            {product.payWhatYouWant && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="amount" className="text-sm">
                  Your Price
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    Rp
                  </span>
                  <Input
                    id="amount"
                    inputMode="numeric"
                    placeholder={
                      product.suggestedPrice
                        ? formatPriceInput(product.suggestedPrice)
                        : '0'
                    }
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="h-11 pl-8"
                  />
                </div>
                <p className="text-sm">
                  {product.minimumPrice
                    ? `Minimum ${formatPrice(product.minimumPrice)}`
                    : 'No minimum — pay what you feel is fair'}
                </p>
              </div>
            )}

            {questions.length > 0 && (
              <div className="space-y-4 pt-2">
                <h2 className="text-md font-medium">Additional Questions</h2>
                {questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <Label htmlFor={`q-${q.id}`} className="text-sm">
                      {q.label}{' '}
                      {q.required && <span className="text-rose-500">*</span>}
                    </Label>
                    <Input
                      id={`q-${q.id}`}
                      value={answers[q.id] ?? ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      required={q.required}
                      size={'lg'}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        }
        purchasedProducts={
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {hasImage ? (
                <div className="w-60 h-30 rounded-xl overflow-hidden shrink-0 bg-slate-100 shadow-sm">
                  <img
                    src={productImages[0]}
                    alt={product.title}
                    width={80}
                    height={80}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  <ShoppingBag className="h-8 w-8 text-slate-300" />
                </div>
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <h1 className="text-lg font-medium text-foreground leading-tight">
                  {product.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Price: {formatPrice(unitPrice)}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>x {quantity}</span>
                  {quantity > 1 ? (
                    <span>Total: {formatPrice(subtotalAmount)}</span>
                  ) : null}
                </div>
                <Link
                  to="/$username"
                  params={{ username: user.username || '' }}
                  className="text-xs underline text-muted-foreground"
                >
                  {user.name}
                </Link>
              </div>
            </div>
            {canAdjustQuantity ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantity</span>
                <div className="flex items-center gap-2 rounded-full border border-input bg-background px-2 py-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
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
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        }
        paymentDetail={
          <Accordion defaultValue={['transactions']} className="w-full">
            <AccordionItem value="transactions" className="border-none">
              <AccordionTrigger className="text-md font-medium">
                Detail Transactions
              </AccordionTrigger>
              <AccordionPanel>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p>Product</p>
                    </div>
                    <span>
                      {formatPrice(
                        paymentQuoteQuery.data?.subtotalAmount ??
                          subtotalAmount,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center font-medium text-foreground justify-between">
                    <span>Subtotal</span>
                    <span>
                      {formatPrice(
                        paymentQuoteQuery.data?.subtotalAmount ??
                          subtotalAmount,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Transaction Fee</span>
                    <span>
                      {formatPrice(
                        paymentQuoteQuery.data?.serviceFeeAmount ?? 0,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payment Gateway Fee</span>
                    <span>
                      {formatPrice(
                        paymentQuoteQuery.data?.gatewayFeeAmount ?? 0,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-base font-medium text-foreground">
                    <span>Total</span>
                    <span>
                      {formatPrice(
                        paymentQuoteQuery.data?.totalAmount ?? subtotalAmount,
                      )}
                    </span>
                  </div>
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        }
        payLabel={'Pay'}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        subtotalAmount={subtotalAmount}
        paymentOptionsName="product-checkout-payment"
      />
    </>
  )
}
