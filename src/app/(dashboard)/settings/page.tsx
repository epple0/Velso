"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  User,
  Palette,
  Brain,
  Tags,
  Moon,
  Sun,
  Trash2,
  Plus,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  HelpCircle,
  Clock,
  LogOut,
  Camera,
  Zap,
  Shuffle,
} from 'lucide-react'
import { GEMINI_MODELS, DEFAULT_CATEGORIES, DEFAULT_TIMER_CONFIG, getCategoryColor, containsProfanity, WORK_STYLES } from '@/types'
import { toast } from 'sonner'
import type { ThemeColors, TimerConfig, SavedTheme, WorkStyle } from '@/types'
import { useTimerStore } from '@/store/timer'
import { createClient } from '@/lib/supabase/client'

type SettingsTab = 'profile' | 'productivity' | 'appearance' | 'categories' | 'api'

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'productivity', label: 'Productivity', icon: Zap },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'api', label: 'AI Integration', icon: Brain },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Customize your workspace</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex md:flex-col gap-1 md:w-48 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="settings-tab"
                  className="absolute inset-0 rounded-lg bg-muted"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <tab.icon className="h-4 w-4 shrink-0 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'productivity' && <ProductivitySettings />}
              {activeTab === 'appearance' && <AppearanceSettings />}
              {activeTab === 'categories' && <CategorySettings />}
              {activeTab === 'api' && <ApiSettings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function ProfileSettings() {
  const { user, updateProfile, setUser } = useAuthStore()
  const timerStore = useTimerStore()
  const [name, setName] = useState(user?.name || '')
  const [startOfDay, setStartOfDay] = useState(user?.startOfDay || '09:00')
  const [endOfDay, setEndOfDay] = useState(user?.endOfDay || '18:00')
  const [buffer, setBuffer] = useState(user?.bufferPercent || 15)

  // Timer config
  const [focusDur, setFocusDur] = useState(
    user?.timerConfig?.focusDuration || DEFAULT_TIMER_CONFIG.focusDuration
  )
  const [breakDur, setBreakDur] = useState(
    user?.timerConfig?.breakDuration || DEFAULT_TIMER_CONFIG.breakDuration
  )
  const [longBreakDur, setLongBreakDur] = useState(
    user?.timerConfig?.longBreakDuration || DEFAULT_TIMER_CONFIG.longBreakDuration
  )
  const [longBreakInt, setLongBreakInt] = useState(
    user?.timerConfig?.longBreakInterval || DEFAULT_TIMER_CONFIG.longBreakInterval
  )

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const save = () => {
    const timerConfig: TimerConfig = {
      focusDuration: focusDur,
      breakDuration: breakDur,
      longBreakDuration: longBreakDur,
      longBreakInterval: longBreakInt,
      aiDecides: false,
    }
    updateProfile({ name, startOfDay, endOfDay, bufferPercent: buffer, timerConfig })
    timerStore.loadConfig(timerConfig)
    timerStore.setDurations(focusDur, breakDur, longBreakDur, longBreakInt)
    toast.success('Profile updated')
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      updateProfile({ avatarUrl: dataUrl })
      toast.success('Profile picture updated')
    }
    reader.readAsDataURL(file)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="h-16 w-16 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.name || 'Your name'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="opacity-60" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Start of Day
              </Label>
              <Input type="time" value={startOfDay} onChange={(e) => setStartOfDay(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> End of Day
              </Label>
              <Input type="time" value={endOfDay} onChange={(e) => setEndOfDay(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Label className="flex items-center gap-1.5 cursor-help">
                    Buffer %
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </Label>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" side="right">
                  <p>Extra time added between scheduled tasks as a buffer for overruns, transitions, and unexpected delays.</p>
                  <p className="mt-1 text-muted-foreground">Example: 15% buffer on a 1-hour block adds 9 minutes of cushion.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={50}
                value={buffer}
                onChange={(e) => setBuffer(parseInt(e.target.value))}
                className="flex-1 h-1.5 rounded-full bg-muted appearance-none cursor-pointer accent-accent"
              />
              <span className="text-sm font-medium w-10 text-right">{buffer}%</span>
            </div>
          </div>
          <Button onClick={save}>Save Changes</Button>

          <Separator className="my-2" />

          <Button variant="outline" onClick={handleSignOut} className="gap-2 text-destructive hover:text-destructive w-fit">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Timer Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4" /> Timer Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure your Pomodoro timer durations. Changes apply immediately.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Focus Duration (min)</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={focusDur}
                onChange={(e) => setFocusDur(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Break Duration (min)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={breakDur}
                onChange={(e) => setBreakDur(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Long Break (min)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={longBreakDur}
                onChange={(e) => setLongBreakDur(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Sessions till long break</Label>
              <Input
                type="number"
                min={2}
                max={10}
                value={longBreakInt}
                onChange={(e) => setLongBreakInt(Number(e.target.value))}
              />
            </div>
          </div>
          <Button onClick={save}>Apply Timer Settings</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ProductivitySettings() {
  const { user, updateProfile } = useAuthStore()
  const timerStore = useTimerStore()
  const currentStyle = user?.workStyle || 'balanced'

  const handleWorkStyleChange = (style: WorkStyle) => {
    updateProfile({ workStyle: style })
    const ws = WORK_STYLES[style]
    const cfg: TimerConfig = {
      focusDuration: ws.focusDuration,
      breakDuration: ws.breakDuration,
      longBreakDuration: ws.longBreakDuration,
      longBreakInterval: style === 'flow' ? 3 : 4,
      aiDecides: false,
    }
    timerStore.loadConfig(cfg)
    timerStore.setDurations(cfg.focusDuration, cfg.breakDuration, cfg.longBreakDuration, cfg.longBreakInterval)
    updateProfile({ timerConfig: cfg })
    toast.success(`Work style set to ${ws.label}`)
  }

  return (
    <div className="space-y-6">
      {/* Work Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" /> Work Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose how you work best. This controls focus/break durations and schedule density.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.entries(WORK_STYLES) as [WorkStyle, typeof WORK_STYLES[WorkStyle]][]).map(
              ([key, ws]) => (
                <TooltipProvider key={key} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleWorkStyleChange(key)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 text-center ${
                          currentStyle === key
                            ? 'border-accent bg-accent/10 shadow-sm'
                            : 'border-border hover:border-accent/40 bg-card'
                        }`}
                      >
                        <span className="text-3xl">{ws.icon}</span>
                        <span className="text-sm font-semibold">{ws.label}</span>
                        <span className="text-[11px] text-muted-foreground leading-tight">{ws.description}</span>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                          <span>{ws.focusDuration}m focus</span>
                          <span>/</span>
                          <span>{ws.breakDuration}m break</span>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs" side="bottom">
                      <p>{ws.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Task Spreading */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-accent" /> Smart Task Spreading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Distribute tasks across categories</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically interleave tasks from different categories to prevent cognitive fatigue.
              </p>
            </div>
            <button
              onClick={() => updateProfile({ taskSpreadEnabled: !user?.taskSpreadEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                user?.taskSpreadEnabled ? 'bg-accent' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ${
                  user?.taskSpreadEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                  <HelpCircle className="h-3.5 w-3.5" />
                  What does this do?
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>When enabled, the AI scheduler arranges your tasks so that similar categories aren&apos;t stacked back-to-back. For example, two &quot;Work&quot; tasks will have a &quot;Health&quot; or &quot;Personal&quot; task between them. This reduces mental fatigue and keeps you fresh throughout the day.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  )
}

function AppearanceSettings() {
  const { theme, setTheme, customColors, setCustomColor } = useThemeStore()
  const { user, updateProfile, saveThemeToSupabase, deleteThemeFromSupabase } = useAuthStore()
  const [selectedColor, setSelectedColor] = useState<keyof ThemeColors>('primary')
  const [themeName, setThemeName] = useState('')
  const [showSaveTheme, setShowSaveTheme] = useState(false)

  const savedThemes = user?.savedThemes || []

  const colorKeys: { key: keyof ThemeColors; label: string }[] = [
    { key: 'background', label: 'Background' },
    { key: 'foreground', label: 'Foreground' },
    { key: 'primary', label: 'Primary' },
    { key: 'accent', label: 'Accent' },
    { key: 'ring', label: 'Ring' },
    { key: 'card', label: 'Card' },
    { key: 'muted', label: 'Muted' },
    { key: 'border', label: 'Border' },
  ]

  const saveCurrentTheme = () => {
    const name = themeName.trim()
    if (!name) return
    if (name.length > 24) {
      toast.error('Theme name too long (max 24 characters)')
      return
    }
    if (containsProfanity(name)) {
      toast.error('Theme name contains inappropriate language')
      return
    }
    if (savedThemes.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A theme with this name already exists')
      return
    }

    const newTheme: SavedTheme = { name, colors: { ...customColors } }
    updateProfile({ savedThemes: [...savedThemes, newTheme] })
    saveThemeToSupabase(newTheme)
    setThemeName('')
    setShowSaveTheme(false)
    toast.success(`Theme "${name}" saved`)
  }

  const applySavedTheme = (saved: SavedTheme) => {
    Object.entries(saved.colors).forEach(([key, value]) => {
      setCustomColor(key as keyof ThemeColors, value)
    })
    toast.success(`Applied theme "${saved.name}"`)
  }

  const deleteSavedTheme = (name: string) => {
    updateProfile({ savedThemes: savedThemes.filter((t) => t.name !== name) })
    deleteThemeFromSupabase(name)
    toast.success('Theme deleted')
  }

  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('onyx')}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                theme === 'onyx' ? 'border-accent' : 'border-border hover:border-accent/30'
              }`}
            >
              <div className="h-10 w-10 rounded-lg bg-black border border-zinc-700" />
              <div className="text-left">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5" /> Onyx
                </p>
                <p className="text-[10px] text-muted-foreground">Pure black with subtle glow</p>
              </div>
            </button>

            <button
              onClick={() => setTheme('cloud')}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                theme === 'cloud' ? 'border-accent' : 'border-border hover:border-accent/30'
              }`}
            >
              <div className="h-10 w-10 rounded-lg bg-white border border-zinc-200" />
              <div className="text-left">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5" /> Cloud
                </p>
                <p className="text-[10px] text-muted-foreground">Bright white with soft shadows</p>
              </div>
            </button>
          </div>

          {/* Saved Themes */}
          {savedThemes.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Saved Themes</p>
              <div className="grid grid-cols-2 gap-2">
                {savedThemes.map((st) => (
                  <div key={st.name} className="flex items-center gap-2 rounded-lg border border-border p-2.5 group">
                    <button
                      onClick={() => applySavedTheme(st)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      <div
                        className="h-6 w-6 rounded-md shrink-0 border border-border"
                        style={{ backgroundColor: st.colors.accent }}
                      />
                      <span className="text-xs font-medium truncate">{st.name}</span>
                    </button>
                    <button
                      onClick={() => deleteSavedTheme(st.name)}
                      className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Lab */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" /> Theme Lab
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pick a property and choose a custom color. Your theme will update live.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Property</Label>
                <div className="space-y-1">
                  {colorKeys.map((ck) => (
                    <button
                      key={ck.key}
                      onClick={() => setSelectedColor(ck.key)}
                      className={`flex items-center gap-2 w-full rounded-md px-3 py-1.5 text-sm transition-colors ${
                        selectedColor === ck.key ? 'bg-muted font-medium' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div
                        className="h-4 w-4 rounded border border-border shrink-0"
                        style={{ backgroundColor: customColors[ck.key] }}
                      />
                      {ck.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Color</Label>
                <div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
                  <input
                    type="color"
                    value={customColors[selectedColor]}
                    onChange={(e) => setCustomColor(selectedColor, e.target.value)}
                    className="h-32 w-32 cursor-pointer rounded-lg border-0 bg-transparent"
                  />
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      value={customColors[selectedColor]}
                      onChange={(e) => {
                        const val = e.target.value
                        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                          setCustomColor(selectedColor, val)
                        }
                      }}
                      className="font-mono text-sm text-center"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="p-3" style={{ backgroundColor: customColors.background }}>
                    <div
                      className="rounded-md p-2 mb-2"
                      style={{ backgroundColor: customColors.card, color: customColors.foreground }}
                    >
                      <div className="text-sm font-medium">Preview Card</div>
                      <div className="text-xs opacity-60 mt-0.5">Sample text content</div>
                    </div>
                    <div className="flex gap-1.5">
                      <div
                        className="h-5 px-2 rounded text-[10px] flex items-center"
                        style={{ backgroundColor: customColors.accent, color: customColors.foreground }}
                      >
                        Accent
                      </div>
                      <div
                        className="h-5 px-2 rounded text-[10px] flex items-center"
                        style={{ backgroundColor: customColors.muted, color: customColors.foreground, border: `1px solid ${customColors.border}` }}
                      >
                        Muted
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Theme */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => setShowSaveTheme(!showSaveTheme)}
                >
                  <Save className="h-3.5 w-3.5" /> Save as Theme
                </Button>
                {showSaveTheme && (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Theme name..."
                      value={themeName}
                      onChange={(e) => setThemeName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveCurrentTheme()}
                      maxLength={24}
                    />
                    <Button size="sm" onClick={saveCurrentTheme} disabled={!themeName.trim()}>
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CategorySettings() {
  const { user, updateProfile } = useAuthStore()
  const categories = user?.categories || DEFAULT_CATEGORIES
  const [newCat, setNewCat] = useState('')

  const addCategory = () => {
    if (!newCat.trim()) return
    if (categories.includes(newCat.trim())) {
      toast.error('Category already exists')
      return
    }
    if (containsProfanity(newCat.trim())) {
      toast.error('Category name contains inappropriate language')
      return
    }
    updateProfile({ categories: [...categories, newCat.trim()] })
    setNewCat('')
    toast.success('Category added')
  }

  const removeCategory = (cat: string) => {
    if (categories.length <= 1) {
      toast.error('You need at least one category')
      return
    }
    updateProfile({ categories: categories.filter((c) => c !== cat) })
    toast.success('Category removed')
  }

  const resetCategories = () => {
    updateProfile({ categories: [...DEFAULT_CATEGORIES] })
    toast.success('Categories reset')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Categories</CardTitle>
          <Button variant="ghost" size="sm" onClick={resetCategories} className="text-xs">
            Reset to defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="New category name"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <Button onClick={addCategory} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        <div className="space-y-1">
          {categories.map((cat) => (
            <div
              key={cat}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${getCategoryColor(cat).split(' ')[0]}`} />
                <span className="text-sm">{cat}</span>
              </div>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => removeCategory(cat)} className="p-1 rounded hover:bg-muted transition-colors">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Remove</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ApiSettings() {
  const { user, updateProfile } = useAuthStore()
  const [apiKey, setApiKey] = useState(user?.geminiApiKey || '')
  const [showKey, setShowKey] = useState(false)
  const [model, setModel] = useState(user?.geminiModel || 'gemini-2.0-flash')

  const saveKey = () => {
    updateProfile({ geminiApiKey: apiKey })
    toast.success('API key saved')
  }

  const saveModel = (m: string) => {
    setModel(m)
    updateProfile({ geminiModel: m })
    toast.success('Model updated')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-4 w-4 text-accent" /> Gemini API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
          <div className="grid gap-2">
            <Label>API Key</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="pr-10"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={saveKey} disabled={!apiKey}>Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>Select Gemini Model</Label>
          <div className="grid gap-2">
            {GEMINI_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => saveModel(m.id)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                  model === m.id
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/30'
                }`}
              >
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  model === m.id ? 'border-accent' : 'border-muted-foreground/30'
                }`}>
                  {model === m.id && <Check className="h-2.5 w-2.5 text-accent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
                {model === m.id && (
                  <span className="text-[10px] text-accent font-medium shrink-0">Active</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
