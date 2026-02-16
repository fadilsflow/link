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

  if (blockStyle === 'flat') {
    return {
      backgroundColor: blockColor || APPEARANCE_DEFAULTS.blockColor,
      borderColor: blockColor || APPEARANCE_DEFAULTS.blockColor,
    }
  }

  if (blockStyle === 'shadow') {
    const shadowColor = blockShadowColor || APPEARANCE_DEFAULTS.blockShadowColor
    return {
      backgroundColor: blockColor || APPEARANCE_DEFAULTS.blockColor,
      borderColor: shadowColor,
      boxShadow: `4px 4px 0px 0px ${shadowColor}`,
    }
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
          backgroundGradientBottom || APPEARANCE_DEFAULTS.backgroundGradientBottom
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

export function isValidAppearanceHexColor(value: string) {
  return HEX_COLOR_PATTERN.test(value.trim())
}
