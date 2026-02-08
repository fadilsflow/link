import { createFileRoute } from '@tanstack/react-router'
import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import { ModeToggle } from '@/components/mode-toggle'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/$username/admin/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <AppHeader>
        <AppHeaderContent title="Settings">
          <AppHeaderDescription>
            Manage your account settings and preferences.
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the app looks on your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred theme.
              </p>
            </div>
            <ModeToggle />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
