import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ShoppingBag } from 'lucide-react'
import type { CheckoutPaymentMethod } from '@/components/checkout/checkout-form'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getPublicProduct } from '@/lib/profile-server'
import { formatPrice, formatPriceInput, parsePriceInput } from '@/lib/utils'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { toastManager } from '@/components/ui/toast'
import LiteYouTube from '@/components/LiteYouTube'
import { extractYouTubeVideoIdFromText } from '@/lib/lite-youtube'

export const Route = createFileRoute('/$username/products/$productId/checkout')(
  {
    component: CheckoutPage,
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
  },
)

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
  const { product, user } = Route.useLoaderData()

  const questions = React.useMemo(
    () => parseQuestions(product.customerQuestions),
    [product.customerQuestions],
  )
  const productImages = product.images || []
  const hasImage = productImages.length > 0
  const productVideoId = extractYouTubeVideoIdFromText(product.description)

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [customAmount, setCustomAmount] = React.useState('')
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [note, setNote] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState<CheckoutPaymentMethod>('qris')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isRedirecting, setIsRedirecting] = React.useState(false)

  const unitPrice = effectiveUnitPrice(
    product,
    customAmount ? parsePriceInput(customAmount) : null,
  )

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
      answers,
      note,
    }

    try {
      setIsSubmitting(true)
      const data = await trpcClient.order.create.mutate(payload)
      setIsRedirecting(true)
      window.location.href = data.deliveryUrl
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

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500">Redirecting to your order...</p>
        </div>
      </div>
    )
  }

  return (
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
              <Label
                htmlFor="amount"
                className="text-xs font-medium text-slate-600"
              >
                Your Price
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
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
              <p className="text-xs text-slate-400">
                {product.minimumPrice
                  ? `Minimum ${formatPrice(product.minimumPrice)}`
                  : 'No minimum — pay what you feel is fair'}
              </p>
            </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-4 pt-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Additional Questions
              </h2>
              {questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <Label
                    htmlFor={`q-${q.id}`}
                    className="text-xs font-medium text-slate-600"
                  >
                    {q.label} {q.required && <span className="text-rose-500">*</span>}
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
                    className="h-11"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      }
      orderInformation={
        <Card>
          <CardHeader>
            <CardTitle>Orders information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {hasImage ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-sm">
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
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ShoppingBag className="h-8 w-8 text-slate-300" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {product.title}
                </h1>
                <Link
                  to="/$username"
                  params={{ username: user.username || '' }}
                  search={{ tab: 'profile' }}
                  className="text-xs underline"
                >
                  {user.name}
                </Link>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(unitPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Fees</span>
                <span>{formatPrice(0)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(unitPrice)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      }
      rightTopSection={
        productVideoId ? (
          <Card>
            <CardHeader>
              <CardTitle>Product preview</CardTitle>
            </CardHeader>
            <CardContent>
              <LiteYouTube
                videoId={productVideoId}
                title={`${product.title} video preview`}
                className="rounded-xl border border-slate-200"
                playLabel="Play product video"
              />
            </CardContent>
          </Card>
        ) : null
      }
      payLabel={`Pay ${formatPrice(unitPrice)}`}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      paymentMethod={paymentMethod}
      onPaymentMethodChange={setPaymentMethod}
      paymentOptionsName="product-checkout-payment"
    />
  )
}
