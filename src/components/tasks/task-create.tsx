"use client"

import React, { useState, useEffect } from 'react'
import { useTasksStore } from '@/store/tasks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/store/auth'
import type { TaskPriority, TaskStatus, Task } from '@/types'
import { Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface TaskCreateProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTask?: Task | null
}

export function TaskCreate({ open, onOpenChange, editTask }: TaskCreateProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [category, setCategory] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [timeEstimate, setTimeEstimate] = useState('')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState<TaskStatus>('not_started')

  const addTask = useTasksStore((s) => s.addTask)
  const updateTask = useTasksStore((s) => s.updateTask)
  const user = useAuthStore((s) => s.user)
  const categories = user?.categories || []
  const isEditing = !!editTask

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setDescription(editTask.description || '')
      setPriority(editTask.priority)
      setCategory(editTask.category || '')
      setDueDate(editTask.dueDate ? editTask.dueDate.split('T')[0] : '')
      setTimeEstimate(editTask.timeEstimate ? String(editTask.timeEstimate) : '')
      setLocation(editTask.location || '')
      setStatus(editTask.status)
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setCategory('')
      setDueDate('')
      setTimeEstimate('')
      setLocation('')
      setStatus('not_started')
    }
  }, [editTask, open])

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      category: category || undefined,
      dueDate: dueDate || undefined,
      timeEstimate: timeEstimate ? parseInt(timeEstimate) : undefined,
      location: location.trim() || undefined,
      userId: user?.id || '',
    }

    if (isEditing && editTask) {
      updateTask(editTask.id, taskData)
      toast.success('Task updated')
      onOpenChange(false)
    } else {
      addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>).then(() => {
        toast.success('Task created')
        onOpenChange(false)
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Update your task details' : 'Add a new task to your workspace'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Optional details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {isEditing && (
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timeEstimate">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Time (min)
                </span>
              </Label>
              <Input
                id="timeEstimate"
                type="number"
                placeholder="30"
                value={timeEstimate}
                onChange={(e) => setTimeEstimate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Location
              </span>
            </Label>
            <Input
              id="location"
              placeholder="Optional location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full mt-2" disabled={!title.trim()}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
