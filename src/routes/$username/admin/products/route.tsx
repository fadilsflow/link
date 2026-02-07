import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/admin/products')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  )
}
