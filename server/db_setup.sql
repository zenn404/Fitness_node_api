-- Users table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password text not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Daily Logs table
create table public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  sugar numeric,
  fiber numeric,
  serving_size numeric,
  log_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exercises table
create table public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  description text,
  muscle_group text not null,
  difficulty text default 'Beginner',
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workouts table
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  description text,
  difficulty text default 'Beginner',
  duration_minutes integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workout Exercises table
create table public.workout_exercises (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  sets integer default 3,
  reps integer default 10,
  rest_seconds integer default 60,
  order_index integer default 0,
  notes text,
  unique(workout_id, exercise_id)
);
