import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

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
import { Package } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

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
          <Spinner />
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
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatPrice(profileAnalytics?.totalRevenue ?? 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>

        {/* Total Sales Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {profileAnalytics?.totalSalesCount ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Successful checkouts</p>
          </CardContent>
        </Card>

        {/* Average Order Value Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatPrice(avgOrderValue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Per transaction</p>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="relative overflow-hidden border-0 shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {totalProducts}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeProducts} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Table */}
      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
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
