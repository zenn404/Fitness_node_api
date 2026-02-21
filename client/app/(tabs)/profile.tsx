import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { changeLanguage } from "@/lib/i18n";
import { useAuthStore } from "@/store/auth-store";

const GOALS = [
  { id: "lose_weight", icon: "🔥", labelKey: "onboarding.goalLoseWeight" },
  { id: "build_muscle", icon: "💪", labelKey: "onboarding.goalBuildMuscle" },
  { id: "stay_fit", icon: "🏃", labelKey: "onboarding.goalStayFit" },
  { id: "improve_endurance", icon: "❤️", labelKey: "onboarding.goalEndurance" },
  { id: "flexibility", icon: "🧘", labelKey: "onboarding.goalFlexibility" },
  { id: "general_health", icon: "🍏", labelKey: "onboarding.goalHealth" },
];

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [showEditSheet, setShowEditSheet] = useState(false);

  const handleLogout = () => {
    Alert.alert(t("profile.logout"), t("profile.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleLanguageSwitch = () => {
    Alert.alert(t("profile.language"), "", [
      {
        text: t("profile.english"),
        onPress: () => changeLanguage("en"),
      },
      {
        text: t("profile.thai"),
        onPress: () => changeLanguage("th"),
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const currentLanguageLabel =
    i18n.language === "th" ? t("profile.thai") : t("profile.english");

  const goalLabel = GOALS.find((g) => g.id === user?.goals)?.labelKey || "";

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Heading size="2xl" className="mt-4 mb-6">
          {t("profile.title")}
        </Heading>

        {/* User Avatar and Info */}
        <VStack className="items-center mb-8">
          <Box className="justify-center items-center bg-primary-500 mb-4 rounded-full w-24 h-24">
            <Text className="font-bold text-gray-900 text-4xl">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </Box>

          <Heading size="xl">{user?.name || "User"}</Heading>

          <Text className="text-gray-400">
            {user?.email || t("profile.noEmail")}
          </Text>

          {user?.age && (
            <HStack space="lg" className="mt-4">
              <VStack className="items-center">
                <Text className="font-bold text-lg">{user.age}</Text>
                <Text className="text-gray-400 text-xs">
                  {t("profile.age")}
                </Text>
              </VStack>
              <Box className="bg-gray-700 w-px h-full" />
              <VStack className="items-center">
                <Text className="font-bold text-lg">{user.height} cm</Text>
                <Text className="text-gray-400 text-xs">
                  {t("profile.height")}
                </Text>
              </VStack>
              <Box className="bg-gray-700 w-px h-full" />
              <VStack className="items-center">
                <Text className="font-bold text-lg">{user.weight} kg</Text>
                <Text className="text-gray-400 text-xs">
                  {t("profile.weight")}
                </Text>
              </VStack>
            </HStack>
          )}

          {goalLabel && (
            <Box className="bg-primary-500/20 px-4 py-1.5 mt-3 rounded-full">
              <Text className="text-primary-500 font-semibold text-sm">
                🎯 {t(goalLabel)}
              </Text>
            </Box>
          )}
        </VStack>

        {/* Menu Items */}
        <VStack space="sm" className="mb-8">
          <MenuItem
            icon="person"
            title={t("profile.editProfile")}
            onPress={() => setShowEditSheet(true)}
          />
          <MenuItem
            icon="notifications"
            title={t("profile.notifications")}
            onPress={() =>
              Alert.alert(t("common.comingSoon"), t("common.comingSoonMessage"))
            }
          />
          <MenuItem
            icon="language"
            title={t("profile.language")}
            subtitle={currentLanguageLabel}
            onPress={handleLanguageSwitch}
          />
        </VStack>

        {/* Logout Button */}
        <Button
          size="lg"
          className="bg-red-500 rounded-xl"
          onPress={handleLogout}
          disabled={isLoading}
        >
          <HStack space="sm" className="items-center">
            <MaterialIcons name="logout" size={20} color="white" />
            <ButtonText>{t("profile.logout")}</ButtonText>
          </HStack>
        </Button>
      </ScrollView>

      {/* Edit Profile ActionSheet */}
      <EditProfileSheet
        isOpen={showEditSheet}
        onClose={() => setShowEditSheet(false)}
      />
    </SafeAreaView>
  );
}

function EditProfileSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, updateProfile, isLoading } = useAuthStore();
  const { t } = useTranslation();

  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age?.toString() || "");
  const [weight, setWeight] = useState(user?.weight?.toString() || "");
  const [height, setHeight] = useState(user?.height?.toString() || "");
  const [selectedGoal, setSelectedGoal] = useState(user?.goals || "");

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || "");
      setAge(user.age?.toString() || "");
      setWeight(user.weight?.toString() || "");
      setHeight(user.height?.toString() || "");
      setSelectedGoal(user.goals || "");
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("profile.nameRequired"));
      return;
    }

    const updateData: Record<string, any> = { name: name.trim() };

    if (age) {
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 120) {
        Alert.alert(t("common.error"), t("onboarding.invalidAge"));
        return;
      }
      updateData.age = parsedAge;
    }

    if (weight) {
      const parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight) || parsedWeight < 20 || parsedWeight > 300) {
        Alert.alert(t("common.error"), t("onboarding.invalidWeight"));
        return;
      }
      updateData.weight = parsedWeight;
    }

    if (height) {
      const parsedHeight = parseFloat(height);
      if (isNaN(parsedHeight) || parsedHeight < 50 || parsedHeight > 300) {
        Alert.alert(t("common.error"), t("onboarding.invalidHeight"));
        return;
      }
      updateData.height = parsedHeight;
    }

    if (selectedGoal) {
      updateData.goals = selectedGoal;
    }

    const success = await updateProfile(updateData);

    if (success) {
      onClose();
    }
  };

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop className="bg-black/60" />
      <ActionsheetContent className="border-t border-gray-800 max-h-[85%]">
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator className="bg-gray-600" />
        </ActionsheetDragIndicatorWrapper>

        {/* Header */}
        <HStack className="justify-between items-center w-full px-1 mb-4">
          <Pressable onPress={onClose}>
            <Text className="text-gray-400">{t("common.cancel")}</Text>
          </Pressable>
          <Heading size="md">{t("profile.editProfile")}</Heading>
          <Pressable onPress={handleSave} disabled={isLoading}>
            {isLoading ? (
              <ButtonSpinner color="#C0EB6A" />
            ) : (
              <Text className="text-primary-500 font-semibold">
                {t("profile.save")}
              </Text>
            )}
          </Pressable>
        </HStack>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="w-full"
        >
          <ScrollView
            className="w-full"
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <VStack space="lg" className="w-full">
              {/* Name */}
              <VStack space="xs">
                <Text className="text-gray-400">{t("auth.fullName")}</Text>
                <Input size="xl">
                  <InputField
                    placeholder={t("auth.enterName")}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </Input>
              </VStack>

              {/* Age */}
              <VStack space="xs">
                <Text className="text-gray-400">{t("onboarding.age")}</Text>
                <Input size="xl">
                  <InputField
                    placeholder={t("onboarding.enterAge")}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                  />
                </Input>
              </VStack>

              {/* Height */}
              <VStack space="xs">
                <Text className="text-gray-400">
                  {t("onboarding.height")} (cm)
                </Text>
                <Input size="xl">
                  <InputField
                    placeholder={t("onboarding.enterHeight")}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="decimal-pad"
                  />
                </Input>
              </VStack>

              {/* Weight */}
              <VStack space="xs">
                <Text className="text-gray-400">
                  {t("onboarding.weight")} (kg)
                </Text>
                <Input size="xl">
                  <InputField
                    placeholder={t("onboarding.enterWeight")}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                  />
                </Input>
              </VStack>

              {/* Goals */}
              <VStack space="xs">
                <Text className="text-gray-400">
                  {t("profile.fitnessGoal")}
                </Text>
                <HStack className="flex-wrap justify-between">
                  {GOALS.map((goal) => {
                    const isSelected = selectedGoal === goal.id;

                    return (
                      <Pressable
                        key={goal.id}
                        onPress={() => setSelectedGoal(goal.id)}
                        className="w-[48%] mb-3"
                      >
                        <Box
                          className={`items-center p-3 rounded-2xl border-2 ${
                            isSelected
                              ? "bg-primary-500/20 border-primary-500"
                              : "bg-gray-900 border-gray-800"
                          }`}
                        >
                          <Text className="text-2xl mb-1">{goal.icon}</Text>
                          <Text
                            className={`text-center font-medium text-xs ${
                              isSelected ? "text-primary-500" : "text-white"
                            }`}
                          >
                            {t(goal.labelKey)}
                          </Text>
                        </Box>
                      </Pressable>
                    );
                  })}
                </HStack>
              </VStack>
            </VStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </ActionsheetContent>
    </Actionsheet>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <HStack className="justify-between items-center bg-gray-900 p-4 border border-gray-800 rounded-2xl">
        <HStack space="md" className="items-center">
          <Box className="bg-gray-800 p-2 rounded-xl">
            <MaterialIcons name={icon as any} size={22} color="#9ca3af" />
          </Box>
          <VStack>
            <Text className="font-medium">{title}</Text>
            {subtitle && (
              <Text className="text-gray-400 text-sm">{subtitle}</Text>
            )}
          </VStack>
        </HStack>
        <MaterialIcons name="chevron-right" size={22} color="#6b7280" />
      </HStack>
    </Pressable>
  );
}