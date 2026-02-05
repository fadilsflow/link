import type { BannerPreset } from './types'

export const LOCAL_BANNER_IMAGES: Array<BannerPreset> = Array.from(
  { length: 12 },
  (_, i) => ({
    id: `local-${i + 1}`,
    label: `Banner ${i + 1}`,
    image: `/banner/profile_bg_${i + 1}.webp`,
    isLocal: true,
  }),
)

export const GRADIENT_PRESETS: Array<BannerPreset> = [
  {
    id: 'gradient-blue',
    label: 'Gradient Blue',
    image: '',
    isLocal: false,
  },
  {
    id: 'gradient-purple',
    label: 'Gradient Purple',
    image: '',
    isLocal: false,
  },
]

export const DEFAULT_BANNER_PRESETS: Array<BannerPreset> = [
  ...LOCAL_BANNER_IMAGES,
  ...GRADIENT_PRESETS,
]
