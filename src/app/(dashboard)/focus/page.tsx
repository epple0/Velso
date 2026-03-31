"use client"

import React from 'react'
import dynamic from 'next/dynamic'

const FocusTimer = dynamic(
  () => import('@/components/timer/focus-timer').then((m) => ({ default: m.FocusTimer })),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    ),
  }
)

export default function FocusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Focus</h1>
        <p className="text-sm text-muted-foreground mt-1">Pomodoro timer with distraction-free focus mode</p>
      </div>
      <FocusTimer />
    </div>
  )
}
