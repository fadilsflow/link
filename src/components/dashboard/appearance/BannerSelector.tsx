import React from 'react'
import { LOCAL_BANNER_IMAGES } from './banner-presets'
import { ImageUploader } from './ImageUploader'
import type { BannerPreset } from './types'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface BannerSelectorProps {
  currentBannerUrl?: string
  currentBannerId?: string
  onBannerSelect: (imageUrl: string, bannerId?: string) => void
}

export function BannerSelector({
  currentBannerUrl,
  currentBannerId,
  onBannerSelect,
}: BannerSelectorProps) {
  const isCustomBanner = React.useMemo(() => {
    if (!currentBannerUrl) return false
    return !LOCAL_BANNER_IMAGES.some((b) => b.image === currentBannerUrl)
  }, [currentBannerUrl])

  const handleLocalImageSelect = (preset: BannerPreset) => {
    onBannerSelect(preset.image, preset.id)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-medium text-zinc-700">Banner Images</Label>
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
                {isSelected ? <div className="absolute inset-0 bg-emerald-500/20" /> : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-zinc-100">
        <Label className="text-xs font-medium text-zinc-700">Custom Image</Label>
        <ImageUploader
          value={isCustomBanner ? currentBannerUrl : undefined}
          onChange={(url) => onBannerSelect(url || '', 'custom')}
          aspectRatio="wide"
          folder="banners"
        />
      </div>
    </div>
  )
}
