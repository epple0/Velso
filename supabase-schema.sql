-- Velso Complete Supabase Schema
-- Run this in your Supabase SQL Editor

-- ============================================================
-- 1. PROFILES TABLE (all user preferences)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  start_of_day TIME NOT NULL DEFAULT '09:00',
  end_of_day TIME NOT NULL DEFAULT '18:00',
  buffer_percent INTEGER NOT NULL DEFAULT 15,
  gemini_api_key TEXT,
  gemini_model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  timer_config JSONB NOT NULL DEFAULT '{"focusDuration":25,"breakDuration":5,"longBreakDuration":15,"longBreakInterval":4,"aiDecides":false}',
  work_style TEXT NOT NULL DEFAULT 'balanced' CHECK (work_style IN ('flow', 'balanced', 'sprint')),
  task_spread_enabled BOOLEAN NOT NULL DEFAULT false,
  categories TEXT[] NOT NULL DEFAULT '{"Work","Personal","Health","Learning","Creative"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'finished')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  due_date DATE,
  time_estimate INTEGER,
  location TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. SCHEDULES TABLE (AI-generated daily schedules)
-- ============================================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  blocks JSONB NOT NULL DEFAULT '[]',
  backlog JSONB NOT NULL DEFAULT '[]',
  work_style TEXT NOT NULL DEFAULT 'balanced',
  start_time TEXT NOT NULL DEFAULT '09:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own schedules" ON schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedules" ON schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedules" ON schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedules" ON schedules FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. SAVED THEMES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  colors JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saved_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own themes" ON saved_themes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own themes" ON saved_themes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own themes" ON saved_themes FOR DELETE USING (auth.uid() = user_id);
