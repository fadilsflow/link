import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/admin/balance')({
  component: () => <Outlet />,
})
