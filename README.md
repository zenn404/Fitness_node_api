#Team members

Nyi Thu Hein (IT) 6612080

Aung Myint Myat  (CS) 6611906

PURAN PAODENSAKUL (CS) 6611140

# Fitness Node API + Mobile Client

Full-stack fitness tracking project with:
- `server/`: Express API + Supabase
- `client/`: Expo React Native app (Android/iOS/Web)

This project covers authentication, workout/exercise management, dashboard analytics, nutrition logging, onboarding, and profile management.

## Project Goals

- Help users plan and complete workouts.
- Track session history and progress trends.
- Log daily nutrition and calories.
- Provide profile-driven recommendations and onboarding.
- Support mobile-first usage with a shared backend API.

## Architecture

- Mobile/Web frontend: Expo + React Native + Expo Router
- API backend: Node.js + Express
- Data layer: Supabase (PostgreSQL)
- Auth: JWT with protected API routes
- State management: Zustand on client
- Localization: i18next with multiple locales (`en`, `th`, `zh`)

## Repository Structure

```text
.
├── client/                         # Expo React Native app
│   ├── app/                        # File-based routes (auth, tabs, onboarding)
│   ├── components/                 # UI primitives and app components
│   ├── services/                   # API and chat service
│   ├── store/                      # Zustand stores (auth, etc.)
│   ├── locales/                    # i18n resources
│   └── scripts/ensure-node.js      # Node version guard for Expo scripts
├── server/                         # Express API server
│   ├── controllers/                # Route business logic
│   ├── routes/                     # API route definitions
│   ├── middleware/                 # Auth middleware
│   ├── config/supabase.js          # Supabase client bootstrap
│   └── database/                   # SQL schema and migrations
└── fitness_api.postman_collection.json
```

## Core Features

### Authentication and Profile
- Register, login, logout, refresh token
- View/update profile
- Change password
- Delete account

### Workout and Exercise
- Browse workouts and exercises
- CRUD for workouts/exercises (protected operations)
- Add/remove/update exercises inside a workout
- Start and complete workout sessions

### Dashboard and Progress
- Dashboard stats endpoint
- Recent activity feed
- Progress data for charts

### Nutrition
- Nutrition lookup endpoint
- Daily nutrition log CRUD (`/api/logs`)

### Client Experience
- Tab navigation (`home`, `workout`, `nutrition`, `progress`, `profile`, `chat`)
- Onboarding screens (`onboarding-info`, `onboarding-goals`)
- Multi-language support
- API fallback logic for Android emulator networking (`10.0.2.2`)

## Backend API Overview

Base URL default: `http://localhost:3000`

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout` (auth)
- `GET /api/auth/profile` (auth)
- `PUT /api/auth/profile` (auth)
- `PUT /api/auth/password` (auth)
- `POST /api/auth/refresh` (auth)
- `DELETE /api/auth/account` (auth)

Exercises:
- `GET /api/exercises`
- `GET /api/exercises/grouped`
- `GET /api/exercises/:id`
- `POST /api/exercises` (auth)
- `PUT /api/exercises/:id` (auth)
- `DELETE /api/exercises/:id` (auth)

Workouts:
- `GET /api/workouts`
- `GET /api/workouts/:id`
- `POST /api/workouts` (auth)
- `PUT /api/workouts/:id` (auth)
- `DELETE /api/workouts/:id` (auth)
- `POST /api/workouts/:id/exercises` (auth)
- `PUT /api/workouts/:id/exercises/:exerciseId` (auth)
- `DELETE /api/workouts/:id/exercises/:exerciseId` (auth)

Sessions:
- `POST /api/sessions/start` (auth)
- `PUT /api/sessions/:id/complete` (auth)

Dashboard:
- `GET /api/dashboard/stats` (auth)
- `GET /api/dashboard/activity` (auth)
- `GET /api/dashboard/progress` (auth)

Nutrition:
- `GET /api/nutrition`
- `GET /api/logs` (auth)
- `POST /api/logs` (auth)
- `DELETE /api/logs/:id` (auth)

## Environment Variables

### Server (`server/.env`)

Required for full functionality:
- `PORT` (default `3000`)
- `CLIENT_URL` (default `http://localhost:8081`)
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `COOKIE_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `SUPABASE_ANON_KEY`
- `USDA_API_KEY` (nutrition integration if enabled)
- `NODE_ENV`

### Client (`client/.env`)

- `EXPO_PUBLIC_API_URL` (e.g. `http://localhost:3000`)
- `EXPO_PUBLIC_HUGGINGFACE_API_KEY` (if chat/AI feature is enabled)
- `EXPO_PUBLIC_HUGGINGFACE_MODEL`
- `DARK_MODE` (optional project flag)

## Local Development Setup

### 1) Clone and install

```bash
git clone https://github.com/zenn404/Fitness_node_api.git
cd Fitness_node_api
```

Install server deps:

```bash
cd server
npm install
```

Install client deps:

```bash
cd ../client
npm install
```

### 2) Configure environment

- Create and fill `server/.env`
- Create and fill `client/.env`

### 3) Run backend

```bash
cd server
npm run dev
```

Server starts at `http://localhost:3000`.

### 4) Run frontend

```bash
cd client
npm run start
```

Other client scripts:
- `npm run android`
- `npm run ios`
- `npm run web`

Note: client scripts enforce Node `20` via `client/.nvmrc` and `scripts/ensure-node.js`.

## Database

SQL resources are in:
- `server/database/schema.sql`
- `server/database/2026-02-26-add-gender-and-user-logs.sql`
- `server/db_setup.sql`

Apply these in your Supabase/Postgres environment in order suitable for your deployment.

## Postman Collection

Use `fitness_api.postman_collection.json` to test API endpoints quickly.

## Troubleshooting

- 401/403 errors: check JWT token and auth headers.
- CORS errors: ensure `CLIENT_URL` matches your Expo app origin.
- Android emulator cannot reach localhost: use `10.0.2.2` mapping (already handled in `client/services/api.ts` fallback logic).
- Supabase not working: verify `SUPABASE_URL` + key values and RLS policies.

## Contribution Workflow

- Create a feature branch from `main`.
- Commit with clear messages.
- Open PR to `main`.
- Ensure commits use an email linked to your GitHub account for contribution attribution.
