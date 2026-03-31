"use client"

import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { HeroCanvas } from '@/components/landing/hero-canvas'
import { Skeleton } from '@/components/ui/skeleton'
import { useThemeStore } from '@/store/theme'

const AuthModal = dynamic(() => import('@/components/auth/auth-modal').then((m) => ({ default: m.AuthModal })), { ssr: false })
import {
  Sparkles,
  CheckSquare,
  Calendar,
  Timer,
  Brain,
  Zap,
  ArrowRight,
  LayoutGrid,
  Target,
} from 'lucide-react'

const features = [
  {
    icon: CheckSquare,
    title: 'Tri-View Tasks',
    description: 'List, Kanban, and Calendar views that sync in real-time. See your work the way you think.',
    color: 'from-purple-500/20 to-purple-500/0',
    accent: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Brain,
    title: 'AI Scheduler',
    description: 'Gemini-powered day optimization. Interleaves Pomodoro breaks and buffers automatically.',
    color: 'from-blue-500/20 to-blue-500/0',
    accent: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Timer,
    title: 'Focus Mode',
    description: 'Ultra-minimal full-screen timer with Pomodoro tracking. Zero distractions, pure flow.',
    color: 'from-green-500/20 to-green-500/0',
    accent: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    icon: Calendar,
    title: 'Smart Calendar',
    description: 'Drag-and-drop weekly planning. Visualize deadlines and time blocks at a glance.',
    color: 'from-orange-500/20 to-orange-500/0',
    accent: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    icon: LayoutGrid,
    title: 'Bento Design',
    description: 'Clean, professional interface. No clutter, no noise. Just your work, beautifully organized.',
    color: 'from-pink-500/20 to-pink-500/0',
    accent: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Target,
    title: 'Theme Lab',
    description: 'Onyx dark mode, Cloud light mode, or craft your own. Every pixel adapts to your style.',
    color: 'from-cyan-500/20 to-cyan-500/0',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
]

const morphWords = ['intelligent', 'AI-powered', 'adaptive', 'personalized']

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [morphIndex, setMorphIndex] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)
  const { applyTheme } = useThemeStore()

  useEffect(() => {
    applyTheme()
    setMounted(true)
  }, [applyTheme])

  useEffect(() => {
    const interval = setInterval(() => {
      setMorphIndex((prev) => (prev + 1) % morphWords.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  /* ── Hero scroll ── */
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroScale = useTransform(heroScroll, [0, 1], [1, 1.15])
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0])
  const heroY = useTransform(heroScroll, [0, 1], [0, -80])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ── Background layers ── */}
      <HeroCanvas />

      {/* Gradient orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', left: '5%', top: '5%', willChange: 'transform' }}
          animate={{ x: [0, 80, -40, 60, 0], y: [0, -60, 40, 50, 0], scale: [1, 1.1, 0.9, 1.05, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', right: '5%', top: '30%', willChange: 'transform' }}
          animate={{ x: [0, -60, 40, -30, 0], y: [0, 50, -30, 60, 0], scale: [1, 0.95, 1.1, 1, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-[350px] h-[350px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', left: '25%', bottom: '10%', willChange: 'transform' }}
          animate={{ x: [0, 50, -60, 30, 0], y: [0, -30, 50, -40, 0], scale: [1.05, 1, 1.08, 0.95, 1.05] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* ── Navigation ── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="landing-nav fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
          <span className="text-lg font-bold tracking-tight text-white">Velso</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setAuthOpen(true)} className="text-white/70 hover:text-white hover:bg-white/10">
            Sign in
          </Button>
          <Button onClick={() => setAuthOpen(true)} className="gap-2 bg-accent hover:bg-accent/90 text-white">
            Get started <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-20 z-10">
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
          className="text-center max-w-5xl mx-auto relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/50 mb-8">
              <Zap className="h-3.5 w-3.5 text-accent" />
              AI-powered productivity
            </div>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-8 text-white">
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Deep work meets
            </motion.span>
            <br />
            <AnimatePresence mode="wait">
              <motion.span
                key={morphWords[morphIndex]}
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                transition={{ duration: 0.35 }}
                className="text-accent inline-block"
              >
                {morphWords[morphIndex]}
              </motion.span>
            </AnimatePresence>{' '}
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              scheduling
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10"
          >
            Velso merges Pomodoro focus sessions with AI-driven time blocking.
            One workspace. Zero friction. Maximum output.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex items-center justify-center"
          >
            <Button
              size="lg"
              onClick={() => setAuthOpen(true)}
              className="gap-2 h-13 px-10 text-base bg-accent hover:bg-accent/90 text-white rounded-xl shadow-lg shadow-accent/20"
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/15 flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-white/30 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── Product Showcase ── */}
      <section className="relative px-6 py-28 md:px-12 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-white">
              Everything you need to own your day
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Six powerful modules, one seamless experience. Designed for people who take their time seriously.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 overflow-hidden"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative z-10">
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg}`}>
                    <feature.icon className={`h-5 w-5 ${feature.accent}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-28 md:px-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="relative">
            {/* Glow backdrop */}
            <div className="absolute inset-0 -m-8 bg-gradient-to-r from-accent/20 via-purple-500/10 to-accent/20 blur-3xl rounded-full" />

            <div className="relative rounded-3xl border border-white/[0.08] bg-white/[0.03] p-14 md:p-20 overflow-hidden backdrop-blur-sm">
              {/* Shimmer line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

              <motion.h2
                className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Your best work<br />starts here.
              </motion.h2>

              <motion.p
                className="text-white/40 text-lg md:text-xl max-w-lg mx-auto mb-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
              >
                Free forever. No credit card. Just sign in and start building momentum.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <button
                  onClick={() => setAuthOpen(true)}
                  className="group relative inline-flex items-center gap-2.5 h-14 px-10 text-base font-semibold text-white rounded-2xl bg-accent hover:bg-accent/90 transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Get started free</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <span className="text-white/25 text-sm">No setup required</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/6 px-6 py-8 md:px-12 z-10 relative">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-white/70">Velso</span>
          </div>
          <p className="text-sm text-white/30">Built for deep work.</p>
        </div>
      </footer>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  )
}
