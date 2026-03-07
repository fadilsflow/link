import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/balance')({
  component: () => <BalanceLayout />,
})

function BalanceLayout() {
  return (
    <div className="p-4 md:p-10 mb-20 md:mb-0">
      <Outlet />
    </div>
  )
}
