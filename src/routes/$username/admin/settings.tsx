import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AppHeader,
  AppHeaderContent,
} from '@/components/app-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import {
  useDashboardThemePreference,
  useResolvedTheme,
} from '@/lib/theme'
import { ThemeOptionCards } from '@/components/dashboard/appearance/ThemeOptionCards'

type ThemeOption = 'system' | 'light' | 'dark'

export const Route = createFileRoute('/$username/admin/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { username } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', username],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  const [dashboardTheme, setDashboardTheme] = useDashboardThemePreference()
  const resolvedDashboardTheme = useResolvedTheme('dashboard', undefined, dashboardTheme)

  const updateTheme = useMutation({
    mutationFn: (publicTheme: ThemeOption) =>
      trpcClient.user.updateProfile.mutate({
        userId: user?.id ?? '',
        publicTheme,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard', username] }),
  })

  return (
    <div className="px-6 py-20">
      <div className="space-y-6 max-w-2xl mx-auto">
        <AppHeader>
          <AppHeaderContent title="Settings"></AppHeaderContent>
        </AppHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Public theme</Label>
              <ThemeOptionCards
                value={(user?.publicTheme as ThemeOption | undefined) || 'system'}
                onChange={(value) => {
                  if (!user || updateTheme.isPending) return
                  updateTheme.mutate(value)
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label>Dashboard theme</Label>
              <ThemeOptionCards
                value={dashboardTheme}
                onChange={(value) => {
                  setDashboardTheme(value)
                }}
              />
              <p className="text-sm text-muted-foreground">
                Dashboard resolved theme: {resolvedDashboardTheme}.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account & Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
              />
            </div>
            <Button variant="outline">Update Password</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email when you get new orders
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Order Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified for every new purchase
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Payout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payout Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Payout Method</Label>
              <Input defaultValue="Bank Transfer" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input id="account-name" placeholder="Name on account" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account-number">Account Number / Email</Label>
              <Input id="account-number" placeholder="Your account details" />
            </div>
            <Button>Save Payout Info</Button>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Make your profile public
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Sales Count</Label>
                <p className="text-sm text-muted-foreground">
                  Display total sales on profile
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Revenue</Label>
                <p className="text-sm text-muted-foreground">
                  Display total revenue on profile
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
