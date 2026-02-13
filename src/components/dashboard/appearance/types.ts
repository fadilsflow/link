export type BlockStyle = 'basic' | 'flat' | 'shadow'
export type BlockRadius = 'rounded' | 'square'

export interface BannerPreset {
  id: string
  label: string
  image: string
  isLocal?: boolean
}
