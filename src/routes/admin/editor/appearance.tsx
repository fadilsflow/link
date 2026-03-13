import React, { useCallback, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BlockRadius, BlockStyle } from '@/lib/block-styles'
import type { AppearanceBackgroundType, AppearanceTextFont } from '@/lib/appearance'
import {
  APPEARANCE_DEFAULTS,
  APPEARANCE_FONT_OPTIONS,
  getAppearanceFontClass,
  isValidAppearanceHexColor,
} from '@/lib/appearance'
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
} from '@/components/app-header'
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
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
  const socialLinks = dashboardData?.socialLinks
  const products = dashboardData?.products
  if (!user) return null

  return (
    <AppearanceEditor
      user={user}
      blocks={blocks || []}
      socialLinks={socialLinks || []}
      products={products || []}
    />
  )
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
        'rounded-xl border p-3 text-left',
        selected ? 'bg-input/80 ' : 'hover:bg-input/40',
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

function AppearanceEditor({
  user,
  blocks,
  socialLinks,
  products,
}: {
  user: any
  blocks: Array<any>
  socialLinks: Array<any>
  products: Array<any>
}) {
  const queryClient = useQueryClient()
  const {
    user: previewUser,
    blocks: previewBlocks,
    setUser,
    setBlocks,
    setSocialLinks,
    setProducts,
    updateUser,
    setStatus,
  } = usePreview()

  useEffect(() => {
    if (!user) return
    if (!previewUser) {
      setUser(user)
      setBlocks(blocks)
      setSocialLinks(socialLinks)
      setProducts(products)
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
    setSocialLinks(socialLinks)
    setProducts(products)
  }, [user, blocks, socialLinks, products, previewUser, previewBlocks, setUser, setBlocks, setSocialLinks, setProducts, updateUser])

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
  const selectedFontOption = React.useMemo(
    () => APPEARANCE_FONT_OPTIONS.find((option) => option.value === textFont),
    [textFont],
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
    setCurrentBannerUrl('/banner/profile_bg_1.webp')
    setCurrentBannerId('local-1')
    save({
      appearanceBannerEnabled: APPEARANCE_DEFAULTS.bannerEnabled,
      appearanceBgImageUrl: '/banner/profile_bg_1.webp',
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
    <div className='p-4 md:p-10 space-y-6'>
      <AppHeader >
        <AppHeaderContent title="Appearance">
        </AppHeaderContent>
      </AppHeader>
      <Frame>
        <FrameHeader className="flex flex-row items-center justify-between">
          <FrameTitle>Banner</FrameTitle>
          <Button
            type="button"
            size={"xs"}
            variant="outline"
            className="gap-2"
            onClick={resetBannerSection}
          >
            Reset
          </Button>
        </FrameHeader>

        <FramePanel className="space-y-4">
          <div className="flex items-center justify-between">
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
        </FramePanel>
      </Frame>

      <Frame >
        <FrameHeader className="flex flex-row items-center justify-between">
          <FrameTitle>Background</FrameTitle>
          <Button
            type="button"
            size={"xs"}
            variant="outline"
            className="gap-2"
            onClick={resetBackgroundSection}
          >
            Reset
          </Button>
        </FrameHeader>
        <FramePanel className="space-y-4">
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
              title="Image"
              description="a full-page background image."
              onClick={() => {
                setBackgroundType('image')
                save({ appearanceBackgroundType: 'image' })
              }}
            />
          </div>
        </FramePanel>
        {backgroundType !== 'none' && backgroundType !== 'avatar-blur' &&


          <FramePanel>
            {backgroundType === 'flat' ? (
              <div className="gap-2 flex flex-col">
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
                <div className="gap-2 flex flex-col">
                  <Label>Top color</Label>
                  <ColorPicker
                    value={backgroundGradientTop}
                    onChange={setBackgroundGradientTop}
                    onCommit={(value) => {
                      saveColor(value, 'appearanceBackgroundGradientTop')
                    }}
                  />
                </div>
                <div className="gap-2 flex flex-col">
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
          </FramePanel>
        }

      </Frame>

      <Frame >
        <FrameHeader className="flex flex-row items-center justify-between">
          <FrameTitle>Blocks</FrameTitle>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={resetBlockSection}
            size='xs'
          >
            Reset
          </Button>
        </FrameHeader>
        <FramePanel className="space-y-4">
          <BlockStyleSelector
            blockStyle={blockStyle}
            blockRadius={blockRadius}
            onChange={handleBlockStyleChange}
          />
        </FramePanel>
        <FramePanel>
          <div className={cn(blockStyle === 'shadow' && "grid grid-cols-1 gap-4 sm:grid-cols-2 ")}>
            <div className="gap-2 flex flex-col">
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
              <div className="gap-2 flex flex-col">
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
          </div>
        </FramePanel>
      </Frame>

      <Frame >
        <FrameHeader className="flex flex-row items-center justify-between">
          <FrameTitle>Font</FrameTitle>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={resetTextSection}
            size='xs'
          >
            Reset
          </Button>
        </FrameHeader>
        <FramePanel className="space-y-4">
          <Label className='sr-only'>Font</Label>
          <Select
            value={textFont}
            onValueChange={(value) => {
              const next = value as AppearanceTextFont
              setTextFont(next)
              save({ appearanceTextFont: next })
            }}
          >
            <SelectTrigger className={getAppearanceFontClass(textFont)}>
              <SelectValue>
                {selectedFontOption
                  ? `${selectedFontOption.family}`
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {APPEARANCE_FONT_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={getAppearanceFontClass(option.value)}
                >
                  {option.family}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FramePanel>
      </Frame>
    </div>
  )
}
