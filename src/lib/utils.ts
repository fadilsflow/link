import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

const IDR_CURRENCY_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatPrice(amount: number): string {
  return IDR_CURRENCY_FORMATTER.format(amount).replace(/\u00A0/g, ' ')
}

export function parsePriceInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/[^\d]/g, '')
  if (!digits) return null

  const amount = Number(digits)
  if (Number.isNaN(amount)) return null
  return amount
}

export function formatPriceInput(value: number | null | undefined): string {
  if (value == null) return ''
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(value)
}
