import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/products')({
  component: ProductAdminLayout,
})

function ProductAdminLayout() {
  return <Outlet />
}
