# Velso — Complete Project Overview

## What is Velso?

Velso is an AI-native productivity web application that combines Pomodoro-style focus timers with AI-driven daily schedule generation. Users create tasks, and the app uses Google Gemini AI to automatically generate optimized daily time-blocked schedules. It is a client-side rendered SPA built on Next.js 14 App Router with Supabase as the backend.

---

## Tech Stack

### Framework & Runtime
- **Next.js 14.2.21** (App Router) — React framework with file-based routing. All pages use `"use client"` directive, meaning they are client components that render in the browser.
- **React 18.3** with **TypeScript 5.7**
- **Node.js** runtime with webpack bundler

### Backend & Database
- **Supabase** — PostgreSQL database with built-in Auth, Row Level Security (RLS), and auto-generated REST API
  - `@supabase/ssr` (v0.5.2) — SSR-compatible Supabase client with cookie handling
  - `@supabase/supabase-js` (v2.47.12) — Core Supabase JS client
  - `@supabase/auth-helpers-nextjs` (v0.10.0) — Auth integration helpers
- **Authentication**: Email/password signup + Google OAuth via Supabase Auth
- **4 Database Tables**: `profiles`, `tasks`, `schedules`, `saved_themes` (defined in `supabase-schema.sql`)

### AI Integration
- **Google Gemini API** via `@google/generative-ai` (v0.21.0) — sends tasks + user preferences to Gemini, receives structured JSON schedules back
- **Fallback**: Local deterministic schedule generation in `schedule-utils.ts` when AI is unavailable or for small task counts (≤12 tasks)

### State Management
- **Zustand 5.0** with `persist` middleware — 5 stores: `auth`, `tasks`, `schedule`, `timer`, `theme`
- State is stored in localStorage via Zustand persist, with Supabase as the source of truth
- All mutations use **optimistic updates** (update local state immediately, sync to Supabase in background, rollback on error)

### UI Libraries
- **Tailwind CSS 3.4** with HSL CSS variable-based design tokens — all colors defined as `hsl(var(--color))` in CSS custom properties, consumed via Tailwind config
- **Radix UI** primitives for accessible components: Dialog, Select, Tooltip, Tabs, Label, Separator, Popover, ScrollArea, Slot
- **Framer Motion 11.15** — animations throughout (page transitions, list animations, layout animations, scroll-based parallax on landing page)
- **Lucide React 0.468** — icon library (tree-shakeable, 50+ icons used)
- **class-variance-authority (CVA)** — component variant system for UI primitives
- **clsx + tailwind-merge** — className utility via `cn()` function

### Drag & Drop
- **@dnd-kit/core 6.1** + **@dnd-kit/sortable 8.0** + **@dnd-kit/utilities 3.2** — used exclusively in the Kanban board view for drag-and-drop task management between columns

### Notifications
- **Sonner 1.7** — toast notifications for all user actions (task created, settings saved, errors)

### Styling Plugins
- **tailwindcss-animate 1.0** — animation utilities for Tailwind (shimmer, accordion, fade-in, slide-in)

---

## File Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout — Inter font, dark theme, Toaster
│   ├── globals.css               # CSS variables, scrollbar, skeleton animation, glass nav
│   ├── page.tsx                  # Landing page — hero with canvas particles, gradient orbs, features, CTA
│   ├── middleware.ts              # Auth middleware — protects dashboard routes, redirects logged-in users
│   ├── auth/
│   │   └── callback/route.ts     # OAuth callback handler — exchanges code for session
│   └── (dashboard)/              # Route group for authenticated pages
│       ├── layout.tsx            # Dashboard layout — sidebar + topbar + auth init + data loading
│       ├── dashboard/page.tsx    # Dashboard — stats cards, quick actions, recent tasks
│       ├── focus/page.tsx        # Focus timer page — dynamically imports FocusTimer
│       ├── schedule/page.tsx     # Schedule page — dynamically imports ScheduleTimeline
│       ├── settings/page.tsx     # Settings — 5 tabs (Profile, Productivity, Appearance, Categories, AI)
│       └── tasks/page.tsx        # Tasks page — 3 views (List, Kanban, Calendar) + quick add
│
├── components/
│   ├── auth/
│   │   └── auth-modal.tsx        # Signup/login dialog — email+password + Google OAuth
│   ├── landing/
│   │   └── hero-canvas.tsx       # Canvas particle constellation — 90 particles with connection lines
│   ├── layout/
│   │   ├── sidebar.tsx           # Navigation sidebar — 6 route links with active indicator animation
│   │   └── topbar.tsx            # Top bar — user avatar, theme toggle, settings link
│   ├── schedule/
│   │   └── timeline.tsx          # AI schedule timeline — work style selector, start time, block list
│   ├── tasks/
│   │   ├── task-calendar.tsx     # Weekly calendar — 6AM-10PM time grid, schedule block overlays, DnD
│   │   ├── task-card.tsx         # Task card component — priority badge, category tag, action buttons
│   │   ├── task-create.tsx       # Create/edit task dialog — all fields, category select, validation
│   │   ├── task-kanban.tsx       # Kanban board — 3 columns (Not Started, In Progress, Finished), DnD via @dnd-kit
│   │   └── task-list.tsx         # Flat task list — renders TaskCard for each task
│   ├── timer/
│   │   └── focus-timer.tsx       # Pomodoro timer — SVG ring, task selector, fullscreen mode, schedule integration
│   └── ui/                       # Reusable UI primitives (Radix-based)
│       ├── badge.tsx, button.tsx, card.tsx, dialog.tsx, input.tsx,
│       ├── label.tsx, scroll-area.tsx, select.tsx, separator.tsx,
│       ├── skeleton.tsx, tabs.tsx, tooltip.tsx
│
├── lib/
│   ├── gemini.ts                 # Gemini AI client — sends prompt, parses JSON schedule response
│   ├── schedule-utils.ts         # Time utilities + local deterministic schedule generation
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client (singleton)
│   │   └── server.ts             # Server-side Supabase client (for middleware + route handlers)
│   └── utils.ts                  # cn(), formatTime(), formatDate(), hexToHsl(), etc.
│
├── store/
│   ├── auth.ts                   # User profile — load/save to Supabase, theme CRUD
│   ├── tasks.ts                  # Task CRUD — optimistic updates, snake_case↔camelCase mapping
│   ├── schedule.ts               # Schedule state — load/save, active/next block tracking
│   ├── timer.ts                  # Pomodoro timer — tick(), mode switching, config loading
│   └── theme.ts                  # Theme system — Onyx/Cloud presets, custom colors, CSS var application
│
├── types/
│   └── index.ts                  # All TypeScript types, constants, defaults, profanity filter
│
├── middleware.ts                  # (duplicate — actual middleware is at src/middleware.ts)
│
└── supabase-schema.sql           # Full database schema (separate file in project root)
```

---

## Database Schema (Supabase PostgreSQL)

### `profiles` table
Stores all user preferences. Auto-created on signup via PostgreSQL trigger.
```sql
id UUID PK → auth.users.id
name TEXT, avatar_url TEXT
start_of_day TIME DEFAULT '09:00', end_of_day TIME DEFAULT '18:00'
buffer_percent INTEGER DEFAULT 15
gemini_api_key TEXT, gemini_model TEXT DEFAULT 'gemini-2.0-flash'
timer_config JSONB (focusDuration, breakDuration, longBreakDuration, longBreakInterval, aiDecides)
work_style TEXT CHECK IN ('flow','balanced','sprint') DEFAULT 'balanced'
task_spread_enabled BOOLEAN DEFAULT false
categories TEXT[] DEFAULT '{"Work","Personal","Health","Learning","Creative"}'
```
RLS: Users can only read/write their own row.

### `tasks` table
```sql
id UUID PK, user_id UUID FK → auth.users
title TEXT, description TEXT
status TEXT CHECK IN ('not_started','in_progress','finished')
priority TEXT CHECK IN ('low','medium','high','urgent')
category TEXT, due_date DATE, time_estimate INTEGER (minutes), location TEXT
"order" INTEGER DEFAULT 0
```
RLS: Users can only CRUD their own tasks.

### `schedules` table
```sql
id UUID PK, user_id UUID FK → auth.users
date DATE, UNIQUE(user_id, date)
blocks JSONB (array of TimeBlock objects)
backlog JSONB (array of {task, reason} objects)
work_style TEXT, start_time TEXT
```
One schedule per user per day.

### `saved_themes` table
```sql
id UUID PK, user_id UUID FK → auth.users
name TEXT, colors JSONB (ThemeColors object)
```
User-created custom color themes.

---

## Type System (`src/types/index.ts`)

### Core Types
- **Task** — id, title, description, status (not_started|in_progress|finished), priority (low|medium|high|urgent), category, dueDate, timeEstimate, location, order, timestamps, userId
- **TimeBlock** — id, taskId?, title, type (task|break|buffer|lunch), startTime, endTime, duration, locked
- **Schedule** — id?, userId?, date, blocks: TimeBlock[], backlog, workStyle, startTime, generatedAt
- **TimerConfig** — focusDuration, breakDuration, longBreakDuration, longBreakInterval, aiDecides
- **UserProfile** — id, email, name, avatarUrl?, startOfDay, endOfDay, bufferPercent, categories, geminiApiKey?, geminiModel, timerConfig?, savedThemes?, workStyle, taskSpreadEnabled
- **ThemeColors** — primary, accent, ring, background, foreground, card, muted, border (all hex strings)
- **SavedTheme** — name + colors
- **WorkStyle** — 'flow' | 'balanced' | 'sprint'

### Key Constants
- **WORK_STYLES** — Record mapping each work style to label, description, tooltip, icon emoji, and timing presets (flow=45/15/30, balanced=25/5/15, sprint=50/10/20)
- **DEFAULT_CATEGORIES** — ['Work', 'Personal', 'Health', 'Learning', 'Creative']
- **CATEGORY_COLORS** — Tailwind classes per category (blue, purple, green, orange, pink)
- **GEMINI_MODELS** — 7 Gemini model options (2.5-pro through 1.5-flash-8b)
- **DEFAULT_TIMER_CONFIG** — 25min focus, 5min break, 15min long break, 4 pomodoros

### Utility Functions
- `getCategoryColor(category)` — returns Tailwind classes, deterministic hash for custom categories
- `containsProfanity(text)` — basic blocklist filter for user-generated content (theme names)

---

## State Management (Zustand Stores)

### `useAuthStore` (store/auth.ts) — persisted to localStorage as `velso-auth`
State: `user: UserProfile | null`, `isLoading: boolean`
Key functions:
- `loadProfileFromSupabase(userId)` — fetches profile + saved_themes table, maps to UserProfile
- `saveProfileToSupabase()` — upserts to profiles table (auto-called on updateProfile)
- `saveThemeToSupabase(theme)` — inserts row into saved_themes table
- `deleteThemeFromSupabase(name)` — deletes row from saved_themes table
- `updateProfile(updates)` — merges partial updates into user, triggers background Supabase save

### `useTasksStore` (store/tasks.ts)
State: `tasks: Task[]`, `viewMode: ViewMode`, `isLoading: boolean`
Key patterns:
- `mapTask(row)` / `toRow(data)` — snake_case ↔ camelCase conversion for Supabase
- All mutations (addTask, updateTask, deleteTask, moveTask) use **optimistic updates**: update local state immediately, then sync to Supabase, rollback on error
- `loadTasks(userId)` — fetches all tasks from Supabase ordered by `order`

### `useScheduleStore` (store/schedule.ts)
State: `schedule: Schedule | null`, `isLoading`, `activeBlockId`
Key functions:
- `loadSchedule(userId, date?)` — fetches today's schedule from Supabase
- `saveSchedule(userId)` — upserts schedule to Supabase
- `getActiveBlock()` / `getNextBlock()` — returns the current/upcoming time block based on real clock time
- `toggleBlockLock(blockId)` — flips the locked state on a block

### `useTimerStore` (store/timer.ts) — NOT persisted (in-memory only)
State: isRunning, isPaused, mode (focus|break|long_break), timeRemaining, totalTime, currentTaskId, completedPomodoros, durations, isPillMode, isFocusScreen, config
Key function:
- `tick()` — decrements timeRemaining every second, auto-transitions between focus→break→long_break modes

### `useThemeStore` (store/theme.ts) — persisted to localStorage as `velso-theme`
State: theme (onyx|cloud|custom), customColors (ThemeColors)
Key function:
- `applyTheme()` — converts hex colors to HSL and sets CSS custom properties on `:root`
- Two presets: Onyx (pure black with indigo accent) and Cloud (white with indigo accent)

---

## Route Architecture

### Public Routes
- `/` (page.tsx) — Landing page with:
  - Canvas particle constellation background (90 particles with connection lines, parallax on scroll, mouse interaction)
  - 3 animated gradient orbs (infinite loops at 22-30s, GPU-composited with will-change)
  - Feature cards, CTA section with gradient glow
  - AuthModal (dynamically imported, opens on "Get Started" click)

### Auth Route
- `/auth/callback` (route.ts) — Server-side route handler that exchanges OAuth code for session, redirects to `/dashboard`

### Protected Routes (via `(dashboard)` route group)
All protected by middleware which checks Supabase session cookies.

**Dashboard Layout** (`(dashboard)/layout.tsx`):
- Initializes auth: calls `supabase.auth.getSession()`, tries `loadProfileFromSupabase()`, falls back to constructing profile from session metadata + cached state
- Subscribes to `onAuthStateChange` for real-time auth updates
- Loads tasks and schedule on auth
- Shows skeleton screen during loading
- Renders Sidebar + Topbar + content area

**Pages**:
- `/dashboard` — Stats grid (total, in progress, completed, focus sessions), quick action links, recent tasks list
- `/tasks` — Quick-add bar with natural language parsing (#category, 30m/1h, today/tomorrow, mm/dd, !1-4 priority), 3 view modes:
  - List: flat list of TaskCard components
  - Kanban: 3-column board with @dnd-kit drag-and-drop (SortableTaskCard, KanbanColumn)
  - Calendar: 7-day weekly view with hourly time grid (6AM-10PM), schedule block overlays, drag-to-assign-date
- `/schedule` — Schedule generation page:
  - Work style selector (Flow/Balanced/Sprint cards)
  - Start time input (defaults to next 15-min slot)
  - "Generate Schedule" button → calls Gemini AI or local fallback
  - Timeline of TimeBlocks with lock/unlock, "Start Focus" buttons
  - Saves to Supabase after generation
- `/focus` — Pomodoro timer:
  - Start screen with task selector, schedule-follow mode showing upcoming blocks
  - SVG circular progress ring with countdown
  - Play/pause/skip/reset controls
  - Fullscreen distraction-free mode
  - Pill mode (compact floating timer)
  - Auto-advances between focus/break/long_break modes
- `/settings` — 5-tab settings panel:
  - Profile: name, avatar upload, start/end of day, buffer %, sign out
  - Productivity: work style selector, smart task spreading toggle
  - Appearance: theme presets (Onyx/Cloud), Theme Lab with color picker, saved themes CRUD
  - Categories: add/remove/reorder categories, profanity filter
  - AI Integration: Gemini API key input, model selector

---

## AI Schedule Generation Flow

1. User clicks "Generate Schedule" on `/schedule` page
2. ScheduleTimeline component collects: pending tasks, user's work style, start time, buffer %, task spread setting
3. If user has a Gemini API key configured:
   - Calls `generateSchedule()` in `lib/gemini.ts`
   - Constructs a prompt with task JSON, timing constraints, and work style instructions
   - Sends to Google Gemini API via `@google/generative-ai` SDK
   - Parses JSON response into `TimeBlock[]`
4. If no API key or AI fails:
   - Falls back to `generateBlocksFromTasks()` in `lib/schedule-utils.ts`
   - Deterministic algorithm: sorts by priority, interleaves categories if spread enabled, rounds to 15-min boundaries, inserts breaks/buffers per work style
5. Result is stored in Zustand schedule store and persisted to Supabase `schedules` table

---

## Performance Optimizations Applied

### Code Splitting (dynamic imports via `next/dynamic`)
- TaskList, TaskKanban, TaskCalendar, TaskCreate — loaded on-demand based on active view
- FocusTimer — loaded only when visiting /focus
- ScheduleTimeline — loaded only when visiting /schedule
- AuthModal — loaded only when user clicks sign in
- Result: /focus dropped from 8.57kB to 1.45kB route JS, /tasks from 33.6kB to 6.24kB

### Supabase Client Singleton
- `lib/supabase/client.ts` uses module-level variable — single instance shared across all stores (was 12+ instances)

### Zustand Selector Optimization
- All store subscriptions use individual selectors: `useStore((s) => s.field)` instead of destructuring the entire store
- Prevents re-renders from unrelated state changes

### React Memoization
- `React.memo` on TaskCard, KanbanColumn, SortableTaskCard
- `useMemo` on status counts, stats, task-by-date maps, active tasks
- `useCallback` on handleQuickAdd

### Animation Performance
- HeroCanvas uses IntersectionObserver to pause rAF when scrolled off-screen
- Landing page gradient orbs use `willChange: 'transform'` for GPU compositing

### Build Optimizations
- `compiler.removeConsole` strips console.log/debug in production
- `poweredByHeader: false`

---

## Configuration Files

- **next.config.js** — Image domains (Google/GitHub avatars), console removal, powered-by header
- **tailwind.config.ts** — HSL variable-based colors, custom keyframes (shimmer, fade-in, slide-in, accordion), tailwindcss-animate plugin
- **tsconfig.json** — Path alias `@/` → `src/`, strict mode
- **supabase-schema.sql** — Full DDL for all 4 tables with RLS policies, auto-create profile trigger, updated_at trigger

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

---

## Theming System

The app is dark-mode-only by default (`<html className="dark">`). Colors are defined as HSL values in CSS custom properties, consumed via Tailwind as `hsl(var(--color))`.

Two built-in themes:
- **Onyx** — Pure black (#000) background, white text, indigo accent (#6366f1)
- **Cloud** — White (#fafafa) background, dark text, indigo accent

Custom themes: Users pick colors via a color picker, which calls `setCustomColor()` → updates CSS variables in real-time. Themes can be saved to the `saved_themes` Supabase table.

The theme store (`store/theme.ts`) converts hex colors to HSL strings using `hexToHsl()` from `lib/utils.ts` and sets them on `document.documentElement.style`.

---

## Authentication Flow

1. **Email/Password**: User fills signup/login form in AuthModal → `supabase.auth.signUp()` or `supabase.auth.signInWithPassword()` → session created → profile loaded
2. **Google OAuth**: `supabase.auth.signInWithOAuth({ provider: 'google' })` → redirects to Google → callback to `/auth/callback` → server exchanges code for session → redirects to `/dashboard`
3. **Session persistence**: Supabase uses cookies managed by middleware. Dashboard layout calls `getSession()` on mount + subscribes to `onAuthStateChange()`
4. **Route protection**: Middleware checks `supabase.auth.getUser()` — unauthenticated users accessing dashboard routes are redirected to `/`, authenticated users on `/` are redirected to `/dashboard`
5. **Profile auto-creation**: PostgreSQL trigger `handle_new_user()` auto-inserts a row into `profiles` when a new user signs up

---

## Key Data Flows

### Tasks
1. User creates task via quick-add or create dialog
2. Zustand tasks store: optimistic local insert → Supabase insert → replace temp ID with real ID (or rollback)
3. Tasks displayed in List/Kanban/Calendar views
4. Kanban uses @dnd-kit for drag-and-drop status changes → `moveTask(id, newStatus)` → optimistic update + Supabase sync

### Schedule
1. User configures work style + start time → clicks generate
2. Tasks + preferences sent to Gemini AI (or local fallback)
3. Returns array of TimeBlock objects with breaks, buffers
4. Saved to Supabase `schedules` table
5. Calendar page overlays schedule blocks on today's column
6. Focus timer reads schedule to show upcoming blocks and enable schedule-follow mode

### Timer
1. User selects a task and starts timer → `startTimer(taskId)` sets mode to 'focus', calculates duration from config
2. `setInterval` calls `tick()` every second → decrements `timeRemaining`
3. When timeRemaining hits 0 → auto-transitions to break/long_break/focus mode
4. Timer state is NOT persisted — resets on page reload
5. Timer config is loaded from user profile on mount

---

## Component Communication Pattern

There are no React Context providers. All cross-component state flows through Zustand stores:
- Components read state via `useXxxStore((s) => s.field)` with individual selectors
- Components write state via store actions (e.g., `addTask()`, `updateProfile()`, `setTheme()`)
- Store actions handle both local state update AND Supabase sync
- The dashboard layout is the orchestrator that initializes auth, loads tasks, and loads schedule on mount
