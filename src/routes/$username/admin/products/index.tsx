import * as React from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@/components/ui/select'
import { authClient } from '@/lib/auth-client'

import {
  Plus,
  MoreHorizontal,
  Copy,
  Edit,
  Trash,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuPopup,
  MenuItem,
  MenuGroup,
  MenuGroupLabel,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import { cn, formatPrice } from '@/lib/utils'
import EmptyProduct from '@/components/emply-product'
import { toastManager } from '@/components/ui/toast'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import {
  AppHeader,
  AppHeaderActions,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import { DataTable } from '@/components/ui/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table'
import { Spinner } from '@/components/ui/spinner'

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
  images: string[] | null
  salesCount: number
  totalRevenue: number
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

function ProductActions({
  product,
  username,
}: {
  product: ProductRow
  username: string
}) {
  const queryClient = useQueryClient()

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      return toastManager.promise(trpcClient.product.duplicate.mutate({ id }), {
        loading: 'Duplicating product...',
        success: 'Product duplicated successfully',
        error: 'Failed to duplicate product',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trpcClient.product.delete.mutate({ id }),
    onSuccess: () => {
      toastManager.add({
        title: 'Product deleted',
        description: 'The product has been removed.',
      })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error: any) => {
      toastManager.add({
        title: 'Failed to delete',
        description: error.message,
        type: 'error',
      })
    },
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toastManager.add({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    })
  }

  const publicUrl = `${window.location.origin}/${username}/products/${product.id}`
  const checkoutUrl = `${publicUrl}/checkout`
  const href = `/${username}/admin/products/${product.id}`
  return (
    <Menu>
      <MenuTrigger
        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
      >
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </MenuTrigger>
      <MenuPopup align="end" className="w-[220px]">
        <MenuGroup>
          <MenuGroupLabel>Actions</MenuGroupLabel>
          <MenuItem
            onClick={() => {
              // Link handles navigation
            }}
            render={
              <Link
                to={href}
                className="flex items-center w-full cursor-pointer"
              />
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </MenuItem>
          <MenuItem
            disabled={duplicateMutation.isPending}
            onClick={() => duplicateMutation.mutate(product.id)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Product
          </MenuItem>
          <MenuItem
            className="text-destructive focus:text-destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(product.id)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Product
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Share</MenuGroupLabel>
          <MenuItem onClick={() => copyToClipboard(product.id, 'Product ID')}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Product ID
          </MenuItem>
          <MenuItem onClick={() => copyToClipboard(publicUrl, 'Public URL')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Copy Public URL
          </MenuItem>
          <MenuItem
            onClick={() => copyToClipboard(checkoutUrl, 'Checkout URL')}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Copy Checkout URL
          </MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  )
}

function getColumns(username: string): Array<ColumnDef<ProductRow>> {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => {
        const imageUrl = row.original.images?.[0]
        const href = `/${username}/admin/products/${row.original.id}`
        const publicUrl = `${window.location.origin}/${username}/products/${row.original.id}`
        return (
          <div className="flex items-center gap-4 py-1">
            <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden border">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={row.original.title || ''}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-300">
                  <ShoppingBag className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <Link
                to={href}
                className="font-bold text-sm hover:underline truncate max-w-[200px] sm:max-w-[300px]"
              >
                {row.original.title || 'Untitled Product'}
              </Link>
              <Link
                className="text-xs max-w-[200px] sm:max-w-[300px] line-clamp-1 hover:underline"
                to={publicUrl}
                target="_blank"
              >
                {publicUrl.replace(/^https?:\/\//, '')}
              </Link>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'salesCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sales" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-zinc-900">
          {row.original.salesCount || 0}
        </span>
      ),
    },
    {
      accessorKey: 'totalRevenue',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Revenue" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-zinc-900">
          {formatPrice(row.original.totalRevenue || 0)}
        </span>
      ),
    },
    {
      id: 'pricing',
      header: 'Price',
      cell: ({ row }) => (
        <span className="text-sm ">{productPriceLabel(row.original)}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const queryClient = useQueryClient()
        const { data: session } = authClient.useSession()
        const active = row.original.isActive

        const toggleMutation = useMutation({
          mutationFn: (value: boolean) =>
            trpcClient.product.toggleActive.mutate({
              id: row.original.id,
              isActive: value,
            }),
          onMutate: async (newValue) => {
            // Optimistic update
            await queryClient.cancelQueries({
              queryKey: ['products', session?.user?.id],
            })
            const previousData = queryClient.getQueryData([
              'products',
              session?.user?.id,
            ])

            queryClient.setQueryData(
              ['products', session?.user?.id],
              (old: any) => {
                if (!old) return old
                return old.map((p: any) =>
                  p.id === row.original.id ? { ...p, isActive: newValue } : p,
                )
              },
            )

            return { previousData }
          },
          onSuccess: (data, variables) => {
            toastManager.add({
              title: variables ? 'Product activated' : 'Product deactivated',
              description: `Product is now ${variables ? 'visible on' : 'hidden from'} your profile.`,
            })
          },
          onError: (err, newTodo, context) => {
            queryClient.setQueryData(
              ['products', session?.user?.id],
              context?.previousData,
            )
            toastManager.add({
              title: 'Failed to update status',
              description: 'Please try again.',
              type: 'error',
            })
          },
          onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
          },
        })

        return (
          <Select
            value={active ? 'active' : 'hidden'}
            onValueChange={(val) => toggleMutation.mutate(val === 'active')}
          >
            <SelectTrigger
              size="sm"
              className={cn(
                'h-7 text-xs shadow-none px-2.5 gap-1.5 w-auto min-w-[95px] justify-start rounded-full',
                active
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100',
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectPopup className="w-[120px]">
              <SelectItem value="active">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Active
                </span>
              </SelectItem>
              <SelectItem value="hidden">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                  Hidden
                </span>
              </SelectItem>
            </SelectPopup>
          </Select>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ProductActions product={row.original} username={username} />
      ),
    },
  ]
}

function ProductAdminRoute() {
  const { username } = Route.useParams()

  const { data: session } = authClient.useSession()

  const { data: products = [], isLoading: isProductsLoading, isFetching: isProductsFetching } = useQuery({
    queryKey: ['products', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      return await trpcClient.product.listByUser.query({
        userId: session.user.id,
      })
    },
    enabled: !!session?.user?.id,
  })

  const columns = React.useMemo(() => getColumns(username), [username])

  const totalSales = products.reduce((acc, p) => acc + (p.salesCount || 0), 0)
  const totalRevenue = products.reduce(
    (acc, p) => acc + (p.totalRevenue || 0),
    0,
  )

  if (!session?.user) return null

  const newHref = `/${username}/admin/products/new`

  return (
    <div className="space-y-6 pb-20">
      <AppHeader>
        <AppHeaderContent title="Products">
          <AppHeaderDescription>
            Manage and track the performance of your digital products.
          </AppHeaderDescription>
        </AppHeaderContent>
        <AppHeaderActions>
          <Button size="sm" render={<Link to={newHref} />}>
            <Plus className="h-4 w-4 mr-1.5" />
            New product
          </Button>
        </AppHeaderActions>
      </AppHeader>

      {(isProductsLoading || isProductsFetching) && products.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-5 w-5 text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <EmptyProduct />
      ) : (
        <div className="space-y-8">
          <DataTable
            columns={columns}
            data={products}
            searchKey="title"
            filterPlaceholder="Search products by name..."
          />
        </div>
      )}
    </div>
  )
}
