import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDashboardData } from '@/lib/profile-server'
import { cn, formatPrice } from '@/lib/utils'
import EmptyProduct from '@/components/emply-product'
import {
  AppHeader,
  AppHeaderActions,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import { DataTable } from '@/components/ui/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table'

export const Route = createFileRoute('/$username/admin/products/')({
  component: ProductAdminRoute,
})

type ProductRow = {
  id: string
  title: string | null
  isActive: boolean
  payWhatYouWant: boolean
  price: number | null
  salePrice: number | null
  minimumPrice: number | null
  suggestedPrice: number | null
  createdAt: string | Date
}

function productPriceLabel(product: ProductRow): string {
  if (product.payWhatYouWant) {
    if (product.minimumPrice) {
      return `From ${formatPrice(product.minimumPrice)}`
    }
    return 'Pay what you want'
  }
  if (product.salePrice && product.price && product.salePrice < product.price) {
    return formatPrice(product.salePrice)
  }
  if (product.price) return formatPrice(product.price)
  return 'No price'
}

function getColumns(username: string): Array<ColumnDef<ProductRow>> {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm truncate max-w-[250px]">
            {row.original.title || 'Untitled'}
          </span>
        </div>
      ),
    },
    {
      id: 'pricing',
      header: 'Pricing',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-muted-foreground">
          {productPriceLabel(row.original)}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const active = row.original.isActive
        return (
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5 text-[11px] font-medium border-0',
              active
                ? 'text-emerald-700 bg-emerald-50/50'
                : 'text-zinc-500 bg-zinc-50/50',
            )}
          >
            {active ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
            )}
            {active ? 'Active' : 'Hidden'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt)
        return (
          <span className="text-xs text-muted-foreground">
            {date.toLocaleDateString()}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const href = `/${username}/admin/products/${row.original.id}`
        return (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              render={<Link to={href} />}
            >
              Edit
            </Button>
          </div>
        )
      },
    },
  ]
}

function ProductAdminRoute() {
  const { username } = Route.useParams()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', username],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  const products = (dashboardData?.products ?? []) as Array<ProductRow>

  const columns = React.useMemo(() => getColumns(username), [username])

  if (!user) return null

  const newHref = `/${username}/admin/products/new`

  return (
    <div className="space-y-6">
      <AppHeader>
        <AppHeaderContent title="Products">
          <AppHeaderDescription>
            Manage the products that appear on your public profile.
          </AppHeaderDescription>
        </AppHeaderContent>
        <AppHeaderActions>
          <Button size="sm" render={<Link to={newHref} />}>
            <Plus className="h-4 w-4 mr-1.5" />
            New product
          </Button>
        </AppHeaderActions>
      </AppHeader>

      {products.length === 0 ? (
        <EmptyProduct />
      ) : (
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-1">
            <DataTable
              columns={columns}
              data={products}
              searchKey="title"
              filterPlaceholder="Filter products..."
            />
          </div>
        </div>
      )}
    </div>
  )
}
