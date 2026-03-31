"use client"

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useAuthStore } from '@/store/auth'
import { useTasksStore } from '@/store/tasks'
import { useScheduleStore } from '@/store/schedule'
import { useThemeStore } from '@/store/theme'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserProfile } from '@/types'
import { DEFAULT_CATEGORIES, DEFAULT_TIMER_CONFIG } from '@/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, setUser, loadProfileFromSupabase } = useAuthStore()
  const loadTasks = useTasksStore((s) => s.loadTasks)
  const loadSchedule = useScheduleStore((s) => s.loadSchedule)
  const { applyTheme } = useThemeStore()
  const router = useRouter()
  const initialized = useRef(false)

  useEffect(() => {
    applyTheme()
  }, [applyTheme])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const supabase = createClient()

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Try loading full profile from Supabase (includes themes from saved_themes table)
          const supabaseProfile = await loadProfileFromSupabase(session.user.id)
          if (supabaseProfile) {
            supabaseProfile.email = session.user.email!
            supabaseProfile.name = session.user.user_metadata?.full_name || supabaseProfile.name
            supabaseProfile.avatarUrl = session.user.user_metadata?.avatar_url || supabaseProfile.avatarUrl
            setUser(supabaseProfile)
            loadTasks(supabaseProfile.id)
            loadSchedule(supabaseProfile.id)
          } else {
            // Fallback: construct from session + cached state
            const prev = useAuthStore.getState().user
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.full_name || prev?.name || '',
              avatarUrl: session.user.user_metadata?.avatar_url || prev?.avatarUrl,
              startOfDay: prev?.startOfDay || '09:00',
              endOfDay: prev?.endOfDay || '18:00',
              bufferPercent: prev?.bufferPercent || 15,
              categories: prev?.categories || DEFAULT_CATEGORIES,
              geminiModel: prev?.geminiModel || 'gemini-2.0-flash',
              geminiApiKey: prev?.geminiApiKey,
              timerConfig: prev?.timerConfig || DEFAULT_TIMER_CONFIG,
              savedThemes: prev?.savedThemes || [],
              workStyle: prev?.workStyle || 'balanced',
              taskSpreadEnabled: prev?.taskSpreadEnabled ?? false,
            }
            setUser(profile)
            loadTasks(profile.id)
            loadSchedule(profile.id)
          }
        } else {
          setUser(null)
          router.push('/')
        }
      } catch {
        setUser(null)
        router.push('/')
      }
    }

    initAuth()
  }, [setUser, loadTasks, loadSchedule, loadProfileFromSupabase, router])

  // Separate effect for auth state change subscription
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const prev = useAuthStore.getState().user
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.full_name || prev?.name || '',
          avatarUrl: session.user.user_metadata?.avatar_url || prev?.avatarUrl,
          startOfDay: prev?.startOfDay || '09:00',
          endOfDay: prev?.endOfDay || '18:00',
          bufferPercent: prev?.bufferPercent || 15,
          categories: prev?.categories || DEFAULT_CATEGORIES,
          geminiModel: prev?.geminiModel || 'gemini-2.0-flash',
          geminiApiKey: prev?.geminiApiKey,
          timerConfig: prev?.timerConfig || DEFAULT_TIMER_CONFIG,
          savedThemes: prev?.savedThemes || [],
          workStyle: prev?.workStyle || 'balanced',
          taskSpreadEnabled: prev?.taskSpreadEnabled ?? false,
        }
        setUser(profile)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen bg-black">
        <div className="hidden md:flex w-56 flex-col gap-4 p-4 border-r border-white/10">
          <Skeleton className="h-6 w-20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b border-white/10 flex items-center px-6">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex-1 p-6 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-16 lg:pl-56">
        <Topbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
