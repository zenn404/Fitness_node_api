import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { api, Exercise, Workout } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useTranslation } from "react-i18next";

const DELETE_DELAY_MS = 5000;

export default function AdminExercisesScreen() {
  const { t } = useTranslation();
  const { user, token } = useAuthStore();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Exercise | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [difficulty, setDifficulty] = useState<Workout["difficulty"]>("Beginner");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [restSeconds, setRestSeconds] = useState("60");
  const [orderIndex, setOrderIndex] = useState("0");
  const [tutorialUrl, setTutorialUrl] = useState("");

  const resetForm = useCallback(() => {
    setEditingExerciseId(null);
    setName("");
    setDescription("");
    setMuscleGroup("");
    setDifficulty("Beginner");
    setSets("3");
    setReps("10");
    setRestSeconds("60");
    setOrderIndex("0");
    setTutorialUrl("");
  }, []);

  const loadWorkouts = useCallback(async () => {
    const response = await api.getWorkouts();
    if (response.success && response.data) {
      setWorkouts(response.data.workouts);
      setSelectedWorkoutId((current) => current || response.data!.workouts[0]?.id || "");
    }
  }, []);

  const loadExercises = useCallback(async (workoutId: string) => {
    if (!workoutId) {
      setExercises([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const response = await api.getExercises({ workout_id: workoutId });
    if (response.success && response.data) {
      setExercises([...response.data.exercises].sort((a, b) => a.order_index - b.order_index));
    } else {
      Alert.alert(t("admin.unableLoadExercises"), response.message);
      setExercises([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  useEffect(() => {
    if (selectedWorkoutId) {
      loadExercises(selectedWorkoutId);
    }
  }, [loadExercises, selectedWorkoutId]);

  useEffect(() => {
    if (!pendingDelete || !token) {
      return undefined;
    }
    const timeoutId = setTimeout(async () => {
      const exerciseToDelete = pendingDelete;
      setPendingDelete(null);
      const response = await api.deleteExercise(token, exerciseToDelete.id);
      if (!response.success) {
        Alert.alert(t("admin.unableDeleteExercise"), response.message);
      }
      if (editingExerciseId === exerciseToDelete.id) {
        resetForm();
      }
      await loadExercises(selectedWorkoutId);
    }, DELETE_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [editingExerciseId, loadExercises, pendingDelete, resetForm, selectedWorkoutId, token]);

  if (user?.role !== "admin") {
    return null;
  }

  const selectedWorkout = useMemo(
    () => workouts.find((workout) => workout.id === selectedWorkoutId) || null,
    [selectedWorkoutId, workouts],
  );

  const handleSubmit = async () => {
    if (!token || !selectedWorkoutId) return;
    if (!name.trim() || !muscleGroup.trim()) {
      Alert.alert(t("admin.missingFields"), t("admin.exerciseMissingFields"));
      return;
    }

    setIsSaving(true);
    const payload = {
      workout_id: selectedWorkoutId,
      name: name.trim(),
      description: description.trim() || undefined,
      muscle_group: muscleGroup.trim(),
      difficulty,
      sets: Number(sets),
      reps: Number(reps),
      rest_seconds: Number(restSeconds),
      order_index: Number(orderIndex),
      tutorial_url: tutorialUrl.trim() || undefined,
    };
    const response = editingExerciseId
      ? await api.updateExercise(token, editingExerciseId, payload)
      : await api.createExercise(token, payload);
    setIsSaving(false);

    if (!response.success) {
      Alert.alert(t("admin.unableSaveExercise"), response.message);
      return;
    }

    resetForm();
    await loadExercises(selectedWorkoutId);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        <AdminHeader title={t("admin.exercises")} colors={colors} />

        {pendingDelete ? (
          <UndoNotice
            title={t("admin.exerciseQueuedDelete")}
            description={t("admin.deleteExerciseInSeconds", { name: pendingDelete.name })}
            onUndo={() => setPendingDelete(null)}
            colors={colors}
          />
        ) : null}

        <Box className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Heading size="md" style={{ color: colors.text }}>{t("admin.pickWorkout")}</Heading>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 16 }}>
            {workouts.map((workout) => {
              const active = workout.id === selectedWorkoutId;
              return (
                <Button
                  key={workout.id}
                  variant={active ? "solid" : "outline"}
                  action="primary"
                  size="sm"
                  onPress={() => setSelectedWorkoutId(workout.id)}
                  style={active ? { backgroundColor: colors.accent } : undefined}
                >
                  <ButtonText style={active ? { color: colors.accentText } : undefined}>
                    {workout.name}
                  </ButtonText>
                </Button>
              );
            })}
          </ScrollView>
        </Box>

        <Box className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <HStack className="items-center justify-between">
            <Heading size="md" style={{ color: colors.text }}>
              {editingExerciseId ? t("admin.editExercise") : t("admin.addExercise")}
            </Heading>
            {editingExerciseId ? (
              <Button variant="outline" action="secondary" size="sm" onPress={resetForm}>
                <ButtonText>{t("admin.cancel")}</ButtonText>
              </Button>
            ) : null}
          </HStack>
          <Text className="mt-2" style={{ color: colors.textMuted }}>
            {selectedWorkout ? t("admin.managingExercisesFor", { name: selectedWorkout.name }) : t("admin.selectWorkoutFirst")}
          </Text>

          {selectedWorkout ? (
            <VStack space="sm" className="mt-4">
              <TextInputBlock value={name} onChangeText={setName} placeholder={t("admin.exerciseName")} colors={colors} />
              <TextInputBlock value={description} onChangeText={setDescription} placeholder={t("admin.exerciseDescription")} colors={colors} />
              <TextInputBlock value={muscleGroup} onChangeText={setMuscleGroup} placeholder={t("admin.muscleGroup")} colors={colors} />
              <DifficultyPicker value={difficulty} onChange={setDifficulty} colors={colors} />
              <HStack space="sm">
                <TextInputBlock value={sets} onChangeText={setSets} placeholder={t("admin.sets")} keyboardType="numeric" colors={colors} className="flex-1" />
                <TextInputBlock value={reps} onChangeText={setReps} placeholder={t("admin.reps")} keyboardType="numeric" colors={colors} className="flex-1" />
              </HStack>
              <HStack space="sm">
                <TextInputBlock value={restSeconds} onChangeText={setRestSeconds} placeholder={t("admin.restSec")} keyboardType="numeric" colors={colors} className="flex-1" />
                <TextInputBlock value={orderIndex} onChangeText={setOrderIndex} placeholder={t("admin.order")} keyboardType="numeric" colors={colors} className="flex-1" />
              </HStack>
              <TextInputBlock value={tutorialUrl} onChangeText={setTutorialUrl} placeholder={t("admin.tutorialUrl")} colors={colors} />
              <Button onPress={handleSubmit} disabled={isSaving} style={{ backgroundColor: colors.accent }}>
                {isSaving ? <ButtonSpinner color={colors.accentText} /> : <ButtonText style={{ color: colors.accentText }}>{editingExerciseId ? t("admin.saveExercise") : t("admin.addExercise")}</ButtonText>}
              </Button>
            </VStack>
          ) : null}
        </Box>

        <VStack space="md">
          {isLoading ? (
            <AdminInfoCard title={t("admin.loadingExercises")} colors={colors} />
          ) : (
            exercises.map((exercise) => (
              <Box key={exercise.id} className="rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <HStack className="items-start justify-between">
                  <VStack className="flex-1 pr-3">
                    <Heading size="md" style={{ color: colors.text }}>{exercise.order_index + 1}. {exercise.name}</Heading>
                    <Text className="mt-1" style={{ color: colors.textMuted }}>{exercise.description || t("admin.noDescriptionYet")}</Text>
                    <Text className="mt-2 text-xs" style={{ color: colors.textSubtle }}>{exercise.muscle_group} • {exercise.sets} {t("common.sets")} • {exercise.reps} {t("common.reps")} • {exercise.rest_seconds}s {t("common.rest")}</Text>
                  </VStack>
                  <VStack space="sm">
                    <Button variant="outline" action="primary" size="sm" onPress={() => {
                      setEditingExerciseId(exercise.id);
                      setName(exercise.name);
                      setDescription(exercise.description || "");
                      setMuscleGroup(exercise.muscle_group);
                      setDifficulty(exercise.difficulty);
                      setSets(String(exercise.sets));
                      setReps(String(exercise.reps));
                      setRestSeconds(String(exercise.rest_seconds));
                      setOrderIndex(String(exercise.order_index));
                      setTutorialUrl(exercise.tutorial_url || "");
                    }}>
                      <ButtonText>{t("admin.edit")}</ButtonText>
                    </Button>
                    <Button action="negative" size="sm" onPress={() => setPendingDelete(exercise)}>
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
