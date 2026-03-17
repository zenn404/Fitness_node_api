import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getThemePalette } from "@/lib/theme-palette";
import { Workout } from "@/services/api";

const difficulties: Array<Workout["difficulty"]> = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

export function AdminHeader({
  title,
  colors,
}: {
  title: string;
  colors: ReturnType<typeof getThemePalette>;
}) {
  const { t } = useTranslation();
  return (
    <HStack className="mt-4 mb-6 items-center">
      <Button variant="outline" action="secondary" size="sm" onPress={() => router.back()}>
        <ButtonText>{t("admin.back")}</ButtonText>
      </Button>
      <Heading className="ml-3" size="2xl" style={{ color: colors.text }}>
        {title}
      </Heading>
    </HStack>
  );
}

export function UndoNotice({
  title,
  description,
  onUndo,
  colors,
}: {
  title: string;
  description: string;
  onUndo: () => void;
  colors: ReturnType<typeof getThemePalette>;
}) {
  const { t } = useTranslation();
  return (
    <Box
      className="mb-4 rounded-2xl border p-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.accent }}
    >
      <HStack className="items-center justify-between">
        <VStack className="flex-1 pr-3">
          <Heading size="sm" style={{ color: colors.text }}>
            {title}
          </Heading>
          <Text className="mt-1" style={{ color: colors.textMuted }}>
            {description}
          </Text>
        </VStack>
        <Button variant="outline" action="primary" size="sm" onPress={onUndo}>
          <ButtonText>{t("admin.undo")}</ButtonText>
        </Button>
      </HStack>
    </Box>
  );
}

export function DifficultyPicker({
  value,
  onChange,
  colors,
}: {
  value: Workout["difficulty"];
  onChange: (value: Workout["difficulty"]) => void;
  colors: ReturnType<typeof getThemePalette>;
}) {
  const { t } = useTranslation();
  return (
    <HStack className="flex-wrap" space="sm">
      {difficulties.map((option) => {
        const active = value === option;
        return (
          <Button
            key={option}
            variant={active ? "solid" : "outline"}
            action="primary"
            size="sm"
            onPress={() => onChange(option)}
            style={active ? { backgroundColor: colors.accent } : undefined}
          >
            <ButtonText style={active ? { color: colors.accentText } : undefined}>
              {option === "Beginner"
                ? t("workout.beginner")
                : option === "Intermediate"
                  ? t("workout.intermediate")
                  : t("workout.advanced")}
            </ButtonText>
          </Button>
        );
      })}
    </HStack>
  );
}

export function TextInputBlock({
  value,
  onChangeText,
  placeholder,
  colors,
  keyboardType,
  className,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: ReturnType<typeof getThemePalette>;
  keyboardType?: "default" | "numeric";
  className?: string;
}) {
  return (
    <Input
      size="lg"
      className={className}
      style={{ borderColor: colors.border, backgroundColor: colors.background }}
    >
      <InputField
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </Input>
  );
}

export function AdminInfoCard({
  title,
  colors,
}: {
  title: string;
  colors: ReturnType<typeof getThemePalette>;
}) {
  return (
    <Box
      className="rounded-2xl border p-4"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <HStack className="items-center">
        <MaterialIcons name="info-outline" size={22} color={colors.icon} />
        <Text className="ml-3" style={{ color: colors.textMuted }}>
          {title}
        </Text>
      </HStack>
    </Box>
  );
}
