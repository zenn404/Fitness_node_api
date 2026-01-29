import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import "react-native-reanimated";

import { useAuthStore } from "@/store/auth-store";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isInitialized, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, isInitialized]);
}

export default function RootLayout() {
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
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal", headerShown: true }}
        />
      </Stack>
      <StatusBar style="light" />
    </GluestackUIProvider>
  );
}