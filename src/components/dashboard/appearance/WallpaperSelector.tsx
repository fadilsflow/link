import React from 'react'
import type { WallpaperStyle } from './types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ImageUploader } from './ImageUploader'
import { cn } from '@/lib/utils'

interface WallpaperSelectorProps {
  wallpaperStyle: WallpaperStyle
  currentBgColor?: string
  currentImageUrl?: string
  onStyleChange: (style: WallpaperStyle) => void
  onColorChange: (color: string | undefined) => void
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
  currentBgColor,
  currentImageUrl,
  onStyleChange,
  onColorChange,
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

      {/* Background Color */}
      <div className="space-y-2 pt-2 border-t border-zinc-100">
        <Label
          htmlFor="wallpaper-color"
          className="text-xs font-medium text-zinc-700"
        >
          Color
        </Label>
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg border border-zinc-200 shrink-0"
            style={{
              background:
                currentBgColor ||
                (wallpaperStyle === 'gradient'
                  ? 'linear-gradient(90deg,#6EE7B7,#3B82F6,#A855F7)'
                  : '#FAFAFA'),
            }}
          />
          <Input
            id="wallpaper-color"
            placeholder={
              wallpaperStyle === 'gradient' ? 'linear-gradient(...)' : '#FAFAFA'
            }
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

      {/* Image URL (only for image style) */}
      {wallpaperStyle === 'image' && (
        <div className="space-y-2">
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
