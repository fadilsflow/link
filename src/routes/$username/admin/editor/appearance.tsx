import React, { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {BlockRadius, BlockStyle} from '@/lib/block-styles';
import type {ThemeOption} from '@/lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { BannerSelector } from '@/components/dashboard/appearance/BannerSelector'
import { BlockStyleSelector } from '@/components/dashboard/appearance/BlockStyleSelector'
import { ThemeOptionCards } from '@/components/dashboard/appearance/ThemeOptionCards'
import { LOCAL_BANNER_IMAGES } from '@/components/dashboard/appearance/banner-presets'
import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import { usePreview } from '@/lib/preview-context'
import { useDashboardThemePreference } from '@/lib/theme'

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
      appearanceBlockStyle: user.appearanceBlockStyle,
      appearanceBlockRadius: user.appearanceBlockRadius,
      publicTheme: user.publicTheme,
    })
  }, [user, previewUser, setUser, updateUser])

  const updateAppearance = useMutation({
    mutationKey: ['updateProfile', username],
    mutationFn: (data: {
      userId: string
      publicTheme?: ThemeOption
      appearanceBgImageUrl?: string | null
      appearanceBlockStyle?: BlockStyle
      appearanceBlockRadius?: BlockRadius
    }) => trpcClient.user.updateProfile.mutate(data),
    onMutate: () => setStatus({ isSaving: true, isSaved: false }),
    onSuccess: () => {
      setStatus({ isSaving: false, isSaved: true })
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
    onError: () => setStatus({ isSaving: false, isSaved: false }),
  })

  const [currentBannerUrl, setCurrentBannerUrl] = React.useState<
    string | undefined
  >(user.appearanceBgImageUrl ?? undefined)
  const [currentBannerId, setCurrentBannerId] = React.useState<
    string | undefined
  >(() => {
    const matchedPreset = LOCAL_BANNER_IMAGES.find(
      (preset) => preset.image === user.appearanceBgImageUrl,
    )
    return matchedPreset?.id
  })

  const [blockStyle, setBlockStyle] = React.useState<BlockStyle>(
    user.appearanceBlockStyle || 'basic',
  )
  const [blockRadius, setBlockRadius] = React.useState<BlockRadius>(
    user.appearanceBlockRadius || 'rounded',
  )
  const [publicTheme, setPublicTheme] = React.useState<ThemeOption>(
    user.publicTheme || 'system',
  )
  const [dashboardTheme, setDashboardTheme] = useDashboardThemePreference()

  const handleBannerSelect = (imageUrl: string, bannerId?: string) => {
    setCurrentBannerId(bannerId)
    setCurrentBannerUrl(imageUrl || undefined)
    updateUser({ appearanceBgImageUrl: imageUrl || null })
    updateAppearance.mutate({
      userId: user.id,
      appearanceBgImageUrl: imageUrl || null,
    })
  }

  const handleStyleChange = (style: BlockStyle) => {
    setBlockStyle(style)
    updateUser({ appearanceBlockStyle: style })
    updateAppearance.mutate({ userId: user.id, appearanceBlockStyle: style })
  }

  const handleRadiusChange = (radius: BlockRadius) => {
    setBlockRadius(radius)
    updateUser({ appearanceBlockRadius: radius })
    updateAppearance.mutate({ userId: user.id, appearanceBlockRadius: radius })
  }

  const handleReset = () => {
    setBlockStyle('basic')
    setBlockRadius('rounded')
    updateUser({
      appearanceBlockStyle: 'basic',
      appearanceBlockRadius: 'rounded',
    })
    updateAppearance.mutate({
      userId: user.id,
      appearanceBlockStyle: 'basic',
      appearanceBlockRadius: 'rounded',
    })
  }

  const handleResetTheme = () => {
    setPublicTheme('system')
    updateUser({ publicTheme: 'system' })
    updateAppearance.mutate({ userId: user.id, publicTheme: 'system' })
    setDashboardTheme('system')
  }

  const handlePublicThemeChange = (theme: ThemeOption) => {
    setPublicTheme(theme)
    updateUser({ publicTheme: theme })
    updateAppearance.mutate({ userId: user.id, publicTheme: theme })
  }

  return (
    <>
      <AppHeader>
        <AppHeaderContent title="Appearance">
          <AppHeaderDescription>
            Choose your banner and block card style.
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>

      <Card className="shadow-sm overflow-hidden">
        <CardHeader className=" border-b flex flex-row items-center justify-between">
          <CardTitle>Banner</CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <BannerSelector
            currentBannerUrl={currentBannerUrl}
            currentBannerId={currentBannerId}
            onBannerSelect={handleBannerSelect}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm mt-6">
        <CardHeader className=" border-b flex flex-row items-center justify-between">
          <CardTitle>Block</CardTitle>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleReset}
          >
            Reset
          </Button>
        </CardHeader>
        <CardContent>
          <BlockStyleSelector
            blockStyle={blockStyle}
            blockRadius={blockRadius}
            onStyleChange={handleStyleChange}
            onRadiusChange={handleRadiusChange}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm mt-6">
        <CardHeader className=" border-b flex flex-row items-center justify-between">
          <CardTitle>Theme</CardTitle>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleResetTheme}
          >
            Reset
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardTitle className="text-xl font-semibold">Public Theme</CardTitle>
          <ThemeOptionCards
            value={publicTheme}
            onChange={handlePublicThemeChange}
          />

          <CardTitle className="text-xl font-semibold">
            Dashboard Theme
          </CardTitle>
          <ThemeOptionCards
            value={dashboardTheme}
            onChange={(theme) => {
              setDashboardTheme(theme)
            }}
          />
        </CardContent>
      </Card>
    </>
  )
}
