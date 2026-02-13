import React, { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image as ImageIcon } from 'lucide-react'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { BannerSelector } from '@/components/dashboard/appearance/BannerSelector'
import { LOCAL_BANNER_IMAGES } from '@/components/dashboard/appearance/banner-presets'
import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import { usePreview } from '@/lib/preview-context'

export const Route = createFileRoute('/$username/admin/editor/appearance')({
  component: AppearanceRouteComponent,
})

function AppearanceRouteComponent() {
  const { username } = Route.useParams()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', username],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  if (!user) return null

  return <AppearanceEditor user={user} username={username} />
}

function AppearanceEditor({ user, username }: { user: any; username: string }) {
  const queryClient = useQueryClient()
  const { user: previewUser, setUser, updateUser, setStatus } = usePreview()

  useEffect(() => {
    if (!user) return
    if (!previewUser) {
      setUser(user)
      return
    }

    updateUser({
      appearanceBgImageUrl: user.appearanceBgImageUrl,
    })
  }, [user, previewUser, setUser, updateUser])

  const updateAppearance = useMutation({
    mutationKey: ['updateProfile', username],
    mutationFn: (data: { userId: string; appearanceBgImageUrl?: string | null }) =>
      trpcClient.user.updateProfile.mutate(data),
    onMutate: () => setStatus({ isSaving: true, isSaved: false }),
    onSuccess: () => {
      setStatus({ isSaving: false, isSaved: true })
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
    onError: () => setStatus({ isSaving: false, isSaved: false }),
  })

  const [currentBannerUrl, setCurrentBannerUrl] = React.useState<string | undefined>(
    user.appearanceBgImageUrl ?? undefined,
  )
  const [currentBannerId, setCurrentBannerId] = React.useState<string | undefined>(() => {
    const matchedPreset = LOCAL_BANNER_IMAGES.find((preset) => preset.image === user.appearanceBgImageUrl)
    return matchedPreset?.id
  })

  const handleBannerSelect = (imageUrl: string, bannerId?: string) => {
    setCurrentBannerId(bannerId)
    setCurrentBannerUrl(imageUrl || undefined)
    updateUser({ appearanceBgImageUrl: imageUrl || null })
    updateAppearance.mutate({ userId: user.id, appearanceBgImageUrl: imageUrl || null })
  }

  return (
    <>
      <AppHeader>
        <AppHeaderContent title="Appearance">
          <AppHeaderDescription>Choose a banner image for your profile header.</AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      <Card className="shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ImageIcon className="h-4 w-4" />
            Banner
          </CardTitle>
        </div>

        <CardContent className="p-6">
          <BannerSelector
            currentBannerUrl={currentBannerUrl}
            currentBannerId={currentBannerId}
            onBannerSelect={handleBannerSelect}
          />
        </CardContent>
      </Card>
    </>
  )
}
