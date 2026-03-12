import * as React from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { ProductFormValues } from '@/components/dashboard/ProductForm'
import { ProductForm, emptyProductForm } from '@/components/dashboard/ProductForm'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { toastManager } from '@/components/ui/toast'

export const Route = createFileRoute('/admin/products/new')({
  component: ProductNewRoute,
})

function buildProductPayload(values: ProductFormValues) {
  return {
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

function ProductNewRoute() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardData,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  const [form, setForm] = React.useState<ProductFormValues | null>(null)
  const [isUploading, setIsUploading] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (user && !form) {
      const empty = emptyProductForm()
      setForm(empty)
    }
  }, [user])

  const createMutation = useMutation({
    mutationKey: ['product-create'],
    mutationFn: (values: ProductFormValues) =>
      trpcClient.product.create.mutate(buildProductPayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['products', user?.id] })
      toastManager.add({ title: 'Product created', description: 'Your product is now live.' })
      router.navigate({ to: '/admin/products' })
    },
    onError: (error: any) => {
      toastManager.add({
        title: 'Failed to create product',
        description: error.message ?? 'An unexpected error occurred.',
        type: 'error',
      })
    },
  })

  const isLoading = createMutation.isPending || isUploading


  return (
    <div className="mb-20 w-full max-w-3xl self-center space-y-6 p-6 md:mb-0 mt-2">
      <h4 className='text-2xl font-medium whitespace-nowrap'>Create Product</h4>

      {form ? (
        <ProductForm
          value={form}
          onChange={setForm}
          onSubmit={(values) => createMutation.mutate(values)}
          submitting={isLoading}
          onUploadingChange={setIsUploading}
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
