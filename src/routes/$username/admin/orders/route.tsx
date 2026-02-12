import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/admin/orders')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  )
}
