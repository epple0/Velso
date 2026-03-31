# Velso Full Integration Plan

## Context
Velso currently uses localStorage (Zustand persist) for all user data. The AI scheduler, calendar, and focus timer are disconnected silos. The user needs everything interlinked: scheduler feeds calendar, calendar feeds focus timer, and all data persists in Supabase. Also needs a proper skeleton loading system and new work-efficiency settings.

## 1. Supabase Schema — New Tables

**Replace `supabase-tasks-schema.sql` with a complete schema:**

- **`profiles`** — stores all user preferences (replaces localStorage)
  - id (FK to auth.users), name, avatar_url, start_of_day, end_of_day, buffer_percent
  - gemini_api_key (encrypted column), gemini_model
  - timer_config (JSONB), work_style (enum: 'flow' | 'balanced' | 'sprint')
  - task_spread_enabled (bool), categories (TEXT[])

- **`tasks`** — already exists, keep as-is

- **`schedules`** — persists AI-generated schedules
  - id, user_id, date, blocks (JSONB), backlog (JSONB), work_style, created_at
  - Links to calendar: schedule for today is loaded into calendar view

- **`saved_themes`** — user's custom themes
  - id, user_id, name, colors (JSONB), created_at

Files: `supabase-schema.sql` (new, replaces old)

## 2. Auth Store → Supabase Backed

**File: `src/store/auth.ts`**
- On login: fetch profile from Supabase `profiles` table
- `updateProfile()` writes to Supabase then updates local state
- On first login: create profile row from user_metadata + defaults
- Keep Zustand as local cache (optimistic reads), Supabase as source of truth

**File: `src/app/(dashboard)/layout.tsx`**
- After auth: load profile from Supabase, load tasks, load schedule for today

## 3. AI Scheduler → Calendar Integration

**File: `src/lib/gemini.ts`**
- Add `startFromTime` parameter (defaults to current time, rounded to next 15min)
- Round all generated times to 15-minute boundaries for satisfaction
- Add `workStyle` parameter that changes scheduling intensity
- Save generated schedule to Supabase `schedules` table

**File: `src/components/schedule/timeline.tsx`**
- Add start-time input (defaults to now)
- Add "Open in Calendar" button that navigates to `/tasks?view=calendar`
- Save schedule to Supabase after generation
- Show schedule blocks with time-based layout

**File: `src/store/schedule.ts`** (new)
- Zustand store for current schedule
- `loadSchedule(userId, date)` — fetch from Supabase
- `saveSchedule()` — persist to Supabase
- `getCurrentBlock()` — returns the active time block based on current time
- `getNextBlock()` — returns upcoming block

## 4. Calendar with Time Slots

**File: `src/components/tasks/task-calendar.tsx`**
- Add hourly time grid (e.g., 6AM–10PM) alongside each day column
- When schedule exists for the week, overlay schedule blocks onto the time grid
- Color-code blocks by type (task=accent, break=green, buffer=yellow, lunch=blue)
- Each time block shows task name + duration
- "View Schedule" link at top if no schedule for current week

**File: `src/app/(dashboard)/tasks/page.tsx`**
- On mount with `?view=calendar`, switch to calendar view
- Pass schedule data to calendar component

## 5. Focus Mode + Scheduler Integration

**File: `src/store/timer.ts`**
- Add `scheduledBlocks` field (from schedule store)
- Add `startFromSchedule(blockId)` — starts timer for a specific scheduled block
- When a pomodoro ends, auto-advance to next block (break or task)
- Show schedule progress (e.g., "Block 3 of 12")

**File: `src/components/timer/focus-timer.tsx`**
- If schedule exists, show "Follow Schedule" option on start screen
- Display current block info: "Working on: [task] (2:00 PM – 2:25 PM)"
- Show upcoming blocks below timer
- When schedule mode active, auto-transitions between focus/break based on schedule

## 6. Work Efficiency Settings

**File: `src/types/index.ts`**
- Add `WorkStyle` type: `'flow' | 'balanced' | 'sprint'`
- Add `workStyleDescriptions` with tooltips:
  - **Flow** (was "relaxed"): "45-min focus, 15-min breaks. Maximum deep thinking. Best for creative or complex work."
  - **Balanced** (was "medium"): "25-min focus, 5-min breaks. Classic Pomodoro. Best mix of focus and rest."
  - **Sprint** (was "high"): "50-min focus, 10-min breaks, 15-min buffer. Maximum throughput. Best for deadline crunches."
- Add `taskSpreadEnabled: boolean` to UserProfile
- Update `TimerConfig` to include workStyle

**File: `src/app/(dashboard)/settings/page.tsx`**
- New "Productivity" settings tab (or add to Profile tab):
  - Work style selector with 3 radio cards (Flow / Balanced / Sprint), each with icon, name, and tooltip description
  - "Smart Task Spreading" toggle with tooltip: "Automatically distribute tasks across your day with optimal spacing. Keeps you from stacking similar tasks back-to-back."

## 7. Skeleton Screen System

**File: `src/components/ui/skeleton.tsx`**
- Add CSS shimmer animation via Tailwind config or inline keyframe
- Create specialized skeleton components:
  - `SkeletonLine` — text placeholder
  - `SkeletonCircle` — avatar placeholder
  - `SkeletonCard` — card placeholder
  - `SkeletonCalendarDay` — calendar day placeholder
  - `SkeletonTimeline` — schedule timeline placeholder

**File: `src/app/globals.css`**
- Add `@keyframes shimmer` animation
- Update `.skeleton` class to use the shimmer

**Apply skeletons to:**
- `src/app/(dashboard)/dashboard/page.tsx` — stats cards, quick actions, recent tasks
- `src/app/(dashboard)/tasks/page.tsx` — task list/kanban/calendar loading states
- `src/app/(dashboard)/schedule/page.tsx` — timeline loading
- `src/components/tasks/task-list.tsx` — already has basic skeletons, enhance
- `src/components/tasks/task-kanban.tsx` — already has basic skeletons, enhance
- `src/components/tasks/task-calendar.tsx` — add skeleton days

## 8. Evenly Numbered Timings

**File: `src/lib/gemini.ts`**
- Round start times to nearest 15 minutes (00, 15, 30, 45)
- Round durations to nearest 5 minutes
- Schedule always starts on the hour or half-hour
- Helper: `roundToNearest(minutes, step = 15)`

## Implementation Order

1. Supabase schema + profiles table (foundation for everything)
2. Update auth store to load/save from Supabase
3. Create schedule store (`src/store/schedule.ts`)
4. Update `gemini.ts` with start time, work style, rounded timings
5. Update schedule timeline with start time input + save to Supabase
6. Enhance calendar with time grid + schedule overlay
7. Link focus timer with schedule
8. Add work efficiency settings
9. Build skeleton system with shimmer animation
10. Apply skeletons across all views
11. Build verification

## Files Modified/Created

### New files:
- `supabase-schema.sql` (complete schema)
- `src/store/schedule.ts`
- `src/lib/schedule-utils.ts` (time rounding, block helpers)

### Modified files:
- `src/types/index.ts` — WorkStyle type, updated types
- `src/store/auth.ts` — Supabase-backed profile
- `src/store/timer.ts` — schedule integration
- `src/store/tasks.ts` — already Supabase-backed
- `src/lib/gemini.ts` — start time, work style, rounded timings
- `src/components/schedule/timeline.tsx` — start time input, save, calendar link
- `src/components/tasks/task-calendar.tsx` — time grid, schedule overlay
- `src/components/timer/focus-timer.tsx` — schedule-follow mode
- `src/app/(dashboard)/settings/page.tsx` — work style + task spread settings
- `src/app/(dashboard)/layout.tsx` — load profile + schedule from Supabase
- `src/app/(dashboard)/tasks/page.tsx` — calendar view param support
- `src/components/ui/skeleton.tsx` — enhanced with shimmer + specialized components
- `src/app/globals.css` — shimmer keyframe animation
- `src/components/tasks/task-list.tsx` — enhanced skeletons
- `src/components/tasks/task-kanban.tsx` — enhanced skeletons

## Verification

1. Run `npx next build` — must pass with no errors
2. Test profile persistence: sign in, change settings, reload → settings preserved
3. Test AI scheduler: generate schedule → see blocks in calendar → start focus from schedule block
4. Test skeleton shimmer: throttle network, observe smooth shimmer loading states
5. Test work style: change from Flow → Balanced → Sprint, verify timer durations update
6. Test task spread toggle: generate schedules with and without spread, verify spacing
