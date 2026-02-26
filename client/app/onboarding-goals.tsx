import { router, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
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
import { getThemePalette } from "@/lib/theme-palette";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";

const GOALS = [
  { id: "lose_weight", icon: "local-fire-department", labelKey: "onboarding.goalLoseWeight" },
  { id: "build_muscle", icon: "fitness-center", labelKey: "onboarding.goalBuildMuscle" },
  { id: "stay_fit", icon: "directions-run", labelKey: "onboarding.goalStayFit" },
  { id: "improve_endurance", icon: "favorite", labelKey: "onboarding.goalEndurance" },
  { id: "flexibility", icon: "self-improvement", labelKey: "onboarding.goalFlexibility" },
  { id: "general_health", icon: "monitor-heart", labelKey: "onboarding.goalHealth" },
];

export default function OnboardingGoalsScreen() {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  const { age, weight, height, gender } = useLocalSearchParams<{
    age: string;
    weight: string;
    height: string;
    gender: "male" | "female" | "other";
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
      gender,
      goals: selectedGoal,
    });

    if (success) {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <VStack className="flex-1 px-6 py-8" space="lg">
        <VStack
          className="items-center mb-4 p-5 border rounded-3xl"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <Box
            className="justify-center items-center mb-4 rounded-2xl w-14 h-14"
            style={{ backgroundColor: colors.accentSoft }}
          >
            <MaterialIcons name="flag" size={26} color={colors.accent} />
          </Box>
          <Heading size="2xl" className="text-center" style={{ color: colors.text }}>
            {t("onboarding.whatsYourGoal")}
          </Heading>
          <Text className="text-center mt-2" style={{ color: colors.textMuted }}>
            {t("onboarding.goalDescription")}
          </Text>
        </VStack>

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
                    className="items-center p-4 rounded-2xl border-2"
                    style={{
                      backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.border,
                    }}
                  >
                    <Box className="mb-2 rounded-xl p-2" style={{ backgroundColor: isSelected ? colors.accentSoft : colors.surfaceAlt }}>
                      <MaterialIcons
                        name={goal.icon as any}
                        size={22}
                        color={isSelected ? colors.accent : colors.icon}
                      />
                    </Box>
                    <Text
                      className="text-center font-medium text-sm"
                      style={{ color: isSelected ? colors.accent : colors.text }}
                    >
                      {t(goal.labelKey)}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </HStack>
        </VStack>

        <Button
          size="xl"
          onPress={handleGetStarted}
          disabled={isLoading || !selectedGoal}
          className={!selectedGoal ? "opacity-50" : ""}
        >
          {isLoading ? <ButtonSpinner color="white" /> : <ButtonText>{t("onboarding.getStarted")}</ButtonText>}
        </Button>
      </VStack>
    </SafeAreaView>
  );
}
