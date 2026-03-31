"use client"

import React from 'react'
import { useTasksStore } from '@/store/tasks'
import { TaskCard } from './task-card'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatePresence } from 'framer-motion'
import { Inbox } from 'lucide-react'
import type { Task } from '@/types'

interface TaskListProps {
  onEdit?: (task: Task) => void
}

export function TaskList({ onEdit }: TaskListProps) {
  const tasks = useTasksStore((s) => s.tasks)
  const isLoading = useTasksStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Inbox className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-sm font-medium">No tasks yet</p>
        <p className="text-xs">Create your first task to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
      </AnimatePresence>
    </div>
  )
}
