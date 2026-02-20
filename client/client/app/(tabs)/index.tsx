import React, { useEffect, useState } from "react";
import { ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { useAuthStore } from "@/store/auth-store";
import { api, DashboardStats, Activity } from "@/services/api";

export default function HomeScreen() {
  const { user, token } = useAuthStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = user?.name?.split(" ")[0] || "User";

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [statsResponse, activityResponse] = await Promise.all([
        api.getDashboardStats(token),
        api.getRecentActivity(token, 5),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (activityResponse.success && activityResponse.data) {
        setActivities(activityResponse.data.activities);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
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
          </Box>
        )}

        <Pressable className="bg-primary-500 mb-6 p-4 rounded-2xl">
          <HStack className="justify-center items-center" space="sm">
            <MaterialIcons name="play-arrow" size={28} color="#1f2937" />
            <Text className="font-bold text-gray-900 text-lg">
              Start Quick Workout
            </Text>
          </HStack>
        </Pressable>

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