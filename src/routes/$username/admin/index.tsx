import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { CalendarIcon, MousePointerClick, Package } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  AppHeader,
  AppHeaderActions,
  AppHeaderContent,
} from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export const Route = createFileRoute('/$username/admin/')({
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

  // Calculate specific metrics
  const rangeViews = overview?.range.views ?? 0
  const rangeClicks = overview?.range.clicks ?? 0
  const blocks = overview?.blocks ?? []
  const topBlocks = blocks.slice(0, 5)
  const topProducts = (productAnalytics ?? []).slice(0, 5)

  // New Data Fetching for Dashboard Cards
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

  return (
    <div className="space-y-6 p-6">
      <AppHeader>
        <AppHeaderContent title="Home"></AppHeaderContent>
        <AppHeaderActions></AppHeaderActions>
      </AppHeader>

      {/* Profile and Earnings Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 ">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="rounded-md h-14 w-14 border-2 border-background ring-2 ring-primary/10 transition-transform group-hover:scale-105">
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className="bg-primary/5 text-primary text-lg">
                    {session?.user?.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold tracking-tight truncate">
                    {session?.user?.name || 'Creator'}
                  </h3>
                  <a
                    href={`/${username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary flex items-center text-sm hover:text-primary transition-colors mt-0.5 group/link w-fit"
                  >
                    <span className="font-medium underline-offset-4 group-hover/link:underline">
                      {PUBLIC_BASE_HOST}/{username}
                    </span>
                  </a>
                </div>
              </div>
              <ShareProfileModal url={`${BASE_URL}/${username}`}>
                <Button size="lg" variant={'outline'}>
                  Share
                </Button>
              </ShareProfileModal>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
          </CardHeader>

          <CardContent className="flex items-center justify-between h-full">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-mono tracking-tight">
                {isLoadingBalance ? (
                  <Spinner className="h-5 w-5 text-muted-foreground" />
                ) : (
                  formatPrice(balance?.currentBalance ?? 0)
                )}
              </span>
            </div>
            <Button
              size="lg"
              render={
                <Link to={`/$username/admin/balance`} params={{ username }} />
              }
            >
              Payout
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="justify-end flex">
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
      </div>

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
        <CardTitle className="text-base font-medium">
          Total Views & Clicks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Spinner className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-3 w-3 rounded-full bg-(--color-chart-4)" />
                  Views
                </div>
                <div className="text-3xl font-bold">{views}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-3 w-3 rounded-full bg-(--color-chart-2)" />
                  Clicks
                </div>
                <div className="text-3xl font-bold">{clicks}</div>
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
        <CardTitle className="text-base flex items-center gap-2">
          <MousePointerClick className="h-4 w-4" />
          Top Blocks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-5 w-5 text-muted-foreground" />
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
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          Top Products (Cached)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Uses cached counters for ranking. Ledger-based balances are
          authoritative in Balance page.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-5 w-5 text-muted-foreground" />
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
