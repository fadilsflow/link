import { useState } from 'react'
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

function OrdersPage() {
  const { data: session } = authClient.useSession()

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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      cell: ({ row }) => {
        const product = row.original.product
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0 bg-secondary/50 border">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="font-medium text-sm truncate max-w-[200px]">
                {product.title}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {new Date(row.original.createdAt).toLocaleDateString()}
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
      cell: ({ row }) => (
        <span className="font-medium text-sm">
          {formatPrice(row.original.amountPaid)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isSent = row.original.emailSent
        return (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-600 bg-emerald-50/50"
            >
              Paid
            </Badge>
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

  return (
    <div className="space-y-6">
      <AppHeader>
        <AppHeaderContent title="Orders">
          <AppHeaderDescription>
            Manage your digital product sales and delivery
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      <DataTable
        columns={columns}
        data={orders || []}
        searchKey="buyerEmail"
        filterPlaceholder="Filter by email..."
      />
    </div>
  )
}
