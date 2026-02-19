import * as React from 'react'
import { Label } from '@/components/ui/label'

export type DummyPaymentMethod = 'qris' | 'bank_transfer' | 'virtual_account'

type DummyPaymentOptionsProps = {
  value: DummyPaymentMethod
  onValueChange: (value: DummyPaymentMethod) => void
  name?: string
}

const options: Array<{ value: DummyPaymentMethod; title: string; subtitle: string }> = [
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

export function DummyPaymentOptions({
  value,
  onValueChange,
  name = 'dummy-payment-method',
}: DummyPaymentOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => {
        const id = `${name}-${option.value}`
        const isActive = value === option.value

        return (
          <label
            key={option.value}
            htmlFor={id}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3"
          >
            <input
              id={id}
              type="radio"
              name={name}
              className="mt-1"
              checked={isActive}
              onChange={() => onValueChange(option.value)}
            />
            <div className="flex-1">
              <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-slate-900">
                {option.title}
              </Label>
              <p className="text-xs text-slate-500">{option.subtitle}</p>
            </div>
          </label>
        )
      })}
      <p className="text-xs text-slate-400">Payment option ini masih dummy untuk UI.</p>
    </div>
  )
}
