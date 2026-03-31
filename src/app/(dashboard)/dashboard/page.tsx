"use client"

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTasksStore } from '@/store/tasks'
import { useTimerStore } from '@/store/timer'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckSquare,
  Circle,
  Loader2,
  Timer,
  TrendingUp,
  Plus,
  ArrowRight,
  Zap,
  Calendar,
  Brain,
  LayoutGrid,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { getCategoryColor } from '@/types'

export default function DashboardPage() {
  const tasks = useTasksStore((s) => s.tasks)
  const tasksLoading = useTasksStore((s) => s.isLoading)
  const completedPomodoros = useTimerStore((s) => s.completedPomodoros)
  const user = useAuthStore((s) => s.user)

  const firstName = user?.name?.split(' ')[0] || ''

  const stats = useMemo(() => ({
    total: tasks.length,
    notStarted: tasks.filter((t) => t.status === 'not_started').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    finished: tasks.filter((t) => t.status === 'finished').length,
  }), [tasks])

  const recentTasks = useMemo(() => tasks.slice(-6).reverse(), [tasks])

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.total,
      icon: CheckSquare,
      color: 'text-foreground',
      bg: 'bg-muted',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Loader2,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Completed',
      value: stats.finished,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Focus Sessions',
      value: completedPomodoros,
      icon: Timer,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ]

  const quickActions = [
    { label: 'New Task', icon: Plus, href: '/tasks', description: 'Add a new task' },
    { label: 'Start Focus', icon: Zap, href: '/focus', description: 'Pomodoro session' },
    { label: 'AI Schedule', icon: Brain, href: '/schedule', description: 'Optimize your day' },
    { label: 'Calendar', icon: Calendar, href: '/tasks', description: 'See weekly view' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold tracking-tight"
        >
          Welcome back{firstName ? `, ${firstName}` : ''}!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-sm text-muted-foreground mt-1"
        >
          Here&apos;s your productivity overview
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hover:border-accent/20 transition-colors duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                  </div>
                </div>
                {tasksLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <button className="w-full flex items-center gap-3 rounded-xl border border-border p-4 hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 text-left">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{action.label}</p>
                      <p className="text-[11px] text-muted-foreground">{action.description}</p>
                    </div>
                  </button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Tasks</CardTitle>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="py-8 text-center">
                <CheckSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No tasks yet. Create one to get started!</p>
                <Link href="/tasks">
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> New Task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    {task.status === 'finished' ? (
                      <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                    ) : task.status === 'in_progress' ? (
                      <Loader2 className="h-4 w-4 text-accent shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={`text-sm flex-1 truncate ${task.status === 'finished' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {task.category && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                    )}
                    {task.timeEstimate && (
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {task.timeEstimate}m
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
