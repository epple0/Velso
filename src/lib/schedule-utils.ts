import type { TimeBlock, WorkStyle } from '@/types'

/**
 * Round minutes to nearest step (default 15)
 */
export function roundToNearest(minutes: number, step = 15): number {
  return Math.ceil(minutes / step) * step
}

/**
 * Round minutes DOWN to nearest step
 */
export function roundDownToNearest(minutes: number, step = 15): number {
  return Math.floor(minutes / step) * step
}

/**
 * Get current time rounded up to next 15-min boundary
 */
export function getNextSlotTime(now?: Date): string {
  const d = now || new Date()
  const totalMin = d.getHours() * 60 + d.getMinutes()
  const rounded = roundToNearest(totalMin, 15)
  const hours = Math.floor(rounded / 60)
  const mins = rounded % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Get current time rounded down to 15-min boundary
 */
export function getCurrentSlotTime(now?: Date): string {
  const d = now || new Date()
  const totalMin = d.getHours() * 60 + d.getMinutes()
  const rounded = roundDownToNearest(totalMin, 15)
  const hours = Math.floor(rounded / 60)
  const mins = rounded % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Add minutes to a time string "HH:MM" and return "HH:MM"
 */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const newH = Math.floor(total / 60)
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

/**
 * Convert "HH:MM" to total minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * Convert total minutes to "HH:MM"
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Check if a time block is start time has passed
 */
export function isBlockActive(block: TimeBlock): boolean {
  const now = new Date()
  const currentMin = now.getHours() * 60 + now.getMinutes()
  const startMin = timeToMinutes(block.startTime)
  const endMin = timeToMinutes(block.endTime)
  return currentMin >= startMin && currentMin < endMin
}

/**
 * Check if a block is in the future
 */
export function isBlockUpcoming(block: TimeBlock): boolean {
  const now = new Date()
  const currentMin = now.getHours() * 60 + now.getMinutes()
  return timeToMinutes(block.startTime) > currentMin
}

/**
 * Work style timing presets
 */
export const WORK_STYLE_TIMING: Record<WorkStyle, {
  focusBlock: number
  shortBreak: number
  longBreak: number
  pomodorosBeforeLongBreak: number
  bufferPercent: number
}> = {
  flow: {
    focusBlock: 45,
    shortBreak: 15,
    longBreak: 30,
    pomodorosBeforeLongBreak: 3,
    bufferPercent: 10,
  },
  balanced: {
    focusBlock: 25,
    shortBreak: 5,
    longBreak: 15,
    pomodorosBeforeLongBreak: 4,
    bufferPercent: 15,
  },
  sprint: {
    focusBlock: 50,
    shortBreak: 10,
    longBreak: 20,
    pomodorosBeforeLongBreak: 4,
    bufferPercent: 8,
  },
}

/**
 * Generate evenly-spaced time blocks from tasks
 */
export function generateBlocksFromTasks(
  tasks: { id: string; title: string; timeEstimate?: number; category?: string; priority?: string }[],
  startTime: string,
  workStyle: WorkStyle,
  endOfDay: string,
  bufferPercent: number,
  spreadTasks: boolean,
): { blocks: TimeBlock[]; backlog: { task: { id: string; title: string }; reason: string }[] } {
  const timing = WORK_STYLE_TIMING[workStyle]
  const blocks: TimeBlock[] = []
  const backlog: { task: { id: string; title: string }; reason: string }[] = []

  let currentTime = timeToMinutes(startTime)
  const endMin = timeToMinutes(endOfDay)
  let pomodoroCount = 0
  let blockIndex = 0

  // Sort tasks: high priority first, then by time estimate
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    const pa = priorityOrder[(a.priority as keyof typeof priorityOrder) ?? 'medium'] ?? 2
    const pb = priorityOrder[(b.priority as keyof typeof priorityOrder) ?? 'medium'] ?? 2
    if (pa !== pb) return pa - pb
    return (b.timeEstimate || 30) - (a.timeEstimate || 30)
  })

  // If spread tasks, alternate categories
  if (spreadTasks && sortedTasks.length > 1) {
    const byCategory = new Map<string, typeof sortedTasks>()
    sortedTasks.forEach((t) => {
      const cat = t.category || 'uncategorized'
      if (!byCategory.has(cat)) byCategory.set(cat, [])
      byCategory.get(cat)!.push(t)
    })

    const interleaved: typeof sortedTasks = []
    const categories = Array.from(byCategory.keys())
    let idx = 0
    while (interleaved.length < sortedTasks.length) {
      for (const cat of categories) {
        const list = byCategory.get(cat)!
        if (idx < list.length) {
          interleaved.push(list[idx])
        }
      }
      idx++
    }
    sortedTasks.splice(0, sortedTasks.length, ...interleaved)
  }

  for (const task of sortedTasks) {
    const taskDuration = task.timeEstimate || 30
    const roundedDuration = roundToNearest(taskDuration, 5)

    // Check if we have room
    if (currentTime + roundedDuration > endMin) {
      backlog.push({
        task: { id: task.id, title: task.title },
        reason: `Not enough time. Needs ${roundedDuration}min but only ${endMin - currentTime}min remaining.`,
      })
      continue
    }

    // Add task block
    blocks.push({
      id: `block-${blockIndex++}`,
      taskId: task.id,
      title: task.title,
      type: 'task',
      startTime: minutesToTime(currentTime),
      endTime: minutesToTime(currentTime + roundedDuration),
      duration: roundedDuration,
      locked: false,
    })
    currentTime += roundedDuration
    pomodoroCount++

    // Add break
    if (currentTime >= endMin) continue

    const isLongBreak = pomodoroCount % timing.pomodorosBeforeLongBreak === 0
    const breakDuration = isLongBreak ? timing.longBreak : timing.shortBreak
    const roundedBreak = roundToNearest(breakDuration, 5)

    if (currentTime + roundedBreak > endMin) continue

    blocks.push({
      id: `block-${blockIndex++}`,
      title: isLongBreak ? 'Long Break' : 'Short Break',
      type: isLongBreak ? 'lunch' : 'break',
      startTime: minutesToTime(currentTime),
      endTime: minutesToTime(currentTime + roundedBreak),
      duration: roundedBreak,
      locked: false,
    })
    currentTime += roundedBreak

    // Add buffer
    if (bufferPercent > 0 && currentTime < endMin) {
      const bufferMin = Math.max(5, roundToNearest(Math.round(timing.focusBlock * bufferPercent / 100), 5))
      if (currentTime + bufferMin <= endMin) {
        blocks.push({
          id: `block-${blockIndex++}`,
          title: 'Buffer',
          type: 'buffer',
          startTime: minutesToTime(currentTime),
          endTime: minutesToTime(currentTime + bufferMin),
          duration: bufferMin,
          locked: false,
        })
        currentTime += bufferMin
      }
    }
  }

  return { blocks, backlog }
}
