"use client"

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTimerStore } from '@/store/timer'
import { useTasksStore } from '@/store/tasks'
import { useAuthStore } from '@/store/auth'
import { useScheduleStore } from '@/store/schedule'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Play, Pause, SkipForward, RotateCcw, Minimize2, Maximize2, X, Coffee, Zap, Brain, CheckCircle2, Settings2, Calendar,
} from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { minutesToTime } from '@/lib/schedule-utils'
import type { TimerConfig, TimeBlock } from '@/types'
import { DEFAULT_TIMER_CONFIG } from '@/types'

function TimerConfigurator({ config, onSave, onClose }: {
  config: TimerConfig
  onSave: (c: TimerConfig) => void
  onClose: () => void
}) {
  const [focus, setFocus] = useState(config.focusDuration)
  const [brk, setBrk] = useState(config.breakDuration)
  const [longBrk, setLongBrk] = useState(config.longBreakDuration)
  const [interval, setInterval_] = useState(config.longBreakInterval)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card border border-border rounded-xl p-6 max-w-sm mx-auto space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Timer Configuration</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label className="text-xs">Focus (min)</Label>
          <Input type="number" min={1} max={120} value={focus} onChange={(e) => setFocus(Number(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Break (min)</Label>
          <Input type="number" min={1} max={60} value={brk} onChange={(e) => setBrk(Number(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Long Break (min)</Label>
          <Input type="number" min={1} max={60} value={longBrk} onChange={(e) => setLongBrk(Number(e.target.value))} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Pomodoros till long</Label>
          <Input type="number" min={2} max={10} value={interval} onChange={(e) => setInterval_(Number(e.target.value))} />
        </div>
      </div>

      <Button
        className="w-full"
        onClick={() => {
          onSave({ focusDuration: focus, breakDuration: brk, longBreakDuration: longBrk, longBreakInterval: interval, aiDecides: false })
          onClose()
        }}
      >
        Apply
      </Button>
    </motion.div>
  )
}

export function FocusTimer() {
  const timer = useTimerStore()
  const tasks = useTasksStore((s) => s.tasks)
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const schedule = useScheduleStore((s) => s.schedule)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showConfig, setShowConfig] = useState(false)

  const activeTasks = useMemo(() => tasks.filter((t) => t.status !== 'finished'), [tasks])
  const currentTask = useMemo(
    () => timer.currentTaskId ? tasks.find((t) => t.id === timer.currentTaskId) : null,
    [tasks, timer.currentTaskId]
  )

  // Load timer config from user profile on mount
  useEffect(() => {
    if (user?.timerConfig) {
      timer.loadConfig(user.timerConfig)
    }
  }, [user?.timerConfig])

  // Interval management: tick every second when running and not paused
  useEffect(() => {
    if (timer.isRunning && !timer.isPaused) {
      intervalRef.current = setInterval(() => {
        timer.tick()
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timer.isRunning, timer.isPaused])

  const progress = timer.totalTime > 0
    ? ((timer.totalTime - timer.timeRemaining) / timer.totalTime) * 100
    : 0

  const modeConfig = {
    focus: { label: 'Focus', icon: Zap, color: 'text-accent' },
    break: { label: 'Break', icon: Coffee, color: 'text-green-500' },
    long_break: { label: 'Long Break', icon: Brain, color: 'text-blue-500' },
  }

  const mode = modeConfig[timer.mode]
  const ModeIcon = mode.icon

  const handleSaveConfig = (cfg: TimerConfig) => {
    timer.loadConfig(cfg)
    timer.setDurations(cfg.focusDuration, cfg.breakDuration, cfg.longBreakDuration, cfg.longBreakInterval)
    updateProfile({ timerConfig: cfg })
  }

  // ── Schedule helpers ──────────────────────────────────────────────
  const nowMinutes = () => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  }

  const getUpcomingBlocks = (count = 5): TimeBlock[] => {
    if (!schedule) return []
    const cur = nowMinutes()
    return schedule.blocks
      .filter((b) => {
        const start = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1])
        return start >= cur
      })
      .slice(0, count)
  }

  const getActiveBlock = (): TimeBlock | null => {
    if (!schedule) return null
    const cur = nowMinutes()
    return schedule.blocks.find((b) => {
      const start = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1])
      const end = parseInt(b.endTime.split(':')[0]) * 60 + parseInt(b.endTime.split(':')[1])
      return cur >= start && cur < end
    }) || null
  }

  const getNextBlock = (): TimeBlock | null => {
    if (!schedule) return null
    const cur = nowMinutes()
    return schedule.blocks.find((b) => {
      const start = parseInt(b.startTime.split(':')[0]) * 60 + parseInt(b.startTime.split(':')[1])
      return start > cur
    }) || null
  }

  const blockIcon = (type: TimeBlock['type']) => {
    switch (type) {
      case 'task': return <Zap className="h-3.5 w-3.5 text-accent" />
      case 'break': return <Coffee className="h-3.5 w-3.5 text-green-500" />
      case 'lunch': return <Brain className="h-3.5 w-3.5 text-blue-500" />
      case 'buffer': return <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
      default: return <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const upcomingBlocks = getUpcomingBlocks(5)
  const activeBlock = getActiveBlock()
  const nextBlock = getNextBlock()

  // ── Full-screen focus mode ────────────────────────────────────────
  if (timer.isFocusScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <button
          onClick={() => timer.setFocusScreen(false)}
          className="absolute top-6 right-6 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center gap-8"
        >
          {/* Mode indicator */}
          <div className={`flex items-center gap-2 ${mode.color}`}>
            <ModeIcon className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-widest">{mode.label}</span>
          </div>

          {/* Timer ring */}
          <div className="relative">
            <svg className="w-72 h-72 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
              <motion.circle
                cx="100" cy="100" r="90"
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={565.48}
                animate={{ strokeDashoffset: 565.48 - (565.48 * progress) / 100 }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold tracking-tight tabular-nums">
                {formatTime(timer.timeRemaining)}
              </span>
              <span className="text-xs text-muted-foreground mt-2">
                #{timer.completedPomodoros + 1} of {timer.longBreakInterval}
              </span>
            </div>
          </div>

          {/* Current task */}
          {currentTask && (
            <div className="text-center max-w-sm">
              <p className="text-sm text-muted-foreground mb-1">Working on</p>
              <p className="text-lg font-medium">{currentTask.title}</p>
              {/* Schedule next-up indicator */}
              {schedule && nextBlock && (
                <p className="text-xs text-muted-foreground mt-2">
                  Next: {nextBlock.title} at {nextBlock.startTime}
                </p>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={timer.resetTimer} className="h-12 w-12">
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset</TooltipContent>
              </Tooltip>

              <Button
                size="lg"
                className="h-16 w-16 rounded-full"
                onClick={() => {
                  if (timer.isRunning) {
                    timer.isPaused ? timer.resumeTimer() : timer.pauseTimer()
                  }
                }}
              >
                {timer.isPaused
                  ? <Play className="h-7 w-7 ml-1" />
                  : <Pause className="h-7 w-7" />
                }
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={timer.mode === 'focus' ? timer.skipToBreak : timer.skipToFocus} className="h-12 w-12">
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Skip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Pomodoro dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: timer.longBreakInterval }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${
                  i < timer.completedPomodoros % timer.longBreakInterval
                    ? 'bg-accent'
                    : i === timer.completedPomodoros % timer.longBreakInterval && timer.mode === 'focus'
                    ? 'bg-accent/40'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    )
  }

  // ── Pill mode ─────────────────────────────────────────────────────
  if (timer.isPillMode && timer.isRunning) {
    return (
      <TooltipProvider delayDuration={0}>
        <motion.div
          drag
          dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
          dragElastic={0.1}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg cursor-grab active:cursor-grabbing"
        >
          <ModeIcon className={`h-4 w-4 ${mode.color}`} />
          <span className="text-sm font-bold tabular-nums">{formatTime(timer.timeRemaining)}</span>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => timer.isPaused ? timer.resumeTimer() : timer.pauseTimer()}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              {timer.isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
            <button onClick={() => timer.setFocusScreen(true)} className="p-1.5 hover:bg-muted rounded-full transition-colors">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </TooltipProvider>
    )
  }

  // ── Default inline view ───────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {showConfig ? (
            <TimerConfigurator
              key="config"
              config={timer.config}
              onSave={handleSaveConfig}
              onClose={() => setShowConfig(false)}
            />
          ) : !timer.isRunning ? (
            /* ── Start screen ──────────────────────────────────────── */
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center w-full max-w-md"
            >
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Zap className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Start a Focus Session</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {timer.focusDuration} min focus / {timer.breakDuration} min break / {timer.longBreakDuration} min long break
              </p>

              {/* Follow Schedule section */}
              {schedule && schedule.blocks.length > 0 && (
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Follow Schedule</p>
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 text-left">
                    {upcomingBlocks.map((block) => {
                      const isActive = activeBlock?.id === block.id
                      return (
                        <button
                          key={block.id}
                          onClick={() => {
                            if (block.taskId) {
                              timer.startTimer(block.taskId)
                            } else {
                              timer.startTimer()
                            }
                          }}
                          className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 flex items-center gap-3 ${
                            isActive
                              ? 'border-accent/60 bg-accent/10'
                              : 'border-border hover:border-accent/40 hover:bg-accent/5'
                          }`}
                        >
                          <div className="shrink-0">{blockIcon(block.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${isActive ? 'text-accent' : ''}`}>{block.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {block.startTime} - {block.endTime}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{block.duration}m</span>
                        </button>
                      )
                    })}
                    {upcomingBlocks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        No upcoming blocks for today
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Task selection */}
              {activeTasks.length > 0 && (
                <div className="space-y-1.5 mb-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Select a task</p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {activeTasks.slice(0, 8).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => timer.startTimer(task.id)}
                        className="w-full text-left rounded-lg border border-border px-3 py-2.5 text-sm hover:border-accent/40 hover:bg-accent/5 transition-all duration-200 flex items-center justify-between gap-2"
                      >
                        <span className="font-medium truncate">{task.title}</span>
                        {task.timeEstimate && (
                          <span className="text-xs text-muted-foreground shrink-0">{task.timeEstimate}m</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => timer.startTimer()} className="gap-2">
                  <Play className="h-4 w-4" /> Quick Start
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => setShowConfig(true)}>
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Configure timer</TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          ) : (
            /* ── Running timer view ─────────────────────────────────── */
            <motion.div
              key="timer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6 w-full max-w-md"
            >
              {/* Mode indicator */}
              <div className={`flex items-center gap-2 ${mode.color}`}>
                <ModeIcon className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-widest">{mode.label}</span>
              </div>

              {/* Timer ring */}
              <div className="relative">
                <svg className="w-56 h-56 -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
                  <motion.circle
                    cx="100" cy="100" r="90"
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={565.48}
                    animate={{ strokeDashoffset: 565.48 - (565.48 * progress) / 100 }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold tracking-tight tabular-nums">
                    {formatTime(timer.timeRemaining)}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    #{timer.completedPomodoros + 1}
                  </span>
                </div>
              </div>

              {/* Current task */}
              {currentTask && (
                <div className="text-center max-w-xs">
                  <p className="text-sm text-muted-foreground">Working on</p>
                  <p className="font-medium truncate">{currentTask.title}</p>
                  {/* Schedule next-up indicator */}
                  {schedule && nextBlock && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Next: {nextBlock.title} at {nextBlock.startTime}
                    </p>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={timer.resetTimer}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset</TooltipContent>
                </Tooltip>

                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full"
                  onClick={() => timer.isPaused ? timer.resumeTimer() : timer.pauseTimer()}
                >
                  {timer.isPaused
                    ? <Play className="h-6 w-6 ml-0.5" />
                    : <Pause className="h-6 w-6" />
                  }
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={timer.mode === 'focus' ? timer.skipToBreak : timer.skipToFocus}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Skip</TooltipContent>
                </Tooltip>
              </div>

              {/* Bottom actions */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <Button variant="outline" size="sm" onClick={() => timer.setPillMode(true)} className="gap-1.5">
                  <Minimize2 className="h-3.5 w-3.5" /> Pill Mode
                </Button>
                <Button variant="outline" size="sm" onClick={() => timer.setFocusScreen(true)} className="gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5" /> Full Screen
                </Button>
                <Button variant="ghost" size="sm" onClick={timer.finishEarly} className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Finish
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowConfig(true)} className="gap-1.5">
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Pomodoro dots */}
              <div className="flex items-center gap-2">
                {Array.from({ length: timer.longBreakInterval }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                      i < timer.completedPomodoros % timer.longBreakInterval ? 'bg-accent' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {/* Schedule upcoming blocks */}
              {schedule && upcomingBlocks.length > 0 && (
                <div className="w-full border-t border-border pt-4 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Upcoming</p>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {upcomingBlocks.slice(0, 4).map((block) => {
                      const isActive = activeBlock?.id === block.id
                      return (
                        <div
                          key={block.id}
                          className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs ${
                            isActive ? 'bg-accent/10 border border-accent/30' : ''
                          }`}
                        >
                          {blockIcon(block.type)}
                          <span className={`flex-1 truncate font-medium ${isActive ? 'text-accent' : ''}`}>
                            {block.title}
                          </span>
                          <span className="text-muted-foreground shrink-0">
                            {block.startTime}-{block.endTime}
                          </span>
                          <span className="text-muted-foreground shrink-0">{block.duration}m</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
