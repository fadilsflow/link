import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { CalendarIcon, InfoIcon } from 'lucide-react'
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
  AppHeaderContent,
} from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { authClient } from '@/lib/auth-client'
import { ShareProfileModal } from '@/components/share-profile-modal'
import { BASE_URL } from '@/lib/constans'
import { cn, formatPrice } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from '@/components/ui/frame'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/admin/')({
  component: HomePage,
})

type DateRange = { from: Date | undefined; to: Date | undefined }
type AnalyzeMode = 'activity' | 'revenue'
type OverviewChartPoint = {
  date: string
  sales: number
  revenue: number
  views: number
  clicks: number
}

const RANGE_PRESETS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
] as const

const ANALYTICS_OPTIONS: Array<{ value: AnalyzeMode; label: string }> = [
  { value: 'activity', label: 'Activity' },
  { value: 'revenue', label: 'Net Revenue' },
]

const PUBLIC_BASE_HOST = new URL(BASE_URL).host

function HomePage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const username =
    (session?.user as { username?: string | null } | undefined)?.username ?? ''
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const [mode, setMode] = React.useState<AnalyzeMode>('activity')
  const [dateRange, setDateRange] = React.useState<DateRange>({
    from: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    to: today,
  })
  const [activePreset, setActivePreset] = React.useState<string | null>('30D')

  const fromStr = dateRange.from?.toISOString().slice(0, 10)
  const toStr = dateRange.to?.toISOString().slice(0, 10)

  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['analytics', 'overview', session?.user.id, mode, fromStr, toStr],
    queryFn: async () => {
      if (!session?.user.id) return null
      return trpcClient.analytics.getOverview.query({
        from: fromStr,
        to: toStr,
        mode,
      })
    },
    enabled: !!session?.user.id,
  })

  const { data: balance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['balance', session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return null
      return trpcClient.balance.getSummary.query()
    },
    enabled: !!session?.user.id,
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
  const chartData = (overview?.chart ?? []) as Array<OverviewChartPoint>
  const rangeRevenue = overview?.range.revenue ?? 0
  const rangeSales = overview?.range.sales ?? 0
  const rangeViews = overview?.range.views ?? 0
  const rangeClicks = overview?.range.clicks ?? 0
  const ctr = rangeViews > 0 ? ((rangeClicks / rangeViews) * 100).toFixed(1) : '0'
  const userName = session?.user.name ?? 'Creator'
  const userInitial = userName.slice(0, 1).toUpperCase() || 'C'

  return (
    <>
      <AppHeader className="px-6 pt-6" showSeparator>
        <AppHeaderContent title="Home">
        </AppHeaderContent>
      </AppHeader>
      <div className="p-6 space-y-6">
        <Alert className="border-none bg-muted">
          <InfoIcon />
          <AlertTitle>Payment processing is not yet available</AlertTitle>
          <AlertDescription>
            Complete all steps below to start accepting payments from customers.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2">
          <Frame>
            <FrameHeader>
              <FrameTitle>Account</FrameTitle>
            </FrameHeader>
            <FramePanel className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-md border-2 border-background ring-2 ring-primary/10">
                  <AvatarImage src={session?.user.image || ''} />
                  <AvatarFallback className="bg-primary/5 text-lg text-primary">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold tracking-tight">{userName}</h3>
                  {username ? (
                    <a
                      href={`/${username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex w-fit items-center text-sm text-muted-foreground underline"
                    >
                      <span className="font-medium">
                        {PUBLIC_BASE_HOST}/{username}
                      </span>
                    </a>
                  ) : null}
                </div>
              </div>
              <ShareProfileModal url={username ? `${BASE_URL}/${username}` : BASE_URL}>
                <Button size="lg" variant="outline">
                  Share
                </Button>
              </ShareProfileModal>
            </FramePanel>
          </Frame>

          <Frame>
            <FrameHeader>
              <FrameTitle>Earnings</FrameTitle>
            </FrameHeader>
            <FramePanel className="flex items-center justify-between gap-4">
              <span className="h-full text-4xl tracking-tight">
                {isLoadingBalance ? (
                  <Spinner className="h-5 w-5 text-muted-foreground" />
                ) : (
                  formatPrice(balance?.currentBalance ?? 0)
                )}
              </span>
              <Button size="lg" variant="outline" render={<Link to="/admin/balance" />}>
                Payout
              </Button>
            </FramePanel>
          </Frame>
        </div>

        <AnalyticsCard
          mode={mode}
          onModeChange={setMode}
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            setDateRange(range)
            setActivePreset(null)
          }}
          activePreset={activePreset}
          onPresetSelect={handlePreset}
          chartData={chartData}
          rangeRevenue={rangeRevenue}
          rangeSales={rangeSales}
          rangeViews={rangeViews}
          rangeClicks={rangeClicks}
          ctr={ctr}
          isLoading={isLoading}
        />
      </div>
    </>
  )
}

function AnalyticsCard({
  mode,
  onModeChange,
  dateRange,
  onDateRangeChange,
  activePreset,
  onPresetSelect,
  chartData,
  rangeRevenue,
  rangeSales,
  rangeViews,
  rangeClicks,
  ctr,
  isLoading,
}: {
  mode: AnalyzeMode
  onModeChange: (mode: AnalyzeMode) => void
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  activePreset: string | null
  onPresetSelect: (days: number, label: string) => void
  chartData: Array<OverviewChartPoint>
  rangeRevenue: number
  rangeSales: number
  rangeViews: number
  rangeClicks: number
  ctr: string
  isLoading?: boolean
}) {
  const summaryByMode: Record<AnalyzeMode, React.ReactNode> = {
    activity: (
      <div className="grid grid-cols-2 gap-16">

        {/* Views */}
        <div className="flex flex-col items-center">
          <span className="text-3xl font-">
            {rangeViews}
          </span>

          <div className="flex items-center gap-3 mt-4">
            <div className="w-3 h-3 rounded-xs bg-yellow-300"></div>
            <div className="text-sm font-medium">
              Views
            </div>
          </div>
        </div>

        {/* Clicks */}
        <div className="flex flex-col items-center">
          <span className="text-3xl font-">
            {rangeClicks}
          </span>

          <div className="flex items-center gap-3 mt-4">
            <div className="w-3 h-3 rounded-xs bg-emerald-300"></div>
            <span className="text-sm font-medium">
              Clicks
            </span>
          </div>
        </div>

      </div>
    ),
    revenue: (
      <>
        <span className="text-3xl font-">{formatPrice(rangeRevenue)}</span>
      </>
    ),
  }

  const chartByMode: Record<AnalyzeMode, React.ReactNode> = {
    activity: (
      <ChartContainer
        config={{
          views: { label: 'Views', color: 'var(--chart-4)' },
          clicks: { label: 'Clicks', color: 'var(--chart-2)' },
        }}
        className="h-[320px] w-full"
      >
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--edge)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            interval={0}
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return (
                date.toLocaleDateString('en-US', { day: 'numeric' }) +
                '\n' +
                date.toLocaleDateString('en-US', { month: 'short' })
              )
            }}
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
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
            }
          />
          <Bar dataKey="views" fill="var(--color-views)" radius={[4, 4, 4, 4]} barSize={8} />
          <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[4, 4, 4, 4]} barSize={8} />
        </BarChart>
      </ChartContainer>
    ),
    revenue: (
      <ChartContainer
        config={{
          revenue: { label: 'Net Revenue', color: 'hsl(var(--chart-1))' },
        }}
        className="h-[320px] w-full"
      >
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
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
            tickFormatter={(value) => formatPrice(value as number)}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value) =>
                  new Date(value).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
                formatter={(value) => (
                  <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    {formatPrice(value as number)}
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
    ),
  }

  return (
    <Frame className="overflow-hidden">
      <FrameHeader className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select
            value={mode}
            onValueChange={(value) => onModeChange(value as AnalyzeMode)}
          >
            <FrameTitle >
              <SelectTrigger className="capitalize w-[80px] border-transparent bg-muted/72 shadow-none hover:bg-zinc-200 before:hidden">
                <SelectValue />
              </SelectTrigger>
            </FrameTitle>
            <SelectContent>
              {ANALYTICS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-wrap items-center gap-2">
            {RANGE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={activePreset === preset.label ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 text-xs font-medium"
                onClick={() => onPresetSelect(preset.days, preset.label)}
              >
                {preset.label}
              </Button>
            ))}
            <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 ml-3">
          {summaryByMode[mode]}
        </div>
      </FrameHeader>

      <FramePanel>
        {isLoading ? (
          <div className="flex h-[320px] items-center justify-center">
            <Spinner className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-muted-foreground">
            No data for this period
          </div>
        ) : (
          chartByMode[mode]
        )}
      </FramePanel>
    </Frame>
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
              'h-8 justify-start text-left text-xs font-normal',
              !value.from && 'text-muted-foreground',
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
        {formatDateRange()}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
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
