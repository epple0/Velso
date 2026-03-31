import { create } from 'zustand'
import type { Task, TaskStatus, ViewMode } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface TasksState {
  tasks: Task[]
  viewMode: ViewMode
  isLoading: boolean
  setTasks: (tasks: Task[]) => void
  loadTasks: (userId: string) => Promise<void>
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  moveTask: (id: string, status: TaskStatus) => Promise<void>
  reorderTask: (id: string, newOrder: number) => void
  setViewMode: (mode: ViewMode) => void
  setLoading: (loading: boolean) => void
}

// Convert snake_case from Supabase to camelCase for the app
function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || undefined,
    status: row.status as TaskStatus,
    priority: row.priority as Task['priority'],
    category: (row.category as string) || undefined,
    dueDate: (row.due_date as string) || undefined,
    timeEstimate: (row.time_estimate as number) || undefined,
    location: (row.location as string) || undefined,
    order: row.order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

// Convert camelCase to snake_case for Supabase
function toRow(data: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if ('title' in data) row.title = data.title
  if ('description' in data) row.description = data.description || null
  if ('status' in data) row.status = data.status
  if ('priority' in data) row.priority = data.priority
  if ('category' in data) row.category = data.category || null
  if ('dueDate' in data) row.due_date = data.dueDate || null
  if ('timeEstimate' in data) row.time_estimate = data.timeEstimate || null
  if ('location' in data) row.location = data.location || null
  if ('order' in data) row.order = data.order
  if ('userId' in data) row.user_id = data.userId
  return row
}

export const useTasksStore = create<TasksState>()((set, get) => ({
  tasks: [],
  viewMode: 'list',
  isLoading: false,
  setTasks: (tasks) => set({ tasks }),

  loadTasks: async (userId: string) => {
    set({ isLoading: true })
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('order', { ascending: true })

      if (error) {
        console.error('Failed to load tasks:', error)
        set({ isLoading: false })
        return
      }

      const tasks = (data || []).map(mapTask)
      set({ tasks, isLoading: false })
    } catch (err) {
      console.error('Failed to load tasks:', err)
      set({ isLoading: false })
    }
  },

  addTask: async (taskData) => {
    const supabase = createClient()
    const maxOrder = get().tasks.reduce((max, t) => Math.max(max, t.order), 0)
    const row = {
      ...toRow(taskData as unknown as Record<string, unknown>),
      order: maxOrder + 1,
    }

    // Optimistic local add
    const tempId = crypto.randomUUID()
    const tempTask: Task = {
      ...taskData,
      id: tempId,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set((state) => ({ tasks: [...state.tasks, tempTask] }))

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(row)
        .select()
        .single()

      if (error) {
        console.error('Failed to add task:', error)
        // Rollback
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== tempId) }))
        return
      }

      // Replace temp with real task
      const realTask = mapTask(data)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? realTask : t)),
      }))
    } catch {
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== tempId) }))
    }
  },

  updateTask: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }))

    try {
      const supabase = createClient()
      const row = toRow(updates as unknown as Record<string, unknown>)
      const { error } = await supabase
        .from('tasks')
        .update(row)
        .eq('id', id)

      if (error) console.error('Failed to update task:', error)
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  },

  deleteTask: async (id) => {
    // Optimistic delete
    const deleted = get().tasks.find((t) => t.id === id)
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Failed to delete task:', error)
        // Rollback
        if (deleted) set((state) => ({ tasks: [...state.tasks, deleted] }))
      }
    } catch {
      if (deleted) set((state) => ({ tasks: [...state.tasks, deleted] }))
    }
  },

  moveTask: async (id, status) => {
    // Optimistic
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    }))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id)

      if (error) console.error('Failed to move task:', error)
    } catch (err) {
      console.error('Failed to move task:', err)
    }
  },

  reorderTask: (id, newOrder) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, order: newOrder } : t
      ),
    })),

  setViewMode: (viewMode) => set({ viewMode }),
  setLoading: (isLoading) => set({ isLoading }),
}))
