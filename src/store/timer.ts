import { create } from 'zustand'
import type { TimerConfig } from '@/types'
import { DEFAULT_TIMER_CONFIG } from '@/types'

interface TimerStore {
  isRunning: boolean
  isPaused: boolean
  mode: 'focus' | 'break' | 'long_break'
  timeRemaining: number
  totalTime: number
  currentTaskId: string | undefined
  completedPomodoros: number
  focusDuration: number
  breakDuration: number
  longBreakDuration: number
  longBreakInterval: number
  isPillMode: boolean
  isFocusScreen: boolean
  config: TimerConfig

  startTimer: (taskId?: string) => void
  pauseTimer: () => void
  resumeTimer: () => void
  resetTimer: () => void
  tick: () => void
  skipToBreak: () => void
  skipToFocus: () => void
  finishEarly: () => void
  setDurations: (focus: number, breakTime: number, longBreak: number, interval: number) => void
  setPillMode: (pill: boolean) => void
  setFocusScreen: (focus: boolean) => void
  loadConfig: (config: TimerConfig) => void
}

export const useTimerStore = create<TimerStore>()((set, get) => ({
  isRunning: false,
  isPaused: false,
  mode: 'focus',
  timeRemaining: DEFAULT_TIMER_CONFIG.focusDuration * 60,
  totalTime: DEFAULT_TIMER_CONFIG.focusDuration * 60,
  currentTaskId: undefined,
  completedPomodoros: 0,
  focusDuration: DEFAULT_TIMER_CONFIG.focusDuration,
  breakDuration: DEFAULT_TIMER_CONFIG.breakDuration,
  longBreakDuration: DEFAULT_TIMER_CONFIG.longBreakDuration,
  longBreakInterval: DEFAULT_TIMER_CONFIG.longBreakInterval,
  isPillMode: false,
  isFocusScreen: false,
  config: DEFAULT_TIMER_CONFIG,

  startTimer: (taskId) =>
    set({
      isRunning: true,
      isPaused: false,
      mode: 'focus',
      timeRemaining: get().focusDuration * 60,
      totalTime: get().focusDuration * 60,
      currentTaskId: taskId,
    }),

  pauseTimer: () => set({ isPaused: true }),
  resumeTimer: () => set({ isPaused: false }),

  resetTimer: () =>
    set({
      isRunning: false,
      isPaused: false,
      mode: 'focus',
      timeRemaining: get().focusDuration * 60,
      totalTime: get().focusDuration * 60,
      currentTaskId: undefined,
      completedPomodoros: 0,
    }),

  tick: () => {
    const state = get()
    if (!state.isRunning || state.isPaused) return

    if (state.timeRemaining <= 1) {
      if (state.mode === 'focus') {
        const newCount = state.completedPomodoros + 1
        if (newCount % state.longBreakInterval === 0) {
          set({
            mode: 'long_break',
            timeRemaining: state.longBreakDuration * 60,
            totalTime: state.longBreakDuration * 60,
            completedPomodoros: newCount,
          })
        } else {
          set({
            mode: 'break',
            timeRemaining: state.breakDuration * 60,
            totalTime: state.breakDuration * 60,
            completedPomodoros: newCount,
          })
        }
      } else {
        set({
          mode: 'focus',
          timeRemaining: state.focusDuration * 60,
          totalTime: state.focusDuration * 60,
        })
      }
    } else {
      set({ timeRemaining: state.timeRemaining - 1 })
    }
  },

  skipToBreak: () => {
    const state = get()
    const newCount = state.completedPomodoros + 1
    set({
      mode: newCount % state.longBreakInterval === 0 ? 'long_break' : 'break',
      timeRemaining: (newCount % state.longBreakInterval === 0 ? state.longBreakDuration : state.breakDuration) * 60,
      totalTime: (newCount % state.longBreakInterval === 0 ? state.longBreakDuration : state.breakDuration) * 60,
      completedPomodoros: newCount,
    })
  },

  skipToFocus: () => {
    const state = get()
    set({
      mode: 'focus',
      timeRemaining: state.focusDuration * 60,
      totalTime: state.focusDuration * 60,
    })
  },

  finishEarly: () => set({ isRunning: false, isPaused: false }),

  setDurations: (focus, breakTime, longBreak, interval) =>
    set({
      focusDuration: focus,
      breakDuration: breakTime,
      longBreakDuration: longBreak,
      longBreakInterval: interval,
      config: { focusDuration: focus, breakDuration: breakTime, longBreakDuration: longBreak, longBreakInterval: interval, aiDecides: false },
    }),

  loadConfig: (cfg: TimerConfig) =>
    set({
      config: cfg,
      focusDuration: cfg.focusDuration,
      breakDuration: cfg.breakDuration,
      longBreakDuration: cfg.longBreakDuration,
      longBreakInterval: cfg.longBreakInterval,
      timeRemaining: cfg.focusDuration * 60,
      totalTime: cfg.focusDuration * 60,
    }),

  setPillMode: (isPillMode) => set({ isPillMode }),
  setFocusScreen: (isFocusScreen) => set({ isFocusScreen }),
}))
