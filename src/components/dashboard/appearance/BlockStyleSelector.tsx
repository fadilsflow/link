import { Check } from 'lucide-react'
import type { BlockRadius, BlockStyle } from '@/lib/block-styles'
import { cn } from '@/lib/utils'
import { getBlockCardBase, getBlockRadius } from '@/lib/block-styles'

interface BlockStyleSelectorProps {
  blockStyle: BlockStyle
  blockRadius: BlockRadius
  onChange: (style: BlockStyle, radius: BlockRadius) => void
}

function OptionCard({
  selected,
  radius,
  style,
}: {
  selected: boolean
  radius: BlockRadius
  style: BlockStyle
}) {
  return (
    <div
      className={cn(
        'relative p-4 transition-all duration-200 rounded-xl',
        // getBlockRadius(radius),
        selected ? 'bg-input/80 ' : '',
      )}
    >
      <div
        className={cn(
          'h-16 w-full flex items-center justify-center transition-all',
          getBlockRadius(radius),
          getBlockCardBase(style),
          // Override bg-card and border-border with zinc for preview consistency if variables aren't loaded
          'bg-card',
        )}
      >
        <div className="h-1.5 w-1/3 bg-input rounded-full" />
      </div>
      {selected ? (
        <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm">
          <Check className="h-3 w-3" />
        </span>
      ) : null}
    </div>
  )
}

export function BlockStyleSelector({
  blockStyle,
  blockRadius,
  onChange,
}: BlockStyleSelectorProps) {
  const styles: Array<{ key: BlockStyle; label: string }> = [
    {
      key: 'basic',
      label: 'Basic',
    },
    {
      key: 'flat',
      label: 'Flat',
    },
    {
      key: 'shadow',
      label: 'Shadow',
    },
  ]

  return (
    <div className="space-y-4">
      {styles.map((styleItem) => (
        <div key={styleItem.key} className="space-y-4">
          <h3 className="text-md">{styleItem.label}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <button
                type="button"
                className="w-full text-left focus:outline-none"
                onClick={() => {
                  onChange(styleItem.key, 'rounded')
                }}
              >
                <OptionCard
                  selected={
                    blockStyle === styleItem.key && blockRadius === 'rounded'
                  }
                  radius="rounded"
                  style={styleItem.key}
                />
              </button>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                className="w-full text-left focus:outline-none"
                onClick={() => {
                  onChange(styleItem.key, 'square')
                }}
              >
                <OptionCard
                  selected={
                    blockStyle === styleItem.key && blockRadius === 'square'
                  }
                  radius="square"
                  style={styleItem.key}
                />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
