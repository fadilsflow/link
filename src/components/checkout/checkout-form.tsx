import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardPanel, CardTitle } from '@/components/ui/card'
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
    <form onSubmit={onSubmit}>
      <div className="relative min-h-screen bg-muted">
        <header className="sticky top-0 z-40 px-2 bg-primary">
          <div className="flex h-14 items-center justify-between px-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <div className="-mt-0.5 flex shrink-0 items-center">
              <LogoType className="text-white" />
            </div>
            <div className="w-[70px]" />
          </div>
        </header>

        <div className="hidden md:block absolute inset-x-0 top-0 h-[420px] bg-primary" />
        <div className="hidden md:block absolute inset-x-0 top-[300px] h-[240px] bg-muted [clip-path:polygon(0_28%,100%_0,100%_100%,0_100%)]" />

        <div className="relative flex w-full max-w-6xl mx-auto flex-col px-4 pb-40 pt-5 sm:px-6 lg:px-10 lg:pb-8">
          <div className="grid flex-1 gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)] xl:mt-8 xl:gap-8">
            <Card className="p-3">
              <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <CardTitle className="text-2xl font-heading">
                  Checkout
                </CardTitle>
              </CardHeader>
              <CardPanel className="space-y-6">
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
                        size={'lg'}
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
                        size={'lg'}
                      />
                    </div>
                  </div>

                  {additionalContactFields}

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="note" className="text-sm">
                      Note to seller{' '}
                      <span className="text-muted-foreground">
                        (optional)
                      </span>
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
              </CardPanel>
            </Card>

            <Card className="p-3 h-fit">
              <CardPanel className="flex flex-col gap-4">

                <Label
                  htmlFor={paymentOptionsName}
                  className="text-xs font-medium"
                >
                  Payment method
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) =>
                    onPaymentMethodChange(value as CheckoutPaymentMethod)
                  }
                >
                  <SelectTrigger
                    id={paymentOptionsName}
                    className="justify-between px-4"
                  >
                    <SelectValue>
                      <div className="flex w-full items-center justify-between gap-3 text-left">
                        <span className="truncate font-medium text-foreground">
                          {selectedPaymentMethod.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          Fee{' '}
                          {formatGatewayFeeLabel(selectedPaymentMethod.id)}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_CATALOG.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex w-full items-center justify-between gap-3">
                          <span className="truncate font-medium text-foreground">
                            {option.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatGatewayFeeLabel(option.id)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {paymentDetail}
                {rightTopSection}


                <div className="w-full fixed bottom-0 left-0 right-0 z-20 bg-background p-4 md:static md:bg-transparent md:p-0">
                  <Button
                    type="submit"
                    size="xl"
                    className="w-full py-6 rounded-full text-xl font-semibold md:mt-2"
                    loading={isSubmitting}
                  >
                    {payLabel}
                  </Button>
                </div>
              </CardPanel>
            </Card>
          </div>
        </div>
      </div>
    </form>
  )
}
