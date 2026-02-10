import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Wallet, ShoppingBag, BarChart3 } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  AppHeader,
  AppHeaderActions,
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

export const Route = createFileRoute('/$username/admin/')({
  component: HomePage,
})

type DateRange = { from: Date | undefined; to: Date | undefined }

const RANGE_PRESETS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
] as const

function HomePage() {
  const { username } = Route.useParams()
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

  const { data: balance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['balance', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      return await trpcClient.balance.getSummary.query({
        userId: session.user.id,
      })
    },
    enabled: !!session?.user?.id,
  })

  const isLoading = isSessionPending || isLoadingOverview
  const chartData = overview?.chart ?? []
  const revenue = overview?.range.revenue ?? 0
  const sales = overview?.range.sales ?? 0
  const clicks = overview?.range.clicks ?? 0
  const conversionRate = clicks > 0 ? (sales / clicks) * 100 : 0

  const handlePreset = (days: number, label: string) => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    const from = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
    from.setHours(0, 0, 0, 0)
    setDateRange({ from, to: now })
    setActivePreset(label)
  }

  return (
    <div className="space-y-6 p-6">
      <AppHeader>
        <AppHeaderContent title="Home">
          <AppHeaderDescription>
            Welcome back, {session?.user?.name || 'Creator'}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SimpleStatCard
          title="Net Revenue"
          value={formatPrice(revenue)}
          isLoading={isLoading}
        />
        <SimpleStatCard title="Sales" value={sales} isLoading={isLoading} />
        <SimpleStatCard
          title="Click → Sale"
          value={`${conversionRate.toFixed(1)}%`}
          isLoading={isLoading}
        />
      </div>

      <RevenueTrendCard data={chartData} isLoading={isLoading} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action center</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={<BarChart3 className="h-4 w-4" />}
            title="Detailed analytics"
            description="Compare periods and conversion quality."
            href={`/${username}/admin/analytics`}
          />
          <QuickAction
            icon={<Wallet className="h-4 w-4" />}
            title="Balance and payouts"
            description={`Available: ${formatPrice(balance?.availableBalance ?? 0)}`}
            href={`/${username}/admin/balance`}
            isLoading={isLoadingBalance}
          />
          <QuickAction
            icon={<ShoppingBag className="h-4 w-4" />}
            title="Orders"
            description="Handle refunds and customer delivery."
            href={`/${username}/admin/orders`}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function QuickAction({
  icon,
  title,
  description,
  href,
  isLoading,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  isLoading?: boolean
}) {
  return (
    <Link
      to={href}
      className="rounded-lg border p-4 transition-colors hover:bg-muted/40 flex items-start justify-between gap-3"
    >
      <div>
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </div>
        {isLoading ? (
          <Skeleton className="h-3 w-32 mt-2" />
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

function SimpleStatCard({
  title,
  value,
  isLoading,
}: {
  title: string
  value: string | number
  isLoading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
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
} satisfies ChartConfig

function RevenueTrendCard({
  data,
  isLoading,
}: {
  data: Array<{ date: string; revenue: number }>
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue trend</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-10 text-center">
          No revenue data for this period.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillRevenueHome" x1="0" y1="0" x2="0" y2="1">
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
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              }
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
                  formatter={(value) => (
                    <div className="flex min-w-[120px] items-center text-xs text-muted-foreground">
                      Revenue
                      <div className="ml-auto font-mono font-medium text-foreground">
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
              fill="url(#fillRevenueHome)"
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
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
