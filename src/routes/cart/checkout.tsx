import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, Loader2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { cn, formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { toastManager } from '@/components/ui/toast'

export const Route = createFileRoute('/cart/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerEmail: '',
    note: '',
  })

  const totalPrice = getTotalPrice()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toastManager.add({
        title: 'Cart is empty',
        description: 'Please add items to cart before checkout',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)

      await trpcClient.order.createMultiple.mutate({
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          amountPaidPerUnit: item.price,
        })),
        buyerEmail: formData.buyerEmail,
        buyerName: formData.buyerName,
        note: formData.note,
      })

      // Success
      clearCart()
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
        variant: 'destructive',
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
          <Button className="w-full" onClick={() => navigate({ to: '/' })}>
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-8"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Order Summary
            </h2>
            <Card className="border-0 shadow-sm ring-1 ring-slate-200">
              <CardContent className="p-6 space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-md shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-slate-400">
                          {formatPrice(item.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-slate-100 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Payment Details
            </h2>
            <Card className="border-0 shadow-sm ring-1 ring-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={formData.buyerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, buyerEmail: e.target.value })
                      }
                    />
                    <p className="text-xs text-slate-500">
                      We'll send your download links to this email.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.buyerName}
                      onChange={(e) =>
                        setFormData({ ...formData, buyerName: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Note to Creator (Optional)</Label>
                    <Textarea
                      id="note"
                      placeholder="Any special instructions?"
                      value={formData.note}
                      onChange={(e) =>
                        setFormData({ ...formData, note: e.target.value })
                      }
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Pay {formatPrice(totalPrice)}
                    </Button>
                    <p className="text-xs text-center text-slate-400 mt-4">
                      Secure payment powered by Link.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
