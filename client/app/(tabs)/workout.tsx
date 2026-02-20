import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  Pressable as RNPressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WorkoutCard } from "@/components/WorkoutCard";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { api, Workout } from "@/services/api";

type DifficultyType = "All" | "Beginner" | "Intermediate" | "Advanced";

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyType>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterWorkouts = () => {
    if (selectedDifficulty === "All") {
      setFilteredWorkouts(workouts);
    } else {
      setFilteredWorkouts(
        workouts.filter((workout) => workout.difficulty === selectedDifficulty),
      );
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    filterWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDifficulty, workouts]);

  const fetchWorkouts = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await api.getWorkouts();

      if (response.success && response.data) {
        setWorkouts(response.data.workouts);
      } else {
        setError(response.message || "Failed to load workouts");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Fetch workouts error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchWorkouts(true);
  };

  const handleRetry = () => {
    fetchWorkouts();
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
        {/* Header */}
        <VStack className="mt-4 mb-6">
          <Heading size="2xl">Workouts 💪</Heading>
          <Text className="text-gray-400 mt-1">
            {!isLoading &&
              `${workouts.length} workout${workouts.length !== 1 ? "s" : ""} available`}
          </Text>
        </VStack>

        {/* Difficulty Filter */}
        {!isLoading && workouts.length > 0 && (
          <Box className="mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <DifficultyChip
                label="All"
                isActive={selectedDifficulty === "All"}
                onPress={() => setSelectedDifficulty("All")}
              />
              <DifficultyChip
                label="Beginner"
                isActive={selectedDifficulty === "Beginner"}
                onPress={() => setSelectedDifficulty("Beginner")}
              />
              <DifficultyChip
                label="Intermediate"
                isActive={selectedDifficulty === "Intermediate"}
                onPress={() => setSelectedDifficulty("Intermediate")}
              />
              <DifficultyChip
                label="Advanced"
                isActive={selectedDifficulty === "Advanced"}
                onPress={() => setSelectedDifficulty("Advanced")}
              />
            </ScrollView>
          </Box>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box className="justify-center items-center py-20">
            <ActivityIndicator size="large" color="#C0EB6A" />
            <Text className="mt-4 text-gray-400">Loading workouts...</Text>
          </Box>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Box className="bg-red-900/30 p-4 border border-red-500 rounded-xl">
            <Text className="text-red-400 text-center mb-3">{error}</Text>
            <Pressable
              onPress={handleRetry}
              className="self-center bg-red-500 px-6 py-3 rounded-lg active:opacity-80"
            >
              <Text className="font-semibold text-white">Try Again</Text>
            </Pressable>
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredWorkouts.length === 0 && (
          <Box className="justify-center items-center py-20">
            <MaterialIcons name="fitness-center" size={64} color="#6b7280" />
            <Text className="mt-4 text-gray-400 text-center">
              {selectedDifficulty === "All"
                ? "No workouts found"
                : `No ${selectedDifficulty.toLowerCase()} workouts found`}
            </Text>
            {selectedDifficulty !== "All" && (
              <Pressable
                onPress={() => setSelectedDifficulty("All")}
                className="mt-3 px-4 py-2 bg-gray-800 rounded-lg"
              >
                <Text className="text-primary-500">Show All Workouts</Text>
              </Pressable>
            )}
          </Box>
        )}

        {/* Workout List */}
        {!isLoading && !error && filteredWorkouts.length > 0 && (
          <VStack space="md">
            {filteredWorkouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Difficulty Filter Chip Component
function DifficultyChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <RNPressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full ${
        isActive ? "bg-primary-500" : "bg-gray-800 border border-gray-700"
      }`}
    >
      <Text
        className={`font-semibold ${
          isActive ? "text-gray-900" : "text-gray-400"
        }`}
      >
        {label}
      </Text>
    </RNPressable>
  );
}