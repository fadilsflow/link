import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Palette, Image as ImageIcon, SearchIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { BannerSelector } from '@/components/dashboard/appearance/BannerSelector'
import { WallpaperSelector } from '@/components/dashboard/appearance/WallpaperSelector'
import { BlockStyleSelector } from '@/components/dashboard/appearance/BlockStyleSelector'
import { AppearancePreview } from '@/components/dashboard/appearance/AppearancePreview'
import {
  BgMode,
  WallpaperStyle,
  BlockStyle,
  BlockRadius,
} from '@/components/dashboard/appearance/types'
import { LOCAL_BANNER_IMAGES } from '@/components/dashboard/appearance/banner-presets'
import {
  AppHeader,
  AppHeaderActions,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
export const Route = createFileRoute('/$username/admin/appearance' as any)({
  component: AppearanceRouteComponent,
})

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
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
  const updateAppearance = useMutation({
    mutationKey: ['updateProfile', username],
    mutationFn: (data: {
      userId: string
      appearanceBgType?: BgMode | 'color' | 'image'
      appearanceBgWallpaperStyle?: WallpaperStyle
      appearanceBgColor?: string
      appearanceBgImageUrl?: string
      appearanceBlockStyle?: BlockStyle
      appearanceBlockRadius?: BlockRadius
      appearanceBlockColor?: string
    }) => trpcClient.user.updateProfile.mutate(data),
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
    // Check if it's a gradient based on color
    if (user.appearanceBgColor?.includes('gradient')) {
      if (
        user.appearanceBgColor.includes('rgb(14, 165, 233)') ||
        user.appearanceBgColor.includes('sky')
      ) {
        return 'gradient-blue'
      }
      if (
        user.appearanceBgColor.includes('rgb(139, 92, 246)') ||
        user.appearanceBgColor.includes('violet')
      ) {
        return 'gradient-purple'
      }
    }
    return undefined
  })

  const handleChange = (
    patch: Omit<
      Partial<Parameters<typeof updateAppearance.mutate>[0]>,
      'userId'
    >,
  ) => {
    updateAppearance.mutate({
      userId: user.id,
      ...patch,
    })
  }

  const handleBannerSelect = (imageUrl: string, bannerId?: string) => {
    setCurrentBannerId(bannerId)
    handleChange({
      appearanceBgType: 'banner',
      appearanceBgImageUrl: imageUrl ? imageUrl : undefined,
    })
  }

  const handleBannerColorChange = (color: string | undefined) => {
    handleChange({
      appearanceBgColor: color,
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
    handleChange({
      appearanceBgColor: color,
    })
  }

  const handleWallpaperImageChange = (url: string | undefined) => {
    handleChange({
      appearanceBgImageUrl: url,
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
    handleChange({ appearanceBlockColor: color })
  }

  const handleBlockReset = () => {
    setBlockStyle('basic')
    setBlockRadius('rounded')
    handleChange({
      appearanceBlockStyle: 'basic',
      appearanceBlockRadius: 'rounded',
      appearanceBlockColor: undefined,
    })
  }

  return (
    <div>
      <AppHeader>
        <AppHeaderContent title="Appearance">
          <AppHeaderDescription>
            Customize your background and how your blocks look.
          </AppHeaderDescription>
        </AppHeaderContent>
        <AppHeaderActions className="max-md:hidden">
          <InputGroup>
            <InputGroupInput
              aria-label="Search"
              placeholder="Search…"
              type="search"
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          {/* <AddEventTypeDialog>
            <PlusIcon className="-ms-1" />
            New
          </AddEventTypeDialog> */}
        </AppHeaderActions>
      </AppHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] items-start">
        {/* Controls */}
        <div className="space-y-6">
          {/* Background */}
          <Card className="border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4 text-zinc-500" />
                  Background
                </CardTitle>
              </div>
              <RadioGroup
                className="flex items-center gap-4"
                value={bgMode}
                onValueChange={(value) => {
                  const mode = value as BgMode
                  setBgMode(mode)
                  handleChange({
                    appearanceBgType: mode,
                  })
                }}
              >
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                  <RadioGroupItem value="banner" />
                  Banner
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
                  <RadioGroupItem value="wallpaper" />
                  Wallpaper
                </label>
              </RadioGroup>
            </CardHeader>
            <CardContent className="space-y-6">
              {bgMode === 'banner' ? (
                <BannerSelector
                  currentBannerUrl={user.appearanceBgImageUrl ?? undefined}
                  currentBannerId={currentBannerId}
                  currentBgColor={user.appearanceBgColor ?? undefined}
                  onBannerSelect={handleBannerSelect}
                  onColorChange={handleBannerColorChange}
                />
              ) : (
                <WallpaperSelector
                  wallpaperStyle={wallpaperStyle}
                  currentBgColor={user.appearanceBgColor ?? undefined}
                  currentImageUrl={user.appearanceBgImageUrl ?? undefined}
                  onStyleChange={handleWallpaperStyleChange}
                  onColorChange={handleWallpaperColorChange}
                  onImageUrlChange={handleWallpaperImageChange}
                />
              )}
            </CardContent>
          </Card>

          {/* Block style */}
          <Card className="border-zinc-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-zinc-500" />
                Block
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-xs text-zinc-500"
                onClick={handleBlockReset}
              >
                ↻
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <BlockStyleSelector
                blockStyle={blockStyle}
                blockRadius={blockRadius}
                currentBlockColor={user.appearanceBlockColor ?? undefined}
                onStyleChange={handleBlockStyleChange}
                onRadiusChange={handleBlockRadiusChange}
                onColorChange={handleBlockColorChange}
                onReset={handleBlockReset}
              />
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <Card className="border-zinc-100 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-500 font-medium">
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="border border-zinc-100 rounded-xl overflow-hidden p-0">
              <AppearancePreview
                user={{
                  name: user.name,
                  title: user.title,
                  bio: user.bio,
                  image: user.image,
                  appearanceBgType: bgMode,
                  appearanceBgWallpaperStyle: wallpaperStyle,
                  appearanceBgColor: user.appearanceBgColor ?? undefined,
                  appearanceBgImageUrl: user.appearanceBgImageUrl ?? undefined,
                  appearanceBlockStyle: blockStyle,
                  appearanceBlockRadius: blockRadius,
                  appearanceBlockColor: user.appearanceBlockColor ?? undefined,
                }}
              />
            </CardContent>
          </Card>

          {updateAppearance.status === 'pending' && (
            <p className="text-xs text-zinc-500">Saving changes…</p>
          )}
        </div>
      </div>
    </div>
  )
}
