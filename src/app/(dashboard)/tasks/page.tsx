"use client"

import React, { useState, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasksStore } from '@/store/tasks'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { List, Columns3, Calendar, Plus, Search, Circle, Loader2, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react'
import type { ViewMode, TaskPriority, TaskStatus, Task } from '@/types'
import { toast } from 'sonner'

const loadingFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
  </div>
)

const TaskList = dynamic(() => import('@/components/tasks/task-list').then((m) => ({ default: m.TaskList })), { ssr: false, loading: loadingFallback })
const TaskKanban = dynamic(() => import('@/components/tasks/task-kanban').then((m) => ({ default: m.TaskKanban })), { ssr: false, loading: loadingFallback })
const TaskCalendar = dynamic(() => import('@/components/tasks/task-calendar').then((m) => ({ default: m.TaskCalendar })), { ssr: false, loading: loadingFallback })
const TaskCreate = dynamic(() => import('@/components/tasks/task-create').then((m) => ({ default: m.TaskCreate })), { ssr: false })

const viewButtons: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: 'list', icon: List, label: 'List' },
  { mode: 'kanban', icon: Columns3, label: 'Kanban' },
  { mode: 'calendar', icon: Calendar, label: 'Calendar' },
]

export default function TasksPage() {
  const viewMode = useTasksStore((s) => s.viewMode)
  const setViewMode = useTasksStore((s) => s.setViewMode)
  const tasks = useTasksStore((s) => s.tasks)
  const addTask = useTasksStore((s) => s.addTask)
  const user = useAuthStore((s) => s.user)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [quickAdd, setQuickAdd] = useState('')
  const quickAddRef = useRef<HTMLInputElement>(null)
  const categories = user?.categories || []

  const statusCounts = useMemo(() => ({
    not_started: tasks.filter((t) => t.status === 'not_started').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    finished: tasks.filter((t) => t.status === 'finished').length,
  }), [tasks])

  const handleQuickAdd = useCallback(() => {
    const raw = quickAdd.trim()
    if (!raw) return

    let title = raw
    let priority: TaskPriority = 'medium'
    let category: string | undefined
    let timeEstimate: number | undefined
    let dueDate: string | undefined

    // Parse !1-4 for priority
    const pMatch = title.match(/\s!(\d)\s*$/)
    if (pMatch) {
      const levels: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
      const idx = parseInt(pMatch[1]) - 1
      if (idx >= 0 && idx < 4) priority = levels[idx]
      title = title.replace(/\s!\d\s*$/, '')
    }

    // Parse #category
    const cMatch = title.match(/\s#(\S+)/)
    if (cMatch) {
      const found = categories.find((c) => c.toLowerCase() === cMatch[1].toLowerCase())
      if (found) category = found
      title = title.replace(/\s#\S+/, '')
    }

    // Parse time: 30m, 1h
    const tMatch = title.match(/\s(\d+)(m|h)\b/)
    if (tMatch) {
      timeEstimate = tMatch[2] === 'h' ? parseInt(tMatch[1]) * 60 : parseInt(tMatch[1])
      title = title.replace(/\s\d+[mh]\b/, '')
    }

    // Parse date: mm/dd or mm-dd or today/tomorrow
    const dMatch = title.match(/\s(\d{1,2}[\/\-]\d{1,2})(?:\s|$)/)
    if (dMatch) {
      const parts = dMatch[1].split(/[\/\-]/)
      const now = new Date()
      const parsed = new Date(now.getFullYear(), parseInt(parts[0]) - 1, parseInt(parts[1]))
      if (!isNaN(parsed.getTime())) {
        dueDate = parsed.toISOString().split('T')[0]
      }
      title = title.replace(/\s\d{1,2}[\/\-]\d{1,2}/, '')
    }

    // Parse "today" / "tomorrow" / "monday" etc.
    const dayWords = ['today', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    const dayMatch = title.match(new RegExp(`\\s(${dayWords.join('|')})\\b`, 'i'))
    if (dayMatch && !dueDate) {
      const word = dayMatch[1].toLowerCase()
      const now = new Date()
      if (word === 'today') {
        dueDate = now.toISOString().split('T')[0]
      } else if (word === 'tomorrow') {
        now.setDate(now.getDate() + 1)
        dueDate = now.toISOString().split('T')[0]
      } else {
        const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
          sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }
        const target = dayMap[word]
        if (target !== undefined) {
          const current = now.getDay()
          let diff = target - current
          if (diff <= 0) diff += 7
          now.setDate(now.getDate() + diff)
          dueDate = now.toISOString().split('T')[0]
        }
      }
      title = title.replace(new RegExp(`\\s${dayMatch[1]}\\b`, 'i'), '')
    }

    title = title.trim()
    if (!title) title = raw.trim()
    if (!title) return

    addTask({
      title,
      status: 'not_started' as TaskStatus,
      priority,
      category,
      timeEstimate,
      dueDate,
      userId: user?.id || '',
    }).then(() => {
      setQuickAdd('')
      toast.success(`Added: ${title}`)
    })
  }, [quickAdd, categories, addTask, user?.id])

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <Circle className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{statusCounts.not_started} pending</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 text-accent" />
                <span className="text-xs text-muted-foreground">{statusCounts.in_progress} active</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-xs text-muted-foreground">{statusCounts.finished} done</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-48 h-9"
              />
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2" size="sm">
              <Plus className="h-4 w-4" /> New Task
            </Button>
          </div>
        </div>

        {/* Quick Add - always visible */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card">
          <Sparkles className="h-4 w-4 text-accent shrink-0" />
          <input
            ref={quickAddRef}
            type="text"
            placeholder="Quick add a task..."
            value={quickAdd}
            onChange={(e) => setQuickAdd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickAdd()
            }}
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/40 outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 cursor-help">
                  <span className="px-1.5 py-0.5 rounded bg-muted/50 border border-border">#category</span>
                  <span className="px-1.5 py-0.5 rounded bg-muted/50 border border-border">30m</span>
                  <span className="px-1.5 py-0.5 rounded bg-muted/50 border border-border">today</span>
                  <span className="px-1.5 py-0.5 rounded bg-muted/50 border border-border">!1-4</span>
                  <HelpCircle className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium mb-1">Quick Add Shortcuts</p>
                <div className="space-y-0.5 text-xs text-muted-foreground">
                  <p><span className="text-foreground">#Work</span> — set category</p>
                  <p><span className="text-foreground">30m</span> or <span className="text-foreground">1h</span> — time estimate</p>
                  <p><span className="text-foreground">today</span> / <span className="text-foreground">tomorrow</span> / <span className="text-foreground">monday</span> / <span className="text-foreground">12/25</span> — due date</p>
                  <p><span className="text-foreground">!1</span>=low <span className="text-foreground">!2</span>=med <span className="text-foreground">!3</span>=high <span className="text-foreground">!4</span>=urgent</p>
                </div>
              </TooltipContent>
            </Tooltip>
            <Button size="sm" onClick={handleQuickAdd} disabled={!quickAdd.trim()}>
              Add
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
          {viewButtons.map((v) => (
            <Tooltip key={v.mode}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode(v.mode)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    viewMode === v.mode
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <v.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>{v.label} view</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* View Content */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {viewMode === 'list' && <TaskList onEdit={(task) => setEditingTask(task)} />}
            {viewMode === 'kanban' && <TaskKanban onEdit={(task) => setEditingTask(task)} />}
            {viewMode === 'calendar' && <TaskCalendar />}
          </motion.div>
        </AnimatePresence>

        <TaskCreate open={createOpen || !!editingTask} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditingTask(null) } }} editTask={editingTask} />
      </div>
    </TooltipProvider>
  )
}
