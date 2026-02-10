import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  CalendarIcon,
  Package,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'

import {
  AppHeader,
  AppHeaderActions,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { authClient } from '@/lib/auth-client'
import { cn, formatPrice } from '@/lib/utils'

export const Route = createFileRoute('/$username/admin/analytics/')({
  component: AnalyticsPage,
})

type DateRange = { from: Date | undefined; to: Date | undefined }

const RANGE_PRESETS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
] as const

function AnalyticsPage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    to: today,
  })
  const [activePreset, setActivePreset] = React.useState<string | null>('30D')

  const fromStr = dateRange.from?.toISOString().slice(0, 10)
  const toStr = dateRange.to?.toISOString().slice(0, 10)

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['analytics', 'overview', session?.user?.id, fromStr, toStr],
    queryFn: async () => {
      if (!session?.user?.id) return null
      return await trpcClient.analytics.getOverview.query({
        userId: session.user.id,
        from: fromStr,
        to: toStr,
      })
    },
    enabled: !!session?.user?.id,
  })

  const { data: productAnalytics, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['analytics', 'products', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      return await trpcClient.analytics.getProductAnalytics.query({
        userId: session.user.id,
      })
    },
    enabled: !!session?.user?.id,
  })

  const handlePreset = (days: number, label: string) => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
    from.setHours(0, 0, 0, 0)
    setDateRange({ from, to: now })
    setActivePreset(label)
  }

  const isLoading = isSessionPending || isLoadingOverview
  const chartData = overview?.chart ?? []
  const rangeRevenue = overview?.range.revenue ?? 0
  const rangeSales = overview?.range.sales ?? 0
  const rangeViews = overview?.range.views ?? 0
  const rangeClicks = overview?.range.clicks ?? 0
  const ctr =
    rangeViews > 0 ? ((rangeClicks / rangeViews) * 100).toFixed(1) : '0'
  const blocks = overview?.blocks ?? []
  const topBlocks = blocks.slice(0, 5)
  const topProducts = (productAnalytics ?? []).slice(0, 5)

  return (
    <div className="space-y-6">
      <AppHeader>
        <AppHeaderContent title="Analytics">
          <AppHeaderDescription>
            Net metrics are near-real-time. Product ranking cards below use
            cached counters.
          </AppHeaderDescription>
        </AppHeaderContent>
        <AppHeaderActions>
          {/* Date Range Picker */}
          <div className="flex flex-wrap items-center gap-2">
            {RANGE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={activePreset === preset.label ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 text-xs font-medium"
                onClick={() => handlePreset(preset.days, preset.label)}
              >
                {preset.label}
              </Button>
            ))}
            <DateRangePicker
              value={dateRange}
              onChange={(range) => {
                setDateRange(range)
                setActivePreset(null)
              }}
            />
          </div>
        </AppHeaderActions>
      </AppHeader>

      {/* Key Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Net Revenue"
          value={formatPrice(rangeRevenue)}
          isLoading={isLoading}
        />
        <StatCard title="Sales" value={rangeSales} isLoading={isLoading} />
        <StatCard title="CTR" value={`${ctr}%`} isLoading={isLoading} />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={chartData} isLoading={isLoading} />

      {/* Engagement Chart */}
      <EngagementCard
        views={rangeViews}
        clicks={rangeClicks}
        data={chartData}
        isLoading={isLoading}
      />

      {/* Two Column Layout for Top Blocks and Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopBlocksCard blocks={topBlocks} isLoading={isLoading} />
        <TopProductsCard
          products={topProducts}
          isLoading={isLoadingProducts || isSessionPending}
        />
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  isLoading,
}: {
  title: string
  value: string | number
  isLoading?: boolean
}) {
  return (
    <Card className="relative overflow-hidden min-h-28">
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-mono">{value}</div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function EngagementCard({
  views,
  clicks,
  data,
  isLoading,
}: {
  views: number
  clicks: number
  data: Array<{
    date: string
    views?: number
    clicks?: number
  }>
  isLoading?: boolean
}) {
  return (
    <Card className="relative overflow-hidden min-h-28">
      <CardHeader className="pb-2">
        <CardTitle>Total Views & Clicks</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex gap-8">
              <Skeleton className="h-12 w-20" />
              <Skeleton className="h-12 w-20" />
            </div>
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-3 w-3 rounded-full bg-(--color-chart-4)" />
                  Views
                </div>
                <div className="text-3xl font-mono">{views}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-3 w-3 rounded-full bg-(--color-chart-2)" />
                  Clicks
                </div>
                <div className="text-3xl font-mono">{clicks}</div>
              </div>
            </div>

            <div className="h-[300px] w-full mt-4">
              <ChartContainer
                config={{
                  views: {
                    label: 'Views',
                    color: 'var(--chart-4)',
                  },
                  clicks: {
                    label: 'Clicks',
                    color: 'var(--chart-2)',
                  },
                }}
                className="h-full w-full"
              >
                <BarChart data={data}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="var(--edge)"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return (
                        date.toLocaleDateString('en-US', {
                          day: 'numeric',
                        }) +
                        '\n' +
                        date.toLocaleDateString('en-US', {
                          month: 'short',
                        })
                      )
                    }}
                    interval={0}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    allowDecimals={false}
                    style={{ fontSize: '12px' }}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--muted)' }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        }}
                      />
                    }
                  />
                  <Bar
                    dataKey="views"
                    fill="var(--color-views)"
                    radius={[4, 4, 4, 4]}
                    barSize={8}
                  />
                  <Bar
                    dataKey="clicks"
                    fill="var(--color-clicks)"
                    radius={[4, 4, 4, 4]}
                    barSize={8}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TopBlocksCard({
  blocks,
  isLoading,
}: {
  blocks: Array<{
    id: string
    title: string
    type: string
    clicks: number
    isEnabled: boolean
  }>
  isLoading?: boolean
}) {
  const maxClicks = Math.max(...blocks.map((b) => b.clicks), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Blocks</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No block data yet
          </p>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <div key={block.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {block.title || 'Untitled'}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {block.clicks} clicks
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(block.clicks / maxClicks) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TopProductsCard({
  products,
  isLoading,
}: {
  products: Array<{
    id: string
    title: string
    image: string | null
    salesCount: number
    totalRevenue: number
    isActive: boolean
  }>
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products (Cached)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Uses cached counters for ranking. Ledger-based balances are
          authoritative in Balance page.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No products yet
          </p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-3">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {product.title}
                    </p>
                    {!product.isActive && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{product.salesCount} sales</span>
                    <span>•</span>
                    <span>{formatPrice(product.totalRevenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const chartConfig = {
  revenue: {
    label: 'Net Revenue',
    color: 'hsl(var(--chart-1))',
  },
  sales: {
    label: 'Sales',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

function RevenueChart({
  data,
  isLoading,
}: {
  data: Array<{ date: string; sales: number; revenue: number }>
  isLoading?: boolean
}) {
  const totalRevenue = React.useMemo(
    () => data.reduce((acc, item) => acc + item.revenue, 0),
    [data],
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Net Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col gap-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Net Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
          No data for this period
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }}
                  formatter={(value, name) => (
                    <div className="flex min-w-[120px] items-center text-xs text-muted-foreground">
                      {name === 'revenue' ? 'Revenue' : 'Sales'}
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {name === 'revenue'
                          ? formatPrice(value as number)
                          : value}
                      </div>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="font-medium">Period net total:</span>
          <span className="font-monon">{formatPrice(totalRevenue)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (range: DateRange) => void
}) {
  const [open, setOpen] = React.useState(false)

  const formatDateRange = () => {
    if (!value.from) return 'Pick a date range'
    if (!value.to) {
      return value.from.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    }
    return `${value.from.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} - ${value.to.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 justify-start text-left font-normal text-xs',
              !value.from && 'text-muted-foreground',
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
        {formatDateRange()}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value.from}
          selected={value}
          onSelect={(range) => {
            onChange({ from: range?.from, to: range?.to })
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}
