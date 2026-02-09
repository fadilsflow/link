import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarIcon, TrendingUp } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
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

  const handlePreset = (days: number) => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
    from.setHours(0, 0, 0, 0)
    setDateRange({ from, to: now })
  }

  const isLoading = isSessionPending || isLoadingOverview
  const chartData = overview?.chart ?? []
  const rangeRevenue = overview?.range.revenue ?? 0
  const rangeSales = overview?.range.sales ?? 0

  return (
    <div className="space-y-6">
      <AppHeader>
        <AppHeaderContent title="Analytics">
          <AppHeaderDescription>
            Performance overview for your profile
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      {/* Date Range Picker */}
      <div className="flex flex-wrap items-center gap-2">
        {RANGE_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => handlePreset(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Key Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue"
          value={formatPrice(rangeRevenue)}
          description="Selected period"
          isLoading={isLoading}
        />
        <StatCard
          title="Sales"
          value={rangeSales}
          description="Selected period"
          isLoading={isLoading}
        />
        <StatCard
          title="Views"
          value={overview?.totals.totalViews ?? 0}
          description="All time"
          isLoading={isLoading}
        />
        <StatCard
          title="Clicks"
          value={overview?.totals.totalClicks ?? 0}
          description="All time"
          isLoading={isLoading}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={chartData} isLoading={isLoading} />
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  isLoading,
}: {
  title: string
  value: string | number
  description: string
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
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
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
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue Trend
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
          <CardTitle className="text-base">Revenue Trend</CardTitle>
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
          Revenue Trend
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
          <span className="font-medium">Total:</span>
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
