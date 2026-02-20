import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable as RNPressable } from "react-native";

import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getDifficultyColor } from "@/lib/utils";
import { Workout } from "@/services/api";

interface WorkoutCardProps {
  workout: Workout;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const router = useRouter();

  const handleStartWorkout = () => {
    router.push(`/workout-detail?id=${workout.id}`);
  };

  return (
    <Box className="bg-gray-900 p-4 border border-gray-800 rounded-2xl active:opacity-90">
      {/* Header Row */}
      <HStack className="justify-between items-start mb-2">
        <VStack className="flex-1 mr-3">
          <Heading size="md" className="mb-1 text-white">
            {workout.name}
          </Heading>
          <Text
            style={{ color: getDifficultyColor(workout.difficulty) }}
            className="font-medium text-sm"
          >
            {workout.difficulty}
          </Text>
        </VStack>
        <Box className="bg-gray-800 p-2 rounded-xl">
          <MaterialIcons name="fitness-center" size={24} color="#9ca3af" />
        </Box>
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
              ? `${workout.duration_minutes} min`
              : "-- min"}
          </Text>
        </HStack>

        {/* Start Button */}
        <RNPressable
          onPress={handleStartWorkout}
          className="bg-primary-500 px-5 py-2 rounded-full active:opacity-80"
        >
          <Text className="font-bold text-gray-900">Start</Text>
        </RNPressable>
      </HStack>
    </Box>
  );
}