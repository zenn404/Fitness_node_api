import React, { useState } from "react";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
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
import { getThemePalette } from "@/lib/theme-palette";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuthStore();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("common.error"), t("auth.enterEmailAndPassword"));
      return;
    }

    const success = await login(email, password);

    if (success) {
      router.replace("/(tabs)");
    }
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
          <VStack className="flex-1 justify-center px-6 py-8" space="xl">
            <VStack
              className="items-center mb-6 p-5 border rounded-3xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <Box
                className="justify-center items-center mb-4 rounded-2xl w-14 h-14"
                style={{ backgroundColor: colors.accentSoft }}
              >
                <MaterialIcons name="shield" size={26} color={colors.accent} />
              </Box>
              <Heading size="2xl" className="text-center mb-1" style={{ color: colors.text }}>
                {t("auth.welcomeBack")}
              </Heading>
              <Text className="text-center" style={{ color: colors.textMuted }}>
                {t("auth.signInToContinue")}
              </Text>
            </VStack>

            {error && (
              <Box className="p-3 border rounded-lg" style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger }}>
                <Text className="text-center" style={{ color: colors.danger }}>{error}</Text>
              </Box>
            )}

            <VStack space="xs">
              <Text style={{ color: colors.textMuted }}>{t("auth.email")}</Text>
              <Input size="xl" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
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
              <Text style={{ color: colors.textMuted }}>{t("auth.password")}</Text>
              <Input size="xl" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
                <InputField
                  placeholder={t("auth.enterPassword")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </Input>
            </VStack>

            <Button size="xl" className="mt-4" onPress={handleLogin} disabled={isLoading}>
              {isLoading ? <ButtonSpinner color="white" /> : <ButtonText>{t("auth.signIn")}</ButtonText>}
            </Button>

            <HStack className="justify-center mt-4" space="xs">
              <Text style={{ color: colors.textMuted }}>{t("auth.noAccount")}</Text>
              <Pressable onPress={() => router.push("/(auth)/register")}>
                <Text className="font-semibold" style={{ color: colors.accent }}>{t("auth.signUp")}</Text>
              </Pressable>
            </HStack>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
