import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Clock,
  DollarSign,
  MoreHorizontal,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Menu,
  MenuPopup,
  MenuItem,
  MenuGroup,
  MenuGroupLabel,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import { authClient } from '@/lib/auth-client'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { formatPrice } from '@/lib/utils'
import { toastManager } from '@/components/ui/toast'

export const Route = createFileRoute('/$username/admin/balance/')({
  component: BalancePage,
})

function BalancePage() {
  const { data: session } = authClient.useSession()
  const queryClient = useQueryClient()

  // Balance summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['balance', 'summary', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      return await trpcClient.balance.getSummary.query({
        userId: session.user.id,
      })
    },
    enabled: !!session?.user?.id,
  })

  // Transaction history
  const { data: txns, isLoading: isTxnsLoading } = useQuery({
    queryKey: ['balance', 'transactions', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      return await trpcClient.balance.getTransactions.query({
        userId: session.user.id,
        limit: 50,
      })
    },
    enabled: !!session?.user?.id,
  })

  // Payouts list
  const { data: payoutsList, isLoading: isPayoutsLoading } = useQuery({
    queryKey: ['balance', 'payouts', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      return await trpcClient.payout.list.query({
        userId: session.user.id,
      })
    },
    enabled: !!session?.user?.id,
  })

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error('Unauthorized')
      return await trpcClient.payout.request.mutate({
        userId: session.user.id,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: 'Payout Requested',
        description: 'Your payout request has been submitted.',
      })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    },
    onError: (error) => {
      toastManager.add({
        title: 'Payout Failed',
        description: error.message,
        type: 'error',
      })
    },
  })

  // Cancel payout mutation
  const cancelPayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      if (!session?.user?.id) throw new Error('Unauthorized')
      return await trpcClient.payout.cancel.mutate({
        payoutId,
        userId: session.user.id,
      })
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
        description: error.message,
        type: 'error',
      })
    },
  })

  const isLoading = isSummaryLoading

  return (
    <div className="space-y-6 pb-20">
      <AppHeader>
        <AppHeaderContent title="Balance & Payouts">
          <AppHeaderDescription>
            Track your earnings, view transaction history, and request payouts
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard
          title="Available Balance"
          value={summary?.availableBalance ?? 0}
          icon={<Wallet className="h-4 w-4" />}
          description="Ready for payout"
          isLoading={isLoading}
          highlight
        />
        <BalanceCard
          title="Pending Balance"
          value={summary?.pendingBalance ?? 0}
          icon={<Clock className="h-4 w-4" />}
          description={`${summary?.holdPeriodDays ?? 7}-day hold period`}
          isLoading={isLoading}
        />
        <BalanceCard
          title="Total Earnings"
          value={summary?.totalEarnings ?? 0}
          icon={<TrendingUp className="h-4 w-4" />}
          description="All time (net of fees)"
          isLoading={isLoading}
        />
        <BalanceCard
          title="Total Refunds"
          value={summary?.totalRefunds ?? 0}
          icon={<ArrowDownRight className="h-4 w-4" />}
          description="All time"
          isLoading={isLoading}
          negative
        />
      </div>

      {/* Payout Action */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6">
          <div className="space-y-1">
            <h3 className="font-semibold">Request Payout</h3>
            <p className="text-sm text-muted-foreground">
              Withdraw your available balance. Funds from sales are available
              after a {summary?.holdPeriodDays ?? 7}-day hold period.
            </p>
          </div>
          <Button
            onClick={() => {
              if (
                confirm(
                  `Request payout of ${formatPrice(summary?.availableBalance ?? 0)}?`,
                )
              ) {
                requestPayoutMutation.mutate()
              }
            }}
            disabled={
              requestPayoutMutation.isPending ||
              !summary?.availableBalance ||
              summary.availableBalance <= 0
            }
            className="shrink-0"
          >
            <Banknote className="mr-2 h-4 w-4" />
            {requestPayoutMutation.isPending
              ? 'Requesting...'
              : `Withdraw ${formatPrice(summary?.availableBalance ?? 0)}`}
          </Button>
        </CardContent>
      </Card>

      {/* Payouts Section */}
      {(payoutsList ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Payout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(payoutsList ?? []).map((payout: any) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {formatPrice(payout.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PayoutStatusBadge status={payout.status} />
                    {payout.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm('Cancel this payout request?')) {
                            cancelPayoutMutation.mutate(payout.id)
                          }
                        }}
                        disabled={cancelPayoutMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTxnsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (txns ?? []).length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No transactions yet. Revenue from sales will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {(txns ?? []).map((txn: any) => (
                <TransactionRow key={txn.id} txn={txn} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function BalanceCard({
  title,
  value,
  icon,
  description,
  isLoading,
  highlight,
  negative,
}: {
  title: string
  value: number
  icon: React.ReactNode
  description: string
  isLoading?: boolean
  highlight?: boolean
  negative?: boolean
}) {
  return (
    <Card className={highlight ? 'border-primary/20 bg-primary/[0.02]' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <>
            <div
              className={`text-2xl font-bold ${negative && value > 0 ? 'text-red-500' : ''} ${highlight ? 'text-primary' : ''}`}
            >
              {negative && value > 0 ? '-' : ''}
              {formatPrice(value)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function TransactionRow({ txn }: { txn: any }) {
  const isCredit = txn.amount > 0
  const typeConfig = getTransactionTypeConfig(txn.type)

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}
        >
          {isCredit ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{txn.description}</p>
            <Badge variant="secondary" className="text-[10px] h-5">
              {typeConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {new Date(txn.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {txn.order && (
              <>
                <span>•</span>
                <span>{txn.order.buyerEmail}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold tabular-nums ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}
        >
          {isCredit ? '+' : ''}
          {formatPrice(Math.abs(txn.netAmount))}
        </p>
        {txn.platformFeeAmount > 0 && (
          <p className="text-[10px] text-muted-foreground">
            Fee: {formatPrice(txn.platformFeeAmount)}
          </p>
        )}
      </div>
    </div>
  )
}

function PayoutStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 text-emerald-600 bg-emerald-50/50"
        >
          Completed
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

function getTransactionTypeConfig(type: string) {
  switch (type) {
    case 'sale':
      return { label: 'Sale', color: 'emerald' }
    case 'refund':
      return { label: 'Refund', color: 'red' }
    case 'partial_refund':
      return { label: 'Partial Refund', color: 'amber' }
    case 'payout':
      return { label: 'Payout', color: 'blue' }
    case 'fee':
      return { label: 'Fee', color: 'zinc' }
    case 'adjustment':
      return { label: 'Adjustment', color: 'purple' }
    default:
      return { label: type, color: 'zinc' }
  }
}
