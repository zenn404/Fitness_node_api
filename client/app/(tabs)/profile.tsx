import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
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
import { getThemePalette } from "@/lib/theme-palette";
import {
  FavoriteWorkout,
  ProfilePrefs,
  getProfilePrefs,
  toggleFavoriteWorkout,
} from "@/lib/profile-prefs";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { AppTheme, useThemeStore } from "@/store/theme-store";

const GOALS = [
  { id: "lose_weight", icon: "🔥", labelKey: "onboarding.goalLoseWeight" },
  { id: "build_muscle", icon: "💪", labelKey: "onboarding.goalBuildMuscle" },
  { id: "stay_fit", icon: "🏃", labelKey: "onboarding.goalStayFit" },
  { id: "improve_endurance", icon: "❤️", labelKey: "onboarding.goalEndurance" },
  { id: "flexibility", icon: "🧘", labelKey: "onboarding.goalFlexibility" },
  { id: "general_health", icon: "🍏", labelKey: "onboarding.goalHealth" },
];

const getAchievementTier = (workouts: number) => {
  if (workouts >= 15) {
    return { labelKey: "home.goldMedal", icon: "🥇", color: "#facc15" };
  }
  if (workouts >= 10) {
    return { labelKey: "home.silverMedal", icon: "🥈", color: "#d1d5db" };
  }
  if (workouts >= 5) {
    return { labelKey: "home.bronzeMedal", icon: "🥉", color: "#d97706" };
  }
  return { labelKey: "home.noMedalYet", icon: "🏅", color: "#6b7280" };
};

export default function ProfileScreen() {
  const { user, token, logout, isLoading, changePassword, deleteAccount } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === "dark";
  const colors = getThemePalette(theme);
  const { t, i18n } = useTranslation();
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showAchievementSheet, setShowAchievementSheet] = useState(false);
  const [showFavoritesSheet, setShowFavoritesSheet] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  const [prefs, setPrefs] = useState<ProfilePrefs>({
    calorieMode: "maintenance",
    calorieTarget: undefined,
    favoriteWorkouts: [],
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadPrefs = useCallback(async () => {
    const stored = await getProfilePrefs();
    setPrefs(stored);
  }, []);

  const loadProgress = useCallback(async () => {
    if (!token) return;
    const response = await api.getProgressData(token);
    if (response.success && response.data) {
      setTotalWorkouts(response.data.totalStats.workouts || 0);
    }
  }, [token]);

  useEffect(() => {
    loadPrefs();
    loadProgress();
  }, [loadPrefs, loadProgress]);

  useFocusEffect(
    useCallback(() => {
      loadPrefs();
      loadProgress();
    }, [loadPrefs, loadProgress]),
  );

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
    setShowLanguageSheet(true);
  };

  const handleThemeSwitch = () => {
    setShowThemeSheet(true);
  };

  const handleSelectTheme = async (nextTheme: AppTheme) => {
    await setTheme(nextTheme);
    setShowThemeSheet(false);
  };

  const handleRemoveFavorite = async (fav: FavoriteWorkout) => {
    const next = await toggleFavoriteWorkout(fav);
    setPrefs(next);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordsNotMatch"));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t("common.error"), t("auth.passwordMinLength"));
      return;
    }

    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert(t("profile.changePassword"), t("profile.passwordChanged"));
    } else {
      Alert.alert(t("common.error"), t("profile.changePasswordFailed"));
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(t("profile.deleteAccount"), t("profile.deleteAccountConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.deleteAccount"),
        style: "destructive",
        onPress: async () => {
          const success = await deleteAccount();
          if (success) {
            router.replace("/(auth)/login");
          } else {
            Alert.alert(t("common.error"), t("profile.deleteAccountFailed"));
          }
        },
      },
    ]);
  };

  const currentLanguageLabel =
    i18n.language === "th"
      ? t("profile.thai")
      : i18n.language === "zh"
        ? t("profile.chinese")
        : t("profile.english");
  const currentThemeLabel =
    theme === "dark" ? t("profile.darkTheme") : t("profile.lightTheme");

  const goalLabel = GOALS.find((g) => g.id === user?.goals)?.labelKey || "";
  const currentTier = getAchievementTier(totalWorkouts);
  const nextMilestone =
    totalWorkouts < 5 ? 5 : totalWorkouts < 10 ? 10 : totalWorkouts < 15 ? 15 : null;
  const progressPercent =
    totalWorkouts < 5
      ? (totalWorkouts / 5) * 100
      : totalWorkouts < 10
        ? ((totalWorkouts - 5) / 5) * 100
        : totalWorkouts < 15
          ? ((totalWorkouts - 10) / 5) * 100
          : 100;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Heading size="2xl" className="mt-4 mb-6" style={{ color: colors.text }}>
          {t("profile.title")}
        </Heading>

        <VStack className="items-center mb-8">
          <Box className="justify-center items-center mb-4 rounded-full w-24 h-24" style={{ backgroundColor: colors.accent }}>
            <Text className="font-bold text-4xl" style={{ color: colors.accentText }}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </Box>

          <Heading size="xl" style={{ color: colors.text }}>{user?.name || "User"}</Heading>

          <Text style={{ color: colors.textMuted }}>
            {user?.email || t("profile.noEmail")}
          </Text>

          {user?.age && (
            <HStack space="lg" className="mt-4">
              <VStack className="items-center">
                <Text className="font-bold text-lg">{user.age}</Text>
                <Text className="text-xs" style={{ color: colors.textSubtle }}>
                  {t("profile.age")}
                </Text>
              </VStack>
              <Box className="w-px h-full" style={{ backgroundColor: colors.border }} />
              <VStack className="items-center">
                <Text className="font-bold text-lg">{user.height} cm</Text>
                <Text className="text-xs" style={{ color: colors.textSubtle }}>
                  {t("profile.height")}
                </Text>
              </VStack>
              <Box className="w-px h-full" style={{ backgroundColor: colors.border }} />
              <VStack className="items-center">
                <Text className="font-bold text-lg">{user.weight} kg</Text>
                <Text className="text-xs" style={{ color: colors.textSubtle }}>
                  {t("profile.weight")}
                </Text>
              </VStack>
            </HStack>
          )}

          {goalLabel && (
            <Box className="px-4 py-1.5 mt-3 rounded-full" style={{ backgroundColor: colors.accentSoft }}>
              <Text className="font-semibold text-sm" style={{ color: colors.accent }}>
                🎯 {t(goalLabel)}
              </Text>
            </Box>
          )}
        </VStack>

        <VStack space="sm" className="mb-8">
          <MenuItem
            icon="person"
            title={t("profile.editProfile")}
            onPress={() => setShowEditSheet(true)}
          />
          <MenuItem
            icon="emoji-events"
            title={t("profile.achievement")}
            subtitle={t(currentTier.labelKey)}
            onPress={() => setShowAchievementSheet(true)}
          />
          <MenuItem
            icon="favorite"
            title={t("profile.favoriteWorkouts")}
            subtitle={t("profile.favoriteCount", { count: prefs.favoriteWorkouts.length })}
            onPress={() => setShowFavoritesSheet(true)}
          />
          <MenuItem
            icon="lock"
            title={t("profile.privacyAccount")}
            onPress={() => setShowAccountSheet(true)}
          />
          <MenuItem
            icon="contrast"
            title={t("profile.appearance")}
            subtitle={currentThemeLabel}
            onPress={handleThemeSwitch}
          />
          <MenuItem
            icon="language"
            title={t("profile.language")}
            subtitle={currentLanguageLabel}
            onPress={handleLanguageSwitch}
          />
        </VStack>

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

      <EditProfileSheet
        isOpen={showEditSheet}
        onClose={() => setShowEditSheet(false)}
      />

      <Actionsheet
        isOpen={showAchievementSheet}
        onClose={() => setShowAchievementSheet(false)}
      >
        <ActionsheetBackdrop className="bg-black/50" />
        <ActionsheetContent className="max-h-[80%]" style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 }}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator style={{ backgroundColor: colors.textSubtle }} />
          </ActionsheetDragIndicatorWrapper>

          <VStack className="w-full" space="md">
            <Heading size="md" style={{ color: colors.text }}>{t("profile.achievement")}</Heading>

            <Box className="border rounded-2xl p-4" style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}>
              <HStack className="items-center justify-between">
                <VStack>
                  <Text className="text-xs" style={{ color: colors.textSubtle }}>{t("profile.currentBadge")}</Text>
                  <Text className="font-semibold" style={{ color: currentTier.color }}>
                    {t(currentTier.labelKey)}
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: colors.textSubtle }}>
                    {t("profile.totalWorkoutsCount", { count: totalWorkouts })}
                  </Text>
                </VStack>
                <Text className="text-4xl">{currentTier.icon}</Text>
              </HStack>
            </Box>

            {nextMilestone ? (
              <Box className="border rounded-2xl p-4" style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}>
                <Text className="text-xs mb-2" style={{ color: colors.textSubtle }}>{t("profile.progressToNext")}</Text>
                <Box className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.surface }}>
                  <Box
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: colors.accent,
                      width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                    }}
                  />
                </Box>
                <Text className="text-xs mt-2" style={{ color: colors.textSubtle }}>
                  {t("profile.nextMilestone", { count: nextMilestone })}
                </Text>
              </Box>
            ) : (
              <Box className="border rounded-2xl p-4" style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.accent }}>
                <Text className="font-semibold text-center" style={{ color: colors.accent }}>
                  {t("profile.topTierUnlocked")}
                </Text>
              </Box>
            )}

            <VStack space="sm">
              <AchievementRule icon="🏅" label={t("home.noMedalYet")} rule={t("profile.ruleNoMedal")} />
              <AchievementRule icon="🥉" label={t("home.bronzeMedal")} rule={t("profile.ruleBronze")} />
              <AchievementRule icon="🥈" label={t("home.silverMedal")} rule={t("profile.ruleSilver")} />
              <AchievementRule icon="🥇" label={t("home.goldMedal")} rule={t("profile.ruleGold")} />
            </VStack>
          </VStack>
        </ActionsheetContent>
      </Actionsheet>

      <Actionsheet isOpen={showFavoritesSheet} onClose={() => setShowFavoritesSheet(false)}>
        <ActionsheetBackdrop className="bg-black/50" />
        <ActionsheetContent className="max-h-[85%]" style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 }}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator style={{ backgroundColor: colors.textSubtle }} />
          </ActionsheetDragIndicatorWrapper>

          <VStack className="w-full" space="md">
            <Heading size="md" style={{ color: colors.text }}>{t("profile.favoriteWorkouts")}</Heading>

            {prefs.favoriteWorkouts.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>{t("profile.noFavoriteWorkouts")}</Text>
            ) : (
              <ScrollView className="w-full" contentContainerStyle={{ paddingBottom: 24 }}>
                <VStack space="sm" className="w-full">
                  {prefs.favoriteWorkouts.map((fav) => (
                    <HStack
                      key={fav.id}
                      className="items-center justify-between border rounded-xl p-3"
                      style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}
                    >
                      <Pressable
                        className="flex-1"
                        onPress={() => {
                          setShowFavoritesSheet(false);
                          router.push({
                            pathname: "/workout-detail",
                            params: { id: fav.id },
                          });
                        }}
                      >
                        <Text className="font-semibold">{fav.name}</Text>
                        <Text className="text-xs" style={{ color: colors.textMuted }}>
                          {fav.difficulty}
                          {typeof fav.duration_minutes === "number"
                            ? ` • ${fav.duration_minutes} ${t("common.min")}`
                            : ""}
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => handleRemoveFavorite(fav)}>
                        <MaterialIcons name="delete-outline" size={22} color={colors.danger} />
                      </Pressable>
                    </HStack>
                  ))}
                </VStack>
              </ScrollView>
            )}
          </VStack>
        </ActionsheetContent>
      </Actionsheet>

      <Actionsheet isOpen={showAccountSheet} onClose={() => setShowAccountSheet(false)}>
        <ActionsheetBackdrop className="bg-black/50" />
        <ActionsheetContent className="max-h-[90%]" style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 }}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator style={{ backgroundColor: colors.textSubtle }} />
          </ActionsheetDragIndicatorWrapper>

          <ScrollView className="w-full" contentContainerStyle={{ paddingBottom: 28 }}>
            <VStack className="w-full" space="md">
              <Heading size="md" style={{ color: colors.text }}>{t("profile.privacyAccount")}</Heading>

              <VStack space="xs">
                <Text style={{ color: colors.textMuted }}>{t("profile.currentPassword")}</Text>
                <Input size="xl">
                  <InputField
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder={t("profile.currentPassword")}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text style={{ color: colors.textMuted }}>{t("profile.newPassword")}</Text>
                <Input size="xl">
                  <InputField
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder={t("profile.newPassword")}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text style={{ color: colors.textMuted }}>{t("profile.confirmNewPassword")}</Text>
                <Input size="xl">
                  <InputField
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t("profile.confirmNewPassword")}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </Input>
              </VStack>

              <Button onPress={handleChangePassword} disabled={isLoading}>
                {isLoading ? <ButtonSpinner color="white" /> : <ButtonText>{t("profile.changePassword")}</ButtonText>}
              </Button>

              <Box className="border-t pt-4" style={{ borderTopColor: colors.border }}>
                <Text className="text-xs mb-2" style={{ color: colors.textMuted }}>{t("profile.deleteAccountWarning")}</Text>
                <Button
                  className="bg-red-500"
                  onPress={handleDeleteAccount}
                  disabled={isLoading}
                >
                  <ButtonText>{t("profile.deleteAccount")}</ButtonText>
                </Button>
              </Box>
            </VStack>
          </ScrollView>
        </ActionsheetContent>
      </Actionsheet>

      <Actionsheet
        isOpen={showLanguageSheet}
        onClose={() => setShowLanguageSheet(false)}
      >
        <ActionsheetBackdrop className="bg-black/50" />
        <ActionsheetContent style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 }}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator style={{ backgroundColor: colors.textSubtle }} />
          </ActionsheetDragIndicatorWrapper>

          <VStack className="w-full" space="md">
            <Heading size="md" style={{ color: colors.text }}>{t("profile.language")}</Heading>
            <Text className="text-sm" style={{ color: colors.textMuted }}>{t("profile.languageHelp")}</Text>

            <LanguageOption
              label={t("profile.english")}
              subtitle="English"
              selected={i18n.language === "en"}
              onPress={async () => {
                await changeLanguage("en");
                setShowLanguageSheet(false);
              }}
            />
            <LanguageOption
              label={t("profile.thai")}
              subtitle="ภาษาไทย"
              selected={i18n.language === "th"}
              onPress={async () => {
                await changeLanguage("th");
                setShowLanguageSheet(false);
              }}
            />
            <LanguageOption
              label={t("profile.chinese")}
              subtitle="中文"
              selected={i18n.language === "zh"}
              onPress={async () => {
                await changeLanguage("zh");
                setShowLanguageSheet(false);
              }}
            />
          </VStack>
        </ActionsheetContent>
      </Actionsheet>

      <Actionsheet
        isOpen={showThemeSheet}
        onClose={() => setShowThemeSheet(false)}
      >
        <ActionsheetBackdrop className="bg-black/50" />
        <ActionsheetContent style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 }}>
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator style={{ backgroundColor: colors.textSubtle }} />
          </ActionsheetDragIndicatorWrapper>

          <VStack className="w-full" space="md">
            <Heading size="md" style={{ color: colors.text }}>{t("profile.appearance")}</Heading>
            <Text className="text-sm" style={{ color: colors.textMuted }}>{t("profile.appearanceHelp")}</Text>
            <ThemeOption
              label={t("profile.darkTheme")}
              subtitle={t("profile.darkThemeDesc")}
              selected={theme === "dark"}
              onPress={() => handleSelectTheme("dark")}
            />
            <ThemeOption
              label={t("profile.lightTheme")}
              subtitle={t("profile.lightThemeDesc")}
              selected={theme === "light"}
              onPress={() => handleSelectTheme("light")}
            />
          </VStack>
        </ActionsheetContent>
      </Actionsheet>
    </SafeAreaView>
  );
}

function LanguageOption({
  label,
  subtitle,
  selected,
  onPress,
}: {
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  return (
    <Pressable onPress={onPress}>
      <HStack
        className="items-center justify-between rounded-2xl border p-4"
        style={{
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentSoft : colors.surfaceAlt,
        }}
      >
        <VStack>
          <Text className="font-semibold" style={{ color: selected ? colors.accent : colors.text }}>
            {label}
          </Text>
          <Text className="text-xs" style={{ color: colors.textMuted }}>{subtitle}</Text>
        </VStack>
        {selected && <MaterialIcons name="check-circle" size={22} color={colors.accent} />}
      </HStack>
    </Pressable>
  );
}

function ThemeOption({
  label,
  subtitle,
  selected,
  onPress,
}: {
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  return (
    <Pressable onPress={onPress}>
      <HStack
        className="items-center justify-between rounded-2xl border p-4"
        style={{
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentSoft : colors.surfaceAlt,
        }}
      >
        <VStack>
          <Text className="font-semibold" style={{ color: selected ? colors.accent : colors.text }}>
            {label}
          </Text>
          <Text className="text-xs" style={{ color: colors.textMuted }}>{subtitle}</Text>
        </VStack>
        {selected && <MaterialIcons name="check-circle" size={22} color={colors.accent} />}
      </HStack>
    </Pressable>
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
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
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
      <ActionsheetBackdrop className="bg-black/50" />
      <ActionsheetContent className="max-h-[85%]" style={{ backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 }}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator style={{ backgroundColor: colors.textSubtle }} />
        </ActionsheetDragIndicatorWrapper>

        <HStack className="justify-between items-center w-full px-1 mb-4">
          <Pressable onPress={onClose}>
            <Text style={{ color: colors.textMuted }}>{t("common.cancel")}</Text>
          </Pressable>
          <Heading size="md" style={{ color: colors.text }}>{t("profile.editProfile")}</Heading>
          <Pressable onPress={handleSave} disabled={isLoading}>
            {isLoading ? (
              <ButtonSpinner color={colors.accent} />
            ) : (
              <Text className="font-semibold" style={{ color: colors.accent }}>
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
              <VStack space="xs">
                <Text style={{ color: colors.textMuted }}>{t("auth.fullName")}</Text>
                <Input size="xl">
                  <InputField
                    placeholder={t("auth.enterName")}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text style={{ color: colors.textMuted }}>{t("onboarding.age")}</Text>
                <Input size="xl">
                  <InputField
                    placeholder={t("onboarding.enterAge")}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text style={{ color: colors.textMuted }}>
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

              <VStack space="xs">
                <Text style={{ color: colors.textMuted }}>
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

              <VStack space="xs">
                <Text style={{ color: colors.textMuted }}>
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
                          className="items-center p-3 rounded-2xl border-2"
                          style={{
                            backgroundColor: isSelected ? colors.accentSoft : colors.surfaceAlt,
                            borderColor: isSelected ? colors.accent : colors.border,
                          }}
                        >
                          <Text className="text-2xl mb-1">{goal.icon}</Text>
                          <Text className="text-center font-medium text-xs" style={{ color: isSelected ? colors.accent : colors.text }}>
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
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  return (
    <Pressable onPress={onPress}>
      <HStack className="justify-between items-center p-4 border rounded-2xl" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <HStack space="md" className="items-center">
          <Box className="p-2 rounded-xl" style={{ backgroundColor: colors.surfaceAlt }}>
            <MaterialIcons name={icon as any} size={22} color={colors.icon} />
          </Box>
          <VStack>
            <Text className="font-medium" style={{ color: colors.text }}>{title}</Text>
            {subtitle && (
              <Text className="text-sm" style={{ color: colors.textMuted }}>{subtitle}</Text>
            )}
          </VStack>
        </HStack>
        <MaterialIcons name="chevron-right" size={22} color={colors.textSubtle} />
      </HStack>
    </Pressable>
  );
}

function AchievementRule({
  icon,
  label,
  rule,
}: {
  icon: string;
  label: string;
  rule: string;
}) {
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  return (
    <HStack className="items-center justify-between border rounded-xl p-3" style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border }}>
      <HStack className="items-center" space="sm">
        <Text className="text-2xl">{icon}</Text>
        <VStack>
          <Text className="font-semibold" style={{ color: colors.text }}>{label}</Text>
          <Text className="text-xs" style={{ color: colors.textMuted }}>{rule}</Text>
        </VStack>
      </HStack>
    </HStack>
  );
}
