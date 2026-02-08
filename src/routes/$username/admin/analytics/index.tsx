import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  BarChart3,
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { authClient } from '@/lib/auth-client'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { formatPrice, cn } from '@/lib/utils'

export const Route = createFileRoute('/$username/admin/analytics/')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const { data: session } = authClient.useSession()

  const { data: profileAnalytics, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['analytics', 'profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      return await trpcClient.analytics.getProfileAnalytics.query({
        userId: session.user.id,
      })
    },
    enabled: !!session?.user?.id,
  })

  const { data: productAnalytics, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['analytics', 'products', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return []
      return await trpcClient.analytics.getProductAnalytics.query({
        userId: session.user.id,
      })
    },
    enabled: !!session?.user?.id,
  })

  const isLoading = isLoadingProfile || isLoadingProducts

  // Show loading spinner while session or initial data loads
  if (!session?.user?.id || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  // Calculate some derived stats
  const totalProducts = productAnalytics?.length ?? 0
  const activeProducts = productAnalytics?.filter((p) => p.isActive).length ?? 0
  const avgOrderValue =
    profileAnalytics?.totalSalesCount && profileAnalytics.totalSalesCount > 0
      ? Math.round(
          profileAnalytics.totalRevenue / profileAnalytics.totalSalesCount,
        )
      : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Track your sales performance and product metrics
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Revenue
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatPrice(profileAnalytics?.totalRevenue ?? 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Lifetime earnings</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
        </Card>

        {/* Total Sales Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Sales
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {profileAnalytics?.totalSalesCount ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Successful checkouts</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
        </Card>

        {/* Average Order Value Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Avg Order Value
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatPrice(avgOrderValue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Per transaction</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
        </Card>

        {/* Products Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Products
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Package className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalProducts}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeProducts} active
            </p>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
        </Card>
      </div>

      {/* Product Performance Table */}
      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-400" />
            <div>
              <CardTitle className="text-base font-semibold">
                Product Performance
              </CardTitle>
              <CardDescription className="text-xs">
                Revenue and sales breakdown by product
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10">
                  Product
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10 text-right">
                  Sales
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10 text-right">
                  Revenue
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase h-10 text-right">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productAnalytics && productAnalytics.length > 0 ? (
                productAnalytics.map((product) => (
                  <TableRow
                    key={product.id}
                    className="group border-slate-100 hover:bg-slate-50/50"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-[200px]">
                            {product.title}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="font-medium text-slate-700">
                        {product.salesCount}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="font-semibold text-slate-900">
                        {formatPrice(product.totalRevenue)}
                      </span>
                    </TableCell>
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
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-slate-300" />
                      <p>No products yet</p>
                      <p className="text-xs text-slate-400">
                        Create a product to start tracking analytics
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
