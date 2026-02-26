import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getThemePalette } from "@/lib/theme-palette";
import { useThemeStore } from "@/store/theme-store";

export default function OnboardingInfoScreen() {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");

  const handleContinue = () => {
    if (!age.trim() || !weight.trim() || !height.trim()) {
      Alert.alert(t("common.error"), t("onboarding.fillAllFields"));
      return;
    }
    if (!gender) {
      Alert.alert(t("common.error"), t("onboarding.selectGender"));
      return;
    }

    const parsedAge = parseInt(age, 10);
    const parsedWeight = parseFloat(weight);
    const parsedHeight = parseFloat(height);

    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
      Alert.alert(t("common.error"), t("onboarding.invalidAge"));
      return;
    }

    if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 300) {
      Alert.alert(t("common.error"), t("onboarding.invalidWeight"));
      return;
    }

    if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 300) {
      Alert.alert(t("common.error"), t("onboarding.invalidHeight"));
      return;
    }

    router.push({
      pathname: "/onboarding-goals",
      params: {
        age: parsedAge,
        weight: parsedWeight,
        height: parsedHeight,
        gender,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <VStack className="flex-1 justify-center px-6 py-8" space="lg">
            <VStack
              className="items-center mb-6 p-5 border rounded-3xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <Box
                className="justify-center items-center mb-4 rounded-2xl w-14 h-14"
                style={{ backgroundColor: colors.accentSoft }}
              >
                <MaterialIcons name="monitor-weight" size={26} color={colors.accent} />
              </Box>
              <Heading size="2xl" className="text-center" style={{ color: colors.text }}>
                {t("onboarding.tellUsAboutYou")}
              </Heading>
              <Text className="text-center mt-2" style={{ color: colors.textMuted }}>
                {t("onboarding.personalizeExperience")}
              </Text>
            </VStack>

            <VStack space="xs">
              <Text style={{ color: colors.textMuted }}>{t("onboarding.gender")}</Text>
              <HStack className="justify-between">
                {[
                  { key: "male", label: t("onboarding.male") },
                  { key: "female", label: t("onboarding.female") },
                  { key: "other", label: t("onboarding.otherGender") },
                ].map((option) => {
                  const selected = gender === option.key;
                  return (
                    <Button
                      key={option.key}
                      size="sm"
                      variant={selected ? "solid" : "outline"}
                      className="flex-1 mx-1"
                      onPress={() => setGender(option.key as "male" | "female" | "other")}
                      style={
                        selected
                          ? undefined
                          : { borderColor: colors.border, backgroundColor: colors.surface }
                      }
                    >
                      <ButtonText style={selected ? undefined : { color: colors.text }}>
                        {option.label}
                      </ButtonText>
                    </Button>
                  );
                })}
              </HStack>
            </VStack>

            <VStack space="xs">
              <Text style={{ color: colors.textMuted }}>{t("onboarding.age")}</Text>
              <Input size="xl" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
                <InputField placeholder={t("onboarding.enterAge")} value={age} onChangeText={setAge} keyboardType="number-pad" />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text style={{ color: colors.textMuted }}>{t("onboarding.weight")} (kg)</Text>
              <Input size="xl" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
                <InputField placeholder={t("onboarding.enterWeight")} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text style={{ color: colors.textMuted }}>{t("onboarding.height")} (cm)</Text>
              <Input size="xl" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
                <InputField placeholder={t("onboarding.enterHeight")} value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
              </Input>
            </VStack>

            <Button size="xl" className="mt-4" onPress={handleContinue}>
              <ButtonText>{t("onboarding.continue")}</ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
