import { createFileRoute } from '@tanstack/react-router'
import {
  AppHeader,
  AppHeaderContent,
} from '@/components/app-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/admin/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="px-6 py-20">
      <div className="space-y-6 max-w-2xl mx-auto">
        <AppHeader>
          <AppHeaderContent title="Settings"></AppHeaderContent>
        </AppHeader>

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
