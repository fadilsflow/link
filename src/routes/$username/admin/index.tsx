import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/$username/admin/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/$username/admin/analytics',
      params: { username: params.username },
    })
  },
  component: () => null,
})
