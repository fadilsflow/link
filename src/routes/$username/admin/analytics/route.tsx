import { createFileRoute } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/admin/analytics')({
  component: AnalyticsLayout,
})

function AnalyticsLayout() {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  )
}
