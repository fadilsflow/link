import { Check } from 'lucide-react'
import type { BlockRadius, BlockStyle } from './types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface BlockStyleSelectorProps {
  blockStyle: BlockStyle
  blockRadius: BlockRadius
  currentBlockColor?: string
  onStyleChange: (style: BlockStyle) => void
  onRadiusChange: (radius: BlockRadius) => void
  onColorChange: (color: string | undefined) => void
  onReset: () => void
}

function StyleOption({
  label,
  value,
  active,
  onClick,
  previewClass,
}: {
  label: string
  value: BlockStyle
  active: boolean
  onClick: () => void
  previewClass: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all hover:bg-zinc-50 focus:outline-none',
        active
          ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
          : 'border-zinc-200 bg-white',
      )}
    >
      <div
        className={cn('h-16 w-full rounded-lg transition-all', previewClass)}
      />
      <span
        className={cn(
          'text-xs font-semibold',
          active ? 'text-zinc-900' : 'text-zinc-600',
        )}
      >
        {label}
      </span>
      {active && (
        <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  )
}

export function BlockStyleSelector({
  blockStyle,
  blockRadius,
  currentBlockColor,
  onStyleChange,
  onRadiusChange,
  onColorChange,
  onReset,
}: BlockStyleSelectorProps) {
  return (
    <div className="space-y-8">
      {/* Style Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-zinc-900">
            Card Style
          </Label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StyleOption
            label="Basic"
            value="basic"
            active={blockStyle === 'basic'}
            onClick={() => onStyleChange('basic')}
            previewClass="bg-white border border-zinc-200 shadow-sm"
          />
          <StyleOption
            label="Flat"
            value="flat"
            active={blockStyle === 'flat'}
            onClick={() => onStyleChange('flat')}
            previewClass="bg-zinc-100 border-transparent shadow-none"
          />
          <StyleOption
            label="Shadow"
            value="shadow"
            active={blockStyle === 'shadow'}
            onClick={() => onStyleChange('shadow')}
            previewClass="bg-white border-none shadow-[5px_5px_0_rgba(0,0,0,1)] border border-zinc-900"
          />
        </div>
      </div>

      {/* Customize Section */}
      <div className="space-y-4">
        <Label className="text-sm font-semibold text-zinc-900">
          Customization
        </Label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-zinc-50 border border-zinc-100">
          {/* Radius */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Corners
            </Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onRadiusChange('rounded')}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-2 h-20 rounded-xl border transition-all',
                  blockRadius === 'rounded'
                    ? 'bg-white border-zinc-900 shadow-sm text-zinc-900'
                    : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300',
                )}
              >
                <div className="h-6 w-6 border-2 border-current rounded-lg" />
                <span className="text-xs font-medium">Rounded</span>
              </button>

              <button
                type="button"
                onClick={() => onRadiusChange('square')}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-2 h-20 rounded-xl border transition-all',
                  blockRadius === 'square'
                    ? 'bg-white border-zinc-900 shadow-sm text-zinc-900'
                    : 'bg-white border-zinc-200 text-zinc-400 hover:border-zinc-300',
                )}
              >
                <div className="h-6 w-6 border-2 border-current rounded-sm" />
                <span className="text-xs font-medium">Square</span>
              </button>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Card Color
            </Label>
            <div className="flex gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-zinc-200 shadow-sm focus-within:ring-2 focus-within:ring-zinc-900/20">
                <input
                  type="color"
                  className="absolute inset-0 h-[150%] w-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-none p-0 opacity-100"
                  value={currentBlockColor || '#FFFFFF'}
                  onChange={(e) => onColorChange(e.target.value)}
                />
              </div>
              <div className="relative flex-1">
                <Input
                  placeholder="#FFFFFF"
                  value={currentBlockColor ?? ''}
                  onChange={(e) => onColorChange(e.target.value || undefined)}
                  className="h-10 text-xs font-mono uppercase"
                />
              </div>
            </div>

            {/* Color Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                '#FFFFFF',
                '#F4F4F5',
                '#18181B',
                '#E11D48',
                '#2563EB',
                '#16A34A',
                '#D97706',
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onColorChange(color)}
                  className={cn(
                    'h-6 w-6 rounded-full border border-zinc-200 transition-all hover:scale-110 active:scale-95',
                    currentBlockColor?.toUpperCase() === color.toUpperCase() &&
                      'ring-2 ring-zinc-900 ring-offset-2',
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
