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
import { FormLabel, PageHeader, SectionCard } from "@/components/app/design";
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
          <VStack className="flex-1 justify-center px-5 py-8" space="lg">
            <SectionCard className="mb-2">
              <PageHeader
                title={t("auth.welcomeBack")}
                subtitle={t("auth.signInToContinue")}
                icon="shield"
              />
            </SectionCard>

            {error && (
              <Box className="p-3 border rounded-lg" style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger }}>
                <Text className="text-center" style={{ color: colors.danger }}>{error}</Text>
              </Box>
            )}

            <VStack space="xs">
              <FormLabel>{t("auth.email")}</FormLabel>
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
              <FormLabel>{t("auth.password")}</FormLabel>
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

            <Button size="xl" className="mt-2" onPress={handleLogin} disabled={isLoading}>
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
