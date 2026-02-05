import React from 'react'
import { GRADIENT_PRESETS, LOCAL_BANNER_IMAGES } from './banner-presets'
import type { BannerPreset } from './types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BannerSelectorProps {
  currentBannerUrl?: string
  currentBannerId?: string
  currentBgColor?: string
  onBannerSelect: (imageUrl: string, bannerId?: string) => void
  onColorChange: (color: string | undefined) => void
}

export function BannerSelector({
  currentBannerUrl,
  currentBannerId,
  currentBgColor,
  onBannerSelect,
  onColorChange,
}: BannerSelectorProps) {
  const isCustomBanner = React.useMemo(() => {
    if (!currentBannerUrl) return false
    // Check if it's a local banner
    if (LOCAL_BANNER_IMAGES.some((b) => b.image === currentBannerUrl))
      return false
    // Check if it's a gradient (no imageUrl but has color)
    if (
      currentBannerId &&
      (currentBannerId === 'gradient-blue' ||
        currentBannerId === 'gradient-purple')
    ) {
      return false
    }
    // Otherwise it's a custom URL
    return true
  }, [currentBannerUrl, currentBannerId])

  const [showCustomUrl, setShowCustomUrl] = React.useState(false)
  const [customUrl, setCustomUrl] = React.useState(
    isCustomBanner ? currentBannerUrl || '' : '',
  )

  const handleGradientSelect = (preset: BannerPreset) => {
    if (preset.id === 'gradient-blue') {
      onBannerSelect('', preset.id)
      onColorChange(
        'linear-gradient(to right, rgb(14, 165, 233), rgb(56, 189, 248), rgb(52, 211, 153))',
      )
    } else if (preset.id === 'gradient-purple') {
      onBannerSelect('', preset.id)
      onColorChange(
        'linear-gradient(to right, rgb(139, 92, 246), rgb(217, 70, 239), rgb(251, 191, 36))',
      )
    }
    setCustomUrl('')
    setShowCustomUrl(false)
  }

  const handleLocalImageSelect = (preset: BannerPreset) => {
    onBannerSelect(preset.image, preset.id)
    setCustomUrl('')
    setShowCustomUrl(false)
  }

  const handleCustomUrlSubmit = () => {
    if (customUrl.trim()) {
      onBannerSelect(customUrl.trim(), 'custom')
      setShowCustomUrl(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Local Banner Images Grid */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-zinc-700">
          Banner Images
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {LOCAL_BANNER_IMAGES.map((preset) => {
            const isSelected =
              currentBannerId === preset.id || currentBannerUrl === preset.image
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLocalImageSelect(preset)}
                className={cn(
                  'relative aspect-video w-full overflow-hidden rounded-lg border-2 transition-all',
                  'border-zinc-200 hover:border-zinc-300',
                  isSelected && 'border-emerald-500 ring-2 ring-emerald-500/40',
                )}
              >
                <img
                  src={preset.image}
                  alt={preset.label}
                  className="h-full w-full object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-emerald-500/20" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Gradient Presets */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-zinc-700">
          Gradient Presets
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {GRADIENT_PRESETS.map((preset) => {
            const isSelected = currentBannerId === preset.id
            const gradientClass =
              preset.id === 'gradient-blue'
                ? 'bg-gradient-to-r from-sky-500 via-sky-400 to-emerald-400'
                : 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-300'

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleGradientSelect(preset)}
                className={cn(
                  'relative flex h-14 w-full items-center justify-center rounded-xl border px-4 text-left text-xs font-medium transition-all',
                  'border-zinc-200 bg-white hover:border-zinc-300',
                  isSelected && 'border-emerald-500 ring-1 ring-emerald-500/40',
                )}
              >
                <div
                  className={cn(
                    'absolute inset-0 rounded-[11px]',
                    gradientClass,
                  )}
                />
                <span className="relative z-10 text-white drop-shadow-sm">
                  {preset.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom URL Input */}
      <div className="space-y-3 pt-2 border-t border-zinc-100">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="custom-banner-url"
            className="text-xs font-medium text-zinc-700"
          >
            Custom Image URL
          </Label>
          {!showCustomUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowCustomUrl(true)}
            >
              + Add URL
            </Button>
          )}
        </div>
        {showCustomUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                id="custom-banner-url"
                placeholder="https://example.com/image.jpg"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomUrlSubmit()
                  }
                  if (e.key === 'Escape') {
                    setShowCustomUrl(false)
                    setCustomUrl('')
                  }
                }}
                className="text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCustomUrlSubmit}
                disabled={!customUrl.trim()}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomUrl(false)
                  setCustomUrl('')
                }}
              >
                Cancel
              </Button>
            </div>
            {isCustomBanner && currentBannerUrl && !showCustomUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-200">
                <img
                  src={currentBannerUrl}
                  alt="Custom banner"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Background Color */}
      <div className="space-y-2 pt-2 border-t border-zinc-100">
        <Label
          htmlFor="banner-bg-color"
          className="text-xs font-medium text-zinc-700"
        >
          Background Color
        </Label>
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg border border-zinc-200 shrink-0"
            style={{
              backgroundColor: currentBgColor || '#F8F2F2',
            }}
          />
          <Input
            id="banner-bg-color"
            placeholder="#F8F2F2"
            defaultValue={currentBgColor ?? ''}
            onBlur={(e) => onColorChange(e.target.value || undefined)}
            className="text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 rounded-full text-xs text-zinc-500 shrink-0"
            onClick={() => onColorChange(undefined)}
          >
            ↻
          </Button>
        </div>
      </div>
    </div>
  )
}
