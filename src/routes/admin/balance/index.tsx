import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { XCircle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { AppHeader, AppHeaderContent } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Frame, FrameHeader, FramePanel, FrameTitle } from '@/components/ui/frame'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'
import { toastManager } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { cn, formatPrice, formatPriceInput, parsePriceInput } from '@/lib/utils'

function getFinanceUiError(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('already have a pending payout')) {
    return 'You already have a pending payout request. Wait until it is processed or cancel it first.'
  }
  if (lower.includes('requested') && lower.includes('available')) {
    return 'Insufficient available balance for this payout request.'
  }
  if (lower.includes('no available balance')) {
    return 'No available balance to withdraw yet. Pending funds will unlock after the hold period.'
  }

  return message
}

type HistoryTab = 'all' | 'pending' | 'settled'
type HistorySort = 'recent' | 'older'

type HistoryRow = {
  id: string
  type: string
  amount: number
  status: string
  statusGroup: Exclude<HistoryTab, 'all'>
  createdAt: string
  timestamp: number
  source: 'transaction' | 'payout'
  payoutId?: string
  canCancelPayout: boolean
}

export const Route = createFileRoute('/admin/balance/')({
  component: BalancePage,
})

function BalancePage() {
  const { data: session } = authClient.useSession()
  const queryClient = useQueryClient()
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutAmountInput, setPayoutAmountInput] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [historyTab, setHistoryTab] = useState<HistoryTab>('all')
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all')
  const [historyDateOrder, setHistoryDateOrder] = useState<HistorySort>('recent')

  // Balance summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['balance', 'summary', session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return null
      return await trpcClient.balance.getSummary.query()
    },
    enabled: !!session?.user.id,
  })

  // Transaction history
  const { data: txns, isLoading: isTxnsLoading } = useQuery({
    queryKey: ['balance', 'transactions', session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return []
      return await trpcClient.balance.getTransactions.query({
        limit: 50,
      })
    },
    enabled: !!session?.user.id,
  })

  // Payouts list
  const { data: payoutsList, isLoading: isPayoutsLoading } = useQuery({
    queryKey: ['balance', 'payouts', session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return []
      return await trpcClient.payout.list.query()
    },
    enabled: !!session?.user.id,
  })

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationKey: ['payout', 'request', session?.user.id ?? 'anonymous'],
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!session?.user.id) throw new Error('Unauthorized')
      return await trpcClient.payout.request.mutate({ amount })
    },
    onSuccess: () => {
      toastManager.add({
        title: 'Payout Requested',
        description: 'Your payout request has been submitted.',
      })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      setPayoutDialogOpen(false)
      setPayoutAmountInput('')
    },
    onError: (error) => {
      toastManager.add({
        title: 'Payout Failed',
        description: getFinanceUiError(error.message),
        type: 'error',
      })
    },
  })

  // Cancel payout mutation
  const cancelPayoutMutation = useMutation({
    mutationKey: ['payout', 'cancel', session?.user.id ?? 'anonymous'],
    mutationFn: async (payoutId: string) => {
      if (!session?.user.id) throw new Error('Unauthorized')
      return await trpcClient.payout.cancel.mutate({ payoutId })
    },
    onSuccess: () => {
      toastManager.add({
        title: 'Payout Cancelled',
        description:
          'Your payout request has been cancelled and balance restored.',
      })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
    onError: (error) => {
      toastManager.add({
        title: 'Cancel Failed',
        description: getFinanceUiError(error.message),
        type: 'error',
      })
    },
  })

  const isLoading = isSummaryLoading
  const isHistoryLoading = isTxnsLoading || isPayoutsLoading
  const availableBalance = summary?.availableBalance ?? 0
  const hasPendingPayout = (payoutsList ?? []).some((p: any) => p.status === 'pending')
  const disablePayoutRequest =
    requestPayoutMutation.isPending || availableBalance <= 0 || hasPendingPayout
  const payoutAmount = parsePriceInput(payoutAmountInput) ?? 0
  const payoutAmountError =
    payoutAmount <= 0
      ? 'Enter a payout amount.'
      : payoutAmount > availableBalance
        ? `Amount exceeds available balance (${formatPrice(availableBalance)}).`
        : null

  const historyRows = useMemo<Array<HistoryRow>>(() => {
    const transactionRows = (txns ?? [])
      .filter((txn: any) => txn.type !== 'payout')
      .map((txn: any) => {
        const createdAt = new Date(txn.createdAt).toISOString()
        const netAmount = (txn.amount ?? 0) - (txn.platformFeeAmount ?? 0)

        return {
          id: `txn-${txn.id}`,
          type: getTransactionTypeConfig(txn.type, txn.metadata).label,
          amount: netAmount,
          status: 'settled',
          statusGroup: 'settled' as const,
          createdAt,
          timestamp: new Date(createdAt).getTime(),
          source: 'transaction' as const,
          canCancelPayout: false,
        }
      })

    const payoutRows = (payoutsList ?? []).map((payout: any) => {
      const createdAt = new Date(payout.createdAt).toISOString()
      const normalizedStatus = `${payout.status ?? 'pending'}`.toLowerCase()

      return {
        id: `payout-${payout.id}`,
        type: 'Withdrawal',
        amount: -Math.abs(payout.amount ?? 0),
        status: normalizedStatus,
        statusGroup: getHistoryStatusGroup(normalizedStatus),
        createdAt,
        timestamp: new Date(createdAt).getTime(),
        source: 'payout' as const,
        payoutId: payout.id,
        canCancelPayout: normalizedStatus === 'pending',
      }
    })

    return [...transactionRows, ...payoutRows]
  }, [txns, payoutsList])

  const historyTypeOptions = useMemo(() => {
    return [
      'all',
      ...Array.from(new Set(historyRows.map((row) => row.type))),
    ]
  }, [historyRows])

  const filteredHistoryRows = useMemo(() => {
    return historyRows
      .filter((row) => {
        if (historyTab !== 'all' && row.statusGroup !== historyTab) return false
        if (historyTypeFilter !== 'all' && row.type !== historyTypeFilter) return false
        return true
      })
      .sort((a, b) => {
        if (historyDateOrder === 'older') return a.timestamp - b.timestamp
        return b.timestamp - a.timestamp
      })
  }, [historyRows, historyTab, historyTypeFilter, historyDateOrder])

  const historyColumns = useMemo<Array<ColumnDef<HistoryRow>>>(() => {
    return [
      {
        accessorKey: 'type',
        header: () => <span className="font-semibold">TYPE</span>,
        cell: ({ row }) => {
          return (
            <span className="font-medium">{row.original.type}</span>
          )
        },
      },
      {
        accessorKey: 'amount',
        header: () => <span className="font-semibold">AMOUNT</span>,
        cell: ({ row }) => {
          const isCredit = row.original.amount > 0
          return (
            <span
              className={cn(
                'font-medium tabular-nums',
                isCredit ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              {isCredit ? '+' : '-'}
              {formatPrice(Math.abs(row.original.amount))}
            </span>
          )
        },
      },
      {
        accessorKey: 'status',
        header: () => <span className="font-semibold">STATUS</span>,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <HistoryStatusBadge status={row.original.status} />
              {row.original.canCancelPayout && row.original.payoutId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    if (confirm('Cancel this payout request?')) {
                      cancelPayoutMutation.mutate(row.original.payoutId as string)
                    }
                  }}
                  disabled={cancelPayoutMutation.isPending}
                >
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: () => <span className="font-semibold">DATE</span>,
        cell: ({ row }) => {
          return (
            <span className="text-sm text-muted-foreground">
              {new Date(row.original.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )
        },
      },
    ]
  }, [cancelPayoutMutation])

  const handleRefreshBalance = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.refetchQueries({
        queryKey: ['balance'],
        type: 'active',
      })
      toastManager.add({
        title: 'Balance Refreshed',
        description: 'Latest balance and payout data loaded.',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <AppHeader>
        <AppHeaderContent title="Balance">
        </AppHeaderContent>
      </AppHeader>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 ">
        <BalanceCard
          title="Active Balance"
          value={summary?.availableBalance ?? 0}
          isLoading={isLoading}
          activeBalance
          actionLabel={
            hasPendingPayout
              ? 'Pending payout in progress'
              : 'Withdraw'
          }
          actionDisabled={disablePayoutRequest || isLoading}
          // actionLoading={requestPayoutMutation.isPending}
          onAction={() => setPayoutDialogOpen(true)}
          actionIcon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.74992 14.416L5.74992 13.0827L11.0833 13.0827L11.0833 14.416L5.74992 14.416ZM5.74992 11.7493L5.74992 10.416L11.0833 10.416L11.0833 11.7493L5.74992 11.7493ZM5.74992 9.08268L5.74992 7.74935L11.0833 7.74935L11.0833 9.08268L5.74992 9.08268ZM13.2499 6.41602L3.58325 6.41602L8.41658 1.58268L13.2499 6.41602Z"
                fill="currentColor"
              />
            </svg>
          }
        />
        <BalanceCard
          title="Pending Balance"
          value={summary?.pendingBalance ?? 0}
          isLoading={isLoading}
          actionLabel={'Refresh'}
          actionLoading={isRefreshing}
          onAction={handleRefreshBalance}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Available = funds ready to withdraw. Pending = funds still in hold (
        {summary?.holdPeriodDays ?? 7} days).
      </p>
      {hasPendingPayout && (
        <p className="text-xs text-muted-foreground -mt-3">
          You already have a pending payout request. Only one pending payout is
          allowed.
        </p>
      )}

      <Dialog
        open={payoutDialogOpen}
        onOpenChange={(open) => {
          setPayoutDialogOpen(open)
          if (!open) setPayoutAmountInput('')
        }}
      >
        <DialogPopup className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Payout</DialogTitle>
            <DialogDescription>
              Enter the amount you want to withdraw.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Available balance: {formatPrice(availableBalance)}
              </p>
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  placeholder="0"
                  value={payoutAmountInput}
                  onChange={(e) => {
                    const amount = parsePriceInput(e.target.value)
                    setPayoutAmountInput(formatPriceInput(amount))
                  }}
                  autoFocus
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setPayoutAmountInput(formatPriceInput(availableBalance))
                  }
                  disabled={availableBalance <= 0}
                >
                  Max
                </Button>
              </div>
              {payoutAmountError && (
                <p className="text-xs text-red-500">{payoutAmountError}</p>
              )}
            </div>
          </DialogPanel>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPayoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => requestPayoutMutation.mutate({ amount: payoutAmount })}
              disabled={requestPayoutMutation.isPending || !!payoutAmountError}
              loading={requestPayoutMutation.isPending}
            >
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <Frame className=''>
        <FrameHeader>
          <FrameTitle>History</FrameTitle>
        </FrameHeader>
        <FramePanel className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs
              value={historyTab}
              onValueChange={(value) => setHistoryTab(value as HistoryTab)}
              className="gap-0"
            >
              <TabsList variant="underline" className="w-full md:w-auto">
                <TabsTab value="all">All</TabsTab>
                <TabsTab value="pending">Pending</TabsTab>
                <TabsTab value="settled">Settled</TabsTab>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Select
                value={historyTypeFilter}
                onValueChange={(value) => setHistoryTypeFilter(value ?? 'all')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="By type" />
                </SelectTrigger>
                <SelectContent>
                  {historyTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={historyDateOrder}
                onValueChange={(value) => {
                  setHistoryDateOrder((value as HistorySort | null) ?? 'recent')
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="By date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="older">Older</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable
            variant='none'
            columns={historyColumns}
            data={filteredHistoryRows}
            isLoading={isHistoryLoading}
            emptyText="No history found for the selected filters."
          />
        </FramePanel>
      </Frame>
    </div>
  )
}

function BalanceCard({
  title,
  value,
  isLoading,
  activeBalance,
  negative,
  actionLabel,
  actionDisabled,
  actionLoading,
  onAction,
  actionIcon,
}: {
  title: string
  value: number
  isLoading?: boolean
  activeBalance?: boolean
  negative?: boolean
  actionLabel?: string
  actionDisabled?: boolean
  actionLoading?: boolean
  onAction?: () => void
  actionIcon?: ReactNode
}) {
  return (
    <Card
      className={cn(
        'p-4',
        activeBalance
          ? 'bg-linear-to-br from-black via-zinc-900 to-zinc-600 text-white shadow-xl'
          : '',
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : (
          <>
            <div
              className={`text-4xl font-heading  ${negative && value > 0 ? 'text-red-500' : ''} ${activeBalance ? 'text-primary-fo  reground' : ''}`}
            >
              {negative && value > 0 ? '-' : ''}
              {formatPrice(value)}
            </div>
          </>
        )}
        {actionLabel && onAction && (
          <Button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            loading={actionLoading}
            variant={activeBalance ? 'outline' : 'secondary'}
            className="rounded-full"
            size="lg"
          >
            {actionLoading ? (
              actionLabel
            ) : (
              <>
                {actionIcon}
                {actionLabel}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function HistoryStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'settled':
    case 'completed':
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 text-emerald-600 bg-emerald-50/50"
        >
          Settled
        </Badge>
      )
    case 'processing':
      return (
        <Badge
          variant="outline"
          className="border-blue-500/30 text-blue-600 bg-blue-50/50"
        >
          Processing
        </Badge>
      )
    case 'pending':
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 text-amber-600 bg-amber-50/50"
        >
          Pending
        </Badge>
      )
    case 'failed':
      return (
        <Badge
          variant="outline"
          className="border-red-500/30 text-red-600 bg-red-50/50"
        >
          Failed
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
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getHistoryStatusGroup(status: string): Exclude<HistoryTab, 'all'> {
  if (status === 'settled' || status === 'completed') {
    return 'settled'
  }

  return 'pending'
}

function getTransactionTypeConfig(
  type: string,
  metadata?: Record<string, unknown> | null,
) {
  switch (type) {
    case 'sale':
      return { label: 'Sale', color: 'emerald' }
    case 'payout':
      return { label: 'Withdrawal', color: 'blue' }
    case 'adjustment':
      if (metadata && 'cancelledPayoutId' in metadata) {
        return { label: 'Reversal', color: 'blue' }
      }
      return { label: 'Adjustment', color: 'purple' }
    default:
      return { label: type, color: 'zinc' }
  }
}
