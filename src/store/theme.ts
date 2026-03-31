import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeName, ThemeColors } from '@/types'
import { hexToHsl } from '@/lib/utils'

interface ThemeState {
  theme: ThemeName
  customColors: ThemeColors
  hasHydrated: boolean
  setTheme: (theme: ThemeName) => void
  setCustomColor: (key: keyof ThemeColors, value: string) => void
  applyTheme: () => void
  setHasHydrated: (state: boolean) => void
}

const ONYX_COLORS: ThemeColors = {
  primary: '#ffffff',
  accent: '#6366f1',
  ring: '#6366f1',
  background: '#000000',
  foreground: '#ffffff',
  card: '#0a0a0a',
  muted: '#1a1a1a',
  border: '#222222',
}

const CLOUD_COLORS: ThemeColors = {
  primary: '#18181b',
  accent: '#6366f1',
  ring: '#6366f1',
  background: '#fafafa',
  foreground: '#18181b',
  card: '#ffffff',
  muted: '#f4f4f5',
  border: '#e4e4e7',
}

function applyColors(colors: ThemeColors) {
  const root = document.documentElement
  root.style.setProperty('--primary', hexToHsl(colors.primary))
  root.style.setProperty('--accent', hexToHsl(colors.accent))
  root.style.setProperty('--ring', hexToHsl(colors.ring))
  root.style.setProperty('--background', hexToHsl(colors.background))
  root.style.setProperty('--foreground', hexToHsl(colors.foreground))
  root.style.setProperty('--card', hexToHsl(colors.card))
  root.style.setProperty('--muted', hexToHsl(colors.muted))
  root.style.setProperty('--border', hexToHsl(colors.border))
  root.style.setProperty('--input', hexToHsl(colors.border))
  root.style.setProperty('--popover', hexToHsl(colors.card))
  root.style.setProperty('--popover-foreground', hexToHsl(colors.foreground))
  root.style.setProperty('--card-foreground', hexToHsl(colors.foreground))
  root.style.setProperty('--primary-foreground', hexToHsl(colors.background))
  root.style.setProperty('--secondary', hexToHsl(colors.muted))
  root.style.setProperty('--secondary-foreground', hexToHsl(colors.foreground))
  root.style.setProperty('--muted-foreground', hexToHsl(colors.foreground) + ' / 0.6')
  root.style.setProperty('--accent-foreground', hexToHsl(colors.foreground))
  root.style.setProperty('--destructive', '0 84% 60%')
  root.style.setProperty('--destructive-foreground', '0 0% 100%')

  // Set dark/light class
  const isDark = colors.background === '#000000' ||
    colors.background.toLowerCase() === '#0a0a0a' ||
    isColorDark(colors.background)
  root.classList.toggle('dark', isDark)
}

function isColorDark(hex: string): boolean {
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'onyx',
      customColors: { ...ONYX_COLORS },
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setTheme: (theme) => {
        const colors = theme === 'onyx' ? ONYX_COLORS
          : theme === 'cloud' ? CLOUD_COLORS
          : get().customColors
        set({ theme })
        applyColors(colors)
      },
      setCustomColor: (key, value) => {
        const newColors = { ...get().customColors, [key]: value }
        set({ customColors: newColors, theme: 'custom' })
        applyColors(newColors)
      },
      applyTheme: () => {
        const { theme, customColors } = get()
        const colors = theme === 'onyx' ? ONYX_COLORS
          : theme === 'cloud' ? CLOUD_COLORS
          : customColors
        applyColors(colors)
      },
    }),
    {
      name: 'velso-theme',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
