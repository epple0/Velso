"use client"

import React from 'react'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Sun,
  Moon,
  LogOut,
  Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export function Topbar() {
  const { user } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const isDark = theme === 'onyx'

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    useAuthStore.getState().setUser(null)
    window.location.href = '/'
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {user?.name || user?.email || 'Welcome back'}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setTheme(isDark ? 'cloud' : 'onyx')}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle theme</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <a href="/settings">
                  <Settings className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        </div>
      </motion.header>
    </TooltipProvider>
  )
}
