import { BannerPreset } from './types'

export const LOCAL_BANNER_IMAGES: BannerPreset[] = Array.from(
  { length: 12 },
  (_, i) => ({
    id: `local-${i + 1}`,
    label: `Banner ${i + 1}`,
    image: `/banner/profile_bg_${i + 1}.webp`,
    isLocal: true,
  }),
)

export const GRADIENT_PRESETS: BannerPreset[] = [
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

export const DEFAULT_BANNER_PRESETS: BannerPreset[] = [
  ...LOCAL_BANNER_IMAGES,
  ...GRADIENT_PRESETS,
]
