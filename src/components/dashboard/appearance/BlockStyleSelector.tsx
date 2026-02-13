import { Check } from 'lucide-react'
import type { BlockRadius, BlockStyle } from './types'
import { cn } from '@/lib/utils'

interface BlockStyleSelectorProps {
  blockStyle: BlockStyle
  blockRadius: BlockRadius
  onStyleChange: (style: BlockStyle) => void
  onRadiusChange: (radius: BlockRadius) => void
}

function OptionCard({
  selected,
  rounded,
  style,
}: {
  selected: boolean
  rounded: boolean
  style: BlockStyle
}) {
  return (
    <div
      className={cn(
        'relative border p-3 transition-all',
        rounded ? 'rounded-2xl' : 'rounded-none',
        selected ? 'border-emerald-500 ring-4 ring-emerald-200' : 'border-zinc-300',
      )}
    >
      <div
        className={cn(
          'h-24 w-full bg-zinc-200',
          rounded ? 'rounded-xl' : 'rounded-none',
          style === 'basic' && 'border border-zinc-300 shadow-sm',
          style === 'flat' && 'border-0 shadow-none',
          style === 'shadow' && 'border border-zinc-900 shadow-[10px_10px_0px_#18181b]',
        )}
      />
      {selected ? (
        <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </div>
  )
}

export function BlockStyleSelector({
  blockStyle,
  blockRadius,
  onStyleChange,
  onRadiusChange,
}: BlockStyleSelectorProps) {
  const styles: Array<{ key: BlockStyle; label: string }> = [
    { key: 'basic', label: 'Basic' },
    { key: 'flat', label: 'Flatten' },
    { key: 'shadow', label: 'Shadow' },
  ]

  return (
    <div className="space-y-8">
      {styles.map((styleItem) => (
        <div key={styleItem.key} className="space-y-4">
          <p className="text-2xl font-medium text-zinc-900">{styleItem.label}</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <button type="button" onClick={() => { onStyleChange(styleItem.key); onRadiusChange('rounded') }}>
              <OptionCard
                selected={blockStyle === styleItem.key && blockRadius === 'rounded'}
                rounded
                style={styleItem.key}
              />
            </button>
            <button type="button" onClick={() => { onStyleChange(styleItem.key); onRadiusChange('square') }}>
              <OptionCard
                selected={blockStyle === styleItem.key && blockRadius === 'square'}
                rounded={false}
                style={styleItem.key}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
