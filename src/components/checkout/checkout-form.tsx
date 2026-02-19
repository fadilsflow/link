import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export type CheckoutPaymentMethod = 'qris' | 'bank_transfer' | 'virtual_account'

type CheckoutFormProps = {
  email: string
  name: string
  note: string
  onEmailChange: (value: string) => void
  onNameChange: (value: string) => void
  onNoteChange: (value: string) => void
  additionalContactFields?: React.ReactNode
  purchasedProducts: React.ReactNode
  paymentDetail: React.ReactNode
  rightTopSection?: React.ReactNode
  payLabel: string
  isSubmitting: boolean
  onSubmit: React.FormEventHandler<HTMLFormElement>
  paymentMethod: CheckoutPaymentMethod
  onPaymentMethodChange: (value: CheckoutPaymentMethod) => void
  paymentOptionsName?: string
}

const paymentOptions: Array<{
  value: CheckoutPaymentMethod
  title: string
  subtitle: string
}> = [
    {
      value: 'qris',
      title: 'QRIS',
      subtitle: 'Scan QR code untuk bayar',
    },
    {
      value: 'bank_transfer',
      title: 'Bank Transfer',
      subtitle: 'Transfer manual (dummy)',
    },
    {
      value: 'virtual_account',
      title: 'Virtual Account',
      subtitle: 'VA otomatis (dummy)',
    },
  ]

export function CheckoutForm({
  email,
  name,
  note,
  onEmailChange,
  onNameChange,
  onNoteChange,
  additionalContactFields,
  purchasedProducts,
  paymentDetail,
  rightTopSection,
  payLabel,
  isSubmitting,
  onSubmit,
  paymentMethod,
  onPaymentMethodChange,
  paymentOptionsName = 'checkout-payment-method',
}: CheckoutFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background ">
          <div className="relative max-w-6xl mx-auto px-4 py-3 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-3 text-xs text-slate-600 -ml-2 hover:bg-slate-100"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
            </Button>
            <h2 className="text-2xl font-heading">Checkout</h2>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <div className="space-y-6">
              {purchasedProducts}

              <Card>
                <CardHeader>
                  <CardTitle>Contact information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium text-slate-600">
                        Email address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => onEmailChange(e.target.value)}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-medium text-slate-600">
                        Full name
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="Your name"
                        required
                      />
                    </div>
                  </div>

                  {additionalContactFields}

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="note" className="text-xs font-medium text-slate-600">
                      Note to seller <span className="text-slate-400">(optional)</span>
                    </Label>
                    <Textarea
                      id="note"
                      rows={2}
                      value={note}
                      onChange={(e) => onNoteChange(e.target.value)}
                      placeholder="Any special requests..."
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 lg:sticky lg:top-20">
              {paymentDetail}

              {rightTopSection}

              <Card>
                <CardHeader>
                  <CardTitle>Pay With</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paymentOptions.map((option) => {
                      const id = `${paymentOptionsName}-${option.value}`
                      const isActive = paymentMethod === option.value

                      return (
                        <label
                          key={option.value}
                          htmlFor={id}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3"
                        >
                          <input
                            id={id}
                            type="radio"
                            name={paymentOptionsName}
                            className="mt-1"
                            checked={isActive}
                            onChange={() => onPaymentMethodChange(option.value)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={id}
                              className="cursor-pointer text-sm font-medium text-slate-900"
                            >
                              {option.title}
                            </Label>
                            <p className="text-xs text-slate-500">{option.subtitle}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : payLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
