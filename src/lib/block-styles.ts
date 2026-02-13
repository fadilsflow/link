import { cn } from '@/lib/utils'

export type BlockStyle = 'basic' | 'flat' | 'shadow'
export type BlockRadius = 'rounded' | 'square'

/**
 * Get the base card classes based on block style.
 * Uses CSS variables for colors to support dark/light mode.
 * 
 * @param style - The block style: 'basic', 'flat', or 'shadow'
 * @returns CSS classes for the card base
 */
export function getBlockCardBase(style: BlockStyle): string {
  switch (style) {
    case 'flat':
      return 'bg-card border border-border'
    case 'shadow':
      // Shadow style with realistic click effect on hover
      return 'bg-card border border-border shadow-[4px_4px_0px_var(--border)] hover:shadow-[2px_2px_0px_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-150'
    case 'basic':
    default:
      return 'bg-card border border-border shadow-sm hover:shadow-md transition-shadow duration-200'
  }
}

/**
 * Get the radius class based on block radius setting.
 * 
 * @param radius - The radius setting: 'rounded' or 'square'
 * @returns CSS classes for border radius
 */
export function getBlockRadius(radius: BlockRadius): string {
  return radius === 'rounded' ? 'rounded-2xl' : 'rounded-none'
}

/**
 * Get skeleton background color using CSS variables.
 * Used for loading states.
 * 
 * @returns CSS classes for skeleton background
 */
export function getSkeletonClass(): string {
  return 'bg-[var(--muted)]/70'
}

/**
 * Get skeleton inner color using CSS variables.
 * 
 * @returns CSS classes for skeleton inner elements
 */
export function getSkeletonInnerClass(): string {
  return 'bg-[var(--muted)]/60'
}

/**
 * Get image placeholder background using CSS variables.
 * 
 * @returns CSS classes for image placeholder
 */
export function getImagePlaceholderClass(): string {
  return 'bg-[var(--muted)]'
}

/**
 * Get background color for the page using CSS variables.
 * 
 * @returns Inline style object with background color
 */
export function getPageBackgroundStyle(): React.CSSProperties {
  return {
    backgroundColor: 'var(--background)',
  }
}

/**
 * Get product card classes combining card base, radius, and hover effects.
 * 
 * @param blockStyle - The block style
 * @param blockRadius - The block radius
 * @param options - Additional options like disableHover
 * @returns Combined CSS classes
 */
export function getProductCardClasses(
  blockStyle: BlockStyle,
  blockRadius: BlockRadius,
  options?: { disableHover?: boolean }
): string {
  const base = getBlockCardBase(blockStyle)
  const radius = getBlockRadius(blockRadius)
  
  return cn(
    'group w-full overflow-hidden',
    base,
    radius,
    !options?.disableHover && 'transition-all hover:-translate-y-0.5'
  )
}

/**
 * Get link block classes with realistic click effect for shadow style.
 * 
 * @param blockStyle - The block style
 * @param blockRadius - The block radius
 * @returns Combined CSS classes
 */
export function getLinkBlockClasses(
  blockStyle: BlockStyle,
  blockRadius: BlockRadius
): string {
  const base = getBlockCardBase(blockStyle)
  const radius = getBlockRadius(blockRadius)
  
  return cn(
    'group w-full cursor-pointer overflow-hidden min-h-20',
    base,
    radius,
    'transition-all hover:scale-[1.01]'
  )
}

/**
 * Get image block classes.
 * 
 * @param blockStyle - The block style
 * @param blockRadius - The block radius
 * @returns Combined CSS classes
 */
export function getImageBlockClasses(
  blockStyle: BlockStyle,
  blockRadius: BlockRadius
): string {
  const base = getBlockCardBase(blockStyle)
  const radius = getBlockRadius(blockRadius)
  
  return cn(
    'w-full overflow-hidden',
    base,
    radius
  )
}

/**
 * Get video block classes.
 * 
 * @param blockStyle - The block style
 * @param blockRadius - The block radius
 * @returns Combined CSS classes
 */
export function getVideoBlockClasses(
  blockStyle: BlockStyle,
  blockRadius: BlockRadius
): string {
  const base = getBlockCardBase(blockStyle)
  const radius = getBlockRadius(blockRadius)
  
  return cn(
    'w-full overflow-hidden p-3 space-y-3',
    base,
    radius
  )
}

/**
 * Get skeleton classes based on block type.
 * 
 * @param type - The block type: 'image', 'video', 'text', or default
 * @returns Combined CSS classes for skeleton
 */
export function getBlockSkeletonClasses(type?: string | null): string {
  const baseClass = getSkeletonClass()
  const innerClass = getSkeletonInnerClass()
  
  switch (type) {
    case 'image':
      return cn(baseClass, 'aspect-[4/3] rounded-2xl animate-pulse')
    case 'video':
      return cn(baseClass, 'aspect-video rounded-2xl animate-pulse')
    case 'text':
      return cn(
        baseClass,
        'rounded-2xl p-6 space-y-3 animate-pulse',
        innerClass,
        'h-6 w-2/3 mx-auto rounded'
      )
    default:
      return cn(baseClass, 'h-20 rounded-2xl animate-pulse')
  }
}

/**
 * Get product skeleton classes.
 * 
 * @returns CSS classes for product skeleton
 */
export function getProductSkeletonClass(): string {
  return 'h-64 w-full rounded-2xl bg-[var(--muted)]/70 animate-pulse'
}
