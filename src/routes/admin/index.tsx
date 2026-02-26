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
import type { ChartConfig } from '@/components/ui/chart'
import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
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
import { Frame, FrameHeader, FramePanel, FrameTitle } from '@/components/ui/frame'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const Route = createFileRoute('/admin/')({
  component: HomePage,
})

type DateRange = { from: Date | undefined; to: Date | undefined }

const RANGE_PRESETS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
] as const

const PUBLIC_BASE_HOST = new URL(BASE_URL).host

function HomePage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const username =
    (session?.user as { username?: string | null } | undefined)?.username ?? ''
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
    queryKey: ['analytics', 'overview', session?.user.id, fromStr, toStr],
    queryFn: async () => {
      if (!session?.user.id) return null
      return trpcClient.analytics.getOverview.query({
        from: fromStr,
        to: toStr,
      })
    },
    enabled: !!session?.user.id,
  })

  const { data: productAnalytics, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['analytics', 'products', session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) return null
      return trpcClient.analytics.getProductAnalytics.query()
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
  const chartData = overview?.chart ?? []
  const rangeRevenue = overview?.range.revenue ?? 0
  const rangeSales = overview?.range.sales ?? 0
  const rangeViews = overview?.range.views ?? 0
  const rangeClicks = overview?.range.clicks ?? 0
  const ctr = rangeViews > 0 ? ((rangeClicks / rangeViews) * 100).toFixed(1) : '0'
  const blocks = overview?.blocks ?? []
  const topBlocks = blocks.slice(0, 5)
  const topProducts = (productAnalytics ?? []).slice(0, 5)
  const userName = session?.user.name ?? 'Creator'
  const userInitial = userName.slice(0, 1).toUpperCase() || 'C'

  return (
    <div className="space-y-6 p-6">
      <AppHeader>
        <AppHeaderContent title="Home">
          <AppHeaderDescription>
            Net metrics are near-real-time. Product ranking cards below use
            cached counters.
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      <Alert className="bg-muted border-none">
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
                <AvatarFallback className="bg-primary/5 text-primary text-lg">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold tracking-tight">
                  {userName}
                </h3>
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
            <ShareProfileModal
              url={username ? `${BASE_URL}/${username}` : BASE_URL}
            >
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

      <div className="flex justify-end">
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
      </div>

      <EngagementCard
        views={rangeViews}
        clicks={rangeClicks}
        data={chartData}
        isLoading={isLoading}
      />

      <RevenueChart data={chartData} isLoading={isLoading} />

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
    <Frame className="min-h-28 overflow-hidden">
      <FrameHeader className="pb-2">
        <FrameTitle className="text-base font-medium">Activity</FrameTitle>
        <div className="mt-4 flex items-center gap-8">
          <div className="space-y-1">
            <div className="text-4xl font-sans font-semibold">
              {views}
              <span className="text-xs font-normal"> views</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-4xl font-sans font-semibold">
              {clicks}
              <span className="text-xs font-normal"> clicks</span>
            </div>
          </div>
        </div>
      </FrameHeader>
      <FramePanel>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Spinner className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-4 h-[300px] w-full">
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
        )}
      </FramePanel>
    </Frame>
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
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2 text-base">
          Top Blocks
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : blocks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No block data yet
          </p>
        ) : (
          <div className="space-y-3 h-[200px] overflow-auto no-scrollbar">
            {blocks.map((block, index) => (
              <div key={block.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-medium">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {block.title || 'Untitled'}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {block.clicks} clicks
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
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
      </FramePanel>
    </Frame>
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
    <Frame>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2 text-base">
          Top Products
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No products yet
          </p>
        ) : (
          <div className="space-y-3  h-[200px] overflow-auto no-scrollbar">
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{product.title}</p>
                    {!product.isActive && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
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
      </FramePanel>
    </Frame>
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
      <Frame>
        <FrameHeader>
          <FrameTitle>Net Revenue Trend</FrameTitle>
        </FrameHeader>
        <FramePanel className="flex h-[300px] items-center justify-center">
          <Spinner className="h-5 w-5 text-muted-foreground" />
        </FramePanel>
      </Frame>
    )
  }

  if (data.length === 0) {
    return (
      <Frame>
        <FrameHeader>
          <FrameTitle>Net Revenue Trend</FrameTitle>
        </FrameHeader>
        <FramePanel className="flex h-[200px] items-center justify-center text-muted-foreground">
          No data for this period
        </FramePanel>
      </Frame>
    )
  }

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Net Revenue</FrameTitle>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="font-mono text-5xl ">{formatPrice(totalRevenue)}</span>
        </div>
      </FrameHeader>
      <FramePanel>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                        {name === 'revenue' ? formatPrice(value as number) : value}
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
