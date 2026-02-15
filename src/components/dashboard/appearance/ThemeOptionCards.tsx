import { Check } from 'lucide-react'
import type { ThemeOption } from '@/lib/theme'
import { cn } from '@/lib/utils'

interface ThemeOptionCardsProps {
  value: ThemeOption
  onChange: (theme: ThemeOption) => void
  options?: Array<ThemeOption>
}

export function ThemeOptionCards({
  value,
  onChange,
  options = ['system', 'light', 'dark'],
}: ThemeOptionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {options.map((option) => {
        const selected = value === option

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'relative rounded-xl p-4 text-left transition-colors',
              selected ? 'bg-input/80' : 'border',
            )}
          >
            <p className="text-sm font-medium capitalize">{option}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {option === 'system'
                ? 'Follow your device preference'
                : `Always use ${option} mode`}
            </p>
            {selected ? (
              <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
