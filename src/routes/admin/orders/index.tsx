import * as React from 'react'
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
import { Badge } from '@/components/ui/badge'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from '@/components/ui/menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { authClient } from '@/lib/auth-client'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { formatPrice } from '@/lib/utils'
import { toastManager } from '@/components/ui/toast'
import { BASE_URL } from '@/lib/constans'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { Spinner } from '@/components/ui/spinner'
import EmptyState from '@/components/empty-state'

export const Route = createFileRoute('/admin/orders/')({
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
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(
    null,
  )
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)

  const {
    data: orders = [],
    refetch,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
  } = useQuery({
    queryKey: ['orders', session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return []
      return await trpcClient.order.listByCreator.query()
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    enabled: !!session?.user.id,
  })

  const orderDetailQuery = useQuery({
    queryKey: ['order-detail', selectedOrderId, session?.user.id],
    queryFn: async () => {
      if (!session?.user.id || !selectedOrderId) return null
      return await trpcClient.order.getDetail.query({
        orderId: selectedOrderId,
      })
    },
    enabled: !!session?.user.id && !!selectedOrderId && isSheetOpen,
  })

  const resendEmailMutation = useMutation({
    mutationFn: async (orderId: string) => {
      if (!session?.user.id) throw new Error('Unauthorized')
      return await trpcClient.order.resendEmail.mutate({ orderId })
    },
    onSuccess: () => {
      toastManager.add({
        title: 'Email Sent',
        description: 'The order confirmation email has been resent.',
      })
      refetch()
      orderDetailQuery.refetch()
    },
    onError: (error) => {
      toastManager.add({
        title: 'Failed to send email',
        description: error.message,
        type: 'error',
      })
    },
  })

  const openOrderSheet = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsSheetOpen(true)
  }

  const columns: Array<ColumnDef<any>> = [
    {
      accessorKey: 'product',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => {
        const order = row.original
        const title =
          order.productTitle ?? order.product?.title ?? 'Deleted Product'
        const image = order.productImage ?? order.product?.images?.[0] ?? null
        const itemCount = order.items?.length ?? 0
        return (
          <button
            type="button"
            onClick={() => openOrderSheet(order.id)}
            className="flex items-center gap-3 text-left hover:opacity-80"
          >
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
              <span className="font-medium text-sm truncate max-w-[220px]">
                {title}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {itemCount > 1 ? `${itemCount} items` : 'Single item order'}
              </span>
            </div>
          </button>
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
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {getStatusBadge(order.status)}
            <Badge
              variant="outline"
              className={
                order.emailSent
                  ? 'border-blue-500/30 text-blue-600 bg-blue-50/50'
                  : 'border-amber-500/30 text-amber-600 bg-amber-50/50'
              }
            >
              {order.emailSent ? 'Sent' : 'Pending'}
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
            <MenuPopup align="end" className="w-[220px]">
              <MenuGroup>
                <MenuGroupLabel>Actions</MenuGroupLabel>
                <MenuItem onClick={() => openOrderSheet(order.id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Order Details
                </MenuItem>
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
              </MenuGroup>
            </MenuPopup>
          </Menu>
        )
      },
    },
  ]

  const selectedOrder = orderDetailQuery.data
  const lineItems = selectedOrder
    ? selectedOrder.items.length > 0
      ? selectedOrder.items
      : [
          {
            id: selectedOrder.id,
            productTitle: selectedOrder.productTitle,
            productImage: selectedOrder.productImage,
            quantity: selectedOrder.quantity,
            amountPaid: selectedOrder.amountPaid,
            productPrice: selectedOrder.productPrice,
            checkoutAnswers: selectedOrder.checkoutAnswers ?? {},
            creator: selectedOrder.creator,
          },
        ]
    : []

  return (
    <>
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

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open)
          if (!open) setSelectedOrderId(null)
        }}
      >
        <SheetContent className="sm:max-w-3xl w-full p-0">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>
              Review customer, pricing, fulfillment, and support actions in one
              place.
            </SheetDescription>
          </SheetHeader>
          <SheetPanel className="space-y-6">
            {orderDetailQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-5 w-5 text-muted-foreground" />
              </div>
            ) : !selectedOrder ? (
              <p className="text-sm text-muted-foreground">
                Unable to load order details.
              </p>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-4 rounded-lg border p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <p className="font-mono text-sm">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Placed</p>
                    <p className="text-sm">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium">
                      {selectedOrder.buyerName || 'Guest'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOrder.buyerEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1 flex gap-2">
                      {getStatusBadge(selectedOrder.status)}
                      <Badge variant="outline">
                        {selectedOrder.emailSent
                          ? 'Email sent'
                          : 'Email pending'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Items</h3>
                  {lineItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="rounded-lg border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">
                            {item.productTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Creator: {item.creator?.name || 'Creator'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatPrice(item.amountPaid)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} ×{' '}
                            {formatPrice(item.productPrice ?? item.amountPaid)}
                          </p>
                        </div>
                      </div>

                      {Object.keys(item.checkoutAnswers ?? {}).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Checkout responses
                          </p>
                          <div className="rounded-md bg-muted/40 p-3 space-y-1">
                            {Object.entries(item.checkoutAnswers).map(
                              ([key, value]) => (
                                <p key={key} className="text-xs">
                                  <span className="font-medium">{key}:</span>{' '}
                                  {String(value)}
                                </p>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Financial Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total paid</span>
                    <span className="font-medium">
                      {formatPrice(selectedOrder.amountPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform fees</span>
                    <span>
                      {formatPrice(
                        selectedOrder.transactions.reduce(
                          (acc: number, t: any) => acc + t.platformFeeAmount,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Net revenue</span>
                    <span>
                      {formatPrice(
                        selectedOrder.transactions.reduce(
                          (acc: number, t: any) => acc + t.netAmount,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                  {!!selectedOrder.note && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Customer note
                        </p>
                        <p className="text-sm">{selectedOrder.note}</p>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </SheetPanel>
          <SheetFooter className="justify-between sm:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={!selectedOrder}
                onClick={() => {
                  if (!selectedOrder) return
                  navigator.clipboard.writeText(selectedOrder.id)
                  toastManager.add({
                    title: 'Copied',
                    description: 'Order ID copied to clipboard',
                  })
                }}
              >
                Copy Order ID
              </Button>
              <Button
                variant="outline"
                disabled={!selectedOrder}
                onClick={() => {
                  if (!selectedOrder) return
                  navigator.clipboard.writeText(
                    `${BASE_URL}/d/${selectedOrder.deliveryToken}`,
                  )
                  toastManager.add({
                    title: 'Copied',
                    description: 'Delivery URL copied to clipboard',
                  })
                }}
              >
                Copy Delivery URL
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={!selectedOrder}
                onClick={() => {
                  if (!selectedOrder) return
                  window.open(
                    `${BASE_URL}/d/${selectedOrder.deliveryToken}`,
                    '_blank',
                  )
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Open Delivery Page
              </Button>
              <Button
                disabled={!selectedOrder || resendEmailMutation.isPending}
                onClick={() =>
                  selectedOrder && resendEmailMutation.mutate(selectedOrder.id)
                }
              >
                <Mail className="h-4 w-4" />
                Resend Email
              </Button>
              <SheetClose render={<Button variant="ghost" />}>Close</SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
