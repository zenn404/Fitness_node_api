import { Stack } from "expo-router";
import { getThemePalette } from "@/lib/theme-palette";
import { useThemeStore } from "@/store/theme-store";

export default function AuthLayout() {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
