import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/superadmin/')({
  component: SuperAdminHomePage,
})

function SuperAdminHomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      
    </div>
  )
}