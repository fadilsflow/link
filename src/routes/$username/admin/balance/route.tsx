import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/admin/balance')({
  component: () => <BalanceLayout />,
})

function BalanceLayout() {
  return (
    <div className="p-6">
      <Outlet />
    </div>
  )
}
