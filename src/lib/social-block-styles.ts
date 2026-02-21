import type { BlockRadius, BlockStyle } from '@/lib/block-styles'
import { getBlockCardBase, getBlockRadius } from '@/lib/block-styles'
import { cn } from '@/lib/utils'

export function getSocialBlocksWrapperClasses(): string {
  return 'flex w-full flex-wrap gap-3'
}

export function getSocialBlockButtonClasses(
  blockStyle: BlockStyle,
  blockRadius: BlockRadius,
): string {
  const base = getBlockCardBase(blockStyle)
  const radius = getBlockRadius(blockRadius)

  return cn(
    'group inline-flex h-10 w-10 items-center justify-center overflow-hidden',
    base,
    radius,
    'transition-all',
  )
}

export function getSocialBlockIconClasses(): string {
  return 'size-4 text-foreground transition-transform group-hover:scale-105'
}
