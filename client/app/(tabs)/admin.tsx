import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getThemePalette } from "@/lib/theme-palette";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useTranslation } from "react-i18next";

export default function AdminScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  if (user?.role !== "admin") {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <VStack className="flex-1 items-center justify-center px-6">
          <MaterialIcons name="lock-outline" size={48} color={colors.icon} />
          <Heading className="mt-4 text-center" size="xl" style={{ color: colors.text }}>
            {t("admin.users")}
          </Heading>
          <Text className="mt-2 text-center" style={{ color: colors.textMuted }}>
            {t("profile.adminAccount")}
          </Text>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 px-4" style={{ backgroundColor: colors.background }}>
      <VStack className="mt-4 mb-6">
        <Heading size="2xl" style={{ color: colors.text }}>
          {t("admin.title")}
        </Heading>
        <Text className="mt-2" style={{ color: colors.textMuted }}>
          {user.email}
        </Text>
      </VStack>

      <VStack space="md">
        <AdminNavCard
          icon="fitness-center"
          title={t("admin.workouts")}
          description={t("admin.workouts")}
          buttonLabel={t("admin.workouts")}
          onPress={() => router.push("/admin-workouts")}
          colors={colors}
        />
        <AdminNavCard
          icon="accessibility-new"
          title={t("admin.exercises")}
          description={t("admin.exercises")}
          buttonLabel={t("admin.exercises")}
          onPress={() => router.push("/admin-exercises")}
          colors={colors}
        />
        <AdminNavCard
          icon="groups"
          title={t("admin.users")}
          description={t("admin.users")}
          buttonLabel={t("admin.users")}
          onPress={() => router.push("/admin-users")}
          colors={colors}
        />
      </VStack>
    </SafeAreaView>
  );
}

function AdminNavCard({
  icon,
  title,
  description,
  buttonLabel,
  onPress,
  colors,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  description: string;
  buttonLabel: string;
  onPress: () => void;
  colors: ReturnType<typeof getThemePalette>;
}) {
  return (
    <Box
      className="rounded-2xl border p-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <HStack className="items-start">
        <Box
          className="mr-3 rounded-xl p-3"
          style={{ backgroundColor: colors.surfaceAlt }}
        >
          <MaterialIcons name={icon} size={24} color={colors.accent} />
        </Box>
        <VStack className="flex-1">
          <Heading size="md" style={{ color: colors.text }}>
            {title}
          </Heading>
          <Text className="mt-2" style={{ color: colors.textMuted }}>
            {description}
          </Text>
          <Button
            className="mt-4 self-start"
            onPress={onPress}
            style={{ backgroundColor: colors.accent }}
          >
            <ButtonText style={{ color: colors.accentText }}>
              {buttonLabel}
            </ButtonText>
          </Button>
        </VStack>
      </HStack>
    </Box>
  );
}
