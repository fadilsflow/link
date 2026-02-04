import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ProductForm,
  type ProductFormValues,
  parseCustomerQuestions,
} from '@/components/dashboard/ProductForm'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

export const Route = createFileRoute(
  '/$username/admin/products/$productId',
)({
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

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', username],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  const product = dashboardData?.products?.find(
    (p: any) => p.id === productId,
  )

  const [form, setForm] = React.useState<ProductFormValues | null>(null)

  React.useEffect(() => {
    if (user && product && !form) {
      setForm(mapProductToForm(user.id, product))
    }
  }, [user, product, form])

  const updateMutation = useMutation({
    mutationKey: ['product-update', username, productId],
    mutationFn: async (payload: ProductFormValues) => {
      const base = {
        userId: payload.userId,
        title: payload.title,
        description: payload.description || undefined,
        productUrl: payload.productUrl,
        isActive: payload.isActive,
        totalQuantity: payload.totalQuantity ?? undefined,
        limitPerCheckout: payload.limitPerCheckout ?? undefined,
        priceSettings: payload.priceSettings,
        customerQuestions: payload.customerQuestions,
      }
      return trpcClient.product.update.mutate({
        ...base,
        id: payload.id!,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
      window.location.href = `/${username}/admin/products`
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
      window.location.href = `/${username}/admin/products`
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
            onClick={() => {
              window.location.href = `/${username}/admin/products`
            }}
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
        onSubmit={(values) => updateMutation.mutate(values)}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  )
}

