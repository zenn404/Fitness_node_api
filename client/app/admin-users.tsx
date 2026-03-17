import React, { useCallback, useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AdminHeader,
  TextInputBlock,
  UndoNotice,
} from "@/components/admin/admin-ui";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getThemePalette } from "@/lib/theme-palette";
import { api, User } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useTranslation } from "react-i18next";

export default function AdminUsersScreen() {
  const { t } = useTranslation();
  const { user, token } = useAuthStore();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteLabel, setPendingDeleteLabel] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    const response = await api.getAdminUsers(token);

    if (response.success && response.data) {
      setUsers(response.data.users);
    } else {
      setUsers([]);
      setError(response.message || t("admin.failedLoadUsers"));
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [token]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("user");
    setGender("male");
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!pendingDeleteId || !token) {
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      const userId = pendingDeleteId;
      setPendingDeleteId(null);
      setPendingDeleteLabel(null);
      const response = await api.deleteAdminUser(token, userId);
      if (!response.success) {
        setError(response.message || t("admin.failedDeleteUser"));
      }
      await loadUsers();
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [loadUsers, pendingDeleteId, token]);

  if (user?.role !== "admin") {
    return null;
  }

  const handleCreateUser = async () => {
    if (!token) return;
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert(t("admin.missingFields"), t("admin.enterUserFields"));
      return;
    }

    setIsSaving(true);
    const response = await api.createAdminUser(token, {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      gender,
    });
    setIsSaving(false);

    if (!response.success) {
      setError(response.message || t("admin.failedCreateUser"));
      return;
    }

    resetForm();
    await loadUsers();
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadUsers(true)}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <AdminHeader title={t("admin.users")} colors={colors} />

        <Box className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Heading size="md" style={{ color: colors.text }}>
            {isLoading ? t("admin.loadingUsers") : t("admin.registeredUsers", { count: users.length })}
          </Heading>
          {error ? (
            <Text className="mt-2" style={{ color: colors.danger }}>
              {error}
            </Text>
          ) : null}
        </Box>

        {pendingDeleteId && pendingDeleteLabel ? (
          <UndoNotice
            title={t("admin.userQueuedDelete")}
            description={t("admin.userDeleteInSeconds", { email: pendingDeleteLabel })}
            onUndo={() => {
              setPendingDeleteId(null);
              setPendingDeleteLabel(null);
            }}
            colors={colors}
          />
        ) : null}

        <Box className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <Heading size="md" style={{ color: colors.text }}>
            {t("admin.addUser")}
          </Heading>
          <Text className="mt-2" style={{ color: colors.textMuted }}>
            {t("admin.addUserHelp")}
          </Text>

          <VStack space="sm" className="mt-4">
            <TextInputBlock value={name} onChangeText={setName} placeholder={t("admin.fullName")} colors={colors} />
            <TextInputBlock value={email} onChangeText={setEmail} placeholder={t("auth.email")} colors={colors} />
            <TextInputBlock value={password} onChangeText={setPassword} placeholder={t("auth.password")} colors={colors} />

            <HStack space="sm">
              <Button
                variant={role === "user" ? "solid" : "outline"}
                action="primary"
                size="sm"
                onPress={() => setRole("user")}
                style={role === "user" ? { backgroundColor: colors.accent } : undefined}
              >
                <ButtonText style={role === "user" ? { color: colors.accentText } : undefined}>
                  {t("admin.newUser")}
                </ButtonText>
              </Button>
              <Button
                variant={role === "admin" ? "solid" : "outline"}
                action="primary"
                size="sm"
                onPress={() => setRole("admin")}
                style={role === "admin" ? { backgroundColor: colors.accent } : undefined}
              >
                <ButtonText style={role === "admin" ? { color: colors.accentText } : undefined}>
                  {t("admin.newAdmin")}
                </ButtonText>
              </Button>
            </HStack>

            <Text className="mt-1" style={{ color: colors.textMuted }}>
              {t("admin.gender")}
            </Text>
            <HStack space="sm" className="flex-wrap">
              <Button
                variant={gender === "male" ? "solid" : "outline"}
                action="primary"
                size="sm"
                onPress={() => setGender("male")}
                style={gender === "male" ? { backgroundColor: colors.accent } : undefined}
              >
                <ButtonText style={gender === "male" ? { color: colors.accentText } : undefined}>
                  {t("admin.male")}
                </ButtonText>
              </Button>
              <Button
                variant={gender === "female" ? "solid" : "outline"}
                action="primary"
                size="sm"
                onPress={() => setGender("female")}
                style={gender === "female" ? { backgroundColor: colors.accent } : undefined}
              >
                <ButtonText style={gender === "female" ? { color: colors.accentText } : undefined}>
                  {t("admin.female")}
                </ButtonText>
              </Button>
              <Button
                variant={gender === "other" ? "solid" : "outline"}
                action="primary"
                size="sm"
                onPress={() => setGender("other")}
                style={gender === "other" ? { backgroundColor: colors.accent } : undefined}
              >
                <ButtonText style={gender === "other" ? { color: colors.accentText } : undefined}>
                  {t("admin.other")}
                </ButtonText>
              </Button>
            </HStack>

            <Button onPress={handleCreateUser} disabled={isSaving} style={{ backgroundColor: colors.accent }}>
              {isSaving ? (
                <ButtonSpinner color={colors.accentText} />
              ) : (
                <ButtonText style={{ color: colors.accentText }}>
                  {t("admin.createAccount")}
                </ButtonText>
              )}
            </Button>
          </VStack>
        </Box>

        <VStack space="md">
          {!isLoading &&
            users.map((item) => (
              <Box key={item.id} className="rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <HStack className="items-start justify-between">
                  <VStack className="flex-1 pr-3">
                    <Heading size="md" style={{ color: colors.text }}>{item.name}</Heading>
                    <Text className="mt-1" style={{ color: colors.textMuted }}>{item.email}</Text>
                    <Text className="mt-2 text-xs" style={{ color: colors.textSubtle }}>
                      {t("admin.goal")}: {item.goals || t("admin.notSet")} • {t("admin.role")}: {item.role || "user"}
                    </Text>
                  </VStack>
                  <Box className="rounded-full px-3 py-2" style={{ backgroundColor: item.role === "admin" ? colors.accent : colors.surfaceAlt }}>
                    <Text className="font-semibold" style={{ color: item.role === "admin" ? colors.accentText : colors.text }}>
                      {item.role === "admin" ? "ADMIN" : "USER"}
                    </Text>
                  </Box>
                </HStack>
                {item.id !== user.id ? (
                  <Button
                    className="mt-4 self-start"
                    action="negative"
                    size="sm"
                    onPress={() => {
                      setPendingDeleteId(item.id);
                      setPendingDeleteLabel(item.email);
                    }}
                  >
                      <ButtonText>{t("admin.deleteUser")}</ButtonText>
                  </Button>
                ) : (
                  <Text className="mt-4 text-xs" style={{ color: colors.textSubtle }}>
                    {t("admin.currentAccount")}
                  </Text>
                )}
              </Box>
            ))}
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
