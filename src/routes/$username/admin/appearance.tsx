import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Palette,
  Image as ImageIcon,
  Square,
  SquareDashed,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

export const Route = createFileRoute('/$username/admin/appearance' as any)({
  component: AppearanceRouteComponent,
})

type BgMode = 'banner' | 'wallpaper'
type WallpaperStyle = 'flat' | 'gradient' | 'avatar' | 'image'
type BlockStyle = 'basic' | 'flat' | 'shadow'
type BlockRadius = 'rounded' | 'square'

function AppearanceRouteComponent() {
  const { username } = Route.useParams()

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', username],
    queryFn: () => getDashboardData(),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  const user = dashboardData?.user

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

  if (!user) return null

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
  const [wallpaperStyle, setWallpaperStyle] =
    React.useState<WallpaperStyle>(initialWallpaperStyle)
  const [blockStyle, setBlockStyle] = React.useState<BlockStyle>(
    (user.appearanceBlockStyle as BlockStyle) ?? 'basic',
  )
  const [blockRadius, setBlockRadius] = React.useState<BlockRadius>(
    (user.appearanceBlockRadius as BlockRadius) ?? 'rounded',
  )

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

  const bannerPresets = [
    {
      id: 'astronaut',
      label: 'Astronaut',
      className:
        'bg-gradient-to-r from-black via-black to-black relative overflow-hidden',
      image:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1440&auto=format&fit=crop',
    },
    {
      id: 'gradient-blue',
      label: 'Gradient Blue',
      className: 'bg-gradient-to-r from-sky-500 via-sky-400 to-emerald-400',
    },
    {
      id: 'gradient-purple',
      label: 'Gradient Purple',
      className:
        'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-300',
    },
  ] satisfies Array<{
    id: string
    label: string
    className: string
    image?: string
  }>

  const currentBannerId = bannerPresets[0]?.id

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-6 lg:p-10 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Appearance
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Customize your background and how your blocks look.
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full text-xs">
          Preview
        </Button>
      </div>

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
                <>
                  <div className="grid gap-3">
                    {bannerPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={cn(
                          'relative flex h-14 w-full items-center justify-between rounded-xl border px-4 text-left text-xs font-medium transition-all',
                          'border-zinc-200 bg-white hover:border-zinc-300',
                          currentBannerId === preset.id &&
                          'border-emerald-500 ring-1 ring-emerald-500/40',
                        )}
                        onClick={() =>
                          handleChange({
                            appearanceBgType: 'banner',
                            appearanceBgImageUrl: preset.image,
                          })
                        }
                      >
                        <div
                          className={cn(
                            'absolute inset-0 rounded-[11px]',
                            preset.className,
                          )}
                        />
                        <span className="relative z-10 text-white drop-shadow-sm">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-100">
                    <Label htmlFor="banner-bg-color">Color</Label>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-lg border border-zinc-200"
                        style={{
                          backgroundColor:
                            user.appearanceBgColor || '#F8F2F2',
                        }}
                      />
                      <Input
                        id="banner-bg-color"
                        placeholder="#F8F2F2"
                        defaultValue={user.appearanceBgColor ?? ''}
                        onBlur={(e) =>
                          handleChange({
                            appearanceBgColor: e.target.value || undefined,
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-8 w-8 rounded-full text-xs text-zinc-500"
                        onClick={() =>
                          handleChange({
                            appearanceBgColor: undefined,
                          })
                        }
                      >
                        ↻
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <WallpaperOption
                      label="Flat Color"
                      value="flat"
                      active={wallpaperStyle === 'flat'}
                      onClick={() => {
                        setWallpaperStyle('flat')
                        handleChange({
                          appearanceBgType: 'wallpaper',
                          appearanceBgWallpaperStyle: 'flat',
                        })
                      }}
                    />
                    <WallpaperOption
                      label="Gradient"
                      value="gradient"
                      active={wallpaperStyle === 'gradient'}
                      onClick={() => {
                        setWallpaperStyle('gradient')
                        handleChange({
                          appearanceBgType: 'wallpaper',
                          appearanceBgWallpaperStyle: 'gradient',
                        })
                      }}
                    />
                    <WallpaperOption
                      label="Avatar Blur"
                      value="avatar"
                      active={wallpaperStyle === 'avatar'}
                      onClick={() => {
                        setWallpaperStyle('avatar')
                        handleChange({
                          appearanceBgType: 'wallpaper',
                          appearanceBgWallpaperStyle: 'avatar',
                        })
                      }}
                    />
                    <WallpaperOption
                      label="Image"
                      value="image"
                      active={wallpaperStyle === 'image'}
                      onClick={() => {
                        setWallpaperStyle('image')
                        handleChange({
                          appearanceBgType: 'wallpaper',
                          appearanceBgWallpaperStyle: 'image',
                        })
                      }}
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-100">
                    <Label htmlFor="wallpaper-color">Color</Label>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-lg border border-zinc-200"
                        style={{
                          background:
                            user.appearanceBgColor ||
                            (wallpaperStyle === 'gradient'
                              ? 'linear-gradient(90deg,#6EE7B7,#3B82F6,#A855F7)'
                              : '#FAFAFA'),
                        }}
                      />
                      <Input
                        id="wallpaper-color"
                        placeholder={
                          wallpaperStyle === 'gradient'
                            ? 'linear-gradient(...)'
                            : '#FAFAFA'
                        }
                        defaultValue={user.appearanceBgColor ?? ''}
                        onBlur={(e) =>
                          handleChange({
                            appearanceBgColor: e.target.value || undefined,
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-8 w-8 rounded-full text-xs text-zinc-500"
                        onClick={() =>
                          handleChange({
                            appearanceBgColor: undefined,
                          })
                        }
                      >
                        ↻
                      </Button>
                    </div>
                  </div>

                  {wallpaperStyle === 'image' && (
                    <div className="space-y-2">
                      <Label htmlFor="wallpaper-image">Image</Label>
                      <Input
                        id="wallpaper-image"
                        placeholder="https://..."
                        defaultValue={user.appearanceBgImageUrl ?? ''}
                        onBlur={(e) =>
                          handleChange({
                            appearanceBgImageUrl:
                              e.target.value || undefined,
                          })
                        }
                      />
                    </div>
                  )}
                </>
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
                onClick={() =>
                  handleChange({
                    appearanceBlockStyle: 'basic',
                    appearanceBlockRadius: 'rounded',
                    appearanceBlockColor: undefined,
                  })
                }
              >
                ↻
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <BlockRow
                label="Basic"
                description="Bordered cards"
                selected={blockStyle === 'basic'}
                onSelect={() => {
                  setBlockStyle('basic')
                  handleChange({ appearanceBlockStyle: 'basic' })
                }}
                variant="basic"
                radius={blockRadius}
              />
              <BlockRow
                label="Flatten"
                description="Flat background"
                selected={blockStyle === 'flat'}
                onSelect={() => {
                  setBlockStyle('flat')
                  handleChange({ appearanceBlockStyle: 'flat' })
                }}
                variant="flat"
                radius={blockRadius}
              />
              <BlockRow
                label="Shadow"
                description="Raised cards"
                selected={blockStyle === 'shadow'}
                onSelect={() => {
                  setBlockStyle('shadow')
                  handleChange({ appearanceBlockStyle: 'shadow' })
                }}
                variant="shadow"
                radius={blockRadius}
              />

              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <Label className="text-xs uppercase tracking-wide text-zinc-500">
                  Corners
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={blockRadius === 'rounded' ? 'default' : 'outline'}
                    className={cn(
                      'h-20 justify-start gap-3 rounded-2xl border-zinc-200',
                      blockRadius === 'rounded'
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                        : 'bg-white',
                    )}
                    onClick={() => {
                      setBlockRadius('rounded')
                      handleChange({ appearanceBlockRadius: 'rounded' })
                    }}
                  >
                    <Square className="h-6 w-6 rounded-2xl border border-current" />
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-medium">Rounded</span>
                      <span className="text-xs text-zinc-500">
                        Softer, friendly cards
                      </span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={blockRadius === 'square' ? 'default' : 'outline'}
                    className={cn(
                      'h-20 justify-start gap-3 rounded-2xl border-zinc-200',
                      blockRadius === 'square'
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                        : 'bg-white',
                    )}
                    onClick={() => {
                      setBlockRadius('square')
                      handleChange({ appearanceBlockRadius: 'square' })
                    }}
                  >
                    <SquareDashed className="h-6 w-6 border border-dashed border-current" />
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-sm font-medium">Straight</span>
                      <span className="text-xs text-zinc-500">
                        Sharp, minimal corners
                      </span>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-zinc-500">
                  Color
                </Label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-lg border border-zinc-200"
                    style={{
                      backgroundColor:
                        user.appearanceBlockColor || '#FFFFFF',
                    }}
                  />
                  <Input
                    placeholder="#FFFFFF"
                    defaultValue={user.appearanceBlockColor ?? ''}
                    onBlur={(e) =>
                      handleChange({
                        appearanceBlockColor: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              </div>
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

function WallpaperOption(props: {
  label: string
  value: WallpaperStyle
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        'flex flex-col items-start justify-between rounded-2xl border px-3 py-2.5 text-left text-xs font-medium transition-all',
        'border-zinc-200 bg-white hover:border-zinc-300',
        props.active && 'border-emerald-500 ring-1 ring-emerald-500/40',
      )}
    >
      <div className="w-full h-14 rounded-xl bg-linear-to-tr from-zinc-100 via-zinc-50 to-white mb-2" />
      <span className="text-zinc-800">{props.label}</span>
    </button>
  )
}

function BlockRow(props: {
  label: string
  description: string
  selected: boolean
  onSelect: () => void
  variant: 'basic' | 'flat' | 'shadow'
  radius: BlockRadius
}) {
  const radiusClass = props.radius === 'rounded' ? 'rounded-2xl' : 'rounded-md'

  const base =
    props.variant === 'flat'
      ? 'bg-zinc-50 border-transparent shadow-none'
      : props.variant === 'shadow'
        ? 'bg-white border border-zinc-900/80 shadow-[0_4px_0_rgba(0,0,0,0.9)]'
        : 'bg-white border border-zinc-200 shadow-sm'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-zinc-900">{props.label}</p>
          <p className="text-xs text-zinc-500">{props.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={props.onSelect}
          className={cn(
            'h-11 w-full cursor-pointer border px-3 py-2 text-left text-xs transition-all',
            'border-transparent bg-transparent',
            props.selected && 'border-emerald-500 ring-1 ring-emerald-500/40',
          )}
        >
          <div className={cn('h-7 w-full', base, radiusClass)} />
        </button>
        <div className="h-11 w-full border border-dashed border-zinc-200 rounded-xl" />
      </div>
    </div>
  )
}

function AppearancePreview(props: {
  user: {
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
    appearanceBgType: BgMode
    appearanceBgWallpaperStyle: WallpaperStyle
    appearanceBgColor?: string
    appearanceBgImageUrl?: string
    appearanceBlockStyle: BlockStyle
    appearanceBlockRadius: BlockRadius
    appearanceBlockColor?: string
  }
}) {
  const {
    appearanceBgType,
    appearanceBgWallpaperStyle,
    appearanceBgColor,
    appearanceBgImageUrl,
    appearanceBlockStyle,
    appearanceBlockRadius,
    appearanceBlockColor,
  } = props.user

  const bgStyle =
    appearanceBgType === 'banner'
      ? {
        backgroundImage:
          appearanceBgImageUrl ||
          'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
      : appearanceBgWallpaperStyle === 'image'
        ? {
          backgroundImage:
            appearanceBgImageUrl ||
            'url(https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=1200&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
        : appearanceBgWallpaperStyle === 'avatar'
          ? {
            background:
              'radial-gradient(circle at center, rgba(15,23,42,0.1), #020617)',
          }
          : {
            background:
              appearanceBgColor ||
              (appearanceBgWallpaperStyle === 'gradient'
                ? 'linear-gradient(135deg,#22c55e,#3b82f6,#a855f7)'
                : '#FAFAFA'),
          }

  const cardBase =
    appearanceBlockStyle === 'flat'
      ? 'bg-zinc-50 border-transparent shadow-none'
      : appearanceBlockStyle === 'shadow'
        ? 'bg-white border border-zinc-900/80 shadow-[0_4px_0_rgba(0,0,0,0.9)]'
        : 'bg-white border border-zinc-200 shadow-sm'

  const radiusClass =
    appearanceBlockRadius === 'rounded' ? 'rounded-2xl' : 'rounded-md'

  return (
    <div className="w-full bg-slate-900/5 p-4">
      <div className="mx-auto aspect-9/16 w-full max-w-[260px] overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-xl">
        <div className="relative h-32 w-full" style={bgStyle}>
          <div className="absolute inset-0 bg-black/15" />
        </div>
        <div className="px-4 -mt-8 pb-4 space-y-3">
          <div
            className={cn(
              'inline-flex h-14 w-14 items-center justify-center border-4 border-white bg-zinc-900 text-white text-lg font-bold shadow-md',
              'rounded-full',
            )}
          >
            {props.user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-900">
              {props.user.name}
            </p>
            {props.user.title && (
              <p className="text-xs text-zinc-500">{props.user.title}</p>
            )}
          </div>
          <div className="space-y-2 pt-2">
            <div
              className={cn(
                'px-4 py-3 text-xs font-medium text-zinc-900 flex items-center justify-between',
                cardBase,
                radiusClass,
              )}
              style={{
                backgroundColor: appearanceBlockColor || undefined,
              }}
            >
              <span>My portfolio</span>
            </div>
            <div
              className={cn(
                'px-4 py-3 text-xs font-medium text-zinc-900 flex items-center justify-between',
                cardBase,
                radiusClass,
              )}
              style={{
                backgroundColor: appearanceBlockColor || undefined,
              }}
            >
              <span>Contact</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

