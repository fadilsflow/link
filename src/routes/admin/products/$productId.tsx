import * as React from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { ProductFormValues } from '@/components/dashboard/ProductForm'
import {
  ProductForm,
  parseCustomerQuestions,
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

export const Route = createFileRoute('/admin/products/$productId')({
  component: ProductEditRoute,
})

function mapProductToForm(userId: string, product: any): ProductFormValues {
  const questions = parseCustomerQuestions(product.customerQuestions)
  return {
    id: product.id,
    userId,
    title: product.title ?? '',
    description: product.description ?? '',
    productUrl: product.productUrl ?? '',
    images: product.images ?? [],
    productFiles: product.productFiles ?? [],
    isActive: product.isActive,
    totalQuantity: product.totalQuantity,
    limitPerCheckout: product.limitPerCheckout,
    priceSettings: {
      payWhatYouWant: product.payWhatYouWant,
      price: product.price,
      salePrice: product.salePrice,
      minimumPrice: product.minimumPrice,
      suggestedPrice: product.suggestedPrice,
    },
    customerQuestions: questions,
  }
}

function ProductEditRoute() {
  const { productId } = Route.useParams()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  const product = dashboardData?.products.find((p: any) => p.id === productId)

  const [initialForm, setInitialForm] =
    React.useState<ProductFormValues | null>(null)
  const [form, setForm] = React.useState<ProductFormValues | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setIsOpen(true)
  }, [])

  React.useEffect(() => {
    if (user && product && !form) {
      const mapped = mapProductToForm(user.id, product)
      setForm(mapped)
      setInitialForm(mapped)
    }
  }, [user, product, form])

  const updateMutation = useMutation({
    mutationKey: ['product-update', productId],
    mutationFn: async (values: ProductFormValues) => {
      const base = {
        id: values.id!,
        userId: values.userId,
        title: values.title,
        description: values.description || undefined,
        productUrl: values.productUrl || undefined,
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
      return trpcClient.product.update.mutate(base)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({
        queryKey: ['products', user?.id],
      })
      toastManager.add({
        title: 'Product updated',
        description: 'Your changes have been saved successfully.',
      })
      router.navigate({ to: '/admin/products' })
    },
    onError: (error: any) => {
      toastManager.add({
        title: 'Failed to update product',
        description:
          error.message ??
          'An unexpected error occurred while updating the product.',
        type: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationKey: ['product-delete', productId],
    mutationFn: (id: string) =>
      trpcClient.product.delete.mutate({
        id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({
        queryKey: ['products', user?.id],
      })
      toastManager.add({
        title: 'Product deleted',
        description: 'The product has been deleted successfully.',
      })
      router.navigate({ to: '/admin/products' })
    },
    onError: (error: any) => {
      toastManager.add({
        title: 'Failed to delete product',
        description:
          error.message ??
          'An unexpected error occurred while deleting the product.',
        type: 'error',
      })
    },
  })

  const isReady = !!(user && product && form)

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

  const isLoading =
    updateMutation.isPending || deleteMutation.isPending || isUploading

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Product Details</SheetTitle>
        </SheetHeader>
        <SheetPanel className="mt-5">
          {isReady ? (
            <ProductForm
              formId="edit-product-form"
              hideFooter
              value={form}
              onChange={setForm}
              submitting={isLoading}
              onUploadingChange={setIsUploading}
              onSubmit={(values) => {
                updateMutation.mutate(values)
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </SheetPanel>
        <SheetFooter className="justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => {
              if (
                product &&
                window.confirm('Are you sure you want to delete this product?')
              ) {
                deleteMutation.mutate(product.id)
              }
            }}
            disabled={isLoading || !isReady}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Delete'
            )}
          </Button>
          <div className="flex items-center gap-2">
            <SheetClose render={<Button variant="outline" />}>
              Cancel
            </SheetClose>
            <Button
              type="submit"
              form="edit-product-form"
              disabled={isLoading || !isReady}
              className="relative min-w-[140px]" // sesuaikan dengan lebar teks terpanjang
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
