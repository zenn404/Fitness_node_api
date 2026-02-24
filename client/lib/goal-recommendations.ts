import { Workout } from "@/services/api";

export type UserGoal =
  | "lose_weight"
  | "build_muscle"
  | "stay_fit"
  | "improve_endurance"
  | "flexibility"
  | "general_health";

const GOAL_KEYWORDS: Record<UserGoal, string[]> = {
  lose_weight: ["fat burn", "cardio", "hiit", "burn", "weight loss", "metabolic"],
  build_muscle: ["strength", "muscle", "hypertrophy", "power", "upper body", "lower body"],
  stay_fit: ["full body", "functional", "fitness", "conditioning"],
  improve_endurance: ["endurance", "stamina", "cardio", "run", "cycling", "aerobic"],
  flexibility: ["stretch", "mobility", "yoga", "pilates", "flexibility", "recovery"],
  general_health: ["beginner", "wellness", "full body", "health", "functional"],
};

const GOAL_CALORIE_OFFSET: Record<UserGoal, number> = {
  lose_weight: -450,
  build_muscle: 300,
  stay_fit: 0,
  improve_endurance: 150,
  flexibility: -100,
  general_health: 0,
};

const containsAnyKeyword = (text: string, keywords: string[]) =>
  keywords.some((kw) => text.includes(kw));

export const scoreWorkoutForGoal = (workout: Workout, goal?: string): number => {
  if (!goal || !(goal in GOAL_KEYWORDS)) return 0;

  const typedGoal = goal as UserGoal;
  const keywords = GOAL_KEYWORDS[typedGoal];
  const text = `${workout.name || ""} ${workout.description || ""}`.toLowerCase();
  let score = 0;

  if (containsAnyKeyword(text, keywords)) {
    score += 100;
  }

  if (typedGoal === "lose_weight" || typedGoal === "improve_endurance") {
    score += Math.min(30, (workout.duration_minutes || 0) / 2);
  }

  if (typedGoal === "build_muscle") {
    if (workout.difficulty === "Advanced") score += 25;
    if (workout.difficulty === "Intermediate") score += 15;
  }

  if (typedGoal === "flexibility") {
    if (workout.difficulty === "Beginner") score += 20;
  }

  if (typedGoal === "general_health" || typedGoal === "stay_fit") {
    if (workout.difficulty === "Beginner") score += 12;
    if (workout.difficulty === "Intermediate") score += 8;
  }

  return score;
};

export const sortWorkoutsForGoal = (workouts: Workout[], goal?: string): Workout[] =>
  [...workouts].sort((a, b) => scoreWorkoutForGoal(b, goal) - scoreWorkoutForGoal(a, goal));

export const getGoalCalorieTarget = (
  maintenanceCalories: number | null,
  goal?: string,
): number | null => {
  if (!maintenanceCalories || !goal || !(goal in GOAL_CALORIE_OFFSET)) {
    return maintenanceCalories;
  }
  const typedGoal = goal as UserGoal;
  return Math.max(1200, maintenanceCalories + GOAL_CALORIE_OFFSET[typedGoal]);
};

