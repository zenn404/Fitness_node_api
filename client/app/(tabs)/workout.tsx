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
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { scoreWorkoutForGoal, sortWorkoutsForGoal } from "@/lib/goal-recommendations";
import { getThemePalette } from "@/lib/theme-palette";
import { api, Workout } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useTranslation } from "react-i18next";

type DifficultyType = "All" | "Beginner" | "Intermediate" | "Advanced";

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterWorkouts = () => {
    const normalized = searchQuery.trim().toLowerCase();
    const goalSorted = sortWorkoutsForGoal(workouts, user?.goals).filter((workout) => {
      if (selectedDifficulty !== "All" && workout.difficulty !== selectedDifficulty) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return (
        workout.name.toLowerCase().includes(normalized) ||
        (workout.description || "").toLowerCase().includes(normalized) ||
        workout.difficulty.toLowerCase().includes(normalized)
      );
    });
    setFilteredWorkouts(goalSorted);
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    filterWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDifficulty, workouts, user?.goals, searchQuery]);

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
        setError(response.message || t("workout.failedToLoad"));
      }
    } catch (err) {
      setError(t("common.networkError"));
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <VStack className="mt-4 mb-6">
          <Heading size="2xl" style={{ color: colors.text }}>{t("workout.title")}</Heading>
          <Text className="mt-1" style={{ color: colors.textMuted }}>
            {!isLoading &&
              t("workout.workoutsAvailable", { count: workouts.length })}
          </Text>
          {user?.goals && (
            <Text className="text-xs mt-1" style={{ color: colors.accent }}>
              {t("workout.recommendedByGoal")}
            </Text>
          )}
        </VStack>

        {!isLoading && workouts.length > 0 && (
          <Box className="mb-4">
            <Input size="lg" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
              <InputField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search workouts by name, difficulty..."
                autoCapitalize="none"
              />
            </Input>
          </Box>
        )}

        {!isLoading && workouts.length > 0 && (
          <Box className="mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <DifficultyChip
                label={t("workout.all")}
                isActive={selectedDifficulty === "All"}
                onPress={() => setSelectedDifficulty("All")}
              />
              <DifficultyChip
                label={t("workout.beginner")}
                isActive={selectedDifficulty === "Beginner"}
                onPress={() => setSelectedDifficulty("Beginner")}
              />
              <DifficultyChip
                label={t("workout.intermediate")}
                isActive={selectedDifficulty === "Intermediate"}
                onPress={() => setSelectedDifficulty("Intermediate")}
              />
              <DifficultyChip
                label={t("workout.advanced")}
                isActive={selectedDifficulty === "Advanced"}
                onPress={() => setSelectedDifficulty("Advanced")}
              />
            </ScrollView>
          </Box>
        )}

        {isLoading && (
          <Box className="justify-center items-center py-20">
            <ActivityIndicator size="large" color={colors.accent} />
            <Text className="mt-4" style={{ color: colors.textMuted }}>{t("workout.loadingWorkouts")}</Text>
          </Box>
        )}

        {error && !isLoading && (
          <Box
            className="p-4 border rounded-xl"
            style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger }}
          >
            <Text className="text-center mb-3" style={{ color: colors.danger }}>{error}</Text>
            <Pressable
              onPress={handleRetry}
              className="self-center px-6 py-3 rounded-lg active:opacity-80"
              style={{ backgroundColor: colors.danger }}
            >
              <Text className="font-semibold" style={{ color: "#fff" }}>{t("common.tryAgain")}</Text>
            </Pressable>
          </Box>
        )}

        {!isLoading && !error && filteredWorkouts.length === 0 && (
          <Box className="justify-center items-center py-20">
            <MaterialIcons name="fitness-center" size={64} color={colors.icon} />
            <Text className="mt-4 text-center" style={{ color: colors.textMuted }}>
              {searchQuery.trim().length > 0
                ? `No workouts match "${searchQuery.trim()}".`
                : selectedDifficulty === "All"
                ? t("workout.noWorkoutsFound")
                : t("workout.noLevelWorkoutsFound", {
                    level: t(`workout.${selectedDifficulty.toLowerCase()}`),
                  })}
            </Text>
            {(selectedDifficulty !== "All" || searchQuery.trim().length > 0) && (
              <Pressable
                onPress={() => {
                  setSelectedDifficulty("All");
                  setSearchQuery("");
                }}
                className="mt-3 px-4 py-2 rounded-lg"
                style={{ backgroundColor: colors.surfaceAlt }}
              >
                <Text style={{ color: colors.accent }}>Show all workouts</Text>
              </Pressable>
            )}
          </Box>
        )}

        {!isLoading && !error && filteredWorkouts.length > 0 && (
          <VStack space="md">
            {filteredWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                isRecommended={scoreWorkoutForGoal(workout, user?.goals) > 0}
              />
            ))}
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DifficultyChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  return (
    <RNPressable
      onPress={onPress}
      className="px-4 py-2 rounded-full border"
      style={{
        backgroundColor: isActive ? colors.accent : colors.surface,
        borderColor: isActive ? colors.accent : colors.border,
      }}
    >
      <Text
        className="font-semibold"
        style={{ color: isActive ? colors.accentText : colors.textMuted }}
      >
        {label}
      </Text>
    </RNPressable>
  );
}
