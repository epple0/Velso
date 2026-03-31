"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Timer,
  Settings,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/focus', icon: Timer, label: 'Focus' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center border-r border-border bg-card py-4 lg:w-56 lg:items-start lg:px-4"
      >
        <Link href="/dashboard" prefetch={true} className="mb-8 flex items-center gap-2 px-2">
          <Sparkles className="h-6 w-6 text-accent shrink-0" />
          <span className="hidden text-lg font-bold tracking-tight lg:block">Velso</span>
        </Link>

        <nav className="flex w-full flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-muted"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <item.icon className="h-5 w-5 shrink-0 relative z-10" />
                    <span className="hidden lg:block relative z-10">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
      </motion.aside>
    </TooltipProvider>
  )
}
