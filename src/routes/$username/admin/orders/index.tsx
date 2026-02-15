import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ExternalLink,
  FileText,
  Mail,
  MoreHorizontal,
  ShoppingBag,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'

import { Button } from '@/components/ui/button'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from '@/components/ui/menu'
import { Badge } from '@/components/ui/badge'
import { authClient } from '@/lib/auth-client'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { formatPrice } from '@/lib/utils'
import { toastManager } from '@/components/ui/toast'
import { BASE_URL } from '@/lib/constans'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { Spinner } from '@/components/ui/spinner'
import EmptyState from '@/components/empty-state'

export const Route = createFileRoute('/$username/admin/orders/')({
  component: OrdersPage,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'cancelled':
      return (
        <Badge
          variant="outline"
          className="border-zinc-500/30 text-zinc-600 bg-zinc-50/50"
        >
          Cancelled
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 text-emerald-600 bg-emerald-50/50"
        >
          Paid
        </Badge>
      )
  }
}

function OrdersPage() {
  const { data: session } = authClient.useSession()
  const {
    data: orders = [],
    refetch,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
  } = useQuery({
    queryKey: ['orders', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      return await trpcClient.order.listByCreator.query({
        userId: session.user.id,
      })
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
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

  const columns: Array<ColumnDef<any>> = [
    {
      accessorKey: 'product',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => {
        // Use snapshot data (immutable), fallback to product relation
        const order = row.original
        const title =
          order.productTitle ?? order.product?.title ?? 'Deleted Product'
        const image = order.productImage ?? order.product?.images?.[0] ?? null
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md flex items-center justify-center overflow-hidden shrink-0 bg-secondary/50 border">
              {image ? (
                <img
                  src={image}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="font-medium text-sm truncate max-w-[200px]">
                {title}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                Snapshot price:{' '}
                {formatPrice(order.productPrice ?? order.amountPaid)}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'buyerEmail',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => (
        <div className="min-w-0 flex flex-col">
          <span className="font-medium text-sm truncate">
            {row.original.buyerName || 'Guest'}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {row.original.buyerEmail}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'amountPaid',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              Paid: {formatPrice(order.amountPaid)}
            </span>
            <span className="text-xs text-muted-foreground">
              Net revenue:{' '}
              {formatPrice(
                (order.transactions ?? []).reduce(
                  (acc: number, t: any) => acc + t.netAmount,
                  0,
                ),
              )}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const order = row.original
        const isSent = order.emailSent
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(order.status)}
            <Badge
              variant="outline"
              className={
                isSent
                  ? 'border-blue-500/30 text-blue-600 bg-blue-50/50'
                  : 'border-amber-500/30 text-amber-600 bg-amber-50/50'
              }
            >
              {isSent ? 'Sent' : 'Pending'}
            </Badge>
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const order = row.original
        return (
          <Menu>
            <MenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8" />
              }
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </MenuTrigger>
            <MenuPopup align="end" className="w-[200px]">
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

  return (
    <div className="space-y-6 pb-20">
      <AppHeader>
        <AppHeaderContent title="Orders">
          <AppHeaderDescription>
            Manage your digital product sales and delivery
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      {(isOrdersLoading || isOrdersFetching) && orders.length === 0 ? (
        <div className="min-h-[500px] flex items-center justify-center py-12">
          <Spinner className="h-5 w-5 text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="min-h-[500px] flex items-center justify-center py-12">
          <EmptyState
            title="No orders yet"
            description="You haven't received any orders yet. Start make a sale by promoting
             your products."
            icon={<ShoppingBag className="h-5 w-5" />}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          searchKey="buyerEmail"
          filterPlaceholder="Filter by email..."
        />
      )}
    </div>
  )
}
