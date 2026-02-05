import * as React from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import type { ProductFormValues } from '@/components/dashboard/ProductForm'
import { Button } from '@/components/ui/button'
import {
  ProductForm,
  parseCustomerQuestions,
} from '@/components/dashboard/ProductForm'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { toastManager } from '@/components/ui/toast'

export const Route = createFileRoute('/$username/admin/products/$productId')({
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
  const { username, productId } = Route.useParams()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', username],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  const product = dashboardData?.products?.find((p: any) => p.id === productId)

  const [form, setForm] = React.useState<ProductFormValues | null>(null)

  React.useEffect(() => {
    if (user && product && !form) {
      setForm(mapProductToForm(user.id, product))
    }
  }, [user, product, form])

  const updateMutation = useMutation({
    mutationKey: ['product-update', username, productId],
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
      router.navigate({ to: '/$username/admin/products', params: { username } })
      return trpcClient.product.update.mutate(base)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
  })

  const deleteMutation = useMutation({
    mutationKey: ['product-delete', username, productId],
    mutationFn: (id: string) =>
      trpcClient.product.delete.mutate({
        id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
      router.navigate({ to: '/$username/admin/products', params: { username } })
    },
  })

  if (!user || !product || !form) return null

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-6 lg:p-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            render={
              <Link to={`/$username/admin/products`} params={{ username }} />
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Edit product
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Update details for {product.title || 'this product'}.
            </p>
          </div>
        </div>
      </div>

      <ProductForm
        value={form}
        onChange={setForm}
        submitting={updateMutation.isPending || deleteMutation.isPending}
        onSubmit={(values) => {
          toastManager.promise(updateMutation.mutateAsync(values), {
            loading: {
              title: 'Saving changes…',
              description: 'Please wait while we update your product.',
            },
            success: () => ({
              title: 'Product updated',
              description: 'Your changes have been saved successfully.',
            }),
            error: (error: unknown) => ({
              title: 'Failed to update product',
              description:
                (error as Error)?.message ??
                'An unexpected error occurred while updating the product.',
            }),
          })
        }}
        onDelete={(id) => {
          toastManager.promise(deleteMutation.mutateAsync(id), {
            loading: {
              title: 'Deleting product…',
              description: 'Please wait while we delete this product.',
            },
            success: () => ({
              title: 'Product deleted',
              description: 'The product has been deleted successfully.',
            }),
            error: (error: unknown) => ({
              title: 'Failed to delete product',
              description:
                (error as Error)?.message ??
                'An unexpected error occurred while deleting the product.',
            }),
          })
        }}
      />
    </div>
  )
}
