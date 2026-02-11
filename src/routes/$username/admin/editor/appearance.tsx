import React, { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image as ImageIcon, Palette } from 'lucide-react'
import type {
  BgMode,
  BlockRadius,
  BlockStyle,
  WallpaperStyle,
} from '@/components/dashboard/appearance/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { BannerSelector } from '@/components/dashboard/appearance/BannerSelector'
import { WallpaperSelector } from '@/components/dashboard/appearance/WallpaperSelector'
import { BlockStyleSelector } from '@/components/dashboard/appearance/BlockStyleSelector'
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

  return (
    <AppearanceEditor
      user={user}
      username={username}
      blocks={dashboardData.blocks || []}
    />
  )
}

function AppearanceEditor({
  user,
  username,
  blocks,
}: {
  user: any
  username: string
  blocks: any[]
}) {
  const queryClient = useQueryClient()
  const {
    user: previewUser,
    setUser,
    setBlocks,
    updateUser,
    setStatus,
  } = usePreview()

  // Sync user data to preview context.
  // Only do a full setUser() on first load (preview is null).
  // After that, use updateUser() to merge appearance-specific fields only —
  // this preserves profile fields (name, bio, image) that may have been set
  // by the profiles page.
  useEffect(() => {
    if (!user) return
    if (!previewUser) {
      setUser(user)
    } else {
      updateUser({
        appearanceBgType: user.appearanceBgType,
        appearanceBgWallpaperStyle: user.appearanceBgWallpaperStyle,
        appearanceBgColor: user.appearanceBgColor,
        appearanceBgImageUrl: user.appearanceBgImageUrl,
        appearanceWallpaperImageUrl: user.appearanceWallpaperImageUrl,
        appearanceWallpaperColor: user.appearanceWallpaperColor,
        appearanceWallpaperGradientTop: user.appearanceWallpaperGradientTop,
        appearanceWallpaperGradientBottom:
          user.appearanceWallpaperGradientBottom,
        appearanceBlockStyle: user.appearanceBlockStyle,
        appearanceBlockRadius: user.appearanceBlockRadius,
        appearanceBlockColor: user.appearanceBlockColor,
      })
    }
  }, [user])

  useEffect(() => {
    setBlocks(blocks)
  }, [blocks, setBlocks])

  const updateAppearance = useMutation({
    mutationKey: ['updateProfile', username],
    mutationFn: (data: {
      userId: string
      appearanceBgType?: BgMode | 'color' | 'image'
      appearanceBgWallpaperStyle?: WallpaperStyle
      appearanceBgColor?: string | null
      appearanceBgImageUrl?: string | null
      appearanceWallpaperImageUrl?: string | null
      appearanceWallpaperColor?: string | null
      appearanceWallpaperGradientTop?: string | null
      appearanceWallpaperGradientBottom?: string | null
      appearanceBlockStyle?: BlockStyle
      appearanceBlockRadius?: BlockRadius
      appearanceBlockColor?: string | null
    }) => trpcClient.user.updateProfile.mutate(data),
    onMutate: () => {
      setStatus({ isSaving: true, isSaved: false })
    },
    onSuccess: () => {
      setStatus({ isSaving: false, isSaved: true })
      // Invalidate dashboard cache so other pages get fresh data
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
    onError: () => {
      setStatus({ isSaving: false, isSaved: false })
    },
  })

  // Map legacy values ('color' | 'image') to wallpaper mode
  const initialBgMode: BgMode =
    user.appearanceBgType === 'banner' || !user.appearanceBgType
      ? 'banner'
      : 'wallpaper'

  const initialWallpaperStyle: WallpaperStyle =
    (user.appearanceBgWallpaperStyle as WallpaperStyle) ||
    (user.appearanceBgType === 'image'
      ? 'image'
      : user.appearanceBgType === 'color'
        ? 'flat'
        : 'flat')

  const [bgMode, setBgMode] = React.useState<BgMode>(initialBgMode)
  const [wallpaperStyle, setWallpaperStyle] = React.useState<WallpaperStyle>(
    initialWallpaperStyle,
  )
  const [blockStyle, setBlockStyle] = React.useState<BlockStyle>(
    (user.appearanceBlockStyle as BlockStyle) ?? 'basic',
  )
  const [blockRadius, setBlockRadius] = React.useState<BlockRadius>(
    (user.appearanceBlockRadius as BlockRadius) ?? 'rounded',
  )

  // Track current images and colors for instant preview
  const [currentBannerUrl, setCurrentBannerUrl] = React.useState<
    string | undefined
  >(user.appearanceBgImageUrl ?? undefined)
  const [currentBgColor, setCurrentBgColor] = React.useState<
    string | undefined
  >(user.appearanceBgColor ?? undefined)

  // New Wallpaper State
  const [currentWallpaperImageUrl, setCurrentWallpaperImageUrl] =
    React.useState<string | undefined>(
      user.appearanceWallpaperImageUrl ?? undefined,
    )
  const [currentWallpaperColor, setCurrentWallpaperColor] = React.useState<
    string | undefined
  >(user.appearanceWallpaperColor ?? undefined)
  const [currentGradientTop, setCurrentGradientTop] = React.useState<
    string | undefined
  >(user.appearanceWallpaperGradientTop ?? undefined)
  const [currentGradientBottom, setCurrentGradientBottom] = React.useState<
    string | undefined
  >(user.appearanceWallpaperGradientBottom ?? undefined)
  const [currentBlockColor, setCurrentBlockColor] = React.useState<
    string | undefined
  >(user.appearanceBlockColor ?? undefined)

  // Track current banner selection
  const [currentBannerId, setCurrentBannerId] = React.useState<
    string | undefined
  >(() => {
    if (user.appearanceBgImageUrl) {
      const localBanner = LOCAL_BANNER_IMAGES.find(
        (b) => b.image === user.appearanceBgImageUrl,
      )
      if (localBanner) return localBanner.id
      // If it's an external URL, mark as custom
      return 'custom'
    }
    return undefined
  })

  // Update effect to sync with user prop if it changes externally
  React.useEffect(() => {
    setCurrentBannerUrl(user.appearanceBgImageUrl ?? undefined)
    setCurrentBgColor(user.appearanceBgColor ?? undefined)
    setCurrentWallpaperImageUrl(user.appearanceWallpaperImageUrl ?? undefined)
    setCurrentWallpaperColor(user.appearanceWallpaperColor ?? undefined)
    setCurrentGradientTop(user.appearanceWallpaperGradientTop ?? undefined)
    setCurrentGradientBottom(
      user.appearanceWallpaperGradientBottom ?? undefined,
    )
    setCurrentBlockColor(user.appearanceBlockColor ?? undefined)
  }, [
    user.appearanceBgImageUrl,
    user.appearanceBgColor,
    user.appearanceWallpaperImageUrl,
    user.appearanceWallpaperColor,
    user.appearanceWallpaperGradientTop,
    user.appearanceWallpaperGradientBottom,
    user.appearanceBlockColor,
  ])

  const handleChange = (
    patch: Omit<
      Partial<Parameters<typeof updateAppearance.mutate>[0]>,
      'userId'
    >,
  ) => {
    // Update preview context for instant visual feedback
    updateUser(patch as any)

    // Save to server
    updateAppearance.mutate({
      userId: user.id,
      ...patch,
    })
  }

  const handleBannerSelect = (imageUrl: string, bannerId?: string) => {
    setCurrentBannerId(bannerId)
    setCurrentBannerUrl(imageUrl || undefined)
    handleChange({
      appearanceBgType: 'banner',
      appearanceBgImageUrl: imageUrl || null,
    })
  }

  const handleBannerColorChange = (color: string | undefined) => {
    setCurrentBgColor(color)
    handleChange({
      appearanceBgColor: color ?? null,
    })
  }

  const handleWallpaperStyleChange = (style: WallpaperStyle) => {
    setWallpaperStyle(style)
    handleChange({
      appearanceBgType: 'wallpaper',
      appearanceBgWallpaperStyle: style,
    })
  }

  const handleWallpaperColorChange = (color: string | undefined) => {
    setCurrentWallpaperColor(color)
    handleChange({
      appearanceWallpaperColor: color ?? null,
    })
  }

  const handleWallpaperGradientChange = (
    top: string | undefined,
    bottom: string | undefined,
  ) => {
    setCurrentGradientTop(top)
    setCurrentGradientBottom(bottom)
    handleChange({
      appearanceWallpaperGradientTop: top ?? null,
      appearanceWallpaperGradientBottom: bottom ?? null,
    })
  }

  const handleWallpaperImageChange = (url: string | undefined) => {
    setCurrentWallpaperImageUrl(url)
    handleChange({
      appearanceWallpaperImageUrl: url || null,
    })
  }

  const handleBlockStyleChange = (style: BlockStyle) => {
    setBlockStyle(style)
    handleChange({ appearanceBlockStyle: style })
  }

  const handleBlockRadiusChange = (radius: BlockRadius) => {
    setBlockRadius(radius)
    handleChange({ appearanceBlockRadius: radius })
  }

  const handleBlockColorChange = (color: string | undefined) => {
    setCurrentBlockColor(color)
    handleChange({ appearanceBlockColor: color ?? null })
  }

  const handleBlockReset = () => {
    setBlockStyle('basic')
    setBlockRadius('rounded')
    setCurrentBlockColor(undefined)
    handleChange({
      appearanceBlockStyle: 'basic',
      appearanceBlockRadius: 'rounded',
      appearanceBlockColor: null,
    })
  }

  return (
    <>
      <AppHeader>
        <AppHeaderContent title="Appearance">
          <AppHeaderDescription>
            Customize your background and how your blocks look.
          </AppHeaderDescription>
        </AppHeaderContent>
      </AppHeader>
      <div className="flex flex-col gap-6">
        {/* Background */}
        <Card className="shadow-sm overflow-hidden">
          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Palette className="h-4 w-4" />
                Background
              </CardTitle>
            </div>
          </div>

          <Tabs
            value={bgMode}
            onValueChange={(v) => {
              const mode = v as BgMode
              setBgMode(mode)
              handleChange({ appearanceBgType: mode })
            }}
            className="w-full"
          >
            <div className="px-6 py-3 border-b">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                <TabsTrigger value="banner">Banner Layout</TabsTrigger>
                <TabsTrigger value="wallpaper">Full Wallpaper</TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-6">
              <TabsContent
                value="banner"
                className="mt-0 animate-in fade-in-0 slide-in-from-left-1 duration-300"
              >
                <BannerSelector
                  currentBannerUrl={currentBannerUrl}
                  currentBannerId={currentBannerId}
                  currentBgColor={currentBgColor}
                  onBannerSelect={handleBannerSelect}
                  onColorChange={handleBannerColorChange}
                />
              </TabsContent>

              <TabsContent
                value="wallpaper"
                className="mt-0 animate-in fade-in-0 slide-in-from-right-1 duration-300"
              >
                <WallpaperSelector
                  wallpaperStyle={wallpaperStyle}
                  wallpaperColor={currentWallpaperColor}
                  gradientTop={currentGradientTop}
                  gradientBottom={currentGradientBottom}
                  currentImageUrl={currentWallpaperImageUrl}
                  onStyleChange={handleWallpaperStyleChange}
                  onWallpaperColorChange={handleWallpaperColorChange}
                  onGradientChange={handleWallpaperGradientChange}
                  onImageUrlChange={handleWallpaperImageChange}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Block style */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4" />
              Block
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-xs"
              onClick={handleBlockReset}
            >
              ↻
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <BlockStyleSelector
              blockStyle={blockStyle}
              blockRadius={blockRadius}
              currentBlockColor={currentBlockColor}
              onStyleChange={handleBlockStyleChange}
              onRadiusChange={handleBlockRadiusChange}
              onColorChange={handleBlockColorChange}
              onReset={handleBlockReset}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
