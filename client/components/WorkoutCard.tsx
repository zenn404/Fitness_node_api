import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Pressable as RNPressable } from "react-native";

import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getDifficultyColor } from "@/lib/utils";
import { getProfilePrefs, isWorkoutFavorite, toggleFavoriteWorkout } from "@/lib/profile-prefs";
import { Workout } from "@/services/api";
import { useTranslation } from "react-i18next";

interface WorkoutCardProps {
  workout: Workout;
  isRecommended?: boolean;
}

export function WorkoutCard({ workout, isRecommended = false }: WorkoutCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const difficultyKey =
    workout.difficulty === "Beginner"
      ? "workout.beginner"
      : workout.difficulty === "Intermediate"
        ? "workout.intermediate"
        : workout.difficulty === "Advanced"
          ? "workout.advanced"
          : null;

  const syncFavoriteStatus = async () => {
    const prefs = await getProfilePrefs();
    setIsFavorite(isWorkoutFavorite(prefs, workout.id));
  };

  useEffect(() => {
    syncFavoriteStatus();
  }, [workout.id]);

  useFocusEffect(
    useCallback(() => {
      syncFavoriteStatus();
    }, [workout.id]),
  );

  const handlePress = () => {
    router.push({
      pathname: "/workout-detail",
      params: { id: workout.id, workout: JSON.stringify(workout) },
    });
  };

  const handleToggleFavorite = async () => {
    const next = await toggleFavoriteWorkout({
      id: workout.id,
      name: workout.name,
      difficulty: workout.difficulty,
      duration_minutes: workout.duration_minutes,
    });
    setIsFavorite(isWorkoutFavorite(next, workout.id));
  };

  return (
    <Box className="bg-gray-900 p-4 border border-gray-800 rounded-2xl active:opacity-90">
      {/* Header Row */}
      <HStack className="justify-between items-start mb-2">
        <VStack className="flex-1 mr-3">
          <Heading size="md" className="mb-1 text-white">
            {workout.name}
          </Heading>
          {isRecommended && (
            <Text className="text-primary-500 text-xs font-semibold mb-1">
              {t("workout.recommendedTag")}
            </Text>
          )}
          <Text
            style={{ color: getDifficultyColor(workout.difficulty) }}
            className="font-medium text-sm"
          >
            {difficultyKey ? t(difficultyKey) : workout.difficulty}
          </Text>
        </VStack>
        <RNPressable
          onPress={handleToggleFavorite}
          className="bg-gray-800 p-2 rounded-xl active:opacity-80"
        >
          <MaterialIcons
            name={isFavorite ? "favorite" : "favorite-border"}
            size={24}
            color={isFavorite ? "#ef4444" : "#9ca3af"}
          />
        </RNPressable>
      </HStack>

      {/* Description */}
      {workout.description && (
        <Text className="mb-3 text-gray-400 text-sm" numberOfLines={2}>
          {workout.description}
        </Text>
      )}

      {/* Footer Row */}
      <HStack className="justify-between items-center">
        {/* Duration */}
        <HStack space="xs" className="items-center">
          <MaterialIcons name="schedule" size={16} color="#9ca3af" />
          <Text className="text-gray-400 text-sm">
            {workout.duration_minutes
              ? `${workout.duration_minutes} ${t("common.min")}`
              : `-- ${t("common.min")}`}
          </Text>
        </HStack>

        {/* Start Button */}
        <RNPressable
          onPress={handlePress}
          className="bg-primary-500 px-5 py-2 rounded-full active:opacity-80"
        >
          <Text className="font-bold text-gray-900">{t("common.start")}</Text>
        </RNPressable>
      </HStack>
    </Box>
  );
}
