import React from 'react'
import { Check } from 'lucide-react'
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
        <ImageUploader
          value={isCustomBanner ? currentBannerUrl : undefined}
          onChange={(url) => onBannerSelect(url || '', 'custom')}
          aspectRatio="wide"
          folder="banners"
          placeholder="1440*190px"
        />
        <div className="grid grid-cols-2 gap-2">
          {LOCAL_BANNER_IMAGES.map((preset) => {
            const isSelected =
              currentBannerId === preset.id || currentBannerUrl === preset.image

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleLocalImageSelect(preset)}
                className={cn(
                  'relative h-[46px] w-[264px] overflow-hidden rounded-lg transition-all',
                )}
              >
                <img
                  src={preset.image}
                  alt={preset.label}
                  className={cn(
                    'h-full w-full object-cover transition-opacity',
                    isSelected ? 'opacity-90' : 'opacity-100',
                  )}
                />
                {isSelected ? (
                  <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm">
                    <Check className="h-3 w-3" />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
