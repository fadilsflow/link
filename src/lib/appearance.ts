import type { CSSProperties } from 'react'
import type { BlockStyle } from '@/lib/block-styles'

export type AppearanceBackgroundType =
  | 'none'
  | 'flat'
  | 'gradient'
  | 'avatar-blur'
  | 'image'

export type AppearanceTextFont = 'sans' | 'heading' | 'mono'
export const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export const APPEARANCE_DEFAULTS = {
  bannerEnabled: true,
  backgroundType: 'none' as AppearanceBackgroundType,
  backgroundColor: '#ffffff',
  backgroundGradientTop: '#f8fafc',
  backgroundGradientBottom: '#e2e8f0',
  blockColor: '#ffffff',
  blockShadowColor: '#111827',
  textColor: '#111827',
  textFont: 'sans' as AppearanceTextFont,
}

export const APPEARANCE_FONT_OPTIONS: Array<{
  value: AppearanceTextFont
  label: string
  family: string
}> = [
  { value: 'sans', label: 'Sans', family: 'Cal Sans UI' },
  { value: 'heading', label: 'Heading', family: 'Cal Sans SemiBold' },
  { value: 'mono', label: 'Mono', family: 'Paper Mono' },
]

const DARK_SURFACE_FOREGROUND = '#f8fafc'
const DARK_SURFACE_MUTED_FOREGROUND = '#e2e8f0'
const LIGHT_SURFACE_FOREGROUND = '#111827'
const LIGHT_SURFACE_MUTED_FOREGROUND = '#475569'

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim()
  if (!HEX_COLOR_PATTERN.test(trimmed)) return null

  if (trimmed.length === 4) {
    const r = trimmed[1]
    const g = trimmed[2]
    const b = trimmed[3]
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }

  return trimmed.toLowerCase()
}

function hexToRgb(value: string): [number, number, number] | null {
  const normalized = normalizeHexColor(value)
  if (!normalized) return null

  const r = Number.parseInt(normalized.slice(1, 3), 16)
  const g = Number.parseInt(normalized.slice(3, 5), 16)
  const b = Number.parseInt(normalized.slice(5, 7), 16)
  return [r, g, b]
}

function getRelativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (channel: number) => {
    const srgb = channel / 255
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }

  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

function getReadableTextTokens(backgroundColor: string): {
  foreground: string
  mutedForeground: string
} {
  const rgb = hexToRgb(backgroundColor)
  if (!rgb) {
    return {
      foreground: LIGHT_SURFACE_FOREGROUND,
      mutedForeground: LIGHT_SURFACE_MUTED_FOREGROUND,
    }
  }

  const luminance = getRelativeLuminance(rgb)
  const isDarkSurface = luminance < 0.4

  return isDarkSurface
    ? {
        foreground: DARK_SURFACE_FOREGROUND,
        mutedForeground: DARK_SURFACE_MUTED_FOREGROUND,
      }
    : {
        foreground: LIGHT_SURFACE_FOREGROUND,
        mutedForeground: LIGHT_SURFACE_MUTED_FOREGROUND,
      }
}

export function getReadableTextTokensForBackground(
  backgroundColor?: string | null,
): {
  foreground: string
  mutedForeground: string
} {
  if (!backgroundColor) {
    return {
      foreground: LIGHT_SURFACE_FOREGROUND,
      mutedForeground: LIGHT_SURFACE_MUTED_FOREGROUND,
    }
  }

  return getReadableTextTokens(backgroundColor)
}

export function getAppearanceFontClass(font?: AppearanceTextFont | null) {
  switch (font) {
    case 'heading':
      return 'font-heading'
    case 'mono':
      return 'font-mono'
    case 'sans':
    default:
      return 'font-sans'
  }
}

export function getAppearanceBlockStyle(options: {
  blockStyle?: BlockStyle | null
  blockColor?: string | null
  blockShadowColor?: string | null
}): CSSProperties {
  const { blockStyle, blockColor, blockShadowColor } = options
  const resolvedBlockColor = blockColor || APPEARANCE_DEFAULTS.blockColor
  const textTokens = getReadableTextTokens(resolvedBlockColor)

  if (blockStyle === 'flat') {
    return {
      backgroundColor: resolvedBlockColor,
      '--foreground': textTokens.foreground,
      '--card-foreground': textTokens.foreground,
      '--popover-foreground': textTokens.foreground,
      '--muted-foreground': textTokens.mutedForeground,
    } as CSSProperties
  }

  if (blockStyle === 'shadow') {
    const shadowColor = blockShadowColor || APPEARANCE_DEFAULTS.blockShadowColor
    return {
      backgroundColor: resolvedBlockColor,
      borderColor: shadowColor,
      // Use CSS variable so Tailwind hover classes can override it
      '--block-shadow-color': shadowColor,
      '--foreground': textTokens.foreground,
      '--card-foreground': textTokens.foreground,
      '--popover-foreground': textTokens.foreground,
      '--muted-foreground': textTokens.mutedForeground,
    } as CSSProperties
  }

  return {}
}

export function getAppearancePageBackgroundStyle(options: {
  backgroundType?: AppearanceBackgroundType | null
  backgroundColor?: string | null
  backgroundGradientTop?: string | null
  backgroundGradientBottom?: string | null
  backgroundImageUrl?: string | null
}): CSSProperties {
  const {
    backgroundType,
    backgroundColor,
    backgroundGradientTop,
    backgroundGradientBottom,
    backgroundImageUrl,
  } = options

  switch (backgroundType) {
    case 'flat':
      return {
        backgroundColor: backgroundColor || APPEARANCE_DEFAULTS.backgroundColor,
      }
    case 'gradient':
      return {
        backgroundImage: `linear-gradient(180deg, ${
          backgroundGradientTop || APPEARANCE_DEFAULTS.backgroundGradientTop
        } 0%, ${
          backgroundGradientBottom ||
          APPEARANCE_DEFAULTS.backgroundGradientBottom
        } 100%)`,
      }
    case 'image':
      if (!backgroundImageUrl) return {}
      return {
        backgroundImage: `url('${backgroundImageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    case 'avatar-blur':
    case 'none':
    default:
      return {}
  }
}

export function getAppearanceTextVars(
  textColor?: string | null,
): CSSProperties {
  if (!textColor) return {}

  return {
    '--foreground': textColor,
    '--card-foreground': textColor,
    '--popover-foreground': textColor,
    '--muted-foreground': textColor,
  } as CSSProperties
}

export function getAppearanceTextColor(options: {
  backgroundType?: AppearanceBackgroundType | null
  backgroundColor?: string | null
  backgroundGradientTop?: string | null
  backgroundGradientBottom?: string | null
  backgroundImageUrl?: string | null
  userImage?: string | null
}): { foreground: string; mutedForeground: string } {
  const {
    backgroundType,
    backgroundColor,
    backgroundGradientTop,
    backgroundGradientBottom,
    backgroundImageUrl,
    userImage,
  } = options

  // For avatar-blur, use the user image to determine text color
  if (backgroundType === 'avatar-blur' && userImage) {
    // For avatar blur, assume dark background (blurred image)
    return {
      foreground: DARK_SURFACE_FOREGROUND,
      mutedForeground: DARK_SURFACE_MUTED_FOREGROUND,
    }
  }

  // For image background, assume dark
  if (backgroundType === 'image' && backgroundImageUrl) {
    return {
      foreground: DARK_SURFACE_FOREGROUND,
      mutedForeground: DARK_SURFACE_MUTED_FOREGROUND,
    }
  }

  // For gradient, check the top color
  if (backgroundType === 'gradient' && backgroundGradientTop) {
    const tokens = getReadableTextTokens(backgroundGradientTop)
    return {
      foreground: tokens.foreground,
      mutedForeground: tokens.mutedForeground,
    }
  }

  // For flat background, check the color
  if (backgroundType === 'flat' && backgroundColor) {
    const tokens = getReadableTextTokens(backgroundColor)
    return {
      foreground: tokens.foreground,
      mutedForeground: tokens.mutedForeground,
    }
  }

  // Default to light text
  return {
    foreground: LIGHT_SURFACE_FOREGROUND,
    mutedForeground: LIGHT_SURFACE_MUTED_FOREGROUND,
  }
}

export function isValidAppearanceHexColor(value: string) {
  return HEX_COLOR_PATTERN.test(value.trim())
}

export function isDarkBackground(options: {
  backgroundType?: AppearanceBackgroundType | null
  backgroundColor?: string | null
  backgroundGradientTop?: string | null
  backgroundGradientBottom?: string | null
  backgroundImageUrl?: string | null
  userImage?: string | null
}): boolean {
  const {
    backgroundType,
    backgroundColor,
    backgroundGradientTop,
    backgroundGradientBottom,
    backgroundImageUrl,
    userImage,
  } = options

  // For avatar-blur, assume dark
  if (backgroundType === 'avatar-blur' && userImage) {
    return true
  }

  // For image background, assume dark
  if (backgroundType === 'image' && backgroundImageUrl) {
    return true
  }

  // For gradient, check the top color
  if (backgroundType === 'gradient' && backgroundGradientTop) {
    const tokens = getReadableTextTokens(backgroundGradientTop)
    return tokens.foreground === DARK_SURFACE_FOREGROUND
  }

  // For flat background, check the color
  if (backgroundType === 'flat' && backgroundColor) {
    const tokens = getReadableTextTokens(backgroundColor)
    return tokens.foreground === DARK_SURFACE_FOREGROUND
  }

  return false
}
