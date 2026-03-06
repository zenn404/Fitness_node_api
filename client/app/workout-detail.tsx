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
import { SectionCard } from "@/components/app/design";
import { getThemePalette } from "@/lib/theme-palette";
import { getDifficultyColor } from "@/lib/utils";
import { api, Workout } from "@/services/api";
import { useThemeStore } from "@/store/theme-store";
import { useTranslation } from "react-i18next";

export default function WorkoutDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  const params = useLocalSearchParams<{ id: string; workout?: string }>();
  const { id, workout: workoutParam } = params;
  const initialWorkout = workoutParam
    ? (() => {
        try {
          return JSON.parse(workoutParam) as Workout;
        } catch {
          return undefined;
        }
      })()
    : undefined;

  const [workout, setWorkout] = useState<Workout | undefined>(initialWorkout);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [softError, setSoftError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchWorkoutDetails();
    } else {
      setIsLoading(false);
      if (!initialWorkout) setError(t("workout.workoutNotFound"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchWorkoutDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    setSoftError(null);
    if (initialWorkout) setWorkout(initialWorkout);

    try {
      const response = await api.getWorkout(id);

      if (response.success && response.data) {
        setWorkout(response.data.workout);
      } else {
        if (initialWorkout) {
          setWorkout(initialWorkout);
          setSoftError(t("workout.couldNotLoadExercises"));
        } else {
          setError(response.message || t("workout.failedToLoadWorkoutDetails"));
        }
      }
    } catch (err) {
      if (initialWorkout) {
        setWorkout(initialWorkout);
        setSoftError(t("workout.couldNotLoadFullDetails"));
      } else {
        setError(t("common.networkError"));
      }
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
    <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header with Back Button */}
        <HStack className="px-5 py-3 items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 p-2 active:opacity-70"
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Heading size="lg" className="flex-1" style={{ color: colors.text }}>
            {t("workout.workoutDetails")}
          </Heading>
        </HStack>

        {/* Loading State */}
        {isLoading && (
          <Box className="justify-center items-center py-20">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="mt-4" style={{ color: colors.textMuted }}>{t("workout.loadingWorkout")}</Text>
          </Box>
        )}

        {/* Error State - no workout to show */}
        {error && !isLoading && !workout && (
          <Box className="mx-4 mt-6 bg-red-900/30 p-4 border border-red-500 rounded-xl">
            <Text className="text-red-400 text-center mb-3">{error}</Text>
            <Pressable
              onPress={handleRetry}
              className="self-center bg-red-500 px-6 py-3 rounded-lg active:opacity-80"
            >
              <Text className="font-semibold text-white">{t("common.tryAgain")}</Text>
            </Pressable>
          </Box>
        )}

        {/* Workout Content */}
        {!isLoading && workout && (
          <VStack className="px-4 mt-4" space="lg">
            {/* Workout Header Card */}
            <SectionCard className="p-6">
              <VStack space="md">
                {/* Title and Difficulty */}
                <VStack space="sm">
                  <Heading size="2xl" style={{ color: colors.text }}>{workout.name}</Heading>
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
                    <MaterialIcons name="schedule" size={20} color={colors.icon} />
                      <Text className="font-medium" style={{ color: colors.textMuted }}>
                        {workout.duration_minutes
                        ? `${workout.duration_minutes} ${t("common.min")}`
                        : `-- ${t("common.min")}`}
                      </Text>
                  </HStack>

                  {/* Exercise count */}
                  <HStack space="xs" className="items-center">
                    <MaterialIcons
                      name="fitness-center"
                      size={20}
                      color={colors.icon}
                    />
                    <Text className="font-medium" style={{ color: colors.textMuted }}>
                      {t("workout.exerciseCount", {
                        count: workout.exercises?.length || 0,
                      })}
                    </Text>
                  </HStack>
                </HStack>
              </VStack>
            </SectionCard>

            {/* Description Section */}
            {workout.description && (
              <SectionCard className="p-5">
                <Heading size="sm" className="mb-3" style={{ color: colors.text }}>
                  {t("workout.about")}
                </Heading>
                <Text className="leading-6" style={{ color: colors.textMuted }}>
                  {workout.description}
                </Text>
              </SectionCard>
            )}

            {/* Exercises Section */}
            <SectionCard className="p-5">
              <Heading size="sm" className="mb-4" style={{ color: colors.text }}>
                {t("workout.exercises")}
              </Heading>

              {workout.exercises && workout.exercises.length > 0 ? (
                <VStack space="sm">
                  {workout.exercises.map((exercise, index) => (
                    <Box
                      key={exercise.id}
                      className="p-4 rounded-xl border"
                      style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
                    >
                      <HStack className="justify-between items-start">
                        <VStack className="flex-1 mr-3">
                          {/* Exercise number and name */}
                          <HStack className="items-center mb-2" space="xs">
                            <Box className="bg-primary-500 w-6 h-6 rounded-full items-center justify-center">
                              <Text className="font-bold text-xs" style={{ color: colors.accentText }}>
                                {index + 1}
                              </Text>
                            </Box>
                            <Heading size="sm" style={{ color: colors.text }}>
                              {exercise.name}
                            </Heading>
                          </HStack>

                          {/* Exercise details */}
                          <HStack space="md" className="flex-wrap">
                            <HStack space="xs" className="items-center">
                              <MaterialIcons
                                name="repeat"
                                size={16}
                                color={colors.icon}
                              />
                              <Text className="text-sm" style={{ color: colors.textMuted }}>
                                {t("workout.setsReps", {
                                  sets: exercise.sets,
                                  reps: exercise.reps,
                                })}
                              </Text>
                            </HStack>
                            <HStack space="xs" className="items-center">
                              <MaterialIcons
                                name="timer"
                                size={16}
                                color={colors.icon}
                              />
                              <Text className="text-sm" style={{ color: colors.textMuted }}>
                                {t("workout.restSeconds", {
                                  seconds: exercise.rest_seconds,
                                })}
                              </Text>
                            </HStack>
                          </HStack>

                          {/* Muscle group */}
                          <Text className="text-xs uppercase tracking-wide" style={{ color: colors.textSubtle }}>
                            {exercise.muscle_group}
                          </Text>
                        </VStack>

                        {/* Exercise icon */}
                        <Box className="p-2 rounded-lg" style={{ backgroundColor: colors.surface }}>
                          <MaterialIcons
                            name="fitness-center"
                            size={20}
                            color={colors.icon}
                          />
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Box className="p-4 rounded-xl border" style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}>
                  <HStack className="justify-between items-center">
                    <VStack className="flex-1">
                      <Text className="text-sm" style={{ color: colors.textMuted }}>
                        {t("workout.noExercisesAdded")}
                      </Text>
                      <Text className="text-xs mt-1" style={{ color: colors.textSubtle }}>
                        {t("workout.exercisesWillAppear")}
                      </Text>
                    </VStack>
                    <MaterialIcons
                      name="info-outline"
                      size={24}
                      color={colors.icon}
                    />
                  </HStack>
                </Box>
              )}
            </SectionCard>
          </VStack>
        )}

        {/* Empty State - Workout Not Found */}
        {!isLoading && !error && !workout && (
          <Box className="justify-center items-center py-20 px-4">
            <MaterialIcons name="search-off" size={64} color={colors.icon} />
            <Text className="mt-4 text-center" style={{ color: colors.textMuted }}>
              {t("workout.workoutNotFound")}
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="mt-4 px-6 py-3 rounded-lg"
              style={{ backgroundColor: colors.surfaceAlt }}
            >
              <Text className="font-semibold" style={{ color: colors.accent }}>{t("common.goBack")}</Text>
            </Pressable>
          </Box>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Button */}
      {!isLoading && !error && workout && (
        <Box className="absolute bottom-0 left-0 right-0 p-4 pt-6" style={{ backgroundColor: colors.background }}>
          <RNPressable
            onPress={handleStartWorkout}
            className="py-4 rounded-2xl active:opacity-90 shadow-lg"
            style={{ backgroundColor: colors.accent }}
          >
            <HStack className="justify-center items-center" space="sm">
              <MaterialIcons name="play-arrow" size={28} color={colors.accentText} />
              <Text className="font-bold text-lg" style={{ color: colors.accentText }}>
                {t("workout.startWorkout")}
              </Text>
            </HStack>
          </RNPressable>
        </Box>
      )}
    </SafeAreaView>
  );
}
