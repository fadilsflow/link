import * as React from 'react'
import { z } from 'zod'
import { Link2, Plus, Trash2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn, formatPrice } from '@/lib/utils'

export type PriceSettings = {
  payWhatYouWant: boolean
  price?: number | null
  salePrice?: number | null
  minimumPrice?: number | null
  suggestedPrice?: number | null
}

export type CustomerQuestion = {
  id: string
  label: string
  required: boolean
}

export type ProductFormValues = {
  id?: string
  userId: string
  title: string
  description: string
  productUrl: string
  isActive: boolean
  totalQuantity?: number | null
  limitPerCheckout?: number | null
  priceSettings: PriceSettings
  customerQuestions: Array<CustomerQuestion>
}

// Client-side validation schema (mirrors server rules but stays in client bundle)
export const priceSettingsClientSchema = z
  .object({
    payWhatYouWant: z.boolean(),
    price: z.number().int().nonnegative().nullable().optional(),
    salePrice: z.number().int().nonnegative().nullable().optional(),
    minimumPrice: z.number().int().nonnegative().nullable().optional(),
    suggestedPrice: z.number().int().nonnegative().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.payWhatYouWant) {
      if (val.minimumPrice == null && val.suggestedPrice == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'For pay-what-you-want products, set a minimum or suggested price.',
          path: ['minimumPrice'],
        })
      }
    } else if (val.price == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Fixed-price products require a price.',
        path: ['price'],
      })
    }
  })

export const customerQuestionClientSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Question label is required.'),
  required: z.boolean().default(false),
})

export const productFormClientSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  productUrl: z.string().url('Please enter a valid URL, including https://'),
  isActive: z.boolean(),
  totalQuantity: z.number().int().positive().nullable().optional(),
  limitPerCheckout: z.number().int().positive().nullable().optional(),
  priceSettings: priceSettingsClientSchema,
  customerQuestions: z.array(customerQuestionClientSchema),
})

export function emptyProductForm(userId: string): ProductFormValues {
  return {
    userId,
    title: '',
    description: '',
    productUrl: '',
    isActive: true,
    totalQuantity: null,
    limitPerCheckout: 1,
    priceSettings: {
      payWhatYouWant: false,
      price: undefined,
      salePrice: undefined,
      minimumPrice: undefined,
      suggestedPrice: undefined,
    },
    customerQuestions: [],
  }
}

export function centsFromInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = Number(trimmed.replace(',', '.'))
  if (Number.isNaN(num) || num < 0) return null
  return Math.round(num * 100)
}

export function inputFromCents(value: number | null | undefined): string {
  if (value == null) return ''
  return (value / 100).toString()
}

export function humanPriceLabel(p: PriceSettings): string {
  if (p.payWhatYouWant) {
    if (p.minimumPrice) {
      return `Pay what you want · minimum ${formatPrice(p.minimumPrice)}`
    }
    if (p.suggestedPrice) {
      return `Pay what you want · suggested ${formatPrice(p.suggestedPrice)}`
    }
    return 'Pay what you want'
  }
  if (p.salePrice && p.price && p.salePrice < p.price) {
    return `${formatPrice(p.salePrice)} (sale)`
  }
  if (p.price) return formatPrice(p.price)
  return 'No price'
}

export function parseCustomerQuestions(raw: unknown): Array<CustomerQuestion> {
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

export interface ProductFormProps {
  value: ProductFormValues
  onChange: (value: ProductFormValues) => void
  onSubmit: (value: ProductFormValues) => void
  submitting?: boolean
  onDelete?: (id: string) => void
}

export function ProductForm(props: ProductFormProps) {
  const { value, onChange, onSubmit, submitting, onDelete } = props

  const handleSubmit: React.FormEventHandler = (e) => {
    e.preventDefault()
    const result = productFormClientSchema.safeParse(value)
    if (!result.success) {
      // For now, surface the first error via alert; callers can add nicer UI later.
      const flat = result.error.flatten()
      const firstFieldError =
        Object.values(flat.fieldErrors).flat().filter(Boolean)[0] ??
        flat.formErrors[0]
      if (typeof window !== 'undefined' && firstFieldError) {
         
        window.alert(firstFieldError)
      }
      return
    }
    onSubmit({ ...result.data, description: result.data.description ?? '' })
  }

  const currentPriceLabel = humanPriceLabel(value.priceSettings)

  return (
    <Card className="border-zinc-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-3">
          <span>{value.id ? 'Edit product' : 'Create product'}</span>
          <span className="text-xs font-normal text-zinc-500">
            {currentPriceLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 text-sm"
          aria-label="Product form"
        >
          <div className="space-y-2">
            <Label htmlFor="product-title">Title</Label>
            <Input
              id="product-title"
              value={value.title}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              placeholder="My Notion template, e-book, course..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              value={value.description}
              onChange={(e) =>
                onChange({ ...value, description: e.target.value })
              }
              placeholder="Short description that appears on the product detail and checkout pages."
              rows={3}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="block">Pricing</Label>
                <p className="text-xs text-zinc-500">
                  Choose fixed price or pay-what-you-want.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Fixed</span>
                <Switch
                  checked={value.priceSettings.payWhatYouWant}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...value,
                      priceSettings: {
                        ...value.priceSettings,
                        payWhatYouWant: checked,
                      },
                    })
                  }
                />
                <span className="font-medium">Pay what you want</span>
              </div>
            </div>

            {!value.priceSettings.payWhatYouWant ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">$</span>
                    <Input
                      id="price"
                      inputMode="decimal"
                      placeholder="9.99"
                      value={inputFromCents(value.priceSettings.price ?? null)}
                      onChange={(e) => {
                        const cents = centsFromInput(e.target.value)
                        onChange({
                          ...value,
                          priceSettings: {
                            ...value.priceSettings,
                            price: cents ?? undefined,
                          },
                        })
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sale-price">Sale price (optional)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">$</span>
                    <Input
                      id="sale-price"
                      inputMode="decimal"
                      placeholder="7.00"
                      value={inputFromCents(
                        value.priceSettings.salePrice ?? null,
                      )}
                      onChange={(e) => {
                        const cents = centsFromInput(e.target.value)
                        onChange({
                          ...value,
                          priceSettings: {
                            ...value.priceSettings,
                            salePrice: cents ?? undefined,
                          },
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="min-price">Minimum price</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">$</span>
                    <Input
                      id="min-price"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={inputFromCents(
                        value.priceSettings.minimumPrice ?? null,
                      )}
                      onChange={(e) => {
                        const cents = centsFromInput(e.target.value)
                        onChange({
                          ...value,
                          priceSettings: {
                            ...value.priceSettings,
                            minimumPrice: cents ?? undefined,
                          },
                        })
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="suggested-price">Suggested price</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">$</span>
                    <Input
                      id="suggested-price"
                      inputMode="decimal"
                      placeholder="9.99"
                      value={inputFromCents(
                        value.priceSettings.suggestedPrice ?? null,
                      )}
                      onChange={(e) => {
                        const cents = centsFromInput(e.target.value)
                        onChange({
                          ...value,
                          priceSettings: {
                            ...value.priceSettings,
                            suggestedPrice: cents ?? undefined,
                          },
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="total-qty">Total quantity (optional)</Label>
              <Input
                id="total-qty"
                inputMode="numeric"
                placeholder="Unlimited"
                value={value.totalQuantity?.toString() ?? ''}
                onChange={(e) => {
                  const v = e.target.value.trim()
                  const parsed = v ? Number(v) : NaN
                  onChange({
                    ...value,
                    totalQuantity: Number.isNaN(parsed) ? null : parsed,
                  })
                }}
              />
              <p className="text-[11px] text-zinc-500">
                Simple limit only; inventory tracking will be added later.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit-per-checkout">Limit per checkout</Label>
              <Input
                id="limit-per-checkout"
                inputMode="numeric"
                placeholder="1"
                value={value.limitPerCheckout?.toString() ?? ''}
                onChange={(e) => {
                  const v = e.target.value.trim()
                  const parsed = v ? Number(v) : NaN
                  onChange({
                    ...value,
                    limitPerCheckout: Number.isNaN(parsed) ? null : parsed,
                  })
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-url">Product URL</Label>
            <div className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-zinc-400" />
              <Input
                id="product-url"
                value={value.productUrl}
                onChange={(e) =>
                  onChange({ ...value, productUrl: e.target.value })
                }
                type="url"
                placeholder="https://your-download-or-course.com"
                required
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              External delivery link only for now. File delivery will be added
              later.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Checkout questions</Label>
                <p className="text-xs text-zinc-500">
                  Ask for extra information after name and email.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="h-7 rounded-full text-[11px]"
                onClick={() =>
                  onChange({
                    ...value,
                    customerQuestions: [
                      ...value.customerQuestions,
                      {
                        id: crypto.randomUUID(),
                        label: '',
                        required: false,
                      },
                    ],
                  })
                }
              >
                <Plus className="h-3 w-3 mr-1" />
                Add question
              </Button>
            </div>

            {value.customerQuestions.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">
                No additional questions. Customers will only enter name and
                email.
              </p>
            ) : (
              <div className="space-y-2">
                {value.customerQuestions.map((q, index) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-2 rounded-lg border border-zinc-200 px-3 py-2"
                  >
                    <div className="flex-1 space-y-1">
                      <Label className="text-[11px] text-zinc-500">
                        Question {index + 1}
                      </Label>
                      <Input
                        value={q.label}
                        onChange={(e) =>
                          onChange({
                            ...value,
                            customerQuestions: value.customerQuestions.map(
                              (cq) =>
                                cq.id === q.id
                                  ? { ...cq, label: e.target.value }
                                  : cq,
                            ),
                          })
                        }
                        placeholder="What should we print on your certificate?"
                      />
                      <div className="flex items-center gap-2 pt-1">
                        <Switch
                          checked={q.required}
                          onCheckedChange={(checked) =>
                            onChange({
                              ...value,
                              customerQuestions: value.customerQuestions.map(
                                (cq) =>
                                  cq.id === q.id
                                    ? { ...cq, required: checked }
                                    : cq,
                              ),
                            })
                          }
                        />
                        <span className="text-[11px] text-zinc-600">
                          Required
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-zinc-400 hover:text-zinc-700"
                      onClick={() =>
                        onChange({
                          ...value,
                          customerQuestions: value.customerQuestions.filter(
                            (cq) => cq.id !== q.id,
                          ),
                        })
                      }
                      aria-label="Remove question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Switch
                checked={value.isActive}
                onCheckedChange={(checked) =>
                  onChange({ ...value, isActive: checked })
                }
              />
              <span className="text-zinc-700 font-medium">
                Active on profile
              </span>
            </div>
            <div className="flex items-center gap-2">
              {value.id && onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-500 hover:text-red-600"
                  onClick={() => onDelete(value.id!)}
                >
                  Delete
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                className={cn('rounded-full text-xs')}
                disabled={submitting}
              >
                {submitting
                  ? 'Saving...'
                  : value.id
                    ? 'Save changes'
                    : 'Create product'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
