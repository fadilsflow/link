import { useState } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  AppHeader,
  AppHeaderActions,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import {
  ExternalLink,
  Mail,
  MoreHorizontal,
  Search,
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
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/$username/admin/orders/')({
  component: OrdersPage,
})

function OrdersPage() {
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
            <div className="h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium  truncate max-w-[150px] sm:max-w-xs">
                {product.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
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
          <p className="font-medium  truncate">
            {row.original.buyerName || 'Guest'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
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
      cell: ({ row }) => <Badge variant="success">Paid</Badge>,
    },
    {
      accessorKey: 'emailSent',
      header: 'Delivery',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.original.emailSent ? 'info' : 'warning'}>
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
            <MenuTrigger
              render={<Button variant="ghost" className="h-8 w-8 p-0" />}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </MenuTrigger>
            <MenuPopup align="end" className="w-[180px]">
              <MenuGroup>
                <MenuGroupLabel>Actions</MenuGroupLabel>
                <MenuItem
                  onClick={() => {
                    window.open(
                      `${BASE_URL}/d/${order.deliveryToken}`,
                      '_blank',
                    )
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
      {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight ">Orders</h1>
          <p className="text-sm ">
            Manage your digital product sales and delivery
          </p>
        </div>
      </div> */}
      <AppHeader>
        <AppHeaderContent title="Orders">
          <AppHeaderDescription>
            Manage your digital product sales and delivery
          </AppHeaderDescription>
        </AppHeaderContent>
        <AppHeaderActions>
          <InputGroup>
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search"
              placeholder="Search orders..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              type="search"
            />
          </InputGroup>
        </AppHeaderActions>
      </AppHeader>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Sales History
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="text-xs font-semibold  uppercase h-10"
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
                    <div className="flex items-center justify-center gap-2">
                      <Spinner />
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="group"
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
                    className="h-32 text-center "
                  >
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4 px-6">
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
