import React from 'react'
import { Square, SquareDashed } from 'lucide-react'
import type { BlockRadius, BlockStyle } from './types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

function BlockRow(props: {
  label: string
  description: string
  selected: boolean
  onSelect: () => void
  variant: BlockStyle
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
    <div className="space-y-6">
      {/* Style Options */}
      <BlockRow
        label="Basic"
        description="Bordered cards"
        selected={blockStyle === 'basic'}
        onSelect={() => onStyleChange('basic')}
        variant="basic"
        radius={blockRadius}
      />
      <BlockRow
        label="Flatten"
        description="Flat background"
        selected={blockStyle === 'flat'}
        onSelect={() => onStyleChange('flat')}
        variant="flat"
        radius={blockRadius}
      />
      <BlockRow
        label="Shadow"
        description="Raised cards"
        selected={blockStyle === 'shadow'}
        onSelect={() => onStyleChange('shadow')}
        variant="shadow"
        radius={blockRadius}
      />

      {/* Corner Radius */}
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
            onClick={() => onRadiusChange('rounded')}
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
            onClick={() => onRadiusChange('square')}
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

      {/* Block Color */}
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-zinc-500">
          Color
        </Label>
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg border border-zinc-200 shrink-0"
            style={{
              backgroundColor: currentBlockColor || '#FFFFFF',
            }}
          />
          <Input
            placeholder="#FFFFFF"
            defaultValue={currentBlockColor ?? ''}
            onBlur={(e) => onColorChange(e.target.value || undefined)}
            className="text-xs"
          />
        </div>
      </div>
    </div>
  )
}
