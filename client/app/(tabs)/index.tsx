import React, { useEffect, useState } from "react";
import { ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { api, DashboardStats, Activity, DailyLog } from "@/services/api";

const toLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const calculateMaintenanceCalories = (
  age?: number,
  weightKg?: number,
  heightCm?: number,
) => {
  if (!age || !weightKg || !heightCm) {
    return null;
  }

  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  return Math.round(bmr * 1.2);
};

const getWorkoutAchievement = (totalWorkouts: number) => {
  if (totalWorkouts > 15) {
    return { label: "Gold Medal", icon: "🥇", color: "#facc15" };
  }
  if (totalWorkouts > 10) {
    return { label: "Silver Medal", icon: "🥈", color: "#d1d5db" };
  }
  if (totalWorkouts > 5) {
    return { label: "Bronze Medal", icon: "🥉", color: "#d97706" };
  }
  return { label: "No Medal Yet", icon: "🏅", color: "#6b7280" };
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [foodLogs, setFoodLogs] = useState<DailyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = user?.name?.split(" ")[0] || "User";
  const maintenanceCalories = calculateMaintenanceCalories(
    user?.age,
    user?.weight,
    user?.height,
  );
  const todayWorkoutCount = stats?.today.workouts || 0;
  const achievement = getWorkoutAchievement(todayWorkoutCount);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const today = toLocalDateString(new Date());
      const [statsResponse, activityResponse, logsResponse] = await Promise.all([
        api.getDashboardStats(token),
        api.getRecentActivity(token, 5),
        api.getDailyLogs(today),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (activityResponse.success && activityResponse.data) {
        setActivities(activityResponse.data.activities);
      }

      if (logsResponse.success && logsResponse.data) {
        setFoodLogs(logsResponse.data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleQuickWorkout = () => {
    router.push("/(tabs)/workout");
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#C0EB6A"
            colors={["#C0EB6A"]}
          />
        }
      >
        <VStack className="mt-4 mb-6">
          <Text className="text-gray-400">Welcome back,</Text>
          <Heading size="2xl">{firstName} 👋</Heading>
        </VStack>

        {isLoading && (
          <Box className="justify-center items-center py-10">
            <ActivityIndicator size="large" color="#C0EB6A" />
          </Box>
        )}

        {!isLoading && (
          <Box className="bg-gray-900 mb-6 p-4 border border-gray-800 rounded-2xl">
            <Text className="mb-3 text-gray-400">Today's Progress</Text>
            <HStack space="md">
              <VStack className="flex-1 items-center bg-gray-800 p-3 rounded-xl">
                <MaterialIcons
                  name="fitness-center"
                  size={24}
                  color="#C0EB6A"
                />
                <Text className="mt-1 font-bold text-lg">
                  {stats?.today.workouts || 0}
                </Text>
                <Text className="text-gray-400 text-xs">Workouts</Text>
              </VStack>

              <VStack className="flex-1 items-center bg-gray-800 p-3 rounded-xl">
                <MaterialIcons
                  name="local-fire-department"
                  size={24}
                  color="#f97316"
                />
                <Text className="mt-1 font-bold text-lg">
                  {stats?.today.calories || 0}
                </Text>
                <Text className="text-gray-400 text-xs">Calories</Text>
              </VStack>

              <VStack className="flex-1 items-center bg-gray-800 p-3 rounded-xl">
                <MaterialIcons name="schedule" size={24} color="#3b82f6" />
                <Text className="mt-1 font-bold text-lg">
                  {stats?.today.minutes || 0}
                </Text>
                <Text className="text-gray-400 text-xs">Minutes</Text>
              </VStack>
            </HStack>

            <HStack className="mt-4 items-center justify-between bg-gray-800 p-3 rounded-xl">
              <VStack>
                <Text className="text-gray-400 text-xs">Achievement</Text>
                <Text className="font-semibold" style={{ color: achievement.color }}>
                  {achievement.label}
                </Text>
                <Text className="text-gray-500 text-xs">
                  Based on workouts today ({todayWorkoutCount}).
                </Text>
              </VStack>
              <Text className="text-2xl">{achievement.icon}</Text>
            </HStack>
          </Box>
        )}

        <Pressable className="bg-primary-500 mb-6 p-4 rounded-2xl" onPress={handleQuickWorkout}>
          <HStack className="justify-center items-center" space="sm">
            <MaterialIcons name="play-arrow" size={28} color="#1f2937" />
            <Text className="font-bold text-gray-900 text-lg">
              Start Quick Workout
            </Text>
          </HStack>
        </Pressable>

        <Box className="bg-gray-900 mb-6 p-4 border border-gray-800 rounded-2xl">
          <HStack className="items-center justify-between">
            <VStack className="flex-1">
              <Text className="text-gray-400 text-xs">Estimated Maintenance</Text>
              <Heading size="md">
                {maintenanceCalories ? `${maintenanceCalories} kcal/day` : "--"}
              </Heading>
              <Text className="text-gray-500 text-xs">
                Based on your age, weight, and height.
              </Text>
            </VStack>
            <Box className="bg-gray-800 p-3 rounded-xl">
              <MaterialIcons name="monitor-weight" size={22} color="#f59e0b" />
            </Box>
          </HStack>
        </Box>

        <HStack className="justify-between items-center mb-4">
          <Heading size="md">Today's Food Log</Heading>
          <Pressable onPress={() => router.push("/(tabs)/nutrition")}>
            <Text className="text-primary-500">Open Nutrition</Text>
          </Pressable>
        </HStack>

        {!isLoading && foodLogs.length === 0 && (
          <Box className="items-center bg-gray-900 p-6 mb-6 border border-gray-800 rounded-2xl">
            <MaterialIcons name="restaurant" size={36} color="#6b7280" />
            <Text className="mt-2 text-gray-400">No food logged today</Text>
            <Text className="text-gray-500 text-sm">
              Add foods from the Nutrition tab.
            </Text>
          </Box>
        )}

        {!isLoading && foodLogs.length > 0 && (
          <VStack space="sm" className="mb-6">
            {foodLogs.slice(0, 4).map((log) => (
              <Box
                key={log.id}
                className="bg-gray-900 p-4 border border-gray-800 rounded-2xl"
              >
                <HStack className="justify-between items-center">
                  <VStack className="flex-1">
                    <Text className="font-semibold capitalize">{log.name}</Text>
                    <Text className="text-gray-400 text-xs">
                      {Number(log.calories || 0).toFixed(0)} kcal •{" "}
                      {Number(log.serving_size || 0).toFixed(0)} g
                    </Text>
                  </VStack>
                  <MaterialIcons name="check-circle" size={18} color="#34d399" />
                </HStack>
              </Box>
            ))}
          </VStack>
        )}

        <HStack className="justify-between items-center mb-4">
          <Heading size="md">Recent Activity</Heading>
          <Pressable>
            <Text className="text-primary-500">See All</Text>
          </Pressable>
        </HStack>

        {!isLoading && activities.length === 0 && (
          <Box className="items-center bg-gray-900 p-6 border border-gray-800 rounded-2xl">
            <MaterialIcons name="history" size={40} color="#6b7280" />
            <Text className="mt-2 text-gray-400">No recent activity</Text>
            <Text className="text-gray-500 text-sm">
              Start a workout to see it here!
            </Text>
          </Box>
        )}

        {!isLoading && activities.length > 0 && (
          <VStack space="sm">
            {activities.map((activity) => (
              <Pressable key={activity.id}>
                <HStack className="justify-between items-center bg-gray-900 p-4 border border-gray-800 rounded-2xl">
                  <HStack space="md" className="items-center">
                    <Box className="bg-gray-800 p-3 rounded-xl">
                      <MaterialIcons
                        name="fitness-center"
                        size={24}
                        color="#9ca3af"
                      />
                    </Box>
                    <VStack>
                      <Text className="font-semibold">{activity.title}</Text>
                      <Text className="text-gray-400 text-sm">
                        {activity.duration || "--"} • {activity.calories || 0}{" "}
                        kcal
                      </Text>
                    </VStack>
                  </HStack>

                  <Text className="text-gray-500 text-sm">{activity.date}</Text>
                </HStack>
              </Pressable>
            ))}
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
