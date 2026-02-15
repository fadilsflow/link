import * as React from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getPublicProduct } from '@/lib/profile-server'
import { cn, formatPrice } from '@/lib/utils'
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

function effectiveUnitPrice(product: any, customAmountCents: number | null) {
  if (product.payWhatYouWant) {
    if (customAmountCents != null) return customAmountCents
    if (product.suggestedPrice) return product.suggestedPrice
    if (product.minimumPrice) return product.minimumPrice
    return 0
  }
  if (product.salePrice && product.price && product.salePrice < product.price) {
    return product.salePrice
  }
  return product.price ?? 0
}

function parseAmount(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = Number(trimmed.replace(',', '.'))
  if (Number.isNaN(num) || num < 0) return null
  return Math.round(num * 100)
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
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isRedirecting, setIsRedirecting] = React.useState(false)

  const unitPrice = effectiveUnitPrice(
    product,
    customAmount ? parseAmount(customAmount) : null,
  )

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    const amountCents = unitPrice
    if (product.payWhatYouWant && amountCents <= 0) {
      alert('Please enter a valid amount.')
      return
    }
    if (product.payWhatYouWant && product.minimumPrice) {
      if (amountCents < product.minimumPrice) {
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
        description: error?.message || 'Something went wrong',
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
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600 -ml-2 hover:bg-slate-100"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Lock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_370px] lg:items-start">
          <div className="space-y-6">
            <Card>
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl">Checkout</CardTitle>
                <CardDescription>
                  Complete your order in three quick steps.
                </CardDescription>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">1. Summary</Badge>
                  <Badge variant="outline">2. Payment</Badge>
                  <Badge variant="outline">3. Confirmation</Badge>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment details</CardTitle>
                <CardDescription>
                  Enter your information to receive your purchase immediately.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Your Information
                    </h2>

                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-xs font-medium text-slate-600"
                      >
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-xs font-medium text-slate-600"
                      >
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="h-11"
                      />
                    </div>
                  </div>

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
                          $
                        </span>
                        <Input
                          id="amount"
                          inputMode="decimal"
                          placeholder={
                            product.suggestedPrice
                              ? (product.suggestedPrice / 100).toString()
                              : '0.00'
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
                            {q.label}{' '}
                            {q.required && (
                              <span className="text-rose-500">*</span>
                            )}
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

                  <div className="space-y-2 pt-2">
                    <Label
                      htmlFor="note"
                      className="text-xs font-medium text-slate-600"
                    >
                      Note to seller{' '}
                      <span className="text-slate-400">(optional)</span>
                    </Label>
                    <Textarea
                      id="note"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Any special requests..."
                      className="resize-none"
                    />
                  </div>

                  <Separator />

                  <Button
                    type="submit"
                    size="xl"
                    className={cn('w-full')}
                    disabled={isSubmitting}
                  >
                    <Lock className="h-4 w-4" />
                    {isSubmitting
                      ? 'Processing...'
                      : `Pay ${formatPrice(unitPrice)}`}
                  </Button>

                  <p className="text-center text-[11px] text-slate-400">
                    This is a demo checkout. Payment processing will be
                    integrated soon.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-20">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {hasImage ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-sm">
                      {/* Keeps product image dimensions fixed to prevent CLS while prioritizing first contentful media paint. */}
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

                  <div className="flex-1 min-w-0 space-y-2">
                    <Badge variant="secondary">Digital Product</Badge>
                    <h1 className="text-lg font-bold text-slate-900 leading-tight">
                      {product.title}
                    </h1>
                    <Link
                      to="/$username"
                      params={{ username: user.username || '' }}
                      search={{ tab: 'profile' }}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarImage
                          src={user.image || '/avatar-placeholder.png'}
                        />
                        <AvatarFallback className="bg-slate-900 text-white text-[8px]">
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      by {user.name}
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

            {productVideoId ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Product preview</CardTitle>
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
            ) : null}

            <Card>
              <CardContent className="pt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Secure encrypted payment flow.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirmation and delivery are sent by email.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
