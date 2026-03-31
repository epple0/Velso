# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Velso is an AI-native productivity app built with Next.js 14 (App Router). It combines Pomodoro focus sessions with AI-driven time blocking via Google Gemini. The app is dark-mode-only with a custom theming system using HSL CSS variables.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build (use to verify no type/build errors)
npm run lint      # ESLint
npm run start     # Start production server
```

There is no test framework configured. Use `npm run build` to verify correctness.

## Architecture

### Tech Stack
- **Framework**: Next.js 14 App Router, React 18, TypeScript
- **State**: Zustand stores in `src/store/` (with `persist` middleware for localStorage cache)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: Google Gemini API for schedule generation (`src/lib/gemini.ts`)
- **Styling**: Tailwind CSS with HSL variable-based design tokens, Radix UI primitives, Framer Motion animations
- **Drag & Drop**: @dnd-kit for task reordering/kanban

### Route Structure
- `src/app/(dashboard)/` — Authenticated route group containing: `dashboard`, `focus`, `schedule`, `settings`, `tasks`
- `src/app/auth/` — Login/signup pages
- `src/app/page.tsx` — Public landing page

### Key Patterns

**State Management**: Zustand stores act as local cache with Supabase as source of truth. Stores use `persist` middleware. `updateProfile()` does optimistic local updates; Supabase writes happen at the page/component level.

**Component Architecture**: Server components for layouts and static content; client components (`"use client"`) for all interactive UI. Components organized by domain: `auth/`, `layout/`, `schedule/`, `tasks/`, `timer/`, `ui/`.

**Theming**: Custom themes stored in Supabase `saved_themes` table. Colors defined as HSL variables in CSS, consumed via Tailwind (`hsl(var(--primary))`). Built-in themes: Onyx (dark), Cloud (light). The app forces `dark` class on `<html>`.

**Work Styles**: Three modes (`flow`/`balanced`/`sprint`) that control Pomodoro timing. Defined in `src/types/index.ts` as `WORK_STYLES` config object with durations for each mode.

**AI Scheduler**: `src/lib/gemini.ts` sends tasks + preferences to Gemini, which returns a structured schedule of `TimeBlock[]`. Schedules are persisted in Supabase `schedules` table with JSONB `blocks` column.

### Database (Supabase)
Schema defined in `supabase-schema.sql`. Four main tables: `profiles`, `tasks`, `schedules`, `saved_themes`. All tables use Row Level Security. Client initialized in `src/lib/supabase/client.ts`. Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars.

### Data Flow
1. Auth (Supabase Google OAuth) → profile loaded into Zustand auth store
2. Tasks CRUD → Supabase `tasks` table → Zustand tasks store
3. AI generates schedule → saved to Supabase `schedules` → displayed in calendar and timeline
4. Focus timer can follow a schedule's time blocks, auto-advancing between focus/break
