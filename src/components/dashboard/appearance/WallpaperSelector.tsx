import React from 'react'
import type { WallpaperStyle } from './types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ImageUploader } from './ImageUploader'
import { cn } from '@/lib/utils'

interface WallpaperSelectorProps {
  wallpaperStyle: WallpaperStyle
  wallpaperColor?: string
  gradientTop?: string
  gradientBottom?: string
  currentImageUrl?: string
  onStyleChange: (style: WallpaperStyle) => void
  onWallpaperColorChange: (color: string | undefined) => void
  onGradientChange: (
    top: string | undefined,
    bottom: string | undefined,
  ) => void
  onImageUrlChange: (url: string | undefined) => void
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

export function WallpaperSelector({
  wallpaperStyle,
  wallpaperColor,
  gradientTop,
  gradientBottom,
  currentImageUrl,
  onStyleChange,
  onWallpaperColorChange,
  onGradientChange,
  onImageUrlChange,
}: WallpaperSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Style Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <WallpaperOption
          label="Flat Color"
          value="flat"
          active={wallpaperStyle === 'flat'}
          onClick={() => onStyleChange('flat')}
        />
        <WallpaperOption
          label="Gradient"
          value="gradient"
          active={wallpaperStyle === 'gradient'}
          onClick={() => onStyleChange('gradient')}
        />
        <WallpaperOption
          label="Avatar Blur"
          value="avatar"
          active={wallpaperStyle === 'avatar'}
          onClick={() => onStyleChange('avatar')}
        />
        <WallpaperOption
          label="Image"
          value="image"
          active={wallpaperStyle === 'image'}
          onClick={() => onStyleChange('image')}
        />
      </div>

      {/* Flat Color Picker */}
      {wallpaperStyle === 'flat' && (
        <div className="space-y-3 pt-2 border-t border-zinc-100">
          <Label className="text-xs font-medium text-zinc-700">
            Background Color
          </Label>
          <div className="flex gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-200 shadow-sm focus-within:ring-2 focus-within:ring-zinc-900/20">
              <input
                type="color"
                className="absolute inset-0 h-[150%] w-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-none p-0 opacity-100"
                value={wallpaperColor || '#F8FAFC'}
                onChange={(e) => onWallpaperColorChange(e.target.value)}
              />
            </div>
            <div className="relative flex-1">
              <Input
                placeholder="#F8FAFC"
                value={wallpaperColor ?? ''}
                onChange={(e) => onWallpaperColorChange(e.target.value)}
                className="h-10 text-xs font-mono uppercase"
              />
            </div>
          </div>
        </div>
      )}

      {/* Gradient Pickers */}
      {wallpaperStyle === 'gradient' && (
        <div className="space-y-3 pt-2 border-t border-zinc-100">
          <Label className="text-xs font-medium text-zinc-700">
            Gradient Colors
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Top Color
              </Label>
              <div className="flex gap-2">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
                  <input
                    type="color"
                    className="absolute inset-0 h-[150%] w-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-none p-0 opacity-100"
                    value={gradientTop || '#FFFFFF'}
                    onChange={(e) =>
                      onGradientChange(e.target.value, gradientBottom)
                    }
                  />
                </div>
                <Input
                  placeholder="#FFFFFF"
                  value={gradientTop ?? ''}
                  onChange={(e) =>
                    onGradientChange(e.target.value, gradientBottom)
                  }
                  className="h-8 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Bottom Color
              </Label>
              <div className="flex gap-2">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-zinc-200 shadow-sm">
                  <input
                    type="color"
                    className="absolute inset-0 h-[150%] w-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-none p-0 opacity-100"
                    value={gradientBottom || '#000000'}
                    onChange={(e) =>
                      onGradientChange(gradientTop, e.target.value)
                    }
                  />
                </div>
                <Input
                  placeholder="#000000"
                  value={gradientBottom ?? ''}
                  onChange={(e) =>
                    onGradientChange(gradientTop, e.target.value)
                  }
                  className="h-8 text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image URL (only for image style) */}
      {wallpaperStyle === 'image' && (
        <div className="space-y-2 pt-2 border-t border-zinc-100">
          <Label className="text-xs font-medium text-zinc-700">
            Wallpaper Image
          </Label>
          <ImageUploader
            value={currentImageUrl}
            onChange={(url) => onImageUrlChange(url || undefined)}
            folder="wallpapers"
            aspectRatio="square"
          />
        </div>
      )}
    </div>
  )
}
