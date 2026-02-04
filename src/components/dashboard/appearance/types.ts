export type BgMode = 'banner' | 'wallpaper'
export type WallpaperStyle = 'flat' | 'gradient' | 'avatar' | 'image'
export type BlockStyle = 'basic' | 'flat' | 'shadow'
export type BlockRadius = 'rounded' | 'square'

export interface BannerPreset {
  id: string
  label: string
  image: string // Can be local path or external URL
  isLocal?: boolean
}

export interface AppearanceData {
  appearanceBgType?: BgMode | 'color' | 'image'
  appearanceBgWallpaperStyle?: WallpaperStyle
  appearanceBgColor?: string
  appearanceBgImageUrl?: string
  appearanceBlockStyle?: BlockStyle
  appearanceBlockRadius?: BlockRadius
  appearanceBlockColor?: string
}
