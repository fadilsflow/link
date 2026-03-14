import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  PAYMENT_METHOD_CATALOG,
  calculatePaymentGatewayFee,
  type CheckoutPaymentMethod,
} from '@/lib/payment-methods'
import { formatPrice } from '@/lib/utils'
import { LogoType } from '@/components/kreasi-logo'

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
  subtotalAmount: number
}

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
  subtotalAmount,
}: CheckoutFormProps) {
  const selectedPaymentMethod =
    PAYMENT_METHOD_CATALOG.find((option) => option.id === paymentMethod) ??
    PAYMENT_METHOD_CATALOG[0]
  const formatGatewayFeeLabel = (method: CheckoutPaymentMethod) => {
    const option = PAYMENT_METHOD_CATALOG.find((entry) => entry.id === method)
    if (!option) return ''

    const percentageLabel =
      option.gatewayFeeRule.percentBps > 0
        ? `${(option.gatewayFeeRule.percentBps / 100)
          .toFixed(2)
          .replace(/\.?0+$/, '')}%`
        : null
    if (percentageLabel) return percentageLabel
    if (option.gatewayFeeRule.fixedAmount > 0) {
      return formatPrice(option.gatewayFeeRule.fixedAmount)
    }
    return formatPrice(calculatePaymentGatewayFee(subtotalAmount, method))
  }

  return (
    <form onSubmit={onSubmit} className="overflow-x-hidden">
      <div className="relative">

        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-background screen-line-after">
          <div className="mx-auto flex max-w-6xl items-center justify-start px-4 py-4 sm:px-6 lg:px-10">
            <LogoType className="text-foreground" text="Checkout" />
          </div>
        </header>

        {/* MAIN CONTAINER */}
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10">

          <div className="grid min-h-screen flex-1 gap-8 md:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)] md:divide-x">

            {/* LEFT COLUMN */}
            <div className="space-y-6 pt-12 md:pr-8 screen-line-after">

              {purchasedProducts}

              <div className="space-y-5">
                <h4 className="text-md font-medium">
                  Complete Personal Information
                </h4>

                <div className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">
                      Email address*
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => onEmailChange(e.target.value)}
                      placeholder="you@example.com"
                      required
                      size="lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm">
                      Full name*
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => onNameChange(e.target.value)}
                      placeholder="Your name"
                      required
                      size="lg"
                    />
                  </div>

                </div>

                {additionalContactFields}

                <div className="space-y-2 pt-2">
                  <Label htmlFor="note" className="text-sm">
                    Note to seller{" "}
                    <span className="text-muted-foreground">(optional)</span>
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
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6 pt-12 pb-32 md:pl-8 md:pb-8">

              <Label htmlFor={paymentOptionsName} className="text-xs font-medium">
                Payment method
              </Label>

              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  onPaymentMethodChange(value as CheckoutPaymentMethod)
                }
              >
                <SelectTrigger
                  size="lg"
                  id={paymentOptionsName}
                  className="justify-between px-4"
                >
                  <SelectValue>
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="truncate font-medium">
                        {selectedPaymentMethod.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Fee {formatGatewayFeeLabel(selectedPaymentMethod.id)}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>

                <SelectContent>
                  {PAYMENT_METHOD_CATALOG.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="truncate font-medium">
                          {option.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatGatewayFeeLabel(option.id)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {paymentDetail}
              {rightTopSection}

              {/* PAY BUTTON */}
              <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background p-4 md:static md:border-0 md:p-0">
                <div className="mx-auto max-w-6xl">
                  <Button
                    type="submit"
                    size="xl"
                    className="w-full rounded-full py-6 text-xl font-semibold"
                    loading={isSubmitting}
                  >
                    {payLabel}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
