import React from 'react'
import { LOCAL_BANNER_IMAGES } from './banner-presets'
import { ImageUploader } from './ImageUploader'
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
    // Otherwise it's a custom URL
    return true
  }, [currentBannerUrl])

  const handleLocalImageSelect = (preset: BannerPreset) => {
    onBannerSelect(preset.image, preset.id)
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

      {/* Custom Image */}
      <div className="space-y-3 pt-2 border-t border-zinc-100">
        <Label className="text-xs font-medium text-zinc-700">
          Custom Image
        </Label>

        <ImageUploader
          value={isCustomBanner ? currentBannerUrl : undefined}
          onChange={(url) => {
            if (url) {
              onBannerSelect(url, 'custom')
            } else {
              onBannerSelect('', 'custom')
            }
          }}
          aspectRatio="wide"
          folder="banners"
        />
      </div>

      {/* Page Background Color */}
      <div className="space-y-3 pt-2 border-t border-zinc-100">
        <Label
          htmlFor="banner-bg-color"
          className="text-xs font-medium text-zinc-700"
        >
          Page Background Color
        </Label>
        <div className="flex gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-200 shadow-sm focus-within:ring-2 focus-within:ring-zinc-900/20">
            <input
              type="color"
              className="absolute inset-0 h-[150%] w-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-none p-0 opacity-100"
              value={currentBgColor || '#F8F2F2'}
              onChange={(e) => onColorChange(e.target.value)}
            />
          </div>

          <div className="relative flex-1">
            <Input
              id="banner-bg-color"
              placeholder="#F8F2F2"
              value={currentBgColor ?? ''}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-10 text-xs font-mono uppercase"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl text-zinc-500 hover:bg-zinc-100"
            onClick={() => onColorChange(undefined)}
            title="Reset to default"
          >
            ↻
          </Button>
        </div>
        <p className="text-[10px] text-zinc-500">
          This color will be applied to the background of your page.
        </p>
      </div>
    </div>
  )
}
