import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/store/auth-store";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import "@/lib/i18n";

export const unstable_settings = {
  anchor: "(tabs)",
};

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isInitialized, needsOnboarding, checkAuth } =
    useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding =
      segments[0] === "onboarding-info" || segments[0] === "onboarding-goals";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && needsOnboarding && !inOnboarding) {
      router.replace("/onboarding-info");
    } else if (
      isAuthenticated &&
      !needsOnboarding &&
      (inAuthGroup || inOnboarding)
    ) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, isInitialized, needsOnboarding]);
}

export default function RootLayout() {
  const { t } = useTranslation();
  const { isInitialized } = useAuthStore();

  useProtectedRoute();

  // Show loading screen while checking auth
  if (!isInitialized) {
    return (
      <GluestackUIProvider mode="dark">
        <View className="flex-1 justify-center items-center bg-background-950">
          <ActivityIndicator size="large" color="#C0EB6A" />
        </View>
      </GluestackUIProvider>
    );
  }

  return (
    <GluestackUIProvider mode="dark">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#1f2937" },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding-info" />
        <Stack.Screen name="onboarding-goals" />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: t("modal.title"),
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="workout-session"
          options={{
            title: t("session.workoutSession"),
            presentation: "modal",
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </GluestackUIProvider>
  );
}
