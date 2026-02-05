import * as React from 'react'
import { Link, createFileRoute, useRouter  } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import type {ProductFormValues} from '@/components/dashboard/ProductForm';
import { Button } from '@/components/ui/button'
import {
  ProductForm,
  
  emptyProductForm
} from '@/components/dashboard/ProductForm'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { toastManager } from '@/components/ui/toast'

export const Route = createFileRoute('/$username/admin/products/new')({
  component: ProductNewRoute,
})

function ProductNewRoute() {
  const { username } = Route.useParams()
  const queryClient = useQueryClient()
  const router = useRouter()

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
    mutationFn: async (values: ProductFormValues) => {
      const base = {
        userId: values.userId,
        title: values.title,
        description: values.description || undefined,
        productUrl: values.productUrl,
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
      return trpcClient.product.create.mutate(base)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
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
            render={
              <Link to={`/$username/admin/products`} params={{ username }} />
            }
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
        onSubmit={(values) => {
          toastManager.promise(createMutation.mutateAsync(values), {
            loading: {
              title: 'Creating product…',
              description: 'Please wait while we save your product.',
            },
            success: () => ({
              title: 'Product created',
              description: 'Your product has been created successfully.',
            }),
            error: (error: unknown) => ({
              title: 'Failed to create product',
              description:
                (error as Error)?.message ??
                'An unexpected error occurred while creating the product.',
            }),
          })
        }}
      />
    </div>
  )
}
