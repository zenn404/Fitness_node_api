import React from "react";
import { Pressable as RNPressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getThemePalette } from "@/lib/theme-palette";
import { useThemeStore } from "@/store/theme-store";

export function AppScreen({
  children,
  scroll = true,
  edges,
  padded = true,
  contentBottom = 120,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: ("top" | "right" | "bottom" | "left")[];
  padded?: boolean;
  contentBottom?: number;
}) {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  if (!scroll) {
    return (
      <SafeAreaView className="flex-1" edges={edges} style={{ backgroundColor: colors.background }}>
        <View className={padded ? "flex-1 px-5" : "flex-1"}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={edges} style={{ backgroundColor: colors.background }}>
      <ScrollView
        className={padded ? "flex-1 px-5" : "flex-1"}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: contentBottom }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  right?: React.ReactNode;
}) {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  return (
    <HStack className="items-center justify-between mb-6">
      <HStack className="items-center flex-1 mr-4" space="sm">
        {icon ? (
          <Box className="w-11 h-11 rounded-2xl items-center justify-center" style={{ backgroundColor: colors.surfaceAlt }}>
            <MaterialIcons name={icon} size={22} color={colors.accent} />
          </Box>
        ) : null}
        <VStack className="flex-1" space="xs">
          <Heading size="2xl" style={{ color: colors.text }}>
            {title}
          </Heading>
          {subtitle ? (
            <Text className="text-sm" style={{ color: colors.textMuted }}>
              {subtitle}
            </Text>
          ) : null}
        </VStack>
      </HStack>
      {right}
    </HStack>
  );
}

export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  return (
    <Box
      className={`rounded-3xl border p-4 ${className}`.trim()}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
    >
      {children}
    </Box>
  );
}

export function FormLabel({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  return (
    <Text className="text-sm mb-2" style={{ color: colors.textMuted }}>
      {children}
    </Text>
  );
}

export function AppChipButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive?: boolean;
  onPress: () => void;
}) {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  return (
    <RNPressable
      onPress={onPress}
      className="px-4 py-2.5 rounded-full border"
      style={{
        backgroundColor: isActive ? colors.accent : colors.surface,
        borderColor: isActive ? colors.accent : colors.border,
      }}
    >
      <Text className="text-sm font-semibold" style={{ color: isActive ? colors.accentText : colors.textMuted }}>
        {label}
      </Text>
    </RNPressable>
  );
}

export function AppTable({
  rows,
}: {
  rows: Array<{ label: string; value: string; subtle?: boolean }>;
}) {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);

  return (
    <VStack>
      {rows.map((row, index) => (
        <HStack
          key={`${row.label}-${index}`}
          className="justify-between items-center py-2.5"
          style={{
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: colors.border,
          }}
        >
          <Text className="text-sm" style={{ color: colors.textMuted }}>
            {row.label}
          </Text>
          <Text className="text-sm font-medium" style={{ color: row.subtle ? colors.textSubtle : colors.text }}>
            {row.value}
          </Text>
        </HStack>
      ))}
    </VStack>
  );
}
