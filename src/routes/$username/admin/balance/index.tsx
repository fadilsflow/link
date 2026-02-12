import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  DollarSign,
  XCircle,
} from 'lucide-react'
import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { formatPrice } from '@/lib/utils'
import { toastManager } from '@/components/ui/toast'
import { Spinner } from '@/components/ui/spinner'

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
        description: getFinanceUiError(error.message),
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
        description: getFinanceUiError(error.message),
        type: 'error',
      })
    },
  })

  const isLoading = isSummaryLoading
  const isTransactionsSectionLoading = isTxnsLoading
  const isPayoutsSectionLoading = isPayoutsLoading
  const availableBalance = summary?.availableBalance ?? 0
  const hasPendingPayout = (payoutsList ?? []).some(
    (p: any) => p.status === 'pending',
  )
  const disablePayoutRequest =
    requestPayoutMutation.isPending || availableBalance <= 0 || hasPendingPayout

  return (
    <div className="space-y-6 pb-20">
      <AppHeader>
        <AppHeaderContent title="Balance & Payouts">
          <AppHeaderDescription>
            Ledger-based balances and payout lifecycle from immutable
            transactions
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-3">
        <BalanceCard
          title="Available Balance"
          value={summary?.availableBalance ?? 0}
          description="Ledger Available (withdrawable now)"
          isLoading={isLoading}
          highlight
        />
        <BalanceCard
          title="Pending Balance"
          value={summary?.pendingBalance ?? 0}
          description={`Ledger Pending (${summary?.holdPeriodDays ?? 7}-day hold)`}
          isLoading={isLoading}
        />
        <BalanceCard
          title="Total Earnings"
          value={summary?.totalEarnings ?? 0}
          description="All time (net of fees)"
          isLoading={isLoading}
        />
      </div>

      {/* Payout Action */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6">
          <div className="space-y-1">
            <h3 className="font-semibold">Request Payout</h3>
            <p className="text-sm text-muted-foreground">
              Available = funds ready to withdraw. Pending = funds still in hold
              ({summary?.holdPeriodDays ?? 7} days).
            </p>
            {hasPendingPayout && (
              <p className="text-xs text-muted-foreground mt-1">
                You already have a pending payout request. Only one pending
                payout is allowed.
              </p>
            )}
          </div>
          <Button
            onClick={() => {
              if (
                confirm(`Request payout of ${formatPrice(availableBalance)}?`)
              ) {
                requestPayoutMutation.mutate()
              }
            }}
            disabled={disablePayoutRequest}
            className="shrink-0"
          >
            {requestPayoutMutation.isPending
              ? 'Requesting...'
              : hasPendingPayout
                ? 'Pending payout in progress'
                : `Withdraw ${formatPrice(availableBalance)}`}
          </Button>
        </CardContent>
      </Card>

      {/* Payouts Section */}
      {(isPayoutsSectionLoading || (payoutsList ?? []).length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            {isPayoutsSectionLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-5 w-5 text-muted-foreground" />
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isTransactionsSectionLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-5 w-5 text-muted-foreground" />
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
  description,
  isLoading,
  highlight,
  negative,
}: {
  title: string
  value: number
  description: string
  isLoading?: boolean
  highlight?: boolean
  negative?: boolean
}) {
  return (
    <Card className={highlight ? 'border-primary/20 bg-primary/[0.02]' : ''}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : (
          <>
            <div
              className={`text-2xl font-mono ${negative && value > 0 ? 'text-red-500' : ''} ${highlight ? 'text-primary' : ''}`}
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
          {formatPrice(
            Math.abs((txn.amount ?? 0) - (txn.platformFeeAmount ?? 0)),
          )}
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
