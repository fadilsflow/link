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
