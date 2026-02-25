import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/services/api";

const PROFILE_PREFS_KEY = "@profile_prefs_v1";

export type CalorieMode = "maintenance" | "cut" | "bulk";

export interface FavoriteWorkout {
  id: string;
  name: string;
  difficulty: string;
  duration_minutes?: number;
}

export interface ProfilePrefs {
  calorieMode: CalorieMode;
  calorieTarget?: number;
  favoriteWorkouts: FavoriteWorkout[];
}

const DEFAULT_PREFS: ProfilePrefs = {
  calorieMode: "maintenance",
  calorieTarget: undefined,
  favoriteWorkouts: [],
};

export const getProfilePrefs = async (): Promise<ProfilePrefs> => {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ProfilePrefs>;
    return {
      calorieMode:
        parsed.calorieMode === "cut" ||
        parsed.calorieMode === "bulk" ||
        parsed.calorieMode === "maintenance"
          ? parsed.calorieMode
          : "maintenance",
      calorieTarget:
        typeof parsed.calorieTarget === "number" ? parsed.calorieTarget : undefined,
      favoriteWorkouts: Array.isArray(parsed.favoriteWorkouts)
        ? parsed.favoriteWorkouts
            .filter((w) => w && typeof w.id === "string" && typeof w.name === "string")
            .map((w) => ({
              id: w.id,
              name: w.name,
              difficulty: typeof w.difficulty === "string" ? w.difficulty : "Beginner",
              duration_minutes:
                typeof w.duration_minutes === "number" ? w.duration_minutes : undefined,
            }))
        : [],
    };
  } catch {
    return DEFAULT_PREFS;
  }
};

export const saveProfilePrefs = async (prefs: ProfilePrefs): Promise<void> => {
  await AsyncStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(prefs));
};

export const toggleFavoriteWorkout = async (
  workout: FavoriteWorkout,
): Promise<ProfilePrefs> => {
  const prefs = await getProfilePrefs();
  const exists = prefs.favoriteWorkouts.some((w) => w.id === workout.id);
  const favoriteWorkouts = exists
    ? prefs.favoriteWorkouts.filter((w) => w.id !== workout.id)
    : [workout, ...prefs.favoriteWorkouts];
  const next = { ...prefs, favoriteWorkouts };
  await saveProfilePrefs(next);
  return next;
};

export const isWorkoutFavorite = (prefs: ProfilePrefs, workoutId: string): boolean =>
  prefs.favoriteWorkouts.some((w) => w.id === workoutId);

const calculateMaintenanceCalories = (
  age?: number,
  weightKg?: number,
  heightCm?: number,
): number | null => {
  if (!age || !weightKg || !heightCm) {
    return null;
  }
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.round(bmr * 1.2);
};

export const initializeDefaultCaloriePlan = async (
  user?: Pick<User, "age" | "weight" | "height"> | null,
): Promise<ProfilePrefs | null> => {
  if (!user) return null;
  const maintenance = calculateMaintenanceCalories(user.age, user.weight, user.height);
  if (!maintenance) return null;

  const prefs = await getProfilePrefs();
  // Keep user's existing target/mode if already configured.
  if (typeof prefs.calorieTarget === "number" && prefs.calorieTarget > 0) {
    return prefs;
  }

  const next: ProfilePrefs = {
    ...prefs,
    calorieMode: "maintenance",
    calorieTarget: maintenance,
  };
  await saveProfilePrefs(next);
  return next;
};
