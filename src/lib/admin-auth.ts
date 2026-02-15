import { queryOptions, useQuery } from '@tanstack/react-query'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

export type AdminAuthContextData = {
  userId: string
  username: string
  name: string | null
  email: string
  image: string | null
}

export function adminAuthQueryKey() {
  return ['admin-auth'] as const
}

export function adminAuthQueryOptions() {
  return queryOptions({
    queryKey: adminAuthQueryKey(),
    queryFn: async (): Promise<AdminAuthContextData> => {
      return await trpcClient.admin.getContext.query()
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}

export function useAdminAuthContext() {
  return useQuery(adminAuthQueryOptions())
}
