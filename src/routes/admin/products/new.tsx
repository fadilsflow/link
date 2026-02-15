import * as React from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { ProductFormValues } from '@/components/dashboard/ProductForm'
import {
  ProductForm,
  emptyProductForm,
} from '@/components/dashboard/ProductForm'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { toastManager } from '@/components/ui/toast'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'

import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/admin/products/new')({
  component: ProductNewRoute,
})

function ProductNewRoute() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  // We use this to track if the form is dirty
  const [initialForm, setInitialForm] =
    React.useState<ProductFormValues | null>(null)
  const [form, setForm] = React.useState<ProductFormValues | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setIsOpen(true)
  }, [])

  React.useEffect(() => {
    if (user && !form) {
      const empty = emptyProductForm(user.id)
      setForm(empty)
      setInitialForm(empty)
    }
  }, [user, form])

  const createMutation = useMutation({
    mutationKey: ['product-create'],
    mutationFn: async (values: ProductFormValues) => {
      const base = {
        userId: values.userId,
        title: values.title,
        description: values.description || undefined,
        productUrl: values.productUrl,
        images: values.images,
        productFiles: values.productFiles,
        isActive: values.isActive,
        totalQuantity: values.totalQuantity ?? undefined,
        limitPerCheckout: values.limitPerCheckout ?? undefined,
        priceSettings: {
          payWhatYouWant: values.priceSettings.payWhatYouWant,
          price: values.priceSettings.price ?? undefined,
          salePrice: values.priceSettings.salePrice ?? undefined,
          minimumPrice: values.priceSettings.minimumPrice ?? undefined,
          suggestedPrice: values.priceSettings.suggestedPrice ?? undefined,
        },
        customerQuestions:
          values.customerQuestions.length > 0
            ? values.customerQuestions
            : undefined,
      }
      return trpcClient.product.create.mutate(base)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({
        queryKey: ['products', user?.id],
      })
      toastManager.add({
        title: 'Product created',
        description: 'Your product has been created successfully.',
      })
      router.navigate({ to: '/admin/products' })
    },
    onError: (error: any) => {
      toastManager.add({
        title: 'Failed to create product',
        description:
          error.message ??
          'An unexpected error occurred while creating the product.',
        type: 'error',
      })
    },
  })

  const isReady = !!(user && form)
  const isDirty =
    isReady && initialForm
      ? JSON.stringify(form) !== JSON.stringify(initialForm)
      : false

  const handleOpenChange = (open: boolean) => {
    if (isUploading) return

    if (!open) {
      if (isDirty) {
        const confirm = window.confirm(
          'Are you sure you want to leave? You have some unsaved changes!',
        )
        if (!confirm) {
          // Force open if user cancelled
          setIsOpen(true)
          return
        }
      }
      setIsOpen(false)
      setTimeout(() => {
        router.navigate({
          to: '/admin/products',
        })
      }, 300)
    } else {
      setIsOpen(open)
    }
  }

  const isLoading = createMutation.isPending || isUploading

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Add Product</SheetTitle>
        </SheetHeader>
        <SheetPanel className="mt-5">
          {isReady ? (
            <ProductForm
              formId="create-product-form"
              hideFooter
              value={form}
              onChange={setForm}
              submitting={isLoading}
              onUploadingChange={setIsUploading}
              onSubmit={(values) => {
                createMutation.mutate(values)
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </SheetPanel>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Cancel</SheetClose>
          <Button
            type="submit"
            form="create-product-form"
            disabled={isLoading || !isReady}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading
              ? isUploading
                ? 'Uploading...'
                : 'Creating...'
              : 'Create product'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
