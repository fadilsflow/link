export type OnboardingProfileForm = {
  username: string
  name: string
  title: string
  bio: string
}

export type OnboardingSocialForm = {
  twitter: string
  instagram: string
  linkedin: string
  website: string
}

export type OnboardingAppearanceForm = {
  palette: 'sand' | 'stone' | 'forest'
  blockStyle: 'basic' | 'flat' | 'shadow'
  blockRadius: 'rounded' | 'square'
}

export const APPEARANCE_PRESETS: Record<
  OnboardingAppearanceForm['palette'],
  { name: string; bgColor: string; blockColor: string; label: string }
> = {
  sand: {
    name: 'Warm Sand',
    bgColor: '#F5EFE4',
    blockColor: '#FFFDFC',
    label: 'Warm and editorial with subtle contrast',
  },
  stone: {
    name: 'Soft Stone',
    bgColor: '#EFF1EE',
    blockColor: '#FFFFFF',
    label: 'Quiet neutral tones for a premium look',
  },
  forest: {
    name: 'Forest Mist',
    bgColor: '#E8EEE8',
    blockColor: '#FCFFFC',
    label: 'Natural and refined, inspired by print design',
  },
}
