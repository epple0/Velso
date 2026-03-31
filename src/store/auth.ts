import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, WorkStyle, SavedTheme } from '@/types'
import { DEFAULT_CATEGORIES, DEFAULT_TIMER_CONFIG } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  hasHydrated: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setHasHydrated: (state: boolean) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  loadProfileFromSupabase: (userId: string) => Promise<UserProfile | null>
  saveProfileToSupabase: () => Promise<void>
  saveThemeToSupabase: (theme: SavedTheme) => Promise<void>
  deleteThemeFromSupabase: (name: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      hasHydrated: false,

      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
        // Save to Supabase in background
        get().saveProfileToSupabase()
      },

      loadProfileFromSupabase: async (userId: string) => {
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (error || !data) return null

          // Load saved themes from separate table
          let savedThemes: SavedTheme[] = []
          try {
            const { data: themeRows } = await supabase
              .from('saved_themes')
              .select('name, colors')
              .eq('user_id', userId)
            if (themeRows) {
              savedThemes = themeRows.map((r: any) => ({
                name: r.name,
                colors: r.colors,
              }))
            }
          } catch { /* themes load is non-critical */ }

          const profile: UserProfile = {
            id: data.id,
            email: '',
            name: data.name || '',
            avatarUrl: data.avatar_url || undefined,
            startOfDay: data.start_of_day || '09:00',
            endOfDay: data.end_of_day || '18:00',
            bufferPercent: data.buffer_percent ?? 15,
            categories: data.categories || DEFAULT_CATEGORIES,
            geminiApiKey: data.gemini_api_key || undefined,
            geminiModel: data.gemini_model || 'gemini-2.0-flash',
            timerConfig: data.timer_config || DEFAULT_TIMER_CONFIG,
            savedThemes,
            workStyle: (data.work_style as WorkStyle) || 'balanced',
            taskSpreadEnabled: data.task_spread_enabled ?? false,
          }

          return profile
        } catch {
          return null
        }
      },

      saveProfileToSupabase: async () => {
        const { user } = get()
        if (!user) return

        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              name: user.name,
              avatar_url: user.avatarUrl || null,
              start_of_day: user.startOfDay,
              end_of_day: user.endOfDay,
              buffer_percent: user.bufferPercent,
              categories: user.categories,
              gemini_api_key: user.geminiApiKey || null,
              gemini_model: user.geminiModel,
              timer_config: user.timerConfig || DEFAULT_TIMER_CONFIG,
              work_style: user.workStyle || 'balanced',
              task_spread_enabled: user.taskSpreadEnabled ?? false,
            })

          if (error) console.error('Failed to save profile:', error)
        } catch (err) {
          console.error('Failed to save profile:', err)
        }
      },

      saveThemeToSupabase: async (theme: SavedTheme) => {
        const { user } = get()
        if (!user) return
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('saved_themes')
            .insert({
              user_id: user.id,
              name: theme.name,
              colors: theme.colors,
            })
          if (error) console.error('Failed to save theme:', error)
        } catch (err) {
          console.error('Failed to save theme:', err)
        }
      },

      deleteThemeFromSupabase: async (name: string) => {
        const { user } = get()
        if (!user) return
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('saved_themes')
            .delete()
            .eq('user_id', user.id)
            .eq('name', name)
          if (error) console.error('Failed to delete theme:', error)
        } catch (err) {
          console.error('Failed to delete theme:', err)
        }
      },
    }),
    {
      name: 'velso-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (state) => ({
        user: state.user ? {
          ...state.user,
          categories: state.user.categories || DEFAULT_CATEGORIES,
          startOfDay: state.user.startOfDay || '09:00',
          endOfDay: state.user.endOfDay || '18:00',
          bufferPercent: state.user.bufferPercent || 15,
          geminiModel: state.user.geminiModel || 'gemini-2.0-flash',
          timerConfig: state.user.timerConfig || DEFAULT_TIMER_CONFIG,
          savedThemes: state.user.savedThemes || [],
          workStyle: state.user.workStyle || 'balanced',
          taskSpreadEnabled: state.user.taskSpreadEnabled ?? false,
        } : null,
      }),
    }
  )
)
