import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle, ShoppingBag } from 'lucide-react'
import type { DummyPaymentMethod } from '@/components/checkout/dummy-payment-options'
import { useCartStore } from '@/store/cart-store'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { toastManager } from '@/components/ui/toast'
import { CheckoutLayout } from '@/components/checkout/checkout-layout'
import { ContactInformationCard } from '@/components/checkout/contact-information-card'
import { DummyPaymentOptions } from '@/components/checkout/dummy-payment-options'

type Question = { id: string; label: string; required: boolean }

export const Route = createFileRoute('/cart/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [deliveryUrl, setDeliveryUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerEmail: '',
    note: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<DummyPaymentMethod>('qris')
  const [answersByProduct, setAnswersByProduct] = useState<
    Partial<Record<string, Record<string, string>>>
  >({})

  const totalPrice = getTotalPrice()
  const productIds = useMemo(() => items.map((item) => item.productId), [items])
  const [productsMeta, setProductsMeta] = useState<
    Array<{ id: string; questions: Array<Question> }>
  >([])

  useEffect(() => {
    if (productIds.length === 0) return
    trpcClient.order.getCheckoutProducts
      .query({ productIds })
      .then((res) => {
        setProductsMeta(
          res.map((r: any) => ({ id: r.id, questions: r.questions || [] })),
        )
      })
      .catch(() => {
        setProductsMeta([])
      })
  }, [productIds])

  const questionsByProduct = useMemo(
    () => new Map(productsMeta.map((p) => [p.id, p.questions])),
    [productsMeta],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toastManager.add({
        title: 'Cart is empty',
        description: 'Please add items to cart before checkout',
        type: 'destructive',
      })
      return
    }

    for (const item of items) {
      const questions = questionsByProduct.get(item.productId) ?? []
      for (const question of questions) {
        if (
          question.required &&
          !(answersByProduct[item.productId]?.[question.id] || '').trim()
        ) {
          toastManager.add({
            title: 'Required question missing',
            description: `Please answer: ${question.label}`,
            type: 'destructive',
          })
          return
        }
      }
    }

    try {
      setIsSubmitting(true)

      const result = await trpcClient.order.createMultiple.mutate({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          amountPaidPerUnit: item.price,
          answers: answersByProduct[item.productId] ?? {},
        })),
        buyerEmail: formData.buyerEmail,
        buyerName: formData.buyerName,
        note: formData.note,
      })

      clearCart()
      setDeliveryUrl(result.deliveryUrl)
      setIsSuccess(true)
      toastManager.add({
        title: 'Order successful!',
        description: `Successfully purchased ${items.length} items.`,
      })
    } catch (error) {
      console.error(error)
      toastManager.add({
        title: 'Checkout failed',
        description:
          error instanceof Error ? error.message : 'Something went wrong',
        type: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Order Confirmed!
            </h1>
            <p className="text-slate-500">
              Thank you for your purchase. We've sent the download links to{' '}
              <strong>{formData.buyerEmail}</strong>.
            </p>
          </div>
          {deliveryUrl && (
            <Button
              className="w-full"
              onClick={() => (window.location.href = deliveryUrl)}
            >
              View Delivery
            </Button>
          )}
          <Button
            className="w-full"
            variant="outline"
            onClick={() => navigate({ to: '/' })}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto">
            <ShoppingBag className="w-8 h-8 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Your cart is empty
          </h1>
          <p className="text-slate-500">
            Add some digital products to get started.
          </p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <CheckoutLayout
        left={
          <ContactInformationCard
            email={formData.buyerEmail}
            name={formData.buyerName}
            note={formData.note}
            onEmailChange={(value) =>
              setFormData((prev) => ({ ...prev, buyerEmail: value }))
            }
            onNameChange={(value) =>
              setFormData((prev) => ({ ...prev, buyerName: value }))
            }
            onNoteChange={(value) =>
              setFormData((prev) => ({ ...prev, note: value }))
            }
            additionalFields={
              items.some(
                (item) => (questionsByProduct.get(item.productId) ?? []).length > 0,
              ) ? (
                <div className="space-y-4 pt-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Additional Questions
                  </h2>
                  {items.map((item) =>
                    (questionsByProduct.get(item.productId) ?? []).map((question) => (
                      <div key={`${item.productId}-${question.id}`} className="space-y-2">
                        <Label
                          htmlFor={`q-${item.productId}-${question.id}`}
                          className="text-xs font-medium text-slate-600"
                        >
                          {question.label} {question.required && <span className="text-rose-500">*</span>}
                        </Label>
                        <p className="text-xs text-slate-400">({item.title})</p>
                        <Input
                          id={`q-${item.productId}-${question.id}`}
                          value={answersByProduct[item.productId]?.[question.id] ?? ''}
                          onChange={(e) =>
                            setAnswersByProduct((prev) => ({
                              ...prev,
                              [item.productId]: {
                                ...(prev[item.productId] ?? {}),
                                [question.id]: e.target.value,
                              },
                            }))
                          }
                          required={question.required}
                          className="h-11"
                        />
                      </div>
                    )),
                  )}
                </div>
              ) : null
            }
          />
        }
        right={
          <>
            <Card>
              <CardHeader>
                <CardTitle>Orders information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-start gap-4">
                      {item.image ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-sm">
                          <img
                            src={item.image}
                            alt={item.title}
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
                          {item.title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Fees</span>
                    <span>{formatPrice(0)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pay With</CardTitle>
              </CardHeader>
              <CardContent>
                <DummyPaymentOptions
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  name="cart-checkout-payment"
                />
              </CardContent>
            </Card>

            <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : `Pay ${formatPrice(totalPrice)}`}
            </Button>
          </>
        }
      />
    </form>
  )
}
