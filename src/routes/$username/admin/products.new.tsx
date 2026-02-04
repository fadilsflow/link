import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ProductForm,
  emptyProductForm,
  type ProductFormValues,
} from '@/components/dashboard/ProductForm'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

export const Route = createFileRoute('/$username/admin/products/new')({
  component: ProductNewRoute,
})

function ProductNewRoute() {
  const { username } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', username],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  const [form, setForm] = React.useState<ProductFormValues | null>(null)

  React.useEffect(() => {
    if (user && !form) {
      setForm(emptyProductForm(user.id))
    }
  }, [user, form])

  const createMutation = useMutation({
    mutationKey: ['product-create', username],
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
      return trpcClient.product.create.mutate(base)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
      window.location.href = `/${username}/admin/products`
    },
  })

  if (!user || !form) return null

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
              New product
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Create a new digital product for your profile.
            </p>
          </div>
        </div>
      </div>

      <ProductForm
        value={form}
        onChange={setForm}
        submitting={createMutation.isPending}
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </div>
  )
}

