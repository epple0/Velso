"use client"

import React, { useEffect, useRef } from 'react'

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0, dpr = 1
    let mx = -1000, my = -1000, sy = 0
    let raf = 0
    let isVisible = true

    const mobile = window.innerWidth < 768
    const N = mobile ? 35 : reduced ? 25 : 90
    const LINK = mobile ? 80 : 120

    interface P { x: number; y: number; z: number; vx: number; vy: number; s: number; hue: number }
    const ps: P[] = []

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const seed = () => {
      ps.length = 0
      for (let i = 0; i < N; i++) {
        ps.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random(),
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          s: Math.random() * 1.8 + 0.4,
          hue: 245 + Math.random() * 40,
        })
      }
    }

    resize()
    seed()
    window.addEventListener('resize', () => { resize(); seed() })
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY })
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) { mx = e.touches[0].clientX; my = e.touches[0].clientY }
    }, { passive: true })
    window.addEventListener('scroll', () => { sy = window.scrollY }, { passive: true })

    const drawX = new Float32Array(N)
    const drawY = new Float32Array(N)

    const frame = () => {
      if (!isVisible) {
        raf = requestAnimationFrame(frame)
        return
      }
      ctx.clearRect(0, 0, w, h)

      for (let i = 0; i < N; i++) {
        const p = ps[i]
        p.x += p.vx
        p.y += p.vy
        const px = p.x
        const py = p.y - sy * p.z * 0.1

        if (!reduced) {
          const dx = px - mx, dy = py - my
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 180 && d > 0) {
            const f = ((180 - d) / 180) * 0.04
            p.vx += (dx / d) * f
            p.vy += (dy / d) * f
          }
        }
        p.vx *= 0.985
        p.vy *= 0.985

        if (p.x < -30) p.x += w + 60
        if (p.x > w + 30) p.x -= w + 60
        if (p.y < -30) p.y += h + 60
        if (p.y > h + 30) p.y -= h + 60

        drawX[i] = px
        drawY[i] = py
      }

      // Connection lines
      ctx.lineWidth = 0.5
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = drawX[i] - drawX[j], dy = drawY[i] - drawY[j]
          const dd = dx * dx + dy * dy
          if (dd < LINK * LINK) {
            const d = Math.sqrt(dd)
            const o = (1 - d / LINK) * 0.16 * Math.min(ps[i].z, ps[j].z)
            if (o > 0.006) {
              ctx.beginPath()
              ctx.moveTo(drawX[i], drawY[i])
              ctx.lineTo(drawX[j], drawY[j])
              ctx.strokeStyle = `hsla(260,70%,65%,${o})`
              ctx.stroke()
            }
          }
        }
      }

      // Particles
      for (let i = 0; i < N; i++) {
        const p = ps[i]
        const o = 0.15 + p.z * 0.65
        const sz = p.s * (0.4 + p.z * 0.8)
        if (p.z > 0.5) {
          ctx.beginPath()
          ctx.arc(drawX[i], drawY[i], sz * 4, 0, 6.283)
          ctx.fillStyle = `hsla(${p.hue},70%,60%,${o * 0.07})`
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(drawX[i], drawY[i], sz, 0, 6.283)
        ctx.fillStyle = `hsla(${p.hue},70%,70%,${o})`
        ctx.fill()
      }

      raf = requestAnimationFrame(frame)
    }

    frame()

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
    }, { threshold: 0 })
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true" />
}
