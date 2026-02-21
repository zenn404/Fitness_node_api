-- =============================================
-- FITNESS APP - COMPLETE DATABASE SCHEMA
-- For Supabase/PostgreSQL
-- ONE-TO-MANY: Exercises belong to Workouts
-- =============================================

-- Drop tables in correct order (respecting foreign keys)
drop table if exists user_exercise_progress;
drop table if exists user_workout_sessions;
drop table if exists exercises;
drop table if exists workouts;
drop table if exists users;

-- =============================================
-- USERS TABLE
-- =============================================
create table users (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  password text not null,
  age integer,
  weight decimal(5,2),
  height decimal(5,2),
  goals text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table users disable row level security;

-- =============================================
-- WORKOUTS TABLE (Workout Templates/Plans)
-- =============================================
create table workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade, -- NULL = system workout, UUID = user created
  name text not null,
  description text,
  difficulty text default 'Beginner',
  duration_minutes integer,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table workouts disable row level security;

-- =============================================
-- EXERCISES TABLE (Exercises belong to Workouts)
-- =============================================
create table exercises (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references workouts(id) on delete cascade not null,
  name text not null,
  description text,
  muscle_group text not null,
  difficulty text default 'Beginner',
  sets integer default 3,
  reps integer default 10,
  rest_seconds integer default 60,
  order_index integer default 0,
  notes text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table exercises disable row level security;

-- =============================================
-- USER_WORKOUT_SESSIONS TABLE (Tracks when user starts a workout)
-- This is the KEY table for tracking progress
-- =============================================
create table user_workout_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  workout_id uuid references workouts(id) on delete cascade not null,
  status text default 'in_progress' check (status in ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')),
  started_at timestamp with time zone default timezone('utc'::text, now()),
  completed_at timestamp with time zone,
  total_duration_seconds integer, -- Actual time spent
  calories_burned integer,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for faster queries
create index idx_user_workout_sessions_user_id on user_workout_sessions(user_id);
create index idx_user_workout_sessions_status on user_workout_sessions(status);
create index idx_user_workout_sessions_started_at on user_workout_sessions(started_at);

alter table user_workout_sessions disable row level security;

-- =============================================
-- USER_EXERCISE_PROGRESS TABLE (Tracks each exercise within a session)
-- =============================================
create table user_exercise_progress (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references user_workout_sessions(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'skipped')),
  sets_completed integer default 0,
  actual_reps text, -- JSON array like "[12, 10, 8]" for each set
  weight_used text, -- JSON array like "[20, 20, 15]" for each set (in kg/lbs)
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(session_id, exercise_id)
);

-- Index for faster queries
create index idx_user_exercise_progress_session_id on user_exercise_progress(session_id);

alter table user_exercise_progress disable row level security;

-- =============================================
-- SEED DATA: WORKOUTS (Beginner)
-- =============================================
INSERT INTO workouts (name, description, difficulty, duration_minutes) VALUES
('Full Body Stretch', 'A gentle full-body stretching routine perfect for beginners.', 'Beginner', 15),
('Morning Wake Up', 'Start your day with this energizing morning workout.', 'Beginner', 20),
('Core Basics', 'Build a strong foundation with basic core exercises.', 'Beginner', 25);

-- =============================================
-- SEED DATA: WORKOUTS (Intermediate)
-- =============================================
INSERT INTO workouts (name, description, difficulty, duration_minutes) VALUES
('HIIT Blast', 'High-intensity interval training to boost metabolism.', 'Intermediate', 25),
('Strength Builder', 'Build lean muscle with strength training.', 'Intermediate', 45),
('Full Body Circuit', 'Complete circuit training for all muscle groups.', 'Intermediate', 40);

-- =============================================
-- SEED DATA: WORKOUTS (Advanced)
-- =============================================
INSERT INTO workouts (name, description, difficulty, duration_minutes) VALUES
('Beast Mode HIIT', 'Extreme high-intensity workout for advanced athletes.', 'Advanced', 30),
('Power Lifting', 'Heavy compound movements for strength gains.', 'Advanced', 60),
('CrossFit WOD', 'Varied functional movements at high intensity.', 'Advanced', 45);

-- =============================================
-- SEED DATA: EXERCISES for each workout
-- =============================================
-- Full Body Stretch exercises
INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Neck Rolls', 'Neck', 'Beginner', 'Gentle neck mobility exercise', 2, 10, 30, 1
FROM workouts WHERE name = 'Full Body Stretch';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Arm Circles', 'Shoulders', 'Beginner', 'Shoulder warm-up and mobility', 2, 15, 30, 2
FROM workouts WHERE name = 'Full Body Stretch';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Cat-Cow Stretch', 'Core', 'Beginner', 'Spine mobility exercise', 2, 12, 30, 3
FROM workouts WHERE name = 'Full Body Stretch';

-- Morning Wake Up exercises
INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Jumping Jacks', 'Full Body', 'Beginner', 'Full body cardio warm-up', 3, 20, 45, 1
FROM workouts WHERE name = 'Morning Wake Up';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Bodyweight Squats', 'Legs', 'Beginner', 'Lower body strength and mobility', 3, 15, 60, 2
FROM workouts WHERE name = 'Morning Wake Up';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Push Ups', 'Chest', 'Beginner', 'Upper body strength exercise', 3, 10, 60, 3
FROM workouts WHERE name = 'Morning Wake Up';

-- Core Basics exercises
INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Plank', 'Core', 'Beginner', 'Core stability exercise', 3, 30, 60, 1
FROM workouts WHERE name = 'Core Basics';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Bicycle Crunches', 'Core', 'Beginner', 'Abs and obliques exercise', 3, 20, 60, 2
FROM workouts WHERE name = 'Core Basics';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Russian Twists', 'Core', 'Beginner', 'Rotational core exercise', 3, 20, 60, 3
FROM workouts WHERE name = 'Core Basics';

-- HIIT Blast exercises
INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Burpees', 'Full Body', 'Intermediate', 'High intensity full body exercise', 4, 15, 45, 1
FROM workouts WHERE name = 'HIIT Blast';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Mountain Climbers', 'Core', 'Intermediate', 'Dynamic core exercise with cardio', 4, 30, 45, 2
FROM workouts WHERE name = 'HIIT Blast';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Jump Squats', 'Legs', 'Intermediate', 'Explosive lower body exercise', 4, 12, 60, 3
FROM workouts WHERE name = 'HIIT Blast';

-- Strength Builder exercises
INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Bench Press', 'Chest', 'Intermediate', 'Classic chest building exercise', 4, 10, 90, 1
FROM workouts WHERE name = 'Strength Builder';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Barbell Rows', 'Back', 'Intermediate', 'Back thickness exercise', 4, 10, 90, 2
FROM workouts WHERE name = 'Strength Builder';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Shoulder Press', 'Shoulders', 'Intermediate', 'Overhead pressing movement', 4, 10, 90, 3
FROM workouts WHERE name = 'Strength Builder';

-- Full Body Circuit exercises
INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Pull Ups', 'Back', 'Intermediate', 'Upper body pulling exercise', 3, 8, 90, 1
FROM workouts WHERE name = 'Full Body Circuit';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Dips', 'Triceps', 'Intermediate', 'Triceps and chest exercise', 3, 12, 90, 2
FROM workouts WHERE name = 'Full Body Circuit';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Lunges', 'Legs', 'Intermediate', 'Single leg strength exercise', 3, 12, 90, 3
FROM workouts WHERE name = 'Full Body Circuit';

-- Beast Mode HIIT exercises
INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Box Jumps', 'Legs', 'Advanced', 'Explosive plyometric exercise', 5, 10, 60, 1
FROM workouts WHERE name = 'Beast Mode HIIT';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Kettlebell Swings', 'Full Body', 'Advanced', 'Dynamic full body power exercise', 5, 20, 60, 2
FROM workouts WHERE name = 'Beast Mode HIIT';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Tuck Jumps', 'Legs', 'Advanced', 'High intensity jumping exercise', 5, 12, 60, 3
FROM workouts WHERE name = 'Beast Mode HIIT';

-- Power Lifting exercises
INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Deadlift', 'Back', 'Advanced', 'Compound exercise for posterior chain', 5, 5, 180, 1
FROM workouts WHERE name = 'Power Lifting';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Back Squat', 'Legs', 'Advanced', 'King of lower body exercises', 5, 5, 180, 2
FROM workouts WHERE name = 'Power Lifting';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Overhead Press', 'Shoulders', 'Advanced', 'Strict overhead pressing', 5, 5, 180, 3
FROM workouts WHERE name = 'Power Lifting';

-- CrossFit WOD exercises
INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Thrusters', 'Full Body', 'Advanced', 'Squat to overhead press combo', 5, 15, 90, 1
FROM workouts WHERE name = 'CrossFit WOD';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Wall Balls', 'Legs', 'Advanced', 'Explosive squat and throw', 5, 20, 90, 2
FROM workouts WHERE name = 'CrossFit WOD';

INSERT INTO exercises (workout_id, name, muscle_group, difficulty, description, sets, reps, rest_seconds, order_index)
SELECT id, 'Rowing', 'Full Body', 'Advanced', 'Cardio and full body endurance', 5, 500, 90, 3
FROM workouts WHERE name = 'CrossFit WOD';