export type TaskStatus = 'not_started' | 'in_progress' | 'finished'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ViewMode = 'list' | 'kanban' | 'calendar'
export type WorkStyle = 'flow' | 'balanced' | 'sprint'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  category?: string
  dueDate?: string
  timeEstimate?: number // minutes
  location?: string
  order: number
  createdAt: string
  updatedAt: string
  userId: string
}

export interface TimeBlock {
  id: string
  taskId?: string
  title: string
  type: 'task' | 'break' | 'buffer' | 'lunch'
  startTime: string
  endTime: string
  duration: number
  locked: boolean
}

export interface Schedule {
  id?: string
  userId?: string
  date: string
  blocks: TimeBlock[]
  backlog: { task: { id: string; title: string }; reason: string }[]
  workStyle: WorkStyle
  startTime: string
  generatedAt: string
}

export interface TimerConfig {
  focusDuration: number    // minutes
  breakDuration: number    // minutes
  longBreakDuration: number // minutes
  longBreakInterval: number // after N pomodoros
  aiDecides: boolean       // let AI pick durations based on task
}

export interface TimerState {
  isRunning: boolean
  isPaused: boolean
  mode: 'focus' | 'break' | 'long_break'
  timeRemaining: number
  totalTime: number
  currentTaskId?: string
  completedPomodoros: number
  config: TimerConfig
  isPillMode: boolean
  isFocusScreen: boolean
}

export type ThemeName = 'onyx' | 'cloud' | 'custom'

export interface ThemeColors {
  primary: string
  accent: string
  ring: string
  background: string
  foreground: string
  card: string
  muted: string
  border: string
}

export interface SavedTheme {
  name: string
  colors: ThemeColors
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatarUrl?: string
  startOfDay: string
  endOfDay: string
  bufferPercent: number
  categories: string[]
  geminiApiKey?: string
  geminiModel: string
  timerConfig?: TimerConfig
  savedThemes?: SavedTheme[]
  workStyle: WorkStyle
  taskSpreadEnabled: boolean
}

// Work style configurations
export const WORK_STYLES: Record<WorkStyle, {
  label: string
  description: string
  tooltip: string
  icon: string
  focusDuration: number
  breakDuration: number
  longBreakDuration: number
}> = {
  flow: {
    label: 'Flow',
    description: 'Deep, extended focus sessions',
    tooltip: '45-min focus blocks with 15-min breaks. Maximum deep thinking. Best for creative or complex work that needs sustained concentration.',
    icon: '🌊',
    focusDuration: 45,
    breakDuration: 15,
    longBreakDuration: 30,
  },
  balanced: {
    label: 'Balanced',
    description: 'Classic Pomodoro rhythm',
    tooltip: '25-min focus blocks with 5-min breaks. The proven Pomodoro technique. Best balance of focus and rest for most work styles.',
    icon: '⚖️',
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
  },
  sprint: {
    label: 'Sprint',
    description: 'High-intensity output mode',
    tooltip: '50-min focus blocks with 10-min breaks and 15% buffer. Maximum throughput for deadline crunches. Push hard, recover fast.',
    icon: '🔥',
    focusDuration: 50,
    breakDuration: 10,
    longBreakDuration: 20,
  },
}

export const DEFAULT_CATEGORIES = [
  'Work',
  'Personal',
  'Health',
  'Learning',
  'Creative',
]

export const CATEGORY_COLORS: Record<string, string> = {
  Work: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Personal: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  Health: 'bg-green-500/15 text-green-400 border-green-500/20',
  Learning: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Creative: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
}

// Fallback color for user-created categories
const EXTRA_COLORS = [
  'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  'bg-red-500/15 text-red-400 border-red-500/20',
  'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  'bg-teal-500/15 text-teal-400 border-teal-500/20',
  'bg-amber-500/15 text-amber-400 border-amber-500/20',
]

export function getCategoryColor(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category]
  // Deterministic color for custom categories
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash)
  return EXTRA_COLORS[Math.abs(hash) % EXTRA_COLORS.length]
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  aiDecides: false,
}

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable, best for complex scheduling' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and efficient, great for daily planning' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Latest stable, balanced speed and quality' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Lightweight, fastest responses' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Proven, good for detailed analysis' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast legacy model' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Smallest, most efficient' },
]

// Profanity filter — basic blocklist for theme names
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'dick', 'bastard',
  'hell', 'piss', 'slut', 'whore', 'cock', 'pussy', 'nigger', 'nigga',
  'retard', 'faggot', 'dyke', 'tranny', 'chink', 'spic', 'kike',
]

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return PROFANITY_LIST.some((word) => {
    if (word.length <= 4) {
      return lower.includes(word)
    }
    return new RegExp(`\\b${word}\\b`, 'i').test(lower)
  })
}
