import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useAuthStore } from "@/store/auth-store";

const GOALS = [
  { id: "lose_weight", icon: "🔥", labelKey: "onboarding.goalLoseWeight" },
  { id: "build_muscle", icon: "💪", labelKey: "onboarding.goalBuildMuscle" },
  { id: "stay_fit", icon: "🏃", labelKey: "onboarding.goalStayFit" },
  { id: "improve_endurance", icon: "❤️", labelKey: "onboarding.goalEndurance" },
  { id: "flexibility", icon: "🧘", labelKey: "onboarding.goalFlexibility" },
  { id: "general_health", icon: "🍏", labelKey: "onboarding.goalHealth" },
];

export default function OnboardingGoalsScreen() {
  const { t } = useTranslation();
  const { age, weight, height } = useLocalSearchParams<{
    age: string;
    weight: string;
    height: string;
  }>();

  const { updateProfile, isLoading } = useAuthStore();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const handleGetStarted = async () => {
    if (!selectedGoal) {
      Alert.alert(t("common.error"), t("onboarding.selectGoal"));
      return;
    }

    const success = await updateProfile({
      age: parseInt(age, 10),
      weight: parseFloat(weight),
      height: parseFloat(height),
      goals: selectedGoal,
    });

    if (success) {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <VStack className="flex-1 px-6 py-8" space="lg">
        {/* Header */}
        <VStack className="items-center mb-4">
          <Box className="justify-center items-center bg-primary-500 mb-4 rounded-2xl w-20 h-20">
            <Text className="text-4xl">🎯</Text>
          </Box>
          <Heading size="2xl" className="text-center">
            {t("onboarding.whatsYourGoal")}
          </Heading>
          <Text className="text-gray-400 text-center mt-2">
            {t("onboarding.goalDescription")}
          </Text>
        </VStack>

        {/* Goal Cards */}
        <VStack space="sm" className="flex-1">
          <HStack className="flex-wrap justify-between">
            {GOALS.map((goal) => {
              const isSelected = selectedGoal === goal.id;

              return (
                <Pressable
                  key={goal.id}
                  onPress={() => setSelectedGoal(goal.id)}
                  className="w-[48%] mb-3"
                >
                  <Box
                    className={`items-center p-4 rounded-2xl border-2 ${
                      isSelected
                        ? "bg-primary-500/20 border-primary-500"
                        : "bg-gray-900 border-gray-800"
                    }`}
                  >
                    <Text className="text-3xl mb-2">{goal.icon}</Text>
                    <Text
                      className={`text-center font-medium text-sm ${
                        isSelected ? "text-primary-500" : "text-white"
                      }`}
                    >
                      {t(goal.labelKey)}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </HStack>
        </VStack>

        {/* Get Started Button */}
        <Button
          size="xl"
          onPress={handleGetStarted}
          disabled={isLoading || !selectedGoal}
          className={!selectedGoal ? "opacity-50" : ""}
        >
          {isLoading ? (
            <ButtonSpinner color="white" />
          ) : (
            <ButtonText>{t("onboarding.getStarted")}</ButtonText>
          )}
        </Button>
      </VStack>
    </SafeAreaView>
  );
}