import * as React from 'react'
import { ImageIcon, Plus, Trash2, X } from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Separator } from '../ui/separator'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import type { Content } from '@tiptap/react'
import type { DragEndEvent } from '@dnd-kit/core'
import { useFileUpload } from '@/hooks/use-file-upload'
import { uploadFile } from '@/lib/upload-client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toastManager } from '@/components/ui/toast'
import { cn, formatPriceInput, parsePriceInput } from '@/lib/utils'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import { ProductContentEditor } from '@/components/dashboard/ProductContentEditor'
import { MinimalTiptapEditor } from '@/components/ui/minimal-tiptap'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  title: string
  description: Content | null
  productContent?: Content | null
  images: Array<string>
  isActive: boolean
  totalQuantity?: number | null
  limitPerCheckout?: number | null
  priceSettings: PriceSettings
  customerQuestions: Array<CustomerQuestion>
}

export interface ProductFormProps {
  value: ProductFormValues
  onChange: (value: ProductFormValues) => void
  onSubmit: (value: ProductFormValues) => void
  submitting?: boolean
  onDelete?: (id: string) => void
  formId?: string
  hideFooter?: boolean
  onUploadingChange?: (isUploading: boolean) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function emptyProductForm(): ProductFormValues {
  return {
    title: '',
    description: null,
    productContent: null,
    images: [],
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

export function parseCustomerQuestions(raw: unknown): Array<CustomerQuestion> {
  if (typeof raw !== 'string') return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (q: any) =>
        q &&
        typeof q.id === 'string' &&
        typeof q.label === 'string' &&
        typeof q.required === 'boolean',
    )
  } catch {
    return []
  }
}

type FormErrors = Record<string, string>
type PricingType = 'fixed' | 'pay-what-you-want' | 'free'
type TabValue = 'product' | 'content'

function validate(
  value: ProductFormValues,
  imageCount: number,
  pricingType: PricingType,
  enableQuantityChoice: boolean,
  enableSalesLimit: boolean,
): FormErrors {
  const errors: FormErrors = {}

  if (!value.title.trim()) errors.title = 'Title is required.'
  if (imageCount === 0) errors.images = 'At least one image is required.'

  if (pricingType === 'fixed' && value.priceSettings.price == null) {
    errors['priceSettings.price'] = 'Price is required.'
  }

  if (
    pricingType === 'pay-what-you-want' &&
    value.priceSettings.minimumPrice == null
  ) {
    errors['priceSettings.minimumPrice'] = 'Minimum price is required.'
  }

  if (enableQuantityChoice && (value.limitPerCheckout ?? 0) < 1) {
    errors.limitPerCheckout = 'Must be at least 1.'
  }

  if (enableSalesLimit && (value.totalQuantity ?? 0) < 1) {
    errors.totalQuantity = 'Must be at least 1.'
  }

  value.customerQuestions.forEach((q, i) => {
    if (!q.label.trim()) errors[`question.${i}`] = 'Question is required.'
  })

  return errors
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <div>
        <p className="text-lg font-sans ">{title}</p>
        {description && (
          <p className="te  xt-sm leading-snug text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

function FieldWrapper({
  label,
  error,
  children,
  required,
}: {
  label?: string
  error?: string
  hint?: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-[11px] text-destructive font-medium">{error}</p>
      )}
    </div>
  )
}

function PriceInput({
  id,
  placeholder,
  value,
  onChange,
}: {
  id: string
  placeholder: string
  value: number | null | undefined
  onChange: (val: number | undefined) => void
}) {
  return (
    <InputGroup className="relative">
      <InputGroupAddon align={'inline-start'}>Rp</InputGroupAddon>
      {/* <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
        Rp
      </span> */}
      <InputGroupInput
        id={id}
        inputMode="numeric"
        placeholder={placeholder}
        className="pl-8"
        value={formatPriceInput(value ?? null)}
        onChange={(e) => {
          const amount = parsePriceInput(e.target.value)
          onChange(amount ?? undefined)
        }}
      />
    </InputGroup>
  )
}

function SortableImageCard({
  id,
  index,
  src,
  onRemove,
}: {
  id: string
  index: number
  src?: string
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'relative aspect-square w-full min-w-0 rounded-lg overflow-hidden border group cursor-grab active:cursor-grabbing',
        isDragging && 'z-50 opacity-60',
      )}
    >
      <img
        src={src}
        alt="Product"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {index === 0 && (
        <Badge className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0 h-4">
          Cover
        </Badge>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 h-5 w-5 bg-background/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProductForm({
  value,
  onChange,
  onSubmit,
  submitting,
  onDelete,
  formId,
  hideFooter,
  onUploadingChange,
}: ProductFormProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [pricingType, setPricingType] = React.useState<PricingType>('fixed')
  const [enableQuantityChoice, setEnableQuantityChoice] = React.useState(false)
  const [enableSalesLimit, setEnableSalesLimit] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<TabValue>('product')
  const [imageOrder, setImageOrder] = React.useState<Array<string>>([])

  const setUploading = (val: boolean) => {
    setIsUploading(val)
    onUploadingChange?.(val)
  }

  React.useEffect(() => {
    const isFreePricing =
      !value.priceSettings.payWhatYouWant &&
      value.priceSettings.price === 0 &&
      value.priceSettings.salePrice == null &&
      value.priceSettings.minimumPrice == null &&
      value.priceSettings.suggestedPrice == null

    const nextPricingType: PricingType = value.priceSettings.payWhatYouWant
      ? 'pay-what-you-want'
      : isFreePricing
        ? 'free'
        : value.priceSettings.price != null ||
            value.priceSettings.salePrice != null
          ? 'fixed'
          : value.priceSettings.minimumPrice != null ||
              value.priceSettings.suggestedPrice != null
            ? 'pay-what-you-want'
            : 'fixed'
    setPricingType(nextPricingType)
    setEnableQuantityChoice((value.limitPerCheckout ?? 1) > 1)
    setEnableSalesLimit(value.totalQuantity != null)
  }, [value.id])

  const clearError = (...keys: Array<string>) => {
    setErrors((prev) => {
      const next = { ...prev }
      keys.forEach((k) => delete next[k])
      return next
    })
  }

  // Image upload
  const [
    { files: imageFiles },
    {
      getInputProps: getImageInputProps,
      openFileDialog: openImageDialog,
      removeFile: removeImage,
      handleDrop: handleImageDrop,
      handleDragOver: handleImageDragOver,
      handleDragEnter: handleImageDragEnter,
      handleDragLeave: handleImageDragLeave,
    },
  ] = useFileUpload({
    accept: 'image/*',
    multiple: true,
    initialFiles: value.images.map((url) => ({
      id: url,
      name: 'Image',
      url,
      size: 0,
      type: 'image/jpeg',
    })),
  })

  // Digital files upload
  React.useEffect(() => {
    if (imageFiles.length > 0) clearError('images')
  }, [imageFiles.length])

  React.useEffect(() => {
    setImageOrder((prev) => {
      const currentIds = imageFiles.map((file) => file.id)
      if (currentIds.length === 0) return []
      if (prev.length === 0) return currentIds

      const currentSet = new Set(currentIds)
      const next = prev.filter((id) => currentSet.has(id))
      const missing = currentIds.filter((id) => !next.includes(id))
      return [...next, ...missing]
    })
  }, [imageFiles])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const orderedImageFiles = React.useMemo(() => {
    if (imageOrder.length === 0) return imageFiles
    const map = new Map(imageFiles.map((file) => [file.id, file]))
    const ordered = imageOrder
      .map((id) => map.get(id))
      .filter((file): file is (typeof imageFiles)[number] => Boolean(file))
    const extras = imageFiles.filter((file) => !imageOrder.includes(file.id))
    return ordered.length > 0 ? [...ordered, ...extras] : imageFiles
  }, [imageFiles, imageOrder])

  const handleImageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const currentIds =
      imageOrder.length > 0 ? imageOrder : imageFiles.map((file) => file.id)
    const oldIndex = currentIds.indexOf(String(active.id))
    const newIndex = currentIds.indexOf(String(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    setImageOrder(arrayMove(currentIds, oldIndex, newIndex))
  }

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault()
    if (!value.id && activeTab === 'product') {
      setActiveTab('content')
      return
    }
    const nextErrors = validate(
      value,
      imageFiles.length,
      pricingType,
      enableQuantityChoice,
      enableSalesLimit,
    )

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      toastManager.add({
        title: 'Check your form',
        description: 'Some fields need your attention.',
        type: 'error',
      })
      return
    }

    setErrors({})
    setUploading(true)

    try {
      const finalImages: Array<string> = []
      for (const f of orderedImageFiles) {
        if (f.file instanceof File) {
          finalImages.push(await uploadFile(f.file, 'products/images'))
        } else {
          finalImages.push(f.file.url)
        }
      }

      onSubmit({
        ...value,
        images: finalImages,
        priceSettings:
          pricingType === 'fixed'
            ? {
                payWhatYouWant: false,
                price: value.priceSettings.price,
                salePrice: value.priceSettings.salePrice,
                minimumPrice: undefined,
                suggestedPrice: undefined,
              }
            : pricingType === 'pay-what-you-want'
              ? {
                  payWhatYouWant: true,
                  price: undefined,
                  salePrice: undefined,
                  minimumPrice: value.priceSettings.minimumPrice,
                  suggestedPrice: value.priceSettings.suggestedPrice,
                }
              : {
                  payWhatYouWant: false,
                  price: 0,
                  salePrice: undefined,
                  minimumPrice: undefined,
                  suggestedPrice: undefined,
                },
        limitPerCheckout: enableQuantityChoice ? value.limitPerCheckout : 1,
        totalQuantity: enableSalesLimit ? value.totalQuantity : null,
      })
    } catch {
      toastManager.add({
        title: 'Upload failed',
        description: 'Could not upload files. Please try again.',
        type: 'error',
      })
    } finally {
      setUploading(false)
    }
  }

  const update = (patch: Partial<ProductFormValues>) =>
    onChange({ ...value, ...patch })
  const updatePrice = (patch: Partial<PriceSettings>) =>
    update({ priceSettings: { ...value.priceSettings, ...patch } })

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} className="w-full min-w-0">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
          className="w-full min-w-0 flex flex-col min-h-0"
        >
          <div className="flex justify-between items-center sticky top-0 z-50 bg-background py-3 -mt-3 mb-4">
            <TabsList>
              <TabsTab value="product">1. Product</TabsTab>
              <TabsTab value="content">2. Content</TabsTab>
            </TabsList>
            <Button
              type="submit"
              size="lg"
              disabled={submitting || isUploading}
              loading={submitting || isUploading}
            >
              {submitting || isUploading
                ? 'Saving…'
                : value.id
                  ? 'Update Product'
                  : activeTab === 'product'
                    ? 'Continue'
                    : 'Create product'}
            </Button>
          </div>

          <TabsPanel value="product">
            <div className="rounded-xl border">
              {/* ── Basic Info ─────────────────────────────────────────────── */}
              <section className="space-y-5 p-4 md:p-10">
                <SectionHeader
                  title="Product"
                  description="Basic product information"
                />

                <FieldWrapper label="Name" error={errors.title} required>
                  <Input
                    value={value.title}
                    onChange={(e) => {
                      update({ title: e.target.value })
                      clearError('title')
                    }}
                    placeholder="e.g. Notion template, e-book, Figma kit..."
                  />
                </FieldWrapper>

                <FieldWrapper label="Description">
                  <MinimalTiptapEditor
                    value={value.description ?? undefined}
                    onChange={(content) => update({ description: content })}
                    placeholder="Describe what the customer will get..."
                    output="json"
                    className="w-full"
                    editorContentClassName="p-4 sm:min-h-[160px]"
                    allowImageUpload
                    allowFileUpload={false}
                    uploader={async (file) => {
                      setUploading(true)
                      try {
                        return await uploadFile(file, 'products/images')
                      } finally {
                        setUploading(false)
                      }
                    }}
                  />
                </FieldWrapper>
              </section>

              <Separator />

              {/* ── Pricing ────────────────────────────────────────────────── */}
              <section className="space-y-5 p-4 md:p-10">
                <SectionHeader
                  title="Pricing"
                  description="Choose pricing mode and set one price value."
                />

                <FieldWrapper label="Pricing type">
                  <select
                    value={pricingType}
                    onChange={(e) => {
                      const nextType = e.target.value as PricingType
                      setPricingType(nextType)
                      clearError(
                        'priceSettings.price',
                        'priceSettings.minimumPrice',
                      )

                      if (nextType === 'fixed') {
                        updatePrice({
                          payWhatYouWant: false,
                          price:
                            value.priceSettings.price ??
                            value.priceSettings.minimumPrice,
                        })
                      } else if (nextType === 'pay-what-you-want') {
                        updatePrice({
                          payWhatYouWant: true,
                          price: undefined,
                          minimumPrice:
                            value.priceSettings.minimumPrice ??
                            value.priceSettings.price,
                        })
                      } else {
                        updatePrice({
                          payWhatYouWant: false,
                          price: 0,
                          salePrice: undefined,
                          minimumPrice: undefined,
                          suggestedPrice: undefined,
                        })
                      }
                    }}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    )}
                  >
                    <option value="fixed">Fixed price</option>
                    <option value="pay-what-you-want">Pay what you want</option>
                    <option value="free">Free</option>
                  </select>
                </FieldWrapper>

                {pricingType !== 'free' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FieldWrapper
                      label={
                        pricingType === 'fixed' ? 'Price' : 'Minimum price'
                      }
                      error={
                        pricingType === 'fixed'
                          ? errors['priceSettings.price']
                          : errors['priceSettings.minimumPrice']
                      }
                      required
                    >
                      <PriceInput
                        id={pricingType === 'fixed' ? 'price' : 'min-price'}
                        placeholder={pricingType === 'fixed' ? '10,000' : '0'}
                        value={
                          pricingType === 'fixed'
                            ? value.priceSettings.price
                            : value.priceSettings.minimumPrice
                        }
                        onChange={(v) => {
                          if (pricingType === 'fixed') {
                            updatePrice({ price: v })
                            clearError('priceSettings.price')
                          } else {
                            updatePrice({ minimumPrice: v })
                            clearError('priceSettings.minimumPrice')
                          }
                        }}
                      />
                    </FieldWrapper>

                    {pricingType === 'fixed' ? (
                      <FieldWrapper
                        label="Sale price"
                        hint="Optional discounted price."
                      >
                        <PriceInput
                          id="sale-price"
                          placeholder="7,000"
                          value={value.priceSettings.salePrice}
                          onChange={(v) => updatePrice({ salePrice: v })}
                        />
                      </FieldWrapper>
                    ) : (
                      <FieldWrapper
                        label="Suggested price"
                        hint="Shown as default."
                      >
                        <PriceInput
                          id="suggested-price"
                          placeholder="10,000"
                          value={value.priceSettings.suggestedPrice}
                          onChange={(v) => updatePrice({ suggestedPrice: v })}
                        />
                      </FieldWrapper>
                    )}
                  </div>
                )}
              </section>

              <Separator />

              {/* ── Images ─────────────────────────────────────────────────── */}
              <section className="space-y-5 p-4 md:p-10">
                <SectionHeader
                  title="Images"
                  description="First image is the cover"
                />

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleImageDragEnd}
                >
                  <SortableContext
                    items={orderedImageFiles.map((file) => file.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div
                      className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                      onDrop={handleImageDrop}
                      onDragOver={handleImageDragOver}
                      onDragEnter={handleImageDragEnter}
                      onDragLeave={handleImageDragLeave}
                    >
                      {orderedImageFiles.map((file, i) => (
                        <SortableImageCard
                          key={file.id}
                          id={file.id}
                          index={i}
                          src={file.preview}
                          onRemove={() => removeImage(file.id)}
                        />
                      ))}

                      <div className="aspect-square w-full min-w-0">
                        <button
                          type="button"
                          onClick={openImageDialog}
                          className="w-full h-full flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 hover:bg-muted/70 transition-colors text-muted-foreground gap-1.5"
                        >
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-[10px] font-medium">
                            Add image
                          </span>
                          <input {...getImageInputProps()} className="hidden" />
                        </button>
                      </div>
                    </div>
                  </SortableContext>
                </DndContext>

                {errors.images && (
                  <p className="text-[11px] text-destructive font-medium">
                    {errors.images}
                  </p>
                )}
              </section>

              <Separator />

              {/* ── Inventory & Limits ─────────────────────────────────────── */}
              <section className="space-y-5 p-4 md:p-10">
                <SectionHeader
                  title="Inventory & Limits"
                  description="Control quantity and stock"
                />

                <div className="space-y-2 ">
                  {/* Quantity choice */}
                  <div className="flex items-center gap-4 pb-3">
                    <Switch
                      checked={enableQuantityChoice}
                      onCheckedChange={(checked) => {
                        setEnableQuantityChoice(checked)
                        clearError('limitPerCheckout')
                        update({
                          limitPerCheckout: checked
                            ? value.limitPerCheckout &&
                              value.limitPerCheckout > 1
                              ? value.limitPerCheckout
                              : 10
                            : 1,
                        })
                      }}
                    />
                    <p className="text-sm font-medium">
                      Customer chooses quantity
                    </p>
                  </div>
                  {enableQuantityChoice && (
                    <FieldWrapper error={errors.limitPerCheckout}>
                      <Input
                        inputMode="numeric"
                        placeholder="10000"
                        className="w-full"
                        value={value.limitPerCheckout?.toString() ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          update({ limitPerCheckout: v ? Number(v) : null })
                          clearError('limitPerCheckout')
                        }}
                      />
                    </FieldWrapper>
                  )}

                  <div className="border-t border-dashed border-input my-6" />
                  {/* Sales limit */}

                  <div className="flex items-center gap-4 pb-3">
                    <Switch
                      checked={enableSalesLimit}
                      onCheckedChange={(checked) => {
                        setEnableSalesLimit(checked)
                        clearError('totalQuantity')
                        update({
                          totalQuantity: checked
                            ? value.totalQuantity && value.totalQuantity > 0
                              ? value.totalQuantity
                              : 100
                            : null,
                        })
                      }}
                    />
                    <p className="text-sm font-medium">Limit Product Sales</p>
                  </div>
                  {enableSalesLimit && (
                    <FieldWrapper error={errors.totalQuantity}>
                      <Input
                        inputMode="numeric"
                        placeholder="100"
                        className="w-full"
                        value={value.totalQuantity?.toString() ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          update({ totalQuantity: v ? Number(v) : null })
                          clearError('totalQuantity')
                        }}
                      />
                    </FieldWrapper>
                  )}
                </div>
              </section>

              <Separator />

              {/* ── Checkout Questions ─────────────────────────────────────── */}
              <section className="space-y-5 p-4 md:p-10">
                <div className="flex  pb-4 justify-between">
                  <SectionHeader
                    title="Buyer form"
                    description="Collect extra info after name & email."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 text-xs gap-1.5"
                    onClick={() =>
                      update({
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
                    <Plus className="h-3.5 w-3.5" />
                    Add question
                  </Button>
                </div>
                <div>
                  <div className="flex gap-2">
                    <p className="text-sm">Your Name</p>
                    <Badge variant={'secondary'}>Mandatory</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">Name</span>
                </div>
                <div>
                  <div className="flex gap-2">
                    <p className="text-sm">Email</p>
                    <Badge variant={'secondary'}>Mandatory</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">Name</span>
                </div>
                {value.customerQuestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No questions added. Customers only enter name and email.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {value.customerQuestions.map((q, i) => (
                      <div
                        key={q.id}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <div className="flex-1 space-y-2">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                            Question {i + 1}
                          </p>
                          <Input
                            value={q.label}
                            onChange={(e) => {
                              update({
                                customerQuestions: value.customerQuestions.map(
                                  (cq) =>
                                    cq.id === q.id
                                      ? { ...cq, label: e.target.value }
                                      : cq,
                                ),
                              })
                              clearError(`question.${i}`)
                            }}
                            placeholder="e.g. What name should we print on the certificate?"
                          />
                          {errors[`question.${i}`] && (
                            <p className="text-[11px] text-destructive">
                              {errors[`question.${i}`]}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={q.required}
                              onCheckedChange={(checked) =>
                                update({
                                  customerQuestions:
                                    value.customerQuestions.map((cq) =>
                                      cq.id === q.id
                                        ? { ...cq, required: checked }
                                        : cq,
                                    ),
                                })
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              Required
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() =>
                            update({
                              customerQuestions: value.customerQuestions.filter(
                                (cq) => cq.id !== q.id,
                              ),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </TabsPanel>

          <TabsPanel value="content">
            <ProductContentEditor
              value={value.productContent ?? null}
              onChange={(content) => update({ productContent: content })}
              onUploadingChange={setUploading}
            />
          </TabsPanel>
        </Tabs>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        {!hideFooter && (
          <div className="flex justify-between items-center pt-5">
            <div className="flex min-w-0 items-center gap-2">
              <Switch
                checked={value.isActive}
                onCheckedChange={(checked) => update({ isActive: checked })}
              />
              <span className="shrink-0 text-sm font-medium">
                {value.isActive ? 'Active' : 'Hidden'}
              </span>
            </div>

            <Button
              type="button"
              variant="destructive-outline"
              size="lg"
              className={cn(
                ' text-xs  hover:text-destructive',
                !(value.id && onDelete) && 'pointer-events-none invisible',
              )}
              onClick={() => {
                if (value.id && onDelete) onDelete(value.id)
              }}
              disabled={submitting || isUploading}
            >
              Delete product
            </Button>
          </div>
        )}
      </form>
    </>
  )
}
