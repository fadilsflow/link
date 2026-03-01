import { createAuthClient } from 'better-auth/react'

const baseURL =
  import.meta.env.VITE_BETTER_AUTH_URL ??
  (typeof window !== 'undefined' ? window.location.origin : undefined)

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: 'include',
  },
})
