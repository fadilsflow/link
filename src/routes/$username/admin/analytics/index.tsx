import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Package } from 'lucide-react'

import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { authClient } from '@/lib/auth-client'
import { cn, formatPrice } from '@/lib/utils'

export const Route = createFileRoute('/$username/admin/analytics/')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { data: session } = authClient.useSession()

  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const [from, setFrom] = useState(thirtyDaysAgo)
  const [to, setTo] = useState(today)

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['analytics', 'overview', session.user.id, from, to],
    queryFn: async () => {
      if (!session.user.id) return null
      return await trpcClient.analytics.getOverview.query({
        userId: session.user.id,
        from,
        to,
      })
    },
    enabled: !!session.user.id,
  })

  const { data: productAnalytics, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['analytics', 'products', session.user.id],
    queryFn: async () => {
      if (!session.user.id) return []
      return await trpcClient.analytics.getProductAnalytics.query({
        userId: session.user.id,
      })
    },
    enabled: !!session.user.id,
  })

  const isLoading = isLoadingOverview || isLoadingProducts

  if (!session.user.id || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    )
  }

  const totalProducts = productAnalytics?.length ?? 0
  const activeProducts = productAnalytics?.filter((p) => p.isActive).length ?? 0
  const avgOrderValue =
    overview?.totals.totalSalesCount && overview.totals.totalSalesCount > 0
      ? Math.round(
          overview.totals.totalRevenue / overview.totals.totalSalesCount,
        )
      : 0

  return (
    <div className="space-y-6">
      <AppHeader>
        <AppHeaderContent title="Analytics">
          <AppHeaderDescription>
            Track sales, views, and clicks performance
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base">Date Range Filter</CardTitle>
          <CardDescription className="text-xs">
            Filter chart and period totals by date
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">From</p>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500">To</p>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={formatPrice(overview?.totals.totalRevenue ?? 0)} sub="Lifetime earnings" />
        <StatCard title="Total Sales" value={overview?.totals.totalSalesCount ?? 0} sub="Successful checkouts" />
        <StatCard title="Total Views" value={overview?.totals.totalViews ?? 0} sub="Profile page views" />
        <StatCard title="Total Clicks" value={overview?.totals.totalClicks ?? 0} sub="All block clicks" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Clicks / Block" value={(overview?.totals.clicksPerBlock ?? 0).toFixed(2)} sub={`${overview?.totals.totalBlocks ?? 0} blocks`} />
        <StatCard title="Avg Order Value" value={formatPrice(avgOrderValue)} sub="Per transaction" />
        <StatCard title="Range Revenue" value={formatPrice(overview?.range.revenue ?? 0)} sub="For selected dates" />
        <StatCard title="Range Sales" value={overview?.range.sales ?? 0} sub="For selected dates" />
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold">Sales & Revenue Trend</CardTitle>
          <CardDescription className="text-xs">
            Shadcn-style chart card for selected date range
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <SimpleBarChart data={overview?.chart ?? []} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold">Block Click Performance</CardTitle>
          <CardDescription className="text-xs">
            Total clicks by block
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10">Block</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10 text-right">Type</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10 text-right">Clicks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(overview?.blocks ?? []).map((block) => (
                <TableRow key={block.id} className="group border-slate-100 hover:bg-slate-50/50">
                  <TableCell className="py-3">
                    <p className="font-medium text-slate-900 truncate max-w-[240px]">{block.title}</p>
                  </TableCell>
                  <TableCell className="py-3 text-right text-slate-600">{block.type}</TableCell>
                  <TableCell className="py-3 text-right font-semibold text-slate-900">{block.clicks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold">Product Performance</CardTitle>
          <CardDescription className="text-xs">Revenue and sales breakdown by product</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10">Product</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10 text-right">Sales</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10 text-right">Revenue</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productAnalytics && productAnalytics.length > 0 ? (
                productAnalytics.map((product) => (
                  <TableRow key={product.id} className="group border-slate-100 hover:bg-slate-50/50">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <p className="font-medium text-slate-900 truncate max-w-[200px]">{product.title}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right font-medium text-slate-700">{product.salesCount}</TableCell>
                    <TableCell className="py-3 text-right font-semibold text-slate-900">{formatPrice(product.totalRevenue)}</TableCell>
                    <TableCell className="py-3 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] h-5 px-1.5 font-normal',
                          product.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200',
                        )}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-slate-300" />
                      <p>No products yet</p>
                      <p className="text-xs text-slate-400">Create a product to start tracking analytics</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">{activeProducts} of {totalProducts} products are active.</p>
    </div>
  )
}

function StatCard({ title, value, sub }: { title: string; value: string | number; sub: string }) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}

function SimpleBarChart({ data }: { data: Array<{ date: string; sales: number; revenue: number }> }) {
  const maxRevenue = useMemo(
    () => data.reduce((max, item) => Math.max(max, item.revenue), 0),
    [data],
  )

  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No order data for this date range.</p>
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.date} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{item.date}</span>
            <span>{item.sales} sales</span>
          </div>
          <div className="h-2 rounded bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-slate-900"
              style={{ width: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
