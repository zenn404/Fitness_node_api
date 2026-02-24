import React, { useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { useAuthStore } from "@/store/auth-store";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    console.log("Login button pressed");
    console.log("Email:", email);
    console.log("Password:", password);
    if (!email || !password) {
      Alert.alert(t("common.error"), t("auth.enterEmailAndPassword"));
      return;
    }

    const success = await login(email, password);

    if (success) {
      router.replace("/(tabs)");
    }
  };

  const goToRegister = () => {
    router.push("/(auth)/register");
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
          <VStack className="flex-1 justify-center px-6 py-8" space="xl">
            <VStack className="items-center mb-8">
              <Box className="justify-center items-center bg-primary-500 mb-4 rounded-2xl w-20 h-20">
                <Text className="text-4xl">💪</Text>
              </Box>
              <Heading size="2xl" className="text-center">
                {t("auth.welcomeBack")}
              </Heading>
              <Text className="text-gray-400 text-center">
                {t("auth.signInToContinue")}
              </Text>
            </VStack>

            {error && (
              <Box className="bg-red-900/50 p-3 border border-red-500 rounded-lg">
                <Text className="text-red-400 text-center">{error}</Text>
              </Box>
            )}

            <VStack space="xs">
              <Text className="text-gray-400">{t("auth.email")}</Text>
              <Input size="xl">
                <InputField
                  placeholder={t("auth.enterEmail")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text className="text-gray-400">{t("auth.password")}</Text>
              <Input size="xl">
                <InputField
                  placeholder={t("auth.enterPassword")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </Input>
            </VStack>

            <Button
              size="xl"
              className="mt-4"
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ButtonSpinner color="white" />
              ) : (
                <ButtonText>{t("auth.signIn")}</ButtonText>
              )}
            </Button>

            <HStack className="justify-center mt-4" space="xs">
              <Text className="text-gray-400">{t("auth.noAccount")}</Text>
              <Pressable onPress={goToRegister}>
                <Text className="font-semibold text-primary-500">{t("auth.signUp")}</Text>
              </Pressable>
            </HStack>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
