"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Clock, MapPin, Trash2, Play, CheckCircle2, Pencil } from 'lucide-react'
import type { Task } from '@/types'
import { getCategoryColor } from '@/types'
import { formatDate } from '@/lib/utils'
import { useTasksStore } from '@/store/tasks'

interface TaskCardProps {
  task: Task
  compact?: boolean
  onEdit?: (task: Task) => void
}

const priorityConfig: Record<string, { label: string; variant: 'secondary' | 'outline' | 'accent' | 'destructive' }> = {
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Med', variant: 'outline' },
  high: { label: 'High', variant: 'accent' },
  urgent: { label: 'Urgent', variant: 'destructive' },
}

export const TaskCard = React.memo(function TaskCard({ task, compact, onEdit }: TaskCardProps) {
  const deleteTask = useTasksStore((s) => s.deleteTask)
  const moveTask = useTasksStore((s) => s.moveTask)
  const priority = priorityConfig[task.priority] || priorityConfig.medium

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group rounded-lg border border-border bg-card p-3.5 transition-all duration-200 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium leading-tight line-clamp-2">{task.title}</h4>
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status === 'not_started' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveTask(task.id, 'in_progress')}
                >
                  <Play className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start task</TooltipContent>
            </Tooltip>
          )}
          {task.status === 'in_progress' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => moveTask(task.id, 'finished')}
                >
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Complete</TooltipContent>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(task)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {!compact && task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant={priority.variant} className="text-[10px] px-1.5 py-0">
          {priority.label}
        </Badge>
        {task.category && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getCategoryColor(task.category)}`}>
            {task.category}
          </span>
        )}
        {task.dueDate && (
          <span className="text-[10px] text-muted-foreground">{formatDate(task.dueDate)}</span>
        )}
        {task.timeEstimate && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" /> {task.timeEstimate}m
          </span>
        )}
        {task.location && !compact && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" /> {task.location}
          </span>
        )}
      </div>
    </motion.div>
  )
})
