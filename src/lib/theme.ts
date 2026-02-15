import { useEffect, useMemo, useState } from 'react'

export type ThemeScope = 'public' | 'dashboard'
export type ThemeOption = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'
const DASHBOARD_THEME_STORAGE_KEY = 'dashboard-theme'
const DASHBOARD_THEME_EVENT = 'dashboard-theme-change'

function getSystemColorScheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function resolveTheme(options: {
  scope: ThemeScope
  persistedPublicTheme?: ThemeOption | null
  dashboardTheme?: ThemeOption | null
  systemColorScheme: ResolvedTheme
}): ResolvedTheme {
  const { scope, persistedPublicTheme, dashboardTheme, systemColorScheme } = options

  if (scope === 'dashboard') {
    if (dashboardTheme && dashboardTheme !== 'system') {
      return dashboardTheme
    }
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
  dashboardTheme?: ThemeOption | null,
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
        dashboardTheme,
        systemColorScheme,
      }),
    [scope, persistedPublicTheme, dashboardTheme, systemColorScheme],
  )
}

export function useApplyRootTheme(
  scope: ThemeScope,
  persistedPublicTheme?: ThemeOption | null,
  dashboardTheme?: ThemeOption | null,
) {
  const resolvedTheme = useResolvedTheme(
    scope,
    persistedPublicTheme,
    dashboardTheme,
  )

  useEffect(() => {
    const root = document.documentElement

    root.dataset.theme = resolvedTheme
    root.classList.toggle('dark', resolvedTheme === 'dark')
    root.classList.toggle('light', resolvedTheme === 'light')
  }, [resolvedTheme])

  return resolvedTheme
}

export function getDashboardThemePreference(): ThemeOption {
  if (typeof window === 'undefined') return 'system'
  const value = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY)
  if (value === 'dark' || value === 'light' || value === 'system') return value
  return 'system'
}

export function setDashboardThemePreference(theme: ThemeOption) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, theme)
  window.dispatchEvent(new CustomEvent<ThemeOption>(DASHBOARD_THEME_EVENT, { detail: theme }))
}

export function useDashboardThemePreference() {
  const [dashboardTheme, setDashboardTheme] = useState<ThemeOption>(
    getDashboardThemePreference,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onStorage = (event: StorageEvent) => {
      if (event.key === DASHBOARD_THEME_STORAGE_KEY) {
        setDashboardTheme(getDashboardThemePreference())
      }
    }

    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeOption>
      setDashboardTheme(customEvent.detail)
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(DASHBOARD_THEME_EVENT, onThemeChange)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(DASHBOARD_THEME_EVENT, onThemeChange)
    }
  }, [])

  const updateDashboardTheme = (theme: ThemeOption) => {
    setDashboardThemePreference(theme)
  }

  return [dashboardTheme, updateDashboardTheme] as const
}
