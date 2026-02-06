import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Download,
  ExternalLink,
  Mail,
  MoreHorizontal,
  Search,
  RefreshCcw,
  ShoppingBag,
  FileText,
} from 'lucide-react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Menu,
  MenuPopup,
  MenuItem,
  MenuGroup,
  MenuGroupLabel,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { authClient } from '@/lib/auth-client'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { formatPrice, cn } from '@/lib/utils'
import { toastManager } from '@/components/ui/toast'
import { BASE_URL } from '@/lib/constans'

export const Route = createFileRoute('/$username/admin/orders/')({
  component: OrdersPage,
})

function OrdersPage() {
  const { username } = Route.useParams()
  const { data: session } = authClient.useSession()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const {
    data: orders,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['orders', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      return await trpcClient.order.listByCreator.query({
        userId: session.user.id,
      })
    },
    enabled: !!session?.user?.id,
  })

  // Resend Email Mutation
  const resendEmailMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!session?.user?.id) throw new Error('Unauthorized')
      return await trpcClient.order.resendEmail.mutate({
        orderId,
        userId: session.user.id,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: 'Email Sent',
        description: 'The order confirmation email has been resent.',
      })
      refetch()
    },
    onError: (error) => {
      toastManager.add({
        title: 'Failed to send email',
        description: error.message,
        type: 'error',
      })
    },
  })

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) => {
        const product = row.original.product
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate max-w-[150px] sm:max-w-xs">
                {product.title}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {new Date(row.original.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'buyerEmail',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900 truncate">
            {row.original.buyerName || 'Guest'}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {row.original.buyerEmail}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'amountPaid',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-medium">
          {formatPrice(row.original.amountPaid)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
          )}
        >
          Paid
        </Badge>
      ),
    },
    {
      accessorKey: 'emailSent',
      header: 'Delivery',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] h-5 px-1.5 font-normal',
              row.original.emailSent
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-50'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-50',
            )}
          >
            {row.original.emailSent ? 'Sent' : 'Pending'}
          </Badge>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const order = row.original
        return (
          <Menu>
            <MenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </MenuTrigger>
            <MenuPopup align="end" className="w-[180px]">
              <MenuGroup>
                <MenuGroupLabel>Actions</MenuGroupLabel>
                <MenuItem
                  onClick={() => {
                    window.open(`${BASE_URL}/d/${order.deliveryToken}`, '_blank')
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Delivery Page
                </MenuItem>
                <MenuItem
                  disabled={resendEmailMutation.isPending}
                  onClick={() => resendEmailMutation.mutate(order.id)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Email
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(order.id)
                    toastManager.add({
                      title: 'Copied',
                      description: 'Order ID copied to clipboard',
                    })
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Copy Order ID
                </MenuItem>
              </MenuGroup>
            </MenuPopup>
          </Menu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: orders || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const safeValue = (() => {
        const value = row.getValue(columnId)
        return typeof value === 'number' ? String(value) : value
      })()

      return (
        (safeValue as string)
          ?.toLowerCase()
          ?.includes(filterValue.toLowerCase()) ?? false
      )
    },
    state: {
      sorting,
      globalFilter,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Orders
          </h1>
          <p className="text-sm text-slate-500">
            Manage your digital product sales and delivery
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Sales History
            </CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search orders..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-slate-100 hover:bg-slate-50"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="text-xs font-semibold text-slate-500 uppercase h-10"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="group border-slate-100"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-slate-500"
                  >
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4 px-6 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
