import { api, User } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  needsOnboarding: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: {
    age?: number;
    weight?: number;
    height?: number;
    goals?: string;
  }) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  needsOnboarding: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.login(email, password);

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Save to storage
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      } else {
        set({
          isLoading: false,
          error: response.message || "Login failed",
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: "An unexpected error occurred",
      });
      return false;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.register(name, email, password);

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Save to storage
        await AsyncStorage.setItem(TOKEN_KEY, token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          needsOnboarding: !user.age || !user.weight || !user.height,
          error: null,
        });

        return true;
      } else {
        set({
          isLoading: false,
          error: response.message || "Registration failed",
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: "An unexpected error occurred",
      });
      return false;
    }
  },

  logout: async () => {
    const { token } = get();

    set({ isLoading: true });

    try {
      if (token) {
        await api.logout(token);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear storage
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });

    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(USER_KEY);

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;

        // Optionally verify token with backend
        const response = await api.getProfile(token);

        if (response.success && response.data) {
          const profileUser = response.data.user;

          set({
            user: profileUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
            needsOnboarding:
              !profileUser.age || !profileUser.weight || !profileUser.height,
          });
        } else {
          // Token is invalid, clear storage
          await AsyncStorage.removeItem(TOKEN_KEY);
          await AsyncStorage.removeItem(USER_KEY);

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      } else {
        set({
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      console.error("Check auth error:", error);
      set({
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  updateProfile: async (data) => {
    const { token } = get();

    if (!token) return false;

    set({ isLoading: true, error: null });

    try {
      const response = await api.updateProfile(token, data);

      if (response.success && response.data) {
        const updatedUser = response.data.user;

        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

        set({
          user: updatedUser,
          isLoading: false,
          needsOnboarding: false,
        });

        return true;
      } else {
        set({
          isLoading: false,
          error: response.message || "Failed to update profile",
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: "An unexpected error occurred",
      });
      return false;
    }
  },
}));