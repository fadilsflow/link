import * as React from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getPublicProduct } from '@/lib/profile-server'
import { cn, formatPrice } from '@/lib/utils'

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

function CheckoutPage() {
  const { username } = Route.useParams()
  const { product, user } = Route.useLoaderData()

  const questions = parseQuestions(product.customerQuestions)

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [customAmount, setCustomAmount] = React.useState('')
  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [note, setNote] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  const unitPrice = effectiveUnitPrice(
    product,
    customAmount ? parseAmount(customAmount) : null,
  )

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault()
    if (submitting) return

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
      if (q.required && !answers[q.id]?.trim()) {
        alert('Please answer all required questions.')
        return
      }
    }

    setSubmitting(true)

    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      // Mock payment – later this can redirect to a real provider.
      // We do not expose productUrl here.
      console.log('Mock checkout payload', {
        productId: product.id,
        username,
        name,
        email,
        amountCents,
        answers,
        note,
      })
    }, 800)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center">
        <div className="max-w-md mx-auto px-4 py-10 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back
            </Button>
          </div>
          <Card className="border-slate-200 rounded-2xl shadow-md">
            <CardContent className="p-6 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                <Lock className="h-3.5 w-3.5" />
                Mock payment complete
              </div>
              <h1 className="text-lg font-semibold text-slate-900">
                Thank you, {name || 'friend'}!
              </h1>
              <p className="text-sm text-slate-600">
                This is a placeholder checkout flow. Payment processing and
                delivery will be wired up later.
              </p>
              <p className="text-xs text-slate-500 pt-1">
                You purchased{' '}
                <span className="font-semibold text-slate-800">
                  {product.title}
                </span>{' '}
                from @{user.username} for{' '}
                <span className="font-semibold">{formatPrice(unitPrice)}</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>
          <span className="text-[11px] text-slate-500">@{user.username}</span>
        </div>

        <Card className="border-slate-200 rounded-2xl shadow-md">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">
                  Checkout
                </p>
                <h1 className="text-lg font-semibold text-slate-900">
                  {product.title}
                </h1>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatPrice(unitPrice)}
                </p>
              </div>
            </div>

            <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {product.payWhatYouWant && (
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">$</span>
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
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {product.minimumPrice
                      ? `Minimum ${formatPrice(product.minimumPrice)}`
                      : 'No minimum amount.'}
                  </p>
                </div>
              )}

              {questions.length > 0 && (
                <div className="space-y-3 pt-1">
                  <p className="text-xs font-medium text-slate-700">
                    Additional questions
                  </p>
                  {questions.map((q) => (
                    <div key={q.id} className="space-y-1.5">
                      <Label htmlFor={`q-${q.id}`}>
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
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="note">Note to seller (optional)</Label>
                <Textarea
                  id="note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className={cn(
                  'w-full rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 mt-2',
                )}
                disabled={submitting}
              >
                <Lock className="h-3.5 w-3.5" />
                {submitting ? 'Processing...' : 'Complete checkout'}
              </Button>

              <p className="text-[11px] text-slate-400 pt-1">
                Payments and file delivery are not connected yet. This flow just
                simulates a purchase for now.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function parseAmount(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = Number(trimmed.replace(',', '.'))
  if (Number.isNaN(num) || num < 0) return null
  return Math.round(num * 100)
}
