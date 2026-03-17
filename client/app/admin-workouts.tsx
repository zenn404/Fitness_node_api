import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AdminHeader,
  AdminInfoCard,
  DifficultyPicker,
  TextInputBlock,
  UndoNotice,
} from "@/components/admin/admin-ui";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getThemePalette } from "@/lib/theme-palette";
import { api, Workout } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useTranslation } from "react-i18next";

const DELETE_DELAY_MS = 5000;

export default function AdminWorkoutsScreen() {
  const { t } = useTranslation();
  const { user, token } = useAuthStore();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [difficulty, setDifficulty] = useState<Workout["difficulty"]>("Beginner");

  const resetForm = useCallback(() => {
    setEditingWorkoutId(null);
    setName("");
    setDescription("");
    setDurationMinutes("");
    setDifficulty("Beginner");
  }, []);

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    const response = await api.getWorkouts();
    if (response.success && response.data) {
      setWorkouts(response.data.workouts);
    } else {
      Alert.alert(t("admin.unableLoadWorkouts"), response.message);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  useEffect(() => {
    if (!pendingDelete || !token) {
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      const workoutToDelete = pendingDelete;
      setPendingDelete(null);
      const response = await api.deleteWorkout(token, workoutToDelete.id);
      if (!response.success) {
        Alert.alert(t("admin.unableDeleteWorkout"), response.message);
      }
      if (editingWorkoutId === workoutToDelete.id) {
        resetForm();
      }
      await loadWorkouts();
    }, DELETE_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [editingWorkoutId, loadWorkouts, pendingDelete, resetForm, token]);

  if (user?.role !== "admin") {
    return null;
  }

  const handleSubmit = async () => {
    if (!token) return;
    if (!name.trim()) {
      Alert.alert(t("admin.workoutNameRequired"), t("admin.enterWorkoutName"));
      return;
    }

    const parsedDuration = durationMinutes.trim()
      ? Number(durationMinutes.trim())
      : undefined;

    setIsSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      difficulty,
      duration_minutes: parsedDuration,
    };
    const response = editingWorkoutId
      ? await api.updateWorkout(token, editingWorkoutId, payload)
      : await api.createWorkout(token, payload);
    setIsSaving(false);

    if (!response.success) {
      Alert.alert(t("admin.unableSaveWorkout"), response.message);
      return;
    }

    resetForm();
    await loadWorkouts();
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        <AdminHeader title={t("admin.workouts")} colors={colors} />

        {pendingDelete ? (
          <UndoNotice
            title={t("admin.workoutQueuedDelete")}
            description={t("admin.deleteWorkoutInSeconds", { name: pendingDelete.name })}
            onUndo={() => setPendingDelete(null)}
            colors={colors}
          />
        ) : null}

        <Box className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <HStack className="items-center justify-between">
            <Heading size="md" style={{ color: colors.text }}>
              {editingWorkoutId ? t("admin.editWorkout") : t("admin.createWorkout")}
            </Heading>
            {editingWorkoutId ? (
              <Button variant="outline" action="secondary" size="sm" onPress={resetForm}>
                <ButtonText>{t("admin.cancel")}</ButtonText>
              </Button>
            ) : null}
          </HStack>

          <VStack space="sm" className="mt-4">
            <TextInputBlock value={name} onChangeText={setName} placeholder={t("admin.workoutName")} colors={colors} />
            <TextInputBlock value={description} onChangeText={setDescription} placeholder={t("admin.workoutDescription")} colors={colors} />
            <TextInputBlock value={durationMinutes} onChangeText={setDurationMinutes} placeholder={t("admin.durationMinutes")} keyboardType="numeric" colors={colors} />
            <DifficultyPicker value={difficulty} onChange={setDifficulty} colors={colors} />
            <Button onPress={handleSubmit} disabled={isSaving} style={{ backgroundColor: colors.accent }}>
              {isSaving ? <ButtonSpinner color={colors.accentText} /> : <ButtonText style={{ color: colors.accentText }}>{editingWorkoutId ? t("admin.saveWorkout") : t("admin.createWorkout")}</ButtonText>}
            </Button>
          </VStack>
        </Box>

        <VStack space="md">
          {isLoading ? (
            <AdminInfoCard title={t("admin.loadingWorkouts")} colors={colors} />
          ) : (
            workouts.map((workout) => (
              <Box key={workout.id} className="rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <HStack className="items-start justify-between">
                  <VStack className="flex-1 pr-3">
                    <Heading size="md" style={{ color: colors.text }}>{workout.name}</Heading>
                    <Text className="mt-1" style={{ color: colors.textMuted }}>{workout.description || t("admin.noDescriptionYet")}</Text>
                    <Text className="mt-2 text-xs" style={{ color: colors.textSubtle }}>{workout.difficulty} • {workout.duration_minutes || "-"} min</Text>
                  </VStack>
                  <VStack space="sm">
                    <Button variant="outline" action="primary" size="sm" onPress={() => {
                      setEditingWorkoutId(workout.id);
                      setName(workout.name);
                      setDescription(workout.description || "");
                      setDurationMinutes(workout.duration_minutes ? String(workout.duration_minutes) : "");
                      setDifficulty(workout.difficulty);
                    }}>
                      <ButtonText>{t("admin.edit")}</ButtonText>
                    </Button>
                    <Button action="negative" size="sm" onPress={() => setPendingDelete(workout)}>
                      <ButtonText>{t("admin.delete")}</ButtonText>
                    </Button>
                  </VStack>
                </HStack>
              </Box>
            ))
          )}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
