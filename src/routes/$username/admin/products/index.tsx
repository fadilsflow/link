import * as React from 'react'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Frame } from '@/components/ui/frame'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getDashboardData } from '@/lib/profile-server'
import { cn, formatPrice } from '@/lib/utils'
import { Link } from '@tanstack/react-router'

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

function getColumns(username: string): ColumnDef<ProductRow>[] {
  return [
    {
      accessorKey: 'title',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {row.original.title || 'Untitled'}
          </span>
        </div>
      ),
    },
    {
      id: 'pricing',
      header: 'Pricing',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {productPriceLabel(row.original)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const active = row.original.isActive
        return (
          <Badge
            variant="outline"
            className={cn(
              'gap-1 text-[11px]',
              active
                ? 'border-emerald-500/60 text-emerald-700 bg-emerald-50'
                : 'border-zinc-200 text-zinc-600 bg-zinc-50',
            )}
          >
            {active ? (
              <ToggleRight className="h-3 w-3" />
            ) : (
              <ToggleLeft className="h-3 w-3" />
            )}
            {active ? 'Active' : 'Hidden'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
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
          <Button
            variant="outline"
            size="xs"
            className="rounded-full text-[11px]"
            render={<Link to={href} />}
          >
            Edit
          </Button>
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
  const products = (dashboardData?.products ?? []) as ProductRow[]

  const columns = React.useMemo(() => getColumns(username), [username])
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!user) return null

  const newHref = `/${username}/admin/products/new`

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-6 lg:p-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Digital products
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage the products that appear on your public profile.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs"
          render={<Link to={newHref} />}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New product
        </Button>
      </div>

      <Card className="border-zinc-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between gap-3">
            <span>Products</span>
            <span className="text-xs text-zinc-500">
              {products.length} product{products.length === 1 ? '' : 's'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No products yet. Click &quot;New product&quot; to create your
              first digital product.
            </p>
          ) : (
            <Frame className="w-full">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => {
                      const href = `/${username}/admin/products/${row.original.id}`
                      return (
                        <TableRow
                          key={row.id}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No products found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Frame>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
