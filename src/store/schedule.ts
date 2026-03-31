import { create } from 'zustand'
import type { Schedule, TimeBlock, WorkStyle } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface ScheduleState {
  schedule: Schedule | null
  isLoading: boolean
  activeBlockId: string | null

  setSchedule: (schedule: Schedule | null) => void
  loadSchedule: (userId: string, date?: string) => Promise<void>
  saveSchedule: (userId: string) => Promise<void>
  getActiveBlock: () => TimeBlock | null
  getNextBlock: () => TimeBlock | null
  setActiveBlockId: (id: string | null) => void
  toggleBlockLock: (blockId: string) => void
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function getCurrentMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export const useScheduleStore = create<ScheduleState>()((set, get) => ({
  schedule: null,
  isLoading: false,
  activeBlockId: null,

  setSchedule: (schedule) => set({ schedule }),

  loadSchedule: async (userId: string, date?: string) => {
    set({ isLoading: true })
    try {
      const supabase = createClient()
      const targetDate = date || getTodayStr()
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('date', targetDate)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load schedule:', error)
      }

      if (data) {
        set({
          schedule: {
            id: data.id,
            userId: data.user_id,
            date: data.date,
            blocks: data.blocks || [],
            backlog: data.backlog || [],
            workStyle: data.work_style || 'balanced',
            startTime: data.start_time || '09:00',
            generatedAt: data.created_at,
          },
          isLoading: false,
        })
      } else {
        set({ schedule: null, isLoading: false })
      }
    } catch (err) {
      console.error('Failed to load schedule:', err)
      set({ isLoading: false })
    }
  },

  saveSchedule: async (userId: string) => {
    const { schedule } = get()
    if (!schedule) return

    try {
      const supabase = createClient()
      const row = {
        user_id: userId,
        date: schedule.date,
        blocks: schedule.blocks,
        backlog: schedule.backlog,
        work_style: schedule.workStyle,
        start_time: schedule.startTime,
      }

      if (schedule.id) {
        await supabase.from('schedules').update(row).eq('id', schedule.id)
      } else {
        const { data } = await supabase
          .from('schedules')
          .upsert({ ...row }, { onConflict: 'user_id,date' })
          .select()
          .single()

        if (data) {
          set((state) => ({
            schedule: state.schedule ? { ...state.schedule, id: data.id } : null,
          }))
        }
      }
    } catch (err) {
      console.error('Failed to save schedule:', err)
    }
  },

  getActiveBlock: () => {
    const { schedule } = get()
    if (!schedule) return null

    const currentMin = getCurrentMinutes()
    return schedule.blocks.find((block) => {
      const start = timeToMinutes(block.startTime)
      const end = timeToMinutes(block.endTime)
      return currentMin >= start && currentMin < end
    }) || null
  },

  getNextBlock: () => {
    const { schedule } = get()
    if (!schedule) return null

    const currentMin = getCurrentMinutes()
    return schedule.blocks.find((block) => {
      return timeToMinutes(block.startTime) > currentMin
    }) || null
  },

  setActiveBlockId: (id) => set({ activeBlockId: id }),

  toggleBlockLock: (blockId: string) => {
    set((state) => {
      if (!state.schedule) return state
      return {
        schedule: {
          ...state.schedule,
          blocks: state.schedule.blocks.map((b) =>
            b.id === blockId ? { ...b, locked: !b.locked } : b
          ),
        },
      }
    })
  },
}))
