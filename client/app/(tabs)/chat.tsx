import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable as RNPressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { PageHeader, SectionCard } from "@/components/app/design";
import { getThemePalette } from "@/lib/theme-palette";
import { api } from "@/services/api";
import {
  ChatMessage,
  getFitnessSystemPrompt,
  sendChatMessage,
} from "@/services/chatservice";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";

const toLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const getPastLocalDates = (days: number) => {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i));
    return toLocalDateString(date);
  });
};

const calculateMaintenanceCalories = (
  age?: number,
  weightKg?: number,
  heightCm?: number,
  gender?: "male" | "female" | "other",
) => {
  if (!age || !weightKg || !heightCm) return null;
  const genderOffset = gender === "female" ? -161 : gender === "male" ? 5 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset;
  return Math.round(bmr * 1.2);
};

export default function ChatScreen() {
  const { user, token } = useAuthStore();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: t("chat.greeting"),
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyAvgCalories, setWeeklyAvgCalories] = useState<number | null>(null);
  const [weeklyCalorieDelta, setWeeklyCalorieDelta] = useState<number | null>(null);
  const [weeklyCalorieStatus, setWeeklyCalorieStatus] = useState<
    "surplus" | "deficit" | "on_track" | null
  >(null);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: t("chat.greeting"),
        timestamp: new Date(),
      },
    ]);
    setWeeklyAvgCalories(null);
    setWeeklyCalorieDelta(null);
    setWeeklyCalorieStatus(null);
  }, [user?.id, t]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const loadWeeklyTrend = async () => {
      if (!token) return;

      const dates = getPastLocalDates(7);
      try {
        const responses = await Promise.all(
          dates.map((date) => api.getDailyLogs(date, token)),
        );
        const totals = responses.map((response) => {
          const logs = response.success && response.data ? response.data.logs || [] : [];
          return logs.reduce((sum, log) => sum + Number(log.calories || 0), 0);
        });
        if (totals.length === 0) return;

        const avg = Math.round(
          totals.reduce((sum, value) => sum + value, 0) / totals.length,
        );
        const maintenance = calculateMaintenanceCalories(
          user?.age,
          user?.weight,
          user?.height,
          user?.gender,
        );

        setWeeklyAvgCalories(avg);

        if (maintenance) {
          const delta = avg - maintenance;
          setWeeklyCalorieDelta(delta);
          if (Math.abs(delta) <= 150) setWeeklyCalorieStatus("on_track");
          else if (delta > 0) setWeeklyCalorieStatus("surplus");
          else setWeeklyCalorieStatus("deficit");
        }
      } catch (error) {
        console.error("Failed to load weekly calorie trend for chat context:", error);
      }
    };

    loadWeeklyTrend();
  }, [token, user?.age, user?.weight, user?.height]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        [...messages, userMessage],
        getFitnessSystemPrompt({
          name: user?.name,
          weight: user?.weight,
          height: user?.height,
          age: user?.age,
          goals: user?.goals,
          gender: user?.gender,
          weeklyAvgCalories: weeklyAvgCalories ?? undefined,
          weeklyCalorieDelta: weeklyCalorieDelta ?? undefined,
          weeklyCalorieStatus: weeklyCalorieStatus ?? undefined,
        }),
      );

      if (response.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("chat.errorMessage", { error: response.error }),
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.message,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("chat.genericError"),
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";

    return (
      <Box
        className={`mb-4 ${isUser ? "items-end" : "items-start"}`}
        style={{ paddingHorizontal: 16 }}
      >
        <Box
          className="max-w-[80%] p-4 rounded-2xl border"
          style={{
            backgroundColor: isUser ? colors.accent : colors.surface,
            borderColor: isUser ? colors.accent : colors.border,
          }}
        >
          <Text
            className="text-base"
            style={{ color: isUser ? colors.accentText : colors.text }}
          >
            {item.content}
          </Text>
        </Box>
      </Box>
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
      style={{ backgroundColor: colors.background }}
    >
      <Box className="px-4 pt-3">
        <PageHeader
          title={t("chat.aiCoach")}
          subtitle={t("chat.poweredBy")}
          icon="chat"
        />
      </Box>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: Platform.OS === "ios" ? 120 : 100,
          }}
          showsVerticalScrollIndicator={false}
        />

        <Box className="mx-4 mb-3" style={{ marginBottom: Platform.OS === "ios" ? 90 : 0 }}>
          <SectionCard>
            <HStack space="sm" className="items-center">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={t("chat.placeholder")}
              placeholderTextColor={colors.textSubtle}
              className="flex-1 px-4 py-3 rounded-2xl border"
              style={{
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
              }}
              multiline
              maxLength={500}
              editable={!isLoading}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <RNPressable
              onPress={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className="p-3 rounded-2xl"
              style={{
                backgroundColor:
                  isLoading || !inputText.trim() ? colors.surfaceAlt : colors.accent,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <MaterialIcons
                  name="send"
                  size={24}
                  color={!inputText.trim() ? colors.textSubtle : colors.accentText}
                />
              )}
            </RNPressable>
            </HStack>
          </SectionCard>
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
