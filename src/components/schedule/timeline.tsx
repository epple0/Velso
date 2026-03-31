"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasksStore } from '@/store/tasks'
import { useAuthStore } from '@/store/auth'
import { useScheduleStore } from '@/store/schedule'
import { generateSchedule } from '@/lib/gemini'
import { getNextSlotTime } from '@/lib/schedule-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Sparkles, Lock, Unlock, Coffee, Clock, Zap, AlertTriangle, RefreshCw, Loader2, Calendar, Play,
} from 'lucide-react'
import { WORK_STYLES, type WorkStyle, type TimeBlock } from '@/types'
import { formatTimeOfDay } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function isBlockActive(block: TimeBlock): boolean {
  const now = new Date()
  const currentMin = now.getHours() * 60 + now.getMinutes()
  const startMin = timeToMinutes(block.startTime)
  const endMin = timeToMinutes(block.endTime)
  return currentMin >= startMin && currentMin < endMin
}

function getBlockIcon(type: TimeBlock['type']) {
  switch (type) {
    case 'task': return <Zap className="h-3.5 w-3.5" />
    case 'break': return <Coffee className="h-3.5 w-3.5" />
    case 'buffer': return <Clock className="h-3.5 w-3.5" />
    case 'lunch': return <Coffee className="h-3.5 w-3.5" />
  }
}

function getBlockColor(type: TimeBlock['type']) {
  switch (type) {
    case 'task': return 'border-accent/40 bg-accent/5'
    case 'break': return 'border-green-500/30 bg-green-500/5'
    case 'buffer': return 'border-yellow-500/30 bg-yellow-500/5'
    case 'lunch': return 'border-blue-500/30 bg-blue-500/5'
  }
}

export function ScheduleTimeline() {
  const tasks = useTasksStore((s) => s.tasks)
  const user = useAuthStore((s) => s.user)
  const schedule = useScheduleStore((s) => s.schedule)

  const [startTime, setStartTime] = useState(getNextSlotTime())
  const [selectedWorkStyle, setSelectedWorkStyle] = useState<WorkStyle>(
    (user?.workStyle as WorkStyle) || 'balanced'
  )
  const [loading, setLoading] = useState(false)

  const handleOptimize = async () => {
    if (!user?.geminiApiKey) {
      toast.error('Please add your Gemini API key in Settings')
      return
    }

    const activeTasks = tasks.filter((t) => t.status !== 'finished')
    if (activeTasks.length === 0) {
      toast.error('Add some tasks first')
      return
    }

    setLoading(true)
    try {
      const result = await generateSchedule(
        user.geminiApiKey,
        user.geminiModel || 'gemini-2.0-flash',
        tasks,
        user.endOfDay || '18:00',
        user.bufferPercent || 15,
        startTime || undefined,
        user.workStyle || 'balanced',
        user.taskSpreadEnabled || false,
      )

      useScheduleStore.getState().setSchedule(result)

      if (user.id) {
        await useScheduleStore.getState().saveSchedule(user.id)
      }

      toast.success('Schedule generated successfully')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate schedule')
    } finally {
      setLoading(false)
    }
  }

  const toggleLock = (blockId: string) => {
    const currentSchedule = useScheduleStore.getState().schedule
    if (!currentSchedule) return

    const updatedBlocks = currentSchedule.blocks.map((b) =>
      b.id === blockId ? { ...b, locked: !b.locked } : b
    )

    useScheduleStore.getState().setSchedule({
      ...currentSchedule,
      blocks: updatedBlocks,
    })
  }

  // --- Empty state: no schedule yet ---
  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg space-y-6"
        >
          <div className="flex flex-col items-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-6">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Optimize your day</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Let AI arrange your tasks into an optimal schedule with Pomodoro breaks and buffer time built in.
            </p>
          </div>

          {/* Start time input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Start Time</label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="max-w-[200px] mx-auto"
            />
          </div>

          {/* Work style selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Work Style</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(WORK_STYLES) as [WorkStyle, typeof WORK_STYLES[WorkStyle]][]).map(
                ([key, style]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedWorkStyle(key)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-4 transition-all duration-200 ${
                      selectedWorkStyle === key
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-border bg-card hover:border-accent/50'
                    }`}
                  >
                    <span className="text-2xl">{style.icon}</span>
                    <span className="text-sm font-medium">{style.label}</span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {style.description}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Optimize button */}
          <Button onClick={handleOptimize} disabled={loading} size="lg" className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Optimize My Day
              </>
            )}
          </Button>
        </motion.div>
      </div>
    )
  }

  // --- Schedule exists: show timeline ---
  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Today&apos;s Schedule</h3>
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatTimeOfDay(schedule.startTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => useScheduleStore.getState().setSchedule(null)}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
            <Button size="sm" onClick={handleOptimize} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Re-optimize
            </Button>
          </div>
        </div>

        {/* View in Calendar link */}
        <Link
          href="/tasks?view=calendar"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <Calendar className="h-3.5 w-3.5" />
          View in Calendar
        </Link>

        {/* Timeline blocks */}
        <div className="relative space-y-2">
          <AnimatePresence>
            {schedule.blocks.map((block, i) => {
              const active = isBlockActive(block)
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`flex items-stretch gap-3 rounded-lg border p-3 transition-all duration-200 ${getBlockColor(block.type)} ${
                    active ? 'ring-2 ring-accent/30 shadow-md' : ''
                  }`}
                >
                  {/* Time */}
                  <div className="w-20 shrink-0 flex flex-col justify-center">
                    <span className="text-xs font-medium">{formatTimeOfDay(block.startTime)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeOfDay(block.endTime)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getBlockIcon(block.type)}
                      <span className="text-sm font-medium truncate">{block.title}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {block.duration}m
                      </Badge>
                    </div>
                    {/* Start Focus button for task blocks */}
                    {block.type === 'task' && block.taskId && (
                      <Link href="/focus">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1.5 text-[11px] text-accent hover:text-accent px-0"
                        >
                          <Play className="h-3 w-3" />
                          Start Focus
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Lock toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => toggleLock(block.id)}
                        className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors self-center"
                      >
                        {block.locked ? (
                          <Lock className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {block.locked ? 'Locked - will not move on re-optimize' : 'Click to lock this block'}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Backlog */}
        {schedule.backlog.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Backlog
            </h4>
            <div className="space-y-2">
              {schedule.backlog.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <span className="text-sm font-medium">{item.task.title}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-[10px] text-muted-foreground cursor-help underline underline-offset-2 decoration-dotted">
                        Why?
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{item.reason}</TooltipContent>
                  </Tooltip>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
