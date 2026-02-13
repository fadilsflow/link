import { useEffect, useMemo, useState } from 'react'

export type ThemeScope = 'public' | 'dashboard'
export type ThemeOption = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

function getSystemColorScheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function resolveTheme(options: {
  scope: ThemeScope
  persistedPublicTheme?: ThemeOption | null
  systemColorScheme: ResolvedTheme
}): ResolvedTheme {
  const { scope, persistedPublicTheme, systemColorScheme } = options

  if (scope === 'dashboard') {
    return systemColorScheme
  }

  if (!persistedPublicTheme || persistedPublicTheme === 'system') {
    return systemColorScheme
  }

  return persistedPublicTheme
}

export function useResolvedTheme(
  scope: ThemeScope,
  persistedPublicTheme?: ThemeOption | null,
) {
  const [systemColorScheme, setSystemColorScheme] =
    useState<ResolvedTheme>(getSystemColorScheme)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      setSystemColorScheme(mediaQuery.matches ? 'dark' : 'light')
    }

    onChange()
    mediaQuery.addEventListener('change', onChange)

    return () => mediaQuery.removeEventListener('change', onChange)
  }, [])

  return useMemo(
    () =>
      resolveTheme({
        scope,
        persistedPublicTheme,
        systemColorScheme,
      }),
    [scope, persistedPublicTheme, systemColorScheme],
  )
}

export function useApplyRootTheme(
  scope: ThemeScope,
  persistedPublicTheme?: ThemeOption | null,
) {
  const resolvedTheme = useResolvedTheme(scope, persistedPublicTheme)

  useEffect(() => {
    const root = document.documentElement

    root.dataset.theme = resolvedTheme
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.classList.toggle('light', resolvedTheme === 'light')
  }, [resolvedTheme])

  return resolvedTheme
}
