import React, { useCallback, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BlockRadius, BlockStyle } from '@/lib/block-styles'
import type { AppearanceBackgroundType, AppearanceTextFont } from '@/lib/appearance'
import { Separator } from "@/components/ui/separator";
import {
  APPEARANCE_DEFAULTS,
  APPEARANCE_FONT_OPTIONS,
  isValidAppearanceHexColor,
} from '@/lib/appearance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ColorPicker } from '@/components/ui/color-picker'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { BannerSelector } from '@/components/dashboard/appearance/BannerSelector'
import { BlockStyleSelector } from '@/components/dashboard/appearance/BlockStyleSelector'
import { LOCAL_BANNER_IMAGES } from '@/components/dashboard/appearance/banner-presets'
import { ImageUploader } from '@/components/dashboard/appearance/ImageUploader'
import {
  AppHeader,
  AppHeaderContent,
  AppHeaderDescription,
} from '@/components/app-header'
import { usePreview } from '@/lib/preview-context'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/editor/appearance')({
  component: AppearanceRouteComponent,
})

function AppearanceRouteComponent() {
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user
  const blocks = dashboardData?.blocks
  if (!user) return null

  return <AppearanceEditor user={user} blocks={blocks || []} />
}

function SectionOptionCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border p-3 text-left transition-colors',
        selected ? 'bg-input/80 border-foreground/20' : 'hover:bg-input/40',
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  )
}

type AppearanceUpdateInput = {
  appearanceBannerEnabled?: boolean
  appearanceBgImageUrl?: string | null
  appearanceBackgroundType?: AppearanceBackgroundType
  appearanceBackgroundColor?: string | null
  appearanceBackgroundGradientTop?: string | null
  appearanceBackgroundGradientBottom?: string | null
  appearanceBackgroundImageUrl?: string | null
  appearanceBlockStyle?: BlockStyle
  appearanceBlockRadius?: BlockRadius
  appearanceBlockColor?: string | null
  appearanceBlockShadowColor?: string | null
  appearanceTextColor?: string | null
  appearanceTextFont?: AppearanceTextFont
}

function AppearanceEditor({ user, blocks }: { user: any; blocks: Array<any> }) {
  const queryClient = useQueryClient()
  const { user: previewUser, blocks: previewBlocks, setUser, setBlocks, updateUser, setStatus } = usePreview()

  useEffect(() => {
    if (!user) return
    if (!previewUser) {
      setUser(user)
      setBlocks(blocks)
      return
    }

    updateUser({
      appearanceBannerEnabled: user.appearanceBannerEnabled,
      appearanceBgImageUrl: user.appearanceBgImageUrl,
      appearanceBackgroundType: user.appearanceBackgroundType,
      appearanceBackgroundColor: user.appearanceBackgroundColor,
      appearanceBackgroundGradientTop: user.appearanceBackgroundGradientTop,
      appearanceBackgroundGradientBottom: user.appearanceBackgroundGradientBottom,
      appearanceBackgroundImageUrl: user.appearanceBackgroundImageUrl,
      appearanceBlockStyle: user.appearanceBlockStyle,
      appearanceBlockRadius: user.appearanceBlockRadius,
      appearanceBlockColor: user.appearanceBlockColor,
      appearanceBlockShadowColor: user.appearanceBlockShadowColor,
      appearanceTextColor: user.appearanceTextColor,
      appearanceTextFont: user.appearanceTextFont,
    })
  }, [user, blocks, previewUser, previewBlocks, setUser, setBlocks, updateUser])

  const updateAppearance = useMutation({
    mutationKey: ['updateProfile'],
    mutationFn: (data: AppearanceUpdateInput) =>
      trpcClient.user.updateProfile.mutate(data),
  })
  const pendingPatchRef = useRef<AppearanceUpdateInput>({})
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestQueueRef = useRef(Promise.resolve())

  const [bannerEnabled, setBannerEnabled] = React.useState<boolean>(
    user.appearanceBannerEnabled ?? APPEARANCE_DEFAULTS.bannerEnabled,
  )
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

  const [backgroundType, setBackgroundType] = React.useState<AppearanceBackgroundType>(
    user.appearanceBackgroundType ?? APPEARANCE_DEFAULTS.backgroundType,
  )
  const [backgroundColor, setBackgroundColor] = React.useState(
    user.appearanceBackgroundColor ?? APPEARANCE_DEFAULTS.backgroundColor,
  )
  const [backgroundGradientTop, setBackgroundGradientTop] = React.useState(
    user.appearanceBackgroundGradientTop ??
    APPEARANCE_DEFAULTS.backgroundGradientTop,
  )
  const [backgroundGradientBottom, setBackgroundGradientBottom] = React.useState(
    user.appearanceBackgroundGradientBottom ??
    APPEARANCE_DEFAULTS.backgroundGradientBottom,
  )
  const [backgroundImageUrl, setBackgroundImageUrl] = React.useState(
    user.appearanceBackgroundImageUrl ?? '',
  )

  const [blockStyle, setBlockStyle] = React.useState<BlockStyle>(
    user.appearanceBlockStyle || 'basic',
  )
  const [blockRadius, setBlockRadius] = React.useState<BlockRadius>(
    user.appearanceBlockRadius || 'rounded',
  )
  const [blockColor, setBlockColor] = React.useState(
    user.appearanceBlockColor ?? APPEARANCE_DEFAULTS.blockColor,
  )
  const [blockShadowColor, setBlockShadowColor] = React.useState(
    user.appearanceBlockShadowColor ?? APPEARANCE_DEFAULTS.blockShadowColor,
  )

  const [textFont, setTextFont] = React.useState<AppearanceTextFont>(
    user.appearanceTextFont ?? APPEARANCE_DEFAULTS.textFont,
  )

  const flushPendingPatch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    const payload = pendingPatchRef.current
    if (Object.keys(payload).length === 0) return

    pendingPatchRef.current = {}
    requestQueueRef.current = requestQueueRef.current.then(async () => {
      setStatus({ isSaving: true, isSaved: false })
      try {
        await updateAppearance.mutateAsync(payload)
        setStatus({ isSaving: false, isSaved: true })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      } catch {
        setStatus({ isSaving: false, isSaved: false })
      }
    })
  }, [queryClient, setStatus, updateAppearance])

  useEffect(
    () => () => {
      flushPendingPatch()
    },
    [flushPendingPatch],
  )

  const save = useCallback(
    (
      data: AppearanceUpdateInput,
      options: {
        debounced?: boolean
      } = {},
    ) => {
      updateUser(data)
      pendingPatchRef.current = { ...pendingPatchRef.current, ...data }

      if (options.debounced) {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
          flushPendingPatch()
        }, 220)
        return
      }

      flushPendingPatch()
    },
    [flushPendingPatch, updateUser],
  )

  const saveColor = useCallback(
    (
      value: string,
      field:
        | 'appearanceBackgroundColor'
        | 'appearanceBackgroundGradientTop'
        | 'appearanceBackgroundGradientBottom'
        | 'appearanceBlockColor'
        | 'appearanceBlockShadowColor',
    ) => {
      if (!isValidAppearanceHexColor(value)) return
      save({ [field]: value } as AppearanceUpdateInput, { debounced: true })
    },
    [save],
  )

  const handleBannerSelect = (imageUrl: string, bannerId?: string) => {
    const nextUrl = imageUrl || ''
    setCurrentBannerId(bannerId)
    setCurrentBannerUrl(nextUrl || undefined)
    save({ appearanceBgImageUrl: nextUrl || null }, { debounced: true })
  }

  const handleBlockStyleChange = (style: BlockStyle, radius: BlockRadius) => {
    setBlockStyle(style)
    setBlockRadius(radius)
    save({
      appearanceBlockStyle: style,
      appearanceBlockRadius: radius,
    })
  }

  const resetBannerSection = () => {
    setBannerEnabled(APPEARANCE_DEFAULTS.bannerEnabled)
    setCurrentBannerUrl(undefined)
    setCurrentBannerId(undefined)
    save({
      appearanceBannerEnabled: APPEARANCE_DEFAULTS.bannerEnabled,
      appearanceBgImageUrl: null,
    })
  }

  const resetBackgroundSection = () => {
    setBackgroundType(APPEARANCE_DEFAULTS.backgroundType)
    setBackgroundColor(APPEARANCE_DEFAULTS.backgroundColor)
    setBackgroundGradientTop(APPEARANCE_DEFAULTS.backgroundGradientTop)
    setBackgroundGradientBottom(APPEARANCE_DEFAULTS.backgroundGradientBottom)
    setBackgroundImageUrl('')
    save({
      appearanceBackgroundType: APPEARANCE_DEFAULTS.backgroundType,
      appearanceBackgroundColor: APPEARANCE_DEFAULTS.backgroundColor,
      appearanceBackgroundGradientTop: APPEARANCE_DEFAULTS.backgroundGradientTop,
      appearanceBackgroundGradientBottom:
        APPEARANCE_DEFAULTS.backgroundGradientBottom,
      appearanceBackgroundImageUrl: null,
    })
  }

  const resetBlockSection = () => {
    setBlockStyle('basic')
    setBlockRadius('rounded')
    setBlockColor(APPEARANCE_DEFAULTS.blockColor)
    setBlockShadowColor(APPEARANCE_DEFAULTS.blockShadowColor)
    save({
      appearanceBlockStyle: 'basic',
      appearanceBlockRadius: 'rounded',
      appearanceBlockColor: APPEARANCE_DEFAULTS.blockColor,
      appearanceBlockShadowColor: APPEARANCE_DEFAULTS.blockShadowColor,
    })
  }

  const resetTextSection = () => {
    setTextFont(APPEARANCE_DEFAULTS.textFont)
    save({
      appearanceTextFont: APPEARANCE_DEFAULTS.textFont,
    })
  }

  return (
    <>
      <AppHeader className='px-6 pt-6'>
        <AppHeaderContent title="Appearance">
          {/* <AppHeaderDescription>
            Customize banner, background, blocks, and text for your public page.
          </AppHeaderDescription> */}
        </AppHeaderContent>
      </AppHeader>
      <Separator />
      <div className="p-6">
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="border-b flex flex-row items-center justify-between">
            <CardTitle>Banner</CardTitle>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={resetBannerSection}
            >
              Reset
            </Button>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <Label htmlFor="banner-enabled">Show banner</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Turn off if you want a profile page without banner.
                </p>
              </div>
              <Switch
                id="banner-enabled"
                checked={bannerEnabled}
                onCheckedChange={(checked) => {
                  setBannerEnabled(checked)
                  save({ appearanceBannerEnabled: checked })
                }}
              />
            </div>

            {bannerEnabled ? (
              <BannerSelector
                currentBannerUrl={currentBannerUrl}
                currentBannerId={currentBannerId}
                onBannerSelect={handleBannerSelect}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm mt-6">
          <CardHeader className="border-b flex flex-row items-center justify-between">
            <CardTitle>Background</CardTitle>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={resetBackgroundSection}
            >
              Reset
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SectionOptionCard
                selected={backgroundType === 'none'}
                title="Default"
                description="Use default page background."
                onClick={() => {
                  setBackgroundType('none')
                  save({ appearanceBackgroundType: 'none' })
                }}
              />
              <SectionOptionCard
                selected={backgroundType === 'flat'}
                title="Flat Color"
                description="Single color background."
                onClick={() => {
                  setBackgroundType('flat')
                  save({ appearanceBackgroundType: 'flat' })
                }}
              />
              <SectionOptionCard
                selected={backgroundType === 'gradient'}
                title="Gradient"
                description="Top and bottom color gradient."
                onClick={() => {
                  setBackgroundType('gradient')
                  save({ appearanceBackgroundType: 'gradient' })
                }}
              />
              <SectionOptionCard
                selected={backgroundType === 'avatar-blur'}
                title="Avatar Blur"
                description="Use profile image as blurred background."
                onClick={() => {
                  setBackgroundType('avatar-blur')
                  save({ appearanceBackgroundType: 'avatar-blur' })
                }}
              />
              <SectionOptionCard
                selected={backgroundType === 'image'}
                title="Image Upload"
                description="Upload a full-page background image."
                onClick={() => {
                  setBackgroundType('image')
                  save({ appearanceBackgroundType: 'image' })
                }}
              />
            </div>

            {backgroundType === 'flat' ? (
              <div className="space-y-2">
                <Label>Background color</Label>
                <ColorPicker
                  value={backgroundColor}
                  onChange={setBackgroundColor}
                  onCommit={(value) => {
                    saveColor(value, 'appearanceBackgroundColor')
                  }}
                />
              </div>
            ) : null}

            {backgroundType === 'gradient' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Top color</Label>
                  <ColorPicker
                    value={backgroundGradientTop}
                    onChange={setBackgroundGradientTop}
                    onCommit={(value) => {
                      saveColor(value, 'appearanceBackgroundGradientTop')
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bottom color</Label>
                  <ColorPicker
                    value={backgroundGradientBottom}
                    onChange={setBackgroundGradientBottom}
                    onCommit={(value) => {
                      saveColor(value, 'appearanceBackgroundGradientBottom')
                    }}
                  />
                </div>
              </div>
            ) : null}

            {backgroundType === 'image' ? (
              <ImageUploader
                value={backgroundImageUrl}
                onChange={(url) => {
                  setBackgroundImageUrl(url)
                  save(
                    { appearanceBackgroundImageUrl: url || null },
                    { debounced: true },
                  )
                }}
                folder="backgrounds"
                aspectRatio="video"
                placeholder="Upload full-page background"
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm mt-6">
          <CardHeader className="border-b flex flex-row items-center justify-between">
            <CardTitle>Blocks</CardTitle>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={resetBlockSection}
            >
              Reset
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <BlockStyleSelector
              blockStyle={blockStyle}
              blockRadius={blockRadius}
              onChange={handleBlockStyleChange}
            />

            <div className="space-y-2">
              <Label>Block color</Label>
              <ColorPicker
                value={blockColor}
                onChange={setBlockColor}
                onCommit={(value) => {
                  saveColor(value, 'appearanceBlockColor')
                }}
              />
            </div>

            {blockStyle === 'shadow' ? (
              <div className="space-y-2">
                <Label>Shadow color</Label>
                <ColorPicker
                  value={blockShadowColor}
                  onChange={setBlockShadowColor}
                  onCommit={(value) => {
                    saveColor(value, 'appearanceBlockShadowColor')
                  }}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-sm mt-6">
          <CardHeader className="border-b flex flex-row items-center justify-between">
            <CardTitle>Text</CardTitle>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={resetTextSection}
            >
              Reset
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label>Font</Label>
              <Select
                value={textFont}
                onValueChange={(value) => {
                  const next = value as AppearanceTextFont
                  setTextFont(next)
                  save({ appearanceTextFont: next })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPEARANCE_FONT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} ({option.family})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
