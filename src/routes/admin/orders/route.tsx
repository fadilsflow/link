import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/orders')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-4 md:p-10 pb-20 pd:mb-0">
      <Outlet />
    </div>
  )
}
