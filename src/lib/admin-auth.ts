import { queryOptions, useQuery } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

export type AdminAuthContextData = {
  userId: string
  username: string
  name: string | null
  email: string
  image: string | null
}

export function adminAuthQueryKey(username: string) {
  return ['admin-auth', username] as const
}

export function adminAuthQueryOptions(username: string) {
  return queryOptions({
    queryKey: adminAuthQueryKey(username),
    queryFn: async (): Promise<AdminAuthContextData> => {
      return await trpcClient.admin.getContext.query({ username })
    },
    enabled: username.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}

export function useAdminAuthContext(username: string) {
  return useQuery(adminAuthQueryOptions(username))
}
