import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { isValidAppearanceHexColor } from '@/lib/appearance'

interface ColorPickerProps {
  value: string
  onChange?: (value: string) => void
  onCommit: (value: string) => void
  className?: string
  disabled?: boolean
}

function normalizeHex(value: string) {
  const raw = value.trim()
  if (!raw) return raw
  return raw.startsWith('#') ? raw.toLowerCase() : `#${raw.toLowerCase()}`
}

export function ColorPicker({
  value,
  onChange,
  onCommit,
  className,
  disabled = false,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(normalizeHex(value))
  const openValueRef = useRef(normalizeHex(value))

  useEffect(() => {
    if (!open) {
      setDraft(normalizeHex(value))
    }
  }, [value, open])

  const commitIfChanged = () => {
    const next = normalizeHex(draft)
    const prev = normalizeHex(openValueRef.current)

    if (!isValidAppearanceHexColor(next)) return
    if (next === prev) return

    onCommit(next)
  }

  const closeAndCommit = () => {
    commitIfChanged()
    setOpen(false)
  }

  const handleChange = (raw: string) => {
    const next = normalizeHex(raw)

    setDraft(next)

    if (isValidAppearanceHexColor(next)) {
      onChange?.(next)
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled) return

        if (next) {
          const normalized = normalizeHex(value)
          openValueRef.current = normalized
          setDraft(normalized)
        }

        if (!next) {
          commitIfChanged()
        }

        setOpen(next)
      }}
    >
      <div className={cn('flex items-center gap-2', className)}>
        <PopoverTrigger
          type="button"
          disabled={disabled}
          aria-label="Open color picker"
          className={cn(
            'h-9 w-14 rounded-lg border border-input shadow-xs/5',
            disabled && 'pointer-events-none opacity-60',
          )}
          style={{
            backgroundColor: isValidAppearanceHexColor(draft)
              ? draft
              : '#000000',
          }}
        />

        <Input
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="#000000"
          className="font-mono"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              closeAndCommit()
            }
          }}
        />
      </div>

      <PopoverContent className="w-[244px] p-3">
        <div className="space-y-3">
          <HexColorPicker
            color={
              isValidAppearanceHexColor(draft) ? draft : '#000000'
            }
            onChange={handleChange}
          />

          <Input
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="#000000"
            className="font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                closeAndCommit()
              }
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
