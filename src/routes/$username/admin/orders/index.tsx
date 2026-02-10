import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import {
  ExternalLink,
  Mail,
  MoreHorizontal,
  ShoppingBag,
  FileText,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { authClient } from '@/lib/auth-client'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { formatPrice } from '@/lib/utils'
import { toastManager } from '@/components/ui/toast'
import { BASE_URL } from '@/lib/constans'
import { DataTable } from '@/components/ui/data-table'
import { DataTableColumnHeader } from '@/components/ui/data-table'

export const Route = createFileRoute('/$username/admin/orders/')({
  component: OrdersPage,
})

function getStatusBadge(status: string, refundedAmount: number) {
  switch (status) {
    case 'refunded':
      return (
        <Badge
          variant="outline"
          className="border-red-500/30 text-red-600 bg-red-50/50"
        >
          Refunded
        </Badge>
      )
    case 'partially_refunded':
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 text-amber-600 bg-amber-50/50"
        >
          Partial Refund ({formatPrice(refundedAmount)})
        </Badge>
      )
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

function getFinanceUiError(message: string): string {
  const lower = message.toLowerCase()

  if (
    lower.includes('already refunded') ||
    lower.includes('nothing to refund')
  ) {
    return 'This order has already been fully refunded.'
  }
  if (
    lower.includes('refund exceeds') ||
    lower.includes('cannot refund more')
  ) {
    return 'Refund amount exceeds the remaining paid amount for this order.'
  }
  if (lower.includes('not found') && lower.includes('unauthorized')) {
    return 'Refund could not be processed because the order state changed. Please refresh and try again.'
  }

  return message
}

function OrdersPage() {
  const { data: session } = authClient.useSession()
  const { data: orders, refetch } = useQuery({
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

  // Full Refund Mutation
  const refundMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!session?.user?.id) throw new Error('Unauthorized')
      return await trpcClient.order.refund.mutate({
        orderId,
        userId: session.user.id,
      })
    },
    onSuccess: (data) => {
      toastManager.add({
        title: 'Refund Processed',
        description: `${formatPrice(data.refundedAmount)} has been refunded.`,
      })
      refetch()
    },
    onError: (error) => {
      toastManager.add({
        title: 'Refund Failed',
        description: getFinanceUiError(error.message),
        type: 'error',
      })
    },
  })

  const columns: ColumnDef<any>[] = [
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
        const remainingRefundable = Math.max(
          0,
          order.amountPaid - (order.refundedAmount ?? 0),
        )
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
            {order.refundedAmount > 0 && (
              <span className="text-xs text-red-500">
                Refunded: {formatPrice(order.refundedAmount)}
              </span>
            )}
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
            {getStatusBadge(order.status, order.refundedAmount ?? 0)}
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
        const remainingRefundable = Math.max(
          0,
          order.amountPaid - (order.refundedAmount ?? 0),
        )
        const canRefund =
          (order.status === 'completed' ||
            order.status === 'partially_refunded') &&
          remainingRefundable > 0
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
                <MenuSeparator />
                {canRefund && (
                  <MenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={refundMutation.isPending || !canRefund}
                    onClick={() => {
                      if (
                        confirm(
                          `Refund ${formatPrice(remainingRefundable)} to ${order.buyerEmail}?`,
                        )
                      ) {
                        refundMutation.mutate(order.id)
                      }
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Full Refund
                  </MenuItem>
                )}
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

  // Calculate totals from snapshot data
  const totalRevenue = (orders ?? []).reduce(
    (acc, o: any) =>
      acc +
      (o.transactions ?? []).reduce(
        (tAcc: number, t: any) => tAcc + t.netAmount,
        0,
      ),
    0,
  )
  const totalOrders = (orders ?? []).length
  // const totalRefunds = (orders ?? []).reduce(
  //   (acc, o: any) => acc + (o.refundedAmount ?? 0),
  //   0,
  // )

  const refundedOrders = (orders ?? []).filter(
    (o: any) => o.status === 'refunded' || o.status === 'partially_refunded',
  ).length
  const refundRate = totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0

  return (
    <div className="space-y-6">
      <AppHeader>
        <AppHeaderContent title="Orders">
          <AppHeaderDescription>
            Manage your digital product sales, delivery, and refunds
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total orders placed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refund rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{refundRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {refundedOrders} refunded or partially refunded orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cumulative Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time net revenue
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={orders || []}
        searchKey="buyerEmail"
        filterPlaceholder="Filter by email..."
      />
    </div>
  )
}
