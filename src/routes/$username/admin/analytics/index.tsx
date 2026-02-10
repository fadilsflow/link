import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarIcon, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

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
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
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

  const previousPeriod = React.useMemo(() => {
    if (!dateRange.from || !dateRange.to) return null

    const end = new Date(dateRange.to)
    end.setHours(0, 0, 0, 0)

    const start = new Date(dateRange.from)
    start.setHours(0, 0, 0, 0)

    const dayCount = Math.max(
      1,
      Math.floor((end.getTime() - start.getTime()) / 86400000) + 1,
    )

    const prevTo = new Date(start)
    prevTo.setDate(prevTo.getDate() - 1)
    const prevFrom = new Date(prevTo)
    prevFrom.setDate(prevFrom.getDate() - (dayCount - 1))

    return {
      from: prevFrom.toISOString().slice(0, 10),
      to: prevTo.toISOString().slice(0, 10),
    }
  }, [dateRange.from, dateRange.to])

  const { data: previousOverview, isLoading: isLoadingPrevious } = useQuery({
    queryKey: [
      'analytics',
      'overview',
      'previous',
      session?.user?.id,
      previousPeriod?.from,
      previousPeriod?.to,
    ],
    queryFn: async () => {
      if (!session?.user?.id || !previousPeriod) return null
      return await trpcClient.analytics.getOverview.query({
        userId: session.user.id,
        from: previousPeriod.from,
        to: previousPeriod.to,
      })
    },
    enabled: !!session?.user?.id && !!previousPeriod,
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

  const clickRate = rangeViews > 0 ? (rangeClicks / rangeViews) * 100 : 0
  const conversionRate = rangeClicks > 0 ? (rangeSales / rangeClicks) * 100 : 0
  const avgOrderValue = rangeSales > 0 ? rangeRevenue / rangeSales : 0

  const previousRevenue = previousOverview?.range.revenue ?? 0
  const previousSales = previousOverview?.range.sales ?? 0
  const previousClicks = previousOverview?.range.clicks ?? 0
  const previousViews = previousOverview?.range.views ?? 0

  const previousConversionRate =
    previousClicks > 0 ? (previousSales / previousClicks) * 100 : 0
  const previousClickRate =
    previousViews > 0 ? (previousClicks / previousViews) * 100 : 0

  return (
    <div className="space-y-6">
      <AppHeader>
        <AppHeaderContent title="Analytics">
          <AppHeaderDescription>
            Focused performance view: revenue, conversion, and traffic quality.
          </AppHeaderDescription>
        </AppHeaderContent>
        <AppHeaderActions>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Net Revenue"
          value={formatPrice(rangeRevenue)}
          delta={percentDelta(rangeRevenue, previousRevenue)}
          isLoading={isLoading || isLoadingPrevious}
        />
        <StatCard
          title="Sales"
          value={rangeSales}
          delta={percentDelta(rangeSales, previousSales)}
          isLoading={isLoading || isLoadingPrevious}
        />
        <StatCard
          title="Click → Sale"
          value={`${conversionRate.toFixed(1)}%`}
          delta={percentDelta(conversionRate, previousConversionRate)}
          isLoading={isLoading || isLoadingPrevious}
        />
        <StatCard
          title="Avg Order Value"
          value={formatPrice(avgOrderValue)}
          isLoading={isLoading}
        />
      </div>

      <RevenueChart data={chartData} isLoading={isLoading} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Traffic quality snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InsightItem
            label="Profile view → click rate"
            value={`${clickRate.toFixed(1)}%`}
            detail={`${rangeClicks.toLocaleString()} clicks from ${rangeViews.toLocaleString()} views`}
            delta={percentDelta(clickRate, previousClickRate)}
            isLoading={isLoading || isLoadingPrevious}
          />
          <InsightItem
            label="Revenue per click"
            value={formatPrice(
              rangeClicks > 0 ? rangeRevenue / rangeClicks : 0,
            )}
            detail="How much each click is worth"
            isLoading={isLoading}
          />
          <InsightItem
            label="Sales velocity"
            value={`${rangeSales.toLocaleString()}`}
            detail="Completed purchases in selected period"
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  delta,
  isLoading,
}: {
  title: string
  value: string | number
  delta?: number | null
  isLoading?: boolean
}) {
  return (
    <Card className="relative overflow-hidden min-h-28">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {typeof delta === 'number' && (
              <DeltaBadge value={delta} className="mt-2" />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function InsightItem({
  label,
  value,
  detail,
  delta,
  isLoading,
}: {
  label: string
  value: string
  detail: string
  delta?: number | null
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-40" />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-xl font-semibold">{value}</div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">{detail}</p>
        {typeof delta === 'number' && <DeltaBadge value={delta} />}
      </div>
    </div>
  )
}

function DeltaBadge({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const rounded = Number.isFinite(value) ? value : 0
  const positive = rounded > 0
  const label = `${positive ? '+' : ''}${rounded.toFixed(1)}% vs previous`

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px]',
        positive
          ? 'border-emerald-500/30 text-emerald-700 bg-emerald-50/50'
          : 'border-amber-500/30 text-amber-700 bg-amber-50/50',
        className,
      )}
    >
      {label}
    </Badge>
  )
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

const chartConfig = {
  revenue: {
    label: 'Net Revenue',
    color: 'hsl(var(--chart-1))',
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
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Net Revenue Trend
          </CardTitle>
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
          <CardTitle className="text-base">Net Revenue Trend</CardTitle>
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
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Net Revenue Trend
        </CardTitle>
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
                  formatter={(value) => (
                    <div className="flex min-w-[120px] items-center text-xs text-muted-foreground">
                      Revenue
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        {formatPrice(value as number)}
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
          <span className="font-bold">{formatPrice(totalRevenue)}</span>
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
