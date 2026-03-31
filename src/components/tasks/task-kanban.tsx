"use client"

import React from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTasksStore } from '@/store/tasks'
import { TaskCard } from './task-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { AnimatePresence, motion } from 'framer-motion'
import type { Task, TaskStatus } from '@/types'
import { Circle, Loader2, CheckCircle2 } from 'lucide-react'

const columns: { id: TaskStatus; title: string; icon: React.ElementType; color: string }[] = [
  { id: 'not_started', title: 'Not Started', icon: Circle, color: 'text-muted-foreground' },
  { id: 'in_progress', title: 'In Progress', icon: Loader2, color: 'text-accent' },
  { id: 'finished', title: 'Finished', icon: CheckCircle2, color: 'text-green-500' },
]

export function TaskKanban({ onEdit }: { onEdit?: (task: Task) => void }) {
  const tasks = useTasksStore((s) => s.tasks)
  const moveTask = useTasksStore((s) => s.moveTask)
  const isLoading = useTasksStore((s) => s.isLoading)
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    let targetStatus: TaskStatus | null = null

    // Check if over another task
    const overTask = tasks.find((t) => t.id === over.id)
    if (overTask) {
      targetStatus = overTask.status
    } else {
      // Dropped on a column
      const colId = over.id as string
      if (['not_started', 'in_progress', 'finished'].includes(colId)) {
        targetStatus = colId as TaskStatus
      }
    }

    if (targetStatus && activeTask.status !== targetStatus) {
      moveTask(activeTask.id, targetStatus)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    let targetStatus: TaskStatus | null = null
    const overTask = tasks.find((t) => t.id === over.id)
    if (overTask) {
      targetStatus = overTask.status
    } else {
      const colId = over.id as string
      if (['not_started', 'in_progress', 'finished'].includes(colId)) {
        targetStatus = colId as TaskStatus
      }
    }

    if (targetStatus && activeTask.status !== targetStatus) {
      moveTask(activeTask.id, targetStatus)
    }
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-8 w-32" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[400px]">
        {columns.map((col) => {
          const columnTasks = getTasksByStatus(col.id)
          return (
            <KanbanColumn key={col.id} column={col} tasks={columnTasks} onEdit={onEdit} />
          )
        })}
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'ease',
      }}>
        {activeTask && (
          <div className="w-full max-w-sm opacity-90 rotate-2 shadow-xl">
            <TaskCard task={activeTask} compact />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

const KanbanColumn = React.memo(function KanbanColumn({
  column,
  tasks,
  onEdit,
}: {
  column: typeof columns[number]
  tasks: Task[]
  onEdit?: (task: Task) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border p-3 min-h-[300px] transition-colors duration-200 ${
        isOver ? 'border-accent/40 bg-accent/5' : 'border-border bg-muted/30'
      }`}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <column.icon className={`h-4 w-4 ${column.color}`} />
        <h3 className="text-sm font-semibold">{column.title}</h3>
        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
          {tasks.length}
        </Badge>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 min-h-[100px]">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onEdit={onEdit} />
            ))}
          </AnimatePresence>
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/40">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
})

const SortableTaskCard = React.memo(function SortableTaskCard({ task, onEdit }: { task: Task; onEdit?: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} compact onEdit={onEdit} />
    </div>
  )
})
