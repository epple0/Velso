"use client"

import React, { useState, useMemo } from 'react'
import { useTasksStore } from '@/store/tasks'
import { useScheduleStore } from '@/store/schedule'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight, GripVertical, Clock, Play } from 'lucide-react'
import { getWeekDates, formatDate } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { getCategoryColor, type TimeBlock, type Task } from '@/types'
import { timeToMinutes, minutesToTime, isBlockActive, isBlockUpcoming } from '@/lib/schedule-utils'
import Link from 'next/link'

const HOUR_HEIGHT = 40
const START_HOUR = 6
const END_HOUR = 22
const TOTAL_HOURS = END_HOUR - START_HOUR

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12AM'
  if (hour === 12) return '12PM'
  return hour < 12 ? `${hour}AM` : `${hour - 12}PM`
}

function getBlockColor(type: TimeBlock['type']): string {
  switch (type) {
    case 'task':
      return 'bg-accent/20 border-accent/40 text-accent-foreground'
    case 'break':
      return 'bg-green-500/20 border-green-500/40 text-green-400'
    case 'buffer':
      return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
    case 'lunch':
      return 'bg-blue-500/20 border-blue-500/40 text-blue-400'
    default:
      return 'bg-muted border-border'
  }
}

export function TaskCalendar() {
  const tasks = useTasksStore((s) => s.tasks)
  const updateTask = useTasksStore((s) => s.updateTask)
  const schedule = useScheduleStore((s) => s.schedule)
  const [weekOffset, setWeekOffset] = useState(0)
  const [dragTaskId, setDragTaskId] = useState<string | null>(null)

  const weekDates = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7)
    return getWeekDates(d)
  }, [weekOffset])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      if (!task.dueDate) continue
      const dateStr = task.dueDate.split('T')[0]
      if (!map.has(dateStr)) map.set(dateStr, [])
      map.get(dateStr)!.push(task)
    }
    return map
  }, [tasks])

  const tasksWithoutDate = useMemo(() => tasks.filter((t) => !t.dueDate), [tasks])

  const isToday = (date: Date) => {
    return date.toISOString().split('T')[0] === todayStr
  }

  const handleDragStart = (taskId: string) => {
    setDragTaskId(taskId)
  }

  const handleDrop = (date: Date) => {
    if (dragTaskId) {
      const dateStr = date.toISOString().split('T')[0]
      updateTask(dragTaskId, { dueDate: dateStr })
      setDragTaskId(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragEnd = () => {
    setDragTaskId(null)
  }

  // Schedule blocks are only shown for today's column when the schedule exists
  const todayScheduleBlocks = useMemo(() => {
    if (!schedule || schedule.date !== todayStr) return []
    return schedule.blocks
  }, [schedule, todayStr])

  const hours = useMemo(() => {
    const result: number[] = []
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      result.push(h)
    }
    return result
  }, [])

  const gridHeight = TOTAL_HOURS * HOUR_HEIGHT

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">
              {formatDate(weekDates[0].toISOString())} &mdash; {formatDate(weekDates[6].toISOString())}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset((w) => w - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous week</TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={() => setWeekOffset((w) => w + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next week</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Calendar Time Grid */}
        <div className="relative overflow-auto rounded-xl border border-border bg-card">
          <div className="flex min-w-[900px]">
            {/* Hour labels column */}
            <div className="w-14 shrink-0 border-r border-border">
              <div className="h-12 border-b border-border" /> {/* spacer for day headers */}
              <div className="relative" style={{ height: gridHeight }}>
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute right-2 text-[10px] text-muted-foreground -translate-y-1/2"
                    style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                  >
                    {formatHourLabel(hour)}
                  </div>
                ))}
              </div>
            </div>

            {/* Day columns */}
            <div className="flex-1 grid grid-cols-7">
              {/* Day headers */}
              {weekDates.map((date, i) => (
                <div
                  key={`header-${date.toISOString()}`}
                  className={`h-12 flex flex-col items-center justify-center border-b border-r border-border last:border-r-0 ${
                    isToday(date) ? 'bg-accent/5' : ''
                  }`}
                >
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider leading-none">
                    {dayNames[i]}
                  </span>
                  <span className={`text-sm font-semibold leading-tight ${isToday(date) ? 'text-accent' : ''}`}>
                    {date.getDate()}
                  </span>
                </div>
              ))}

              {/* Time grid rows for each day column */}
              {weekDates.map((date, dayIndex) => {
                const dayTasks = tasksByDate.get(date.toISOString().split('T')[0]) || []
                const isTodayCol = isToday(date)

                return (
                  <div
                    key={`col-${date.toISOString()}`}
                    className={`relative border-r border-border last:border-r-0 ${
                      isTodayCol ? 'bg-accent/[0.02]' : ''
                    } ${dragTaskId ? 'transition-colors' : ''}`}
                    style={{ height: gridHeight }}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(date)}
                  >
                    {/* Horizontal grid lines */}
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-border/40"
                        style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                      />
                    ))}

                    {/* Half-hour subtle lines */}
                    {hours.slice(0, -1).map((hour) => (
                      <div
                        key={`half-${hour}`}
                        className="absolute left-0 right-0 border-t border-border/20"
                        style={{ top: (hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                      />
                    ))}

                    {/* Schedule blocks (only for today) */}
                    {isTodayCol && todayScheduleBlocks.map((block) => {
                      const startMin = timeToMinutes(block.startTime)
                      const endMin = timeToMinutes(block.endTime)
                      const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT
                      const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20)
                      const active = isBlockActive(block)
                      const upcoming = isBlockUpcoming(block)

                      return (
                        <Tooltip key={block.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={`absolute left-1 right-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium overflow-hidden cursor-default z-10 ${getBlockColor(block.type)} ${
                                active ? 'ring-2 ring-accent/60 shadow-lg' : ''
                              } ${upcoming ? 'opacity-80' : 'opacity-50'}`}
                              style={{ top, height }}
                            >
                              {active && (
                                <span className="absolute inset-0 animate-pulse bg-accent/10 rounded-md" />
                              )}
                              <div className="relative flex items-center gap-1">
                                {active && <Play className="h-2.5 w-2.5 shrink-0" />}
                                {!active && block.type === 'task' && <Clock className="h-2.5 w-2.5 shrink-0 opacity-60" />}
                                <span className="truncate">{block.title}</span>
                              </div>
                              <div className="relative text-[8px] opacity-70">
                                {block.startTime} - {block.endTime}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            <div className="font-medium">{block.title}</div>
                            <div>{block.startTime} &ndash; {block.endTime} ({block.duration}min)</div>
                            {block.type === 'task' && block.taskId && (
                              <Link href={`/tasks?id=${block.taskId}`} className="text-accent underline">
                                View task
                              </Link>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}

                    {/* Task pills for this day */}
                    <AnimatePresence>
                      {dayTasks.map((task) => {
                        // Position task pills below schedule blocks area or stack them at top
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`absolute left-0.5 right-0.5 rounded-md border px-1.5 py-1 text-[10px] z-20 ${getCategoryColor(task.category || 'default')} cursor-default`}
                            style={{
                              bottom: dayTasks.indexOf(task) * 28 + 4,
                              height: 24,
                            }}
                          >
                            <div className="font-medium truncate leading-tight">{task.title}</div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

                    {/* Drag-over highlight */}
                    {dragTaskId && (
                      <div className="absolute inset-0 bg-accent/5 border-2 border-dashed border-accent/30 rounded-sm pointer-events-none z-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Unscheduled tasks - draggable pills */}
        {tasksWithoutDate.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Unscheduled ({tasksWithoutDate.length}) &mdash; drag to a day above
            </h4>
            <div className="flex flex-wrap gap-2">
              {tasksWithoutDate.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 cursor-grab active:cursor-grabbing hover:border-accent/30 transition-colors"
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{task.title}</span>
                  {task.category && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getCategoryColor(task.category)}`}>
                      {task.category}
                    </span>
                  )}
                  {task.timeEstimate && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {task.timeEstimate}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
