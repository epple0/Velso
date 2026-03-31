"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const ScheduleTimeline = dynamic(
  () => import('@/components/schedule/timeline').then((m) => ({ default: m.ScheduleTimeline })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    ),
  }
)

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-optimized daily timeline with Pomodoro breaks</p>
      </div>
      <ScheduleTimeline />
    </div>
  )
}
