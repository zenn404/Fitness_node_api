import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable as RNPressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getDifficultyColor } from "@/lib/utils";
import { api, Workout } from "@/services/api";

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (id) {
      fetchWorkoutDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchWorkoutDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getWorkout(id as string);

      if (response.success && response.data) {
        setWorkout(response.data.workout);
      } else {
        setError(response.message || "Failed to load workout details");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Fetch workout details error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    fetchWorkoutDetails();
  };

  const handleStartWorkout = () => {
    if (workout) {
      router.push({
        pathname: "/workout-session",
        params: { workout: JSON.stringify(workout) },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header with Back Button */}
        <HStack className="px-4 py-3 items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 p-2 active:opacity-70"
          >
            <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
          </Pressable>
          <Heading size="lg" className="flex-1">
            Workout Details
          </Heading>
        </HStack>

        {/* Loading State */}
        {isLoading && (
          <Box className="justify-center items-center py-20">
            <ActivityIndicator size="large" color="#C0EB6A" />
            <Text className="mt-4 text-gray-400">Loading workout...</Text>
          </Box>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Box className="mx-4 mt-6 bg-red-900/30 p-4 border border-red-500 rounded-xl">
            <Text className="text-red-400 text-center mb-3">{error}</Text>
            <Pressable
              onPress={handleRetry}
              className="self-center bg-red-500 px-6 py-3 rounded-lg active:opacity-80"
            >
              <Text className="font-semibold text-white">Try Again</Text>
            </Pressable>
          </Box>
        )}

        {/* Workout Content */}
        {!isLoading && !error && workout && (
          <VStack className="px-4 mt-4" space="lg">
            {/* Workout Header Card */}
            <Box className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 border border-gray-700 rounded-3xl">
              <VStack space="md">
                {/* Title and Difficulty */}
                <VStack space="sm">
                  <Heading size="2xl">{workout.name}</Heading>
                  <HStack className="items-center" space="xs">
                    <Box
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${getDifficultyColor(workout.difficulty)}20`,
                      }}
                    >
                      <Text
                        className="font-semibold text-sm"
                        style={{
                          color: getDifficultyColor(workout.difficulty),
                        }}
                      >
                        {workout.difficulty}
                      </Text>
                    </Box>
                  </HStack>
                </VStack>

                {/* Stats Row */}
                <HStack className="mt-2" space="lg">
                  {/* Duration */}
                  <HStack space="xs" className="items-center">
                    <MaterialIcons name="schedule" size={20} color="#9ca3af" />
                    <Text className="text-gray-300 font-medium">
                      {workout.duration_minutes
                        ? `${workout.duration_minutes} min`
                        : "-- min"}
                    </Text>
                  </HStack>

                  {/* Exercise count */}
                  <HStack space="xs" className="items-center">
                    <MaterialIcons
                      name="fitness-center"
                      size={20}
                      color="#9ca3af"
                    />
                    <Text className="text-gray-300 font-medium">
                      {workout.exercises?.length || 0} exercise
                      {workout.exercises?.length !== 1 ? "s" : ""}
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </Box>

            {/* Description Section */}
            {workout.description && (
              <Box className="bg-gray-900 p-5 border border-gray-800 rounded-2xl">
                <Heading size="sm" className="mb-3 text-gray-200">
                  About
                </Heading>
                <Text className="text-gray-400 leading-6">
                  {workout.description}
                </Text>
              </Box>
            )}

            {/* Exercises Section */}
            <Box className="bg-gray-900 p-5 border border-gray-800 rounded-2xl">
              <Heading size="sm" className="mb-4 text-gray-200">
                Exercises
              </Heading>

              {workout.exercises && workout.exercises.length > 0 ? (
                <VStack space="sm">
                  {workout.exercises.map((exercise, index) => (
                    <Box
                      key={exercise.id}
                      className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50"
                    >
                      <HStack className="justify-between items-start">
                        <VStack className="flex-1 mr-3">
                          {/* Exercise number and name */}
                          <HStack className="items-center mb-2" space="xs">
                            <Box className="bg-primary-500 w-6 h-6 rounded-full items-center justify-center">
                              <Text className="text-white font-bold text-xs">
                                {index + 1}
                              </Text>
                            </Box>
                            <Heading size="sm" className="text-white">
                              {exercise.name}
                            </Heading>
                          </HStack>

                          {/* Exercise details */}
                          <HStack space="md" className="flex-wrap">
                            <HStack space="xs" className="items-center">
                              <MaterialIcons
                                name="repeat"
                                size={16}
                                color="#9ca3af"
                              />
                              <Text className="text-gray-400 text-sm">
                                {exercise.sets} sets × {exercise.reps} reps
                              </Text>
                            </HStack>
                            <HStack space="xs" className="items-center">
                              <MaterialIcons
                                name="timer"
                                size={16}
                                color="#9ca3af"
                              />
                              <Text className="text-gray-400 text-sm">
                                {exercise.rest_seconds}s rest
                              </Text>
                            </HStack>
                          </HStack>

                          {/* Muscle group */}
                          <Text className="text-gray-500 text-xs uppercase tracking-wide">
                            {exercise.muscle_group}
                          </Text>
                        </VStack>

                        {/* Exercise icon */}
                        <Box className="bg-gray-700/50 p-2 rounded-lg">
                          <MaterialIcons
                            name="fitness-center"
                            size={20}
                            color="#9ca3af"
                          />
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Box className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                  <HStack className="justify-between items-center">
                    <VStack className="flex-1">
                      <Text className="text-gray-400 text-sm">
                        No exercises added yet
                      </Text>
                      <Text className="text-gray-500 text-xs mt-1">
                        Exercises will appear here when added
                      </Text>
                    </VStack>
                    <MaterialIcons
                      name="info-outline"
                      size={24}
                      color="#6b7280"
                    />
                  </HStack>
                </Box>
              )}
            </Box>
          </VStack>
        )}

        {/* Empty State - Workout Not Found */}
        {!isLoading && !error && !workout && (
          <Box className="justify-center items-center py-20 px-4">
            <MaterialIcons name="search-off" size={64} color="#6b7280" />
            <Text className="mt-4 text-gray-400 text-center">
              Workout not found
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="mt-4 px-6 py-3 bg-gray-800 rounded-lg"
            >
              <Text className="text-primary-500 font-semibold">Go Back</Text>
            </Pressable>
          </Box>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Button */}
      {!isLoading && !error && workout && (
        <Box className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent pt-6">
          <RNPressable
            onPress={handleStartWorkout}
            className="bg-primary-500 py-4 rounded-2xl active:opacity-90 shadow-lg"
          >
            <HStack className="justify-center items-center" space="sm">
              <MaterialIcons name="play-arrow" size={28} color="#1f2937" />
              <Text className="font-bold text-lg text-gray-900">
                Start Workout
              </Text>
            </HStack>
          </RNPressable>
        </Box>
      )}
    </SafeAreaView>
  );
}