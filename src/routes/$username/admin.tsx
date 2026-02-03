import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/admin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/$username/admin"!</div>
}
