import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Palette, Image as ImageIcon, Square, SquareDashed } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { getDashboardData } from '@/lib/profile-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'

export const Route = createFileRoute('/$username/admin/appearance')({
  component: AppearanceRouteComponent,
})

type BgType = 'banner' | 'color' | 'image'
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
      appearanceBgType?: BgType
      appearanceBgColor?: string
      appearanceBgImageUrl?: string
      appearanceBlockStyle?: BlockStyle
      appearanceBlockRadius?: BlockRadius
    }) => trpcClient.user.updateProfile.mutate(data),
  })

  if (!user) return null

  const currentBgType: BgType = (user.appearanceBgType as BgType) ?? 'banner'
  const currentBlockStyle: BlockStyle =
    (user.appearanceBlockStyle as BlockStyle) ?? 'basic'
  const currentBlockRadius: BlockRadius =
    (user.appearanceBlockRadius as BlockRadius) ?? 'rounded'

  const handleChange = (patch: Partial<Parameters<typeof updateAppearance.mutate>[0]>) => {
    if (updateAppearance.status === 'pending') return
    updateAppearance.mutate({
      userId: user.id,
      appearanceBgType: currentBgType,
      appearanceBgColor: user.appearanceBgColor ?? undefined,
      appearanceBgImageUrl: user.appearanceBgImageUrl ?? undefined,
      appearanceBlockStyle: currentBlockStyle,
      appearanceBlockRadius: currentBlockRadius,
      ...patch,
    })
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-6 lg:p-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Appearance
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Customize your background and how your blocks look.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] items-start">
        {/* Controls */}
        <div className="space-y-6">
          <Card className="border-zinc-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-zinc-500" />
                Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                defaultValue={currentBgType}
                onValueChange={(value) =>
                  handleChange({ appearanceBgType: value as BgType })
                }
              >
                <BackgroundOption
                  value="banner"
                  label="Banner"
                  description="Banner image + color"
                />
                <BackgroundOption
                  value="color"
                  label="Color"
                  description="Flat / gradient color"
                />
                <BackgroundOption
                  value="image"
                  label="Image"
                  description="Full image background"
                />
              </RadioGroup>

              {currentBgType === 'color' && (
                <div className="space-y-2">
                  <Label htmlFor="bg-color">Background color</Label>
                  <Input
                    id="bg-color"
                    placeholder="e.g. #0f172a or linear-gradient(...)"
                    defaultValue={user.appearanceBgColor ?? ''}
                    onBlur={(e) =>
                      handleChange({
                        appearanceBgColor: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              )}

              {currentBgType !== 'color' && (
                <div className="space-y-2">
                  <Label htmlFor="bg-image">Background image URL</Label>
                  <Input
                    id="bg-image"
                    placeholder="https://..."
                    defaultValue={user.appearanceBgImageUrl ?? ''}
                    onBlur={(e) =>
                      handleChange({
                        appearanceBgImageUrl: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-zinc-500" />
                Block style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-zinc-500">
                  Card type
                </Label>
                <RadioGroup
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  defaultValue={currentBlockStyle}
                  onValueChange={(value) =>
                    handleChange({
                      appearanceBlockStyle: value as BlockStyle,
                    })
                  }
                >
                  <BlockStyleOption
                    value="basic"
                    label="Basic"
                    description="Subtle border"
                  />
                  <BlockStyleOption
                    value="flat"
                    label="Flat"
                    description="Minimal, no shadow"
                  />
                  <BlockStyleOption
                    value="shadow"
                    label="Shadow"
                    description="Lifted cards"
                  />
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-zinc-500">
                  Corners
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={currentBlockRadius === 'rounded' ? 'default' : 'outline'}
                    className={cn(
                      'h-20 justify-start gap-3 rounded-2xl border-zinc-200',
                      currentBlockRadius === 'rounded'
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                        : 'bg-white',
                    )}
                    onClick={() =>
                      handleChange({ appearanceBlockRadius: 'rounded' })
                    }
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
                    variant={currentBlockRadius === 'square' ? 'default' : 'outline'}
                    className={cn(
                      'h-20 justify-start gap-3 rounded-2xl border-zinc-200',
                      currentBlockRadius === 'square'
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                        : 'bg-white',
                    )}
                    onClick={() =>
                      handleChange({ appearanceBlockRadius: 'square' })
                    }
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
                  appearanceBgType: currentBgType,
                  appearanceBgColor: user.appearanceBgColor ?? undefined,
                  appearanceBgImageUrl: user.appearanceBgImageUrl ?? undefined,
                  appearanceBlockStyle: currentBlockStyle,
                  appearanceBlockRadius: currentBlockRadius,
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

function BackgroundOption(props: {
  value: BgType
  label: string
  description: string
}) {
  return (
    <Label className="cursor-pointer">
      <div className="relative flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-left shadow-xs/10 hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-zinc-900">
            {props.label}
          </span>
          <RadioGroupItem value={props.value} />
        </div>
        <span className="text-xs text-zinc-500">{props.description}</span>
      </div>
    </Label>
  )
}

function BlockStyleOption(props: {
  value: BlockStyle
  label: string
  description: string
}) {
  return (
    <Label className="cursor-pointer">
      <div className="relative flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-left shadow-xs/10 hover:border-zinc-300 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-zinc-900">
            {props.label}
          </span>
          <RadioGroupItem value={props.value} />
        </div>
        <span className="text-xs text-zinc-500">{props.description}</span>
      </div>
    </Label>
  )
}

function AppearancePreview(props: {
  user: {
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
    appearanceBgType: BgType
    appearanceBgColor?: string
    appearanceBgImageUrl?: string
    appearanceBlockStyle: BlockStyle
    appearanceBlockRadius: BlockRadius
  }
}) {
  const {
    appearanceBgType,
    appearanceBgColor,
    appearanceBgImageUrl,
    appearanceBlockStyle,
    appearanceBlockRadius,
  } = props.user

  const bgStyle =
    appearanceBgType === 'color'
      ? {
        background:
          appearanceBgColor ||
          'radial-gradient(circle at top, #1f2937, #020617)',
      }
      : {
        backgroundImage: `url(${appearanceBgImageUrl ||
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop'
          })`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }

  const cardBase =
    appearanceBlockStyle === 'flat'
      ? 'bg-white border border-zinc-200'
      : appearanceBlockStyle === 'shadow'
        ? 'bg-white border-none shadow-md'
        : 'bg-white border border-zinc-100 shadow-sm'

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
            >
              <span>My portfolio</span>
            </div>
            <div
              className={cn(
                'px-4 py-3 text-xs font-medium text-zinc-900 flex items-center justify-between',
                cardBase,
                radiusClass,
              )}
            >
              <span>Contact</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
