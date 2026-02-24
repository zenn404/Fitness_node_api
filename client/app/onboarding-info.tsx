import { router } from "expo-router";
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
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

export default function OnboardingInfoScreen() {
  const { t } = useTranslation();

  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  const handleContinue = () => {
    if (!age.trim() || !weight.trim() || !height.trim()) {
      Alert.alert(t("common.error"), t("onboarding.fillAllFields"));
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
      },
    });
  };

  return (
    <SafeAreaView className="flex-1">
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
            <VStack className="items-center mb-6">
              <Box className="justify-center items-center bg-primary-500 mb-4 rounded-2xl w-20 h-20">
                <Text className="text-4xl">📏</Text>
              </Box>
              <Heading size="2xl" className="text-center">
                {t("onboarding.tellUsAboutYou")}
              </Heading>
              <Text className="text-gray-400 text-center mt-2">
                {t("onboarding.personalizeExperience")}
              </Text>
            </VStack>

            <VStack space="xs">
              <Text className="text-gray-400">{t("onboarding.age")}</Text>
              <Input size="xl">
                <InputField
                  placeholder={t("onboarding.enterAge")}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text className="text-gray-400">{t("onboarding.weight")} (kg)</Text>
              <Input size="xl">
                <InputField
                  placeholder={t("onboarding.enterWeight")}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text className="text-gray-400">{t("onboarding.height")} (cm)</Text>
              <Input size="xl">
                <InputField
                  placeholder={t("onboarding.enterHeight")}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                />
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
