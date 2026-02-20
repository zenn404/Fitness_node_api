import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Pressable as RNPressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getDifficultyColor } from "@/lib/utils";
import { api, Exercise, Workout } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";

type SessionPhase = "exercise" | "rest" | "completed";

interface SessionState {
  currentExerciseIndex: number;
  currentSet: number;
  phase: SessionPhase;
  timeRemaining: number;
  isPaused: boolean;
  isStarted: boolean;
}

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { workout: workoutParam } = useLocalSearchParams<{ workout: string }>();
  const workout: Workout | null = workoutParam
    ? JSON.parse(workoutParam)
    : null;

  const [sessionId, setSessionId] = useState<string | null>(null);

  const exercises = useMemo(
    () => workout?.exercises || [],
    [workout?.exercises],
  );

  // Calculate exercise time based on total workout duration / number of exercises
  const exerciseTimePerSet = useMemo(() => {
    if (!workout?.duration_minutes || exercises.length === 0) {
      return 45;
    }
    const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0);
    if (totalSets === 0) return 45;
    // Convert minutes to seconds and divide by total sets
    return Math.floor((workout.duration_minutes * 60) / totalSets);
  }, [workout?.duration_minutes, exercises]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [session, setSession] = useState<SessionState>({
    currentExerciseIndex: 0,
    currentSet: 1,
    phase: "exercise",
    timeRemaining: 45,
    isPaused: false,
    isStarted: false,
  });

  useEffect(() => {
    if (!session.isStarted) {
      setSession((prev) => ({
        ...prev,
        timeRemaining: exerciseTimePerSet,
      }));
    }
  }, [exerciseTimePerSet, session.isStarted]);

  const currentExercise: Exercise | undefined =
    exercises[session.currentExerciseIndex];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateProgress = useCallback((): number => {
    if (exercises.length === 0) return 0;

    let totalSets = 0;
    let completedSets = 0;

    exercises.forEach((exercise, index) => {
      totalSets += exercise.sets;
      if (index < session.currentExerciseIndex) {
        completedSets += exercise.sets;
      } else if (index === session.currentExerciseIndex) {
        completedSets += session.currentSet - 1;
      }
    });

    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  }, [exercises, session.currentExerciseIndex, session.currentSet]);

  const moveToNextPhase = useCallback(() => {
    setSession((prev) => {
      const currentEx = exercises[prev.currentExerciseIndex];

      if (prev.phase === "exercise") {
        // After exercise, go to rest phase
        if (prev.currentSet < currentEx.sets) {
          return {
            ...prev,
            phase: "rest",
            timeRemaining: currentEx.rest_seconds,
          };
        } else {
          if (prev.currentExerciseIndex < exercises.length - 1) {
            // Move to next exercise
            return {
              ...prev,
              currentExerciseIndex: prev.currentExerciseIndex + 1,
              currentSet: 1,
              phase: "rest",
              timeRemaining: currentEx.rest_seconds,
            };
          } else {
            return {
              ...prev,
              phase: "completed",
              timeRemaining: 0,
            };
          }
        }
      } else if (prev.phase === "rest") {
        // After rest, start next set or next exercise
        return {
          ...prev,
          currentSet:
            prev.currentSet < currentEx.sets
              ? prev.currentSet + 1
              : prev.currentSet,
          phase: "exercise",
          timeRemaining: exerciseTimePerSet,
        };
      }

      return prev;
    });
  }, [exercises, exerciseTimePerSet]);

  // Timer logic
  useEffect(() => {
    if (
      session.isStarted &&
      !session.isPaused &&
      session.phase !== "completed"
    ) {
      timerRef.current = setInterval(() => {
        setSession((prev) => {
          if (prev.timeRemaining <= 1) {
            return prev;
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session.isStarted, session.isPaused, session.phase]);

  useEffect(() => {
    if (
      session.timeRemaining === 0 &&
      session.isStarted &&
      session.phase !== "completed"
    ) {
      moveToNextPhase();
    }
  }, [
    session.timeRemaining,
    session.isStarted,
    session.phase,
    moveToNextPhase,
  ]);

  useEffect(() => {
    const progress = calculateProgress();
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [calculateProgress, progressAnim]);

  const handleStart = async () => {
    if (token && workout?.id) {
      try {
        const response = await api.startWorkoutSession(token, workout.id);
        if (response.success && response.data) {
          setSessionId(response.data.session.id);
        }
      } catch (error) {
        console.error("Failed to start session:", error);
      }
    }
    setSession((prev) => ({ ...prev, isStarted: true }));
  };

  const handlePause = () => {
    setSession((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const handleStop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    router.back();
  };

  const handleSkip = () => {
    moveToNextPhase();
  };

  const handleFinish = async () => {
    if (token && sessionId) {
      try {
        await api.completeWorkoutSession(token, sessionId);
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }
    router.back();
  };

  if (!workout || exercises.length === 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-950">
        <MaterialIcons name="error-outline" size={64} color="#ef4444" />
        <Text className="mt-4 text-gray-400 text-center">
          No exercises found in this workout
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 px-6 py-3 bg-gray-800 rounded-lg"
        >
          <Text className="text-primary-500 font-semibold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (session.phase === "completed") {
    return (
      <SafeAreaView className="flex-1 bg-gray-950" edges={["top", "bottom"]}>
        <Box className="flex-1 justify-center items-center px-6">
          <Box className="bg-primary-500/20 p-8 rounded-full mb-6">
            <MaterialIcons name="emoji-events" size={80} color="#C0EB6A" />
          </Box>
          <Heading size="3xl" className="text-center mb-4">
            Workout Complete! 🎉
          </Heading>
          <Text className="text-gray-400 text-center text-lg mb-8">
            Great job! You&apos;ve completed {workout.name}
          </Text>
          <VStack
            className="w-full bg-gray-900 p-6 rounded-2xl mb-8"
            space="md"
          >
            <HStack className="justify-between items-center">
              <Text className="text-gray-400">Exercises</Text>
              <Text className="text-white font-semibold">
                {exercises.length}
              </Text>
            </HStack>
            <HStack className="justify-between items-center">
              <Text className="text-gray-400">Total Sets</Text>
              <Text className="text-white font-semibold">
                {exercises.reduce((acc, ex) => acc + ex.sets, 0)}
              </Text>
            </HStack>
            <HStack className="justify-between items-center">
              <Text className="text-gray-400">Difficulty</Text>
              <Text
                className="font-semibold"
                style={{ color: getDifficultyColor(workout.difficulty) }}
              >
                {workout.difficulty}
              </Text>
            </HStack>
          </VStack>
          <RNPressable
            onPress={handleFinish}
            className="w-full bg-primary-500 py-4 rounded-2xl active:opacity-90"
          >
            <Text className="text-center font-bold text-lg text-gray-900">
              Finish
            </Text>
          </RNPressable>
        </Box>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-gray-950" edges={["top", "bottom"]}>
      <HStack className="px-4 py-3 items-center justify-between">
        <HStack className="items-center" space="sm">
          <Pressable onPress={handleStop} className="p-2 active:opacity-70">
            <MaterialIcons name="close" size={24} color="#ffffff" />
          </Pressable>
          <VStack>
            <Text className="text-gray-400 text-sm">{workout.name}</Text>
            <Text className="text-white font-medium">
              Exercise {session.currentExerciseIndex + 1} of {exercises.length}
            </Text>
          </VStack>
        </HStack>
        <Box
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: `${getDifficultyColor(workout.difficulty)}20`,
          }}
        >
          <Text
            className="font-semibold text-sm"
            style={{ color: getDifficultyColor(workout.difficulty) }}
          >
            {workout.difficulty}
          </Text>
        </Box>
      </HStack>

      <Box className="px-4 py-2">
        <Box className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <Animated.View
            className="h-full bg-primary-500 rounded-full"
            style={{
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            }}
          />
        </Box>
        <Text className="text-gray-500 text-xs mt-1 text-right">
          {Math.round(calculateProgress())}% complete
        </Text>
      </Box>

      {/* Main Content */}
      <Box className="flex-1 justify-center items-center px-6">
        <Box
          className={`px-4 py-2 rounded-full mb-4 ${
            session.phase === "rest" ? "bg-blue-500/20" : "bg-primary-500/20"
          }`}
        >
          <Text
            className={`font-semibold uppercase tracking-wider ${
              session.phase === "rest" ? "text-blue-400" : "text-primary-500"
            }`}
          >
            {session.phase === "rest" ? "Rest Time" : "Exercise"}
          </Text>
        </Box>

        {/* Timer Circle */}
        <Box className="relative items-center justify-center mb-6">
          <Box
            className={`w-56 h-56 rounded-full items-center justify-center border-4 ${
              session.phase === "rest"
                ? "border-blue-500 bg-blue-500/10"
                : "border-primary-500 bg-primary-500/10"
            }`}
          >
            <Text
              className={`text-6xl font-bold ${
                session.phase === "rest" ? "text-blue-400" : "text-primary-500"
              }`}
            >
              {formatTime(session.timeRemaining)}
            </Text>
            {session.isPaused && (
              <Text className="text-gray-400 text-sm mt-2">PAUSED</Text>
            )}
          </Box>
        </Box>

        <VStack className="items-center mb-8" space="sm">
          <Heading size="xl" className="text-center">
            {currentExercise?.name}
          </Heading>
          <HStack className="items-center" space="md">
            <HStack className="items-center" space="xs">
              <MaterialIcons name="repeat" size={18} color="#9ca3af" />
              <Text className="text-gray-400">
                Set {session.currentSet} of {currentExercise?.sets}
              </Text>
            </HStack>
            <Text className="text-gray-600">•</Text>
            <HStack className="items-center" space="xs">
              <MaterialIcons name="fitness-center" size={18} color="#9ca3af" />
              <Text className="text-gray-400">
                {currentExercise?.reps} reps
              </Text>
            </HStack>
          </HStack>
          <Text className="text-gray-500 text-sm uppercase tracking-wide">
            {currentExercise?.muscle_group}
          </Text>
        </VStack>
      </Box>
      {/* Control Buttons */}
      <Box className="px-6 pb-6">
        {!session.isStarted ? (
          <RNPressable
            onPress={handleStart}
            className="w-full bg-primary-500 py-4 rounded-2xl active:opacity-90"
          >
            <HStack className="justify-center items-center" space="sm">
              <MaterialIcons name="play-arrow" size={28} color="#1f2937" />
              <Text className="font-bold text-lg text-gray-900">
                Start Exercise
              </Text>
            </HStack>
          </RNPressable>
        ) : (
          <VStack space="md">
            <HStack space="md" className="w-full">
              <RNPressable
                onPress={handleStop}
                className="flex-1 bg-red-500/20 border border-red-500 py-4 rounded-2xl active:opacity-90"
              >
                <HStack className="justify-center items-center" space="sm">
                  <MaterialIcons name="stop" size={24} color="#ef4444" />
                  <Text className="font-bold text-red-400">Stop</Text>
                </HStack>
              </RNPressable>

              <RNPressable
                onPress={handlePause}
                className={`flex-1 py-4 rounded-2xl active:opacity-90 ${
                  session.isPaused
                    ? "bg-primary-500"
                    : "bg-amber-500/20 border border-amber-500"
                }`}
              >
                <HStack className="justify-center items-center" space="sm">
                  <MaterialIcons
                    name={session.isPaused ? "play-arrow" : "pause"}
                    size={24}
                    color={session.isPaused ? "#1f2937" : "#f59e0b"}
                  />
                  <Text
                    className={`font-bold ${
                      session.isPaused ? "text-gray-900" : "text-amber-400"
                    }`}
                  >
                    {session.isPaused ? "Resume" : "Pause"}
                  </Text>
                </HStack>
              </RNPressable>
            </HStack>

            <RNPressable
              onPress={handleSkip}
              className="w-full bg-gray-800 py-4 rounded-2xl active:opacity-90"
            >
              <HStack className="justify-center items-center" space="sm">
                <MaterialIcons name="skip-next" size={24} color="#9ca3af" />
                <Text className="font-semibold text-gray-400">
                  Skip {session.phase === "rest" ? "Rest" : "Exercise"}
                </Text>
              </HStack>
            </RNPressable>
          </VStack>
        )}
      </Box>
    </SafeAreaView>
  );
}