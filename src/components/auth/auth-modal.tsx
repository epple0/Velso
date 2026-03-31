"use client"

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Mail, Lock, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { UserProfile } from '@/types'
import { DEFAULT_CATEGORIES, DEFAULT_TIMER_CONFIG } from '@/types'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    if (isSignUp && password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        })
        if (error) throw error

        if (data.user) {
          // Check if email confirmation is required
          if (data.session === null) {
            toast.success('Check your email to confirm your account, then sign in.')
            setIsSignUp(false)
            setLoading(false)
            return
          }

          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email!,
            name: name || data.user.user_metadata?.full_name || '',
            startOfDay: '09:00',
            endOfDay: '18:00',
            bufferPercent: 15,
            categories: DEFAULT_CATEGORIES,
            geminiModel: 'gemini-2.0-flash',
            timerConfig: DEFAULT_TIMER_CONFIG,
            savedThemes: [],
            workStyle: 'balanced',
            taskSpreadEnabled: false,
          }
          setUser(profile)
          toast.success('Account created successfully')
          onOpenChange(false)
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name || '',
            avatarUrl: data.user.user_metadata?.avatar_url,
            startOfDay: '09:00',
            endOfDay: '18:00',
            bufferPercent: 15,
            categories: DEFAULT_CATEGORIES,
            geminiModel: 'gemini-2.0-flash',
            timerConfig: DEFAULT_TIMER_CONFIG,
            savedThemes: [],
            workStyle: 'balanced',
            taskSpreadEnabled: false,
          }
          setUser(profile)
          toast.success('Welcome back')
          onOpenChange(false)
        }
      }
    } catch (error: any) {
      const msg = error.message || 'Authentication failed'
      if (msg.includes('Invalid login')) {
        toast.error('Invalid email or password')
      } else if (msg.includes('already registered')) {
        toast.error('This email is already registered. Try signing in instead.')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          toast.error('Google sign-in is not enabled yet. Use email/password for now.')
        } else {
          throw error
        }
      }
    } catch (error: any) {
      const msg = error.message || 'Google sign-in failed'
      if (msg.includes('provider is not enabled') || msg.includes('Unsupported provider')) {
        toast.error('Google sign-in is not enabled yet. Use email/password for now.')
      } else {
        toast.error(msg)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-[#0a0a0a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white">
            {isSignUp ? 'Create your account' : 'Welcome to Velso'}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            {isSignUp
              ? 'Start your productivity journey today'
              : 'Sign in to continue to your workspace'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Google button */}
          <Button
            variant="outline"
            className="w-full h-11 gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            onClick={handleGoogleAuth}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0a] px-2 text-white/30">or continue with email</span>
            </div>
          </div>

          {isSignUp && (
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white/70">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-accent"
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-white/70">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-accent"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password" className="text-white/70">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:ring-accent"
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
              />
            </div>
          </div>

          <Button
            className="w-full h-11 bg-accent hover:bg-accent/90 text-white"
            onClick={handleEmailAuth}
            disabled={loading || !email || !password}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Please wait...
              </span>
            ) : isSignUp ? 'Create account' : 'Sign in'}
          </Button>

          <p className="text-center text-sm text-white/40">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-accent hover:underline font-medium"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
