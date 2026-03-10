/**
 * ThemeProvider - Theme context provider for Varity dashboards
 *
 * Provides theme configuration throughout the component tree.
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react'

export interface VarityTheme {
  /** Primary brand color */
  primaryColor: string
  /** Primary color dark variant */
  primaryDark?: string
  /** Accent color */
  accentColor?: string
  /** Success color */
  successColor?: string
  /** Warning color */
  warningColor?: string
  /** Error color */
  errorColor?: string
  /** Background colors */
  background?: {
    primary?: string
    secondary?: string
    card?: string
    header?: string
    sidebar?: string
    footer?: string
  }
  /** Text colors */
  text?: {
    primary?: string
    secondary?: string
  }
  /** Border color */
  borderColor?: string
  /** Font family */
  fontFamily?: string
  /** Border radius */
  borderRadius?: string
}

export interface ThemeProviderProps {
  /** Theme configuration */
  theme: VarityTheme
  /** Child components */
  children: ReactNode
}

const ThemeContext = createContext<VarityTheme | undefined>(undefined)

/**
 * useTheme Hook
 *
 * Access theme configuration from any component.
 *
 * @example
 * ```tsx
 * const theme = useTheme()
 * console.log(theme.primaryColor)
 * ```
 */
export const useTheme = (): VarityTheme => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * Default Varity theme
 */
export const defaultTheme: VarityTheme = {
  primaryColor: '#1976d2',
  primaryDark: '#1565c0',
  accentColor: '#ff5722',
  successColor: '#4caf50',
  warningColor: '#ff9800',
  errorColor: '#f44336',
  background: {
    primary: '#f5f5f5',
    secondary: '#f9f9f9',
    card: '#ffffff',
    header: '#ffffff',
    sidebar: '#ffffff',
    footer: '#ffffff'
  },
  text: {
    primary: '#212121',
    secondary: '#757575'
  },
  borderColor: '#e0e0e0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  borderRadius: '8px'
}

/**
 * ThemeProvider Component
 *
 * Wrap your app with this provider to enable theming.
 *
 * @example
 * ```tsx
 * <ThemeProvider theme={customTheme}>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme, children }) => {
  // Merge provided theme with defaults
  const mergedTheme = useMemo(() => ({
    ...defaultTheme,
    ...theme,
    background: {
      ...defaultTheme.background,
      ...theme.background
    },
    text: {
      ...defaultTheme.text,
      ...theme.text
    }
  }), [theme])

  // Apply CSS variables
  useMemo(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    // Colors
    root.style.setProperty('--varity-primary-color', mergedTheme.primaryColor)
    if (mergedTheme.primaryDark) {
      root.style.setProperty('--varity-primary-dark', mergedTheme.primaryDark)
    }
    if (mergedTheme.accentColor) {
      root.style.setProperty('--varity-accent-color', mergedTheme.accentColor)
    }
    if (mergedTheme.successColor) {
      root.style.setProperty('--varity-success-color', mergedTheme.successColor)
    }
    if (mergedTheme.warningColor) {
      root.style.setProperty('--varity-warning-color', mergedTheme.warningColor)
    }
    if (mergedTheme.errorColor) {
      root.style.setProperty('--varity-error-color', mergedTheme.errorColor)
    }

    // Backgrounds
    if (mergedTheme.background?.primary) {
      root.style.setProperty('--varity-bg-primary', mergedTheme.background.primary)
    }
    if (mergedTheme.background?.secondary) {
      root.style.setProperty('--varity-bg-secondary', mergedTheme.background.secondary)
    }
    if (mergedTheme.background?.card) {
      root.style.setProperty('--varity-bg-card', mergedTheme.background.card)
    }
    if (mergedTheme.background?.header) {
      root.style.setProperty('--varity-bg-header', mergedTheme.background.header)
    }
    if (mergedTheme.background?.sidebar) {
      root.style.setProperty('--varity-bg-sidebar', mergedTheme.background.sidebar)
    }
    if (mergedTheme.background?.footer) {
      root.style.setProperty('--varity-bg-footer', mergedTheme.background.footer)
    }

    // Text
    if (mergedTheme.text?.primary) {
      root.style.setProperty('--varity-text-primary', mergedTheme.text.primary)
    }
    if (mergedTheme.text?.secondary) {
      root.style.setProperty('--varity-text-secondary', mergedTheme.text.secondary)
    }

    // Border
    if (mergedTheme.borderColor) {
      root.style.setProperty('--varity-border-color', mergedTheme.borderColor)
    }

    // Typography
    if (mergedTheme.fontFamily) {
      root.style.setProperty('--varity-font-family', mergedTheme.fontFamily)
    }

    // Border radius
    if (mergedTheme.borderRadius) {
      root.style.setProperty('--varity-border-radius', mergedTheme.borderRadius)
    }
  }, [mergedTheme])

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Industry-specific theme presets
 */
export const themePresets = {
  finance: {
    primaryColor: '#1565c0',
    primaryDark: '#0d47a1',
    accentColor: '#00897b',
    successColor: '#2e7d32',
    background: {
      primary: '#fafafa',
      card: '#ffffff'
    }
  } as VarityTheme,

  healthcare: {
    primaryColor: '#0277bd',
    primaryDark: '#01579b',
    accentColor: '#00acc1',
    successColor: '#00897b',
    background: {
      primary: '#e3f2fd',
      card: '#ffffff'
    }
  } as VarityTheme,

  retail: {
    primaryColor: '#d32f2f',
    primaryDark: '#c62828',
    accentColor: '#f57c00',
    successColor: '#388e3c',
    background: {
      primary: '#fff8e1',
      card: '#ffffff'
    }
  } as VarityTheme,

  tech: {
    primaryColor: '#6a1b9a',
    primaryDark: '#4a148c',
    accentColor: '#00bcd4',
    successColor: '#00c853',
    background: {
      primary: '#f3e5f5',
      card: '#ffffff'
    }
  } as VarityTheme
}
