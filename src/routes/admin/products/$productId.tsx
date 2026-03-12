import * as React from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { ProductFormValues } from '@/components/dashboard/ProductForm'
import { ProductForm, parseCustomerQuestions } from '@/components/dashboard/ProductForm'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { toastManager } from '@/components/ui/toast'

export const Route = createFileRoute('/admin/products/$productId')({
  component: ProductEditRoute,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProductPayload(values: ProductFormValues) {
  return {
    id: values.id!,
    title: values.title,
    description: values.description || undefined,
    productContent: values.productContent ?? undefined,
    images: values.images,
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
    customerQuestions: values.customerQuestions.length > 0
      ? values.customerQuestions
      : undefined,
  }
}

function mapProductToForm(product: any): ProductFormValues {
  return {
    id: product.id,
    title: product.title ?? '',
    description: product.description ?? '',
    productContent: product.productContent ?? null,
    images: product.images ?? [],
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
    customerQuestions: parseCustomerQuestions(product.customerQuestions),
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function ProductEditRoute() {
  const { productId } = Route.useParams()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  const product = dashboardData?.products.find((p: any) => p.id === productId)

  const [form, setForm] = React.useState<ProductFormValues | null>(null)
  const [initialForm, setInitialForm] = React.useState<ProductFormValues | null>(null)
  const [isUploading, setIsUploading] = React.useState<boolean>(false)
  const formId = 'product-edit-form'

  React.useEffect(() => {
    if (user && product && !form) {
      const mapped = mapProductToForm(product)
      setForm(mapped)
      setInitialForm(mapped)
    }
  }, [user, product])

  const updateMutation = useMutation({
    mutationKey: ['product-update', productId],
    mutationFn: (values: ProductFormValues) =>
      trpcClient.product.update.mutate(buildProductPayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['products', user?.id] })
      toastManager.add({ title: 'Product updated', description: 'Your changes have been saved.' })
      router.navigate({ to: '/admin/products' })
    },
    onError: (error: any) => {
      toastManager.add({
        title: 'Failed to update product',
        description: error.message ?? 'An unexpected error occurred.',
        type: 'error',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationKey: ['product-delete', productId],
    mutationFn: (id: string) => trpcClient.product.delete.mutate({ id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['products', user?.id] })
      toastManager.add({ title: 'Product deleted', description: 'The product has been removed.' })
      router.navigate({ to: '/admin/products' })
    },
    onError: (error: any) => {
      toastManager.add({
        title: 'Failed to delete product',
        description: error.message ?? 'An unexpected error occurred.',
        type: 'error',
      })
    },
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this product? This cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const isLoading = updateMutation.isPending || deleteMutation.isPending || isUploading

  return (
    <div className="mb-20 w-full max-w-3xl self-center space-y-6 p-6 md:mb-0 mt-2">
      <div className="sm:sticky sm:top-0 z-10 flex justify-between items-center mb-4 bg-white py-2">
        <h4 className='text-2xl font-medium whitespace-nowrap'>Update Product</h4>
      </div>
      {form ? (
        <ProductForm
          value={form}
          onChange={setForm}
          onSubmit={(values) => updateMutation.mutate(values)}
          onDelete={handleDelete}
          submitting={isLoading}
          onUploadingChange={setIsUploading}
          formId={formId}
        />
      ) : (
        <LoadingState />
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  )
}
