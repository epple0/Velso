import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Velso — AI-Native Productivity',
  description: 'Deep work meets intelligent scheduling. Pomodoro focus sessions with AI-driven time blocking.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Prevent flash of white — force dark background immediately */}
        <style dangerouslySetInnerHTML={{ __html: `body{background:#000;color:#fff}` }} />
      </head>
      <body className={`${inter.variable} font-sans`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'border border-white/10 bg-[#0a0a0a] text-white',
          }}
        />
      </body>
    </html>
  )
}
