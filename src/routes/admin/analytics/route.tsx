import { Outlet, createFileRoute  } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/analytics')({
  component: AnalyticsLayout,
})

function AnalyticsLayout() {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  )
}
