const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, any>;
  token?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const { method, body, token } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  // Auth endpoints
  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
  }

  async logout(token: string): Promise<ApiResponse> {
    return this.request("/api/auth/logout", {
      method: "POST",
      token,
    });
  }

  async getProfile(token: string): Promise<ApiResponse<{ user: User }>> {
    return this.request("/api/auth/profile", {
      method: "GET",
      token,
    });
  }

  async updateProfile(
    token: string,
    data: { age?: number; weight?: number; height?: number; goals?: string },
  ): Promise<ApiResponse<{ user: User }>> {
    return this.request("/api/auth/profile", {
      method: "PUT",
      body: data,
      token,
    });
  }

  // Workout endpoints
  async getWorkouts(params?: {
    difficulty?: string;
  }): Promise<ApiResponse<{ workouts: Workout[] }>> {
    const queryParams = new URLSearchParams();
    if (params?.difficulty) queryParams.append("difficulty", params.difficulty);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request(`/api/workouts${query}`, {
      method: "GET",
    });
  }

  async getWorkout(id: string): Promise<ApiResponse<{ workout: Workout }>> {
    return this.request(`/api/workouts/${id}`, {
      method: "GET",
    });
  }

  // Dashboard endpoints
  async getDashboardStats(token: string): Promise<ApiResponse<DashboardStats>> {
    return this.request("/api/dashboard/stats", {
      method: "GET",
      token,
    });
  }

  async getRecentActivity(
    token: string,
    limit?: number,
  ): Promise<ApiResponse<{ activities: Activity[] }>> {
    const query = limit ? `?limit=${limit}` : "";
    return this.request(`/api/dashboard/activity${query}`, {
      method: "GET",
      token,
    });
  }

  async getProgressData(token: string): Promise<ApiResponse<ProgressData>> {
    return this.request("/api/dashboard/progress", {
      method: "GET",
      token,
    });
  }

  // Nutrition endpoints
  async searchNutrition(
    query: string
  ): Promise<ApiResponse<{ items: NutritionItem[] }>> {
    const encoded = encodeURIComponent(query);
    return this.request(`/api/nutrition?query=${encoded}`, {
      method: "GET",
    });
  }

  async getDailyLogs(
    date: string
  ): Promise<ApiResponse<{ logs: DailyLog[] }>> {
    const encoded = encodeURIComponent(date);
    return this.request(`/api/logs?date=${encoded}`, {
      method: "GET",
    });
  }

  async createDailyLog(
    payload: CreateDailyLogPayload
  ): Promise<ApiResponse<{ log: DailyLog }>> {
    return this.request("/api/logs", {
      method: "POST",
      body: payload,
    });
  }

  async deleteDailyLog(id: string): Promise<ApiResponse> {
    return this.request(`/api/logs/${id}`, {
      method: "DELETE",
    });
  }

  // Session endpoints
  async startWorkoutSession(
    token: string,
    workoutId: string,
  ): Promise<ApiResponse<{ session: WorkoutSession }>> {
    return this.request("/api/sessions/start", {
      method: "POST",
      body: { workout_id: workoutId },
      token,
    });
  }

  async completeWorkoutSession(
    token: string,
    sessionId: string,
  ): Promise<ApiResponse<{ session: WorkoutSession }>> {
    return this.request(`/api/sessions/${sessionId}/complete`, {
      method: "PUT",
      token,
    });
  }
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_id: string;
  status: "in_progress" | "completed";
  started_at: string;
  completed_at?: string;
  total_duration_seconds?: number;
  calories_burned?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  weight?: number;
  height?: number;
  goals?: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  description?: string;
  muscle_group: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  sets: number;
  reps: number;
  rest_seconds: number;
  order_index: number;
  notes?: string;
  image_url?: string;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration_minutes?: number;
  created_at: string;
  image_url?: string;
  exercises?: Exercise[];
}

export interface DashboardStats {
  today: {
    workouts: number;
    calories: number;
    minutes: number;
  };
  week: {
    workouts: number;
  };
}

export interface Activity {
  id: string;
  title: string;
  difficulty: string;
  status: string;
  duration: string | null;
  calories: number | null;
  date: string;
}

export interface WeeklyChartItem {
  day: string;
  workouts: number;
  minutes: number;
  calories: number;
}

export interface ProgressData {
  weeklyChart: WeeklyChartItem[];
  totalStats: {
    workouts: number;
    calories: number;
    minutes: number;
  };
}


export interface NutritionItem {
  name: string;
  calories: number;
  serving_size_g: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
  sugar_g: number;
  fiber_g: number;
}

export interface DailyLog {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  serving_size: number;
  log_date: string;
  created_at: string;
}

export interface CreateDailyLogPayload {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  serving_size: number;
  log_date?: string;
}

export const api = new ApiService(API_BASE_URL);
