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
import { getThemePalette } from "@/lib/theme-palette";
import { Workout } from "@/services/api";
import { useThemeStore } from "@/store/theme-store";
import { useTranslation } from "react-i18next";

interface WorkoutCardProps {
  workout: Workout;
  isRecommended?: boolean;
}

export function WorkoutCard({ workout, isRecommended = false }: WorkoutCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
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
    <Box
      className="p-4 border rounded-2xl active:opacity-90"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <HStack className="justify-between items-start mb-2">
        <VStack className="flex-1 mr-3">
          <Heading size="md" className="mb-1" style={{ color: colors.text }}>
            {workout.name}
          </Heading>
          {isRecommended && (
            <Text className="text-xs font-semibold mb-1" style={{ color: colors.accent }}>
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
          className="p-2 rounded-xl active:opacity-80"
          style={{ backgroundColor: colors.surfaceAlt }}
        >
          <MaterialIcons
            name={isFavorite ? "favorite" : "favorite-border"}
            size={24}
            color={isFavorite ? colors.danger : colors.icon}
          />
        </RNPressable>
      </HStack>

      {workout.description && (
        <Text className="mb-3 text-sm" numberOfLines={2} style={{ color: colors.textMuted }}>
          {workout.description}
        </Text>
      )}

      <HStack className="justify-between items-center">
        <HStack space="xs" className="items-center">
          <MaterialIcons name="schedule" size={16} color={colors.icon} />
          <Text className="text-sm" style={{ color: colors.textMuted }}>
            {workout.duration_minutes
              ? `${workout.duration_minutes} ${t("common.min")}`
              : `-- ${t("common.min")}`}
          </Text>
        </HStack>

        <RNPressable
          onPress={handlePress}
          className="px-5 py-2 rounded-full active:opacity-80"
          style={{ backgroundColor: colors.accent }}
        >
          <Text className="font-bold" style={{ color: colors.accentText }}>
            {t("common.start")}
          </Text>
        </RNPressable>
      </HStack>
    </Box>
  );
}
