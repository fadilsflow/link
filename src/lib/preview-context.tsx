import React, { createContext, useContext, useMemo, useState } from 'react'
import type {BlockRadius, BlockStyle} from '@/lib/block-styles';
import type { AppearanceBackgroundType, AppearanceTextFont } from '@/lib/appearance'

export interface PreviewUser {
  id: string
  username: string | null
  name: string
  title?: string | null
  bio?: string | null
  image?: string | null
  appearanceBannerEnabled?: boolean | null
  appearanceBgImageUrl?: string | null
  appearanceBackgroundType?: AppearanceBackgroundType | null
  appearanceBackgroundColor?: string | null
  appearanceBackgroundGradientTop?: string | null
  appearanceBackgroundGradientBottom?: string | null
  appearanceBackgroundImageUrl?: string | null
  appearanceBlockStyle?: BlockStyle | null
  appearanceBlockRadius?: BlockRadius | null
  appearanceBlockColor?: string | null
  appearanceBlockShadowColor?: string | null
  appearanceTextColor?: string | null
  appearanceTextFont?: AppearanceTextFont | null
}

interface PreviewBlock {
  id: string
  title: string
  url: string
  type?: string
  content?: string
  isEnabled: boolean
}

interface PreviewStatus {
  isSaving?: boolean
  isSaved?: boolean
}

interface PreviewContextValue {
  user: PreviewUser | null
  blocks: Array<PreviewBlock>
  status: PreviewStatus
  setUser: (user: PreviewUser | null) => void
  setBlocks: (blocks: Array<PreviewBlock>) => void
  updateUser: (updates: Partial<PreviewUser>) => void
  setStatus: (status: PreviewStatus) => void
}

const PreviewContext = createContext<PreviewContextValue | null>(null)

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PreviewUser | null>(null)
  const [blocks, setBlocks] = useState<Array<PreviewBlock>>([])
  const [status, setStatus] = useState<PreviewStatus>({})

  const updateUser = (updates: Partial<PreviewUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const value = useMemo(
    () => ({
      user,
      blocks,
      status,
      setUser,
      setBlocks,
      updateUser,
      setStatus,
    }),
    [user, blocks, status],
  )

  return (
    <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>
  )
}

export function usePreview() {
  const context = useContext(PreviewContext)
  if (!context) {
    throw new Error('usePreview must be used within a PreviewProvider')
  }
  return context
}
