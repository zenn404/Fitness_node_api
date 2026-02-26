import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type SetEntry = {
  id: string;
  reps: number;
  completed: boolean;
};

type ExerciseEntry = {
  id: string;
  name: string;
  muscleGroup: string;
  restSeconds: number;
  sets: SetEntry[];
};

const createSet = (reps: number): SetEntry => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  reps,
  completed: false,
});

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function WorkoutScreen() {
  const [workoutName, setWorkoutName] = useState("Strong Session");
  const [exerciseName, setExerciseName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [setCount, setSetCount] = useState("3");
  const [repCount, setRepCount] = useState("10");
  const [restSeconds, setRestSeconds] = useState("60");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [activeRest, setActiveRest] = useState<number | null>(null);
  const [restRunning, setRestRunning] = useState(false);

  useEffect(() => {
    if (!restRunning || activeRest === null) return;

    const timer = setInterval(() => {
      setActiveRest((prev) => {
        if (prev === null || prev <= 1) {
          setRestRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [restRunning, activeRest]);

  const totals = useMemo(() => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );
    return { totalSets, completedSets, totalExercises: exercises.length };
  }, [exercises]);

  const handleAddExercise = () => {
    if (!exerciseName.trim()) {
      Alert.alert("Missing info", "Add an exercise name.");
      return;
    }

    const reps = Math.max(Number(repCount) || 0, 1);
    const sets = Math.max(Number(setCount) || 0, 1);
    const rest = Math.max(Number(restSeconds) || 0, 0);

    const newExercise: ExerciseEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: exerciseName.trim(),
      muscleGroup: muscleGroup.trim() || "General",
      restSeconds: rest,
      sets: Array.from({ length: sets }, () => createSet(reps)),
    };

    setExercises((prev) => [newExercise, ...prev]);
    setExerciseName("");
  };

  const handleToggleSet = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const updatedSets = exercise.sets.map((set) => {
          if (set.id !== setId) return set;
          return { ...set, completed: !set.completed };
        });
        return { ...exercise, sets: updatedSets };
      })
    );

    const exercise = exercises.find((item) => item.id === exerciseId);
    if (exercise?.restSeconds) {
      setActiveRest(exercise.restSeconds);
      setRestRunning(true);
    }
  };

  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const defaultReps = exercise.sets[exercise.sets.length - 1]?.reps || 10;
        return {
          ...exercise,
          sets: [...exercise.sets, createSet(defaultReps)],
        };
      })
    );
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((exercise) => exercise.id !== exerciseId));
  };

  const handleRestPreset = (value: number) => {
    setActiveRest(value);
    setRestRunning(true);
  };

  const handleResetRest = () => {
    setActiveRest(null);
    setRestRunning(false);
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        <VStack className="mt-4 mb-6" space="xs">
          <Heading size="2xl">Workout</Heading>
          <Text className="text-gray-400">
            Plan your sets, track reps, and keep rests dialed in.
          </Text>
        </VStack>

        <Box className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
          <VStack space="md">
            <Text className="text-gray-300 text-sm">Session Name</Text>
            <Input size="lg">
              <InputField
                placeholder="Strong Session"
                value={workoutName}
                onChangeText={setWorkoutName}
              />
            </Input>
          </VStack>
        </Box>

        <Box className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
          <VStack space="md">
            <HStack className="items-center justify-between">
              <Heading size="md">Add Exercise</Heading>
              <Text className="text-gray-500 text-xs">Custom or existing</Text>
            </HStack>
            <VStack space="sm">
              <Input size="lg">
                <InputField
                  placeholder="Exercise name"
                  value={exerciseName}
                  onChangeText={setExerciseName}
                />
              </Input>
              <Input size="lg">
                <InputField
                  placeholder="Muscle group"
                  value={muscleGroup}
                  onChangeText={setMuscleGroup}
                />
              </Input>
            </VStack>
            <HStack space="sm" className="items-center">
              <Box className="flex-1">
                <Text className="text-gray-400 text-xs mb-1">Sets</Text>
                <Input size="md">
                  <InputField
                    keyboardType="numeric"
                    value={setCount}
                    onChangeText={setSetCount}
                  />
                </Input>
              </Box>
              <Box className="flex-1">
                <Text className="text-gray-400 text-xs mb-1">Reps</Text>
                <Input size="md">
                  <InputField
                    keyboardType="numeric"
                    value={repCount}
                    onChangeText={setRepCount}
                  />
                </Input>
              </Box>
              <Box className="flex-1">
                <Text className="text-gray-400 text-xs mb-1">Rest (sec)</Text>
                <Input size="md">
                  <InputField
                    keyboardType="numeric"
                    value={restSeconds}
                    onChangeText={setRestSeconds}
                  />
                </Input>
              </Box>
            </HStack>
            <Button size="lg" onPress={handleAddExercise}>
              <ButtonText>Add to Plan</ButtonText>
            </Button>
          </VStack>
        </Box>

        <Box className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
          <HStack className="items-center justify-between mb-3">
            <Heading size="md">Rest Timer</Heading>
            <Text className="text-gray-400 text-xs">
              {activeRest === null ? "Idle" : restRunning ? "Running" : "Paused"}
            </Text>
          </HStack>
          <HStack className="items-center justify-between mb-3">
            <Text className="text-gray-200 text-3xl font-semibold">
              {formatTimer(activeRest ?? 0)}
            </Text>
            <HStack space="sm">
              <Pressable
                className="bg-gray-800 p-3 rounded-full"
                onPress={() => setRestRunning((prev) => !prev)}
              >
                <MaterialIcons
                  name={restRunning ? "pause" : "play-arrow"}
                  size={20}
                  color="#C0EB6A"
                />
              </Pressable>
              <Pressable
                className="bg-gray-800 p-3 rounded-full"
                onPress={handleResetRest}
              >
                <MaterialIcons name="restart-alt" size={20} color="#f87171" />
              </Pressable>
            </HStack>
          </HStack>
          <HStack space="sm">
            {[30, 60, 90, 120].map((value) => (
              <Pressable
                key={value}
                className="bg-gray-800 px-3 py-2 rounded-full"
                onPress={() => handleRestPreset(value)}
              >
                <Text className="text-gray-300 text-xs">{value}s</Text>
              </Pressable>
            ))}
          </HStack>
        </Box>

        <Box className="mb-6">
          <HStack className="items-center justify-between mb-3">
            <Heading size="md">Today&apos;s Plan</Heading>
            <Text className="text-gray-400 text-sm">
              {totals.completedSets}/{totals.totalSets} sets
            </Text>
          </HStack>

          {exercises.length === 0 && (
            <Box className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <Text className="text-gray-400">
                Add exercises to build your session.
              </Text>
            </Box>
          )}

          {exercises.length > 0 && (
            <VStack space="md">
              {exercises.map((exercise) => (
                <Box
                  key={exercise.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
                >
                  <HStack className="items-center justify-between mb-2">
                    <VStack space="xs" className="flex-1">
                      <Heading size="sm">{exercise.name}</Heading>
                      <Text className="text-gray-400 text-xs">
                        {exercise.muscleGroup} • Rest {exercise.restSeconds}s
                      </Text>
                    </VStack>
                    <Pressable
                      className="p-2 bg-gray-800 rounded-full"
                      onPress={() => handleRemoveExercise(exercise.id)}
                    >
                      <MaterialIcons name="close" size={18} color="#f87171" />
                    </Pressable>
                  </HStack>

                  <VStack space="xs" className="mb-3">
                    {exercise.sets.map((set, index) => (
                      <HStack
                        key={set.id}
                        className="items-center justify-between"
                      >
                        <HStack space="sm" className="items-center">
                          <Pressable
                            className="bg-gray-800 p-2 rounded-full"
                            onPress={() =>
                              handleToggleSet(exercise.id, set.id)
                            }
                          >
                            <MaterialIcons
                              name={
                                set.completed
                                  ? "check-circle"
                                  : "radio-button-unchecked"
                              }
                              size={18}
                              color={set.completed ? "#C0EB6A" : "#9ca3af"}
                            />
                          </Pressable>
                          <Text className="text-gray-300 text-sm">
                            Set {index + 1}
                          </Text>
                        </HStack>
                        <Text className="text-gray-200 text-sm">
                          {set.reps} reps
                        </Text>
                      </HStack>
                    ))}
                  </VStack>

                  <HStack className="items-center justify-between">
                    <Pressable
                      className="bg-gray-800 px-3 py-2 rounded-full"
                      onPress={() => handleAddSet(exercise.id)}
                    >
                      <Text className="text-gray-300 text-xs">Add Set</Text>
                    </Pressable>
                    <Text className="text-gray-500 text-xs">
                      {exercise.sets.filter((s) => s.completed).length}/
                      {exercise.sets.length} complete
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        <Box className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <HStack className="items-center justify-between mb-2">
            <Heading size="md">Session Summary</Heading>
            <Text className="text-gray-400 text-xs">
              {workoutName || "Workout"}
            </Text>
          </HStack>
          <HStack className="justify-between mb-2">
            <Text className="text-gray-400 text-xs">Exercises</Text>
            <Text className="text-gray-200 text-xs">{totals.totalExercises}</Text>
          </HStack>
          <HStack className="justify-between">
            <Text className="text-gray-400 text-xs">Completed Sets</Text>
            <Text className="text-gray-200 text-xs">
              {totals.completedSets} / {totals.totalSets}
            </Text>
          </HStack>
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
