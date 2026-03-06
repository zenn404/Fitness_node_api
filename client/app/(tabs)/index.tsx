import React, { useEffect, useState } from "react";
import {
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { useRouter } from "expo-router";
import { PageHeader, SectionCard } from "@/components/app/design";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { getThemePalette } from "@/lib/theme-palette";
import { api, DashboardStats, Activity, DailyLog } from "@/services/api";
import { useTranslation } from "react-i18next";

const toLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const calculateMaintenanceCalories = (
  age?: number,
  weightKg?: number,
  heightCm?: number,
  gender?: "male" | "female" | "other",
) => {
  if (!age || !weightKg || !heightCm) {
    return null;
  }

  const genderOffset = gender === "female" ? -161 : gender === "male" ? 5 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset;
  return Math.round(bmr * 1.2);
};

type CalorieTrendPoint = {
  date: string;
  label: string;
  consumed: number;
  maintenance: number | null;
};

const getPastLocalDates = (days: number) => {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - i));
    return toLocalDateString(date);
  });
};

const formatWeekday = (dateStr: string) =>
  new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });

const buildSmoothPath = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const controlX = (prev.x + curr.x) / 2;
    path += ` Q ${controlX} ${prev.y}, ${curr.x} ${curr.y}`;
  }
  return path;
};

function CalorieTrendChart({
  data,
  gridColor,
  labelColor,
}: {
  data: CalorieTrendPoint[];
  gridColor: string;
  labelColor: string;
}) {
  const chartWidth = Math.max(280, Dimensions.get("window").width - 64);
  const chartHeight = 160;
  const paddingTop = 16;
  const paddingBottom = 26;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  const maxY = Math.max(
    1,
    ...data.map((p) => p.consumed),
    ...data.map((p) => p.maintenance || 0),
  );

  const points = data.map((p, i) => ({
    x: i * xStep,
    y: paddingTop + usableHeight - (p.consumed / maxY) * usableHeight,
  }));

  const trendPath = buildSmoothPath(points);

  return (
    <VStack>
      <Svg width={chartWidth} height={chartHeight}>
        <Line
          x1={0}
          y1={paddingTop + usableHeight}
          x2={chartWidth}
          y2={paddingTop + usableHeight}
          stroke={gridColor}
          strokeWidth={1}
        />
        <Path
          d={trendPath}
          stroke="#86efac"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />

        {points.map((point, idx) => {
          const maintenance = data[idx].maintenance;
          const consumed = data[idx].consumed;
          const markerColor =
            maintenance === null
              ? "#86efac"
              : consumed > maintenance
                ? "#f59e0b"
                : consumed < maintenance
                  ? "#38bdf8"
                  : "#86efac";
          const maintenanceY =
            maintenance === null
              ? null
              : paddingTop + usableHeight - (maintenance / maxY) * usableHeight;

          return (
            <React.Fragment key={data[idx].date}>
              {maintenanceY !== null && (
                <Line
                  x1={point.x}
                  y1={maintenanceY}
                  x2={point.x}
                  y2={point.y}
                  stroke={gridColor}
                  strokeWidth={1}
                  strokeDasharray="2,3"
                />
              )}
              <Circle cx={point.x} cy={point.y} r={4} fill={markerColor} />
            </React.Fragment>
          );
        })}
      </Svg>

      <HStack className="mt-1 justify-between">
        {data.map((point) => (
          <Text key={point.date} className="text-[10px]" style={{ color: labelColor }}>
            {point.label}
          </Text>
        ))}
      </HStack>
    </VStack>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const colors = getThemePalette(theme);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [foodLogs, setFoodLogs] = useState<DailyLog[]>([]);
  const [calorieTrend, setCalorieTrend] = useState<CalorieTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = user?.name?.split(" ")[0] || t("home.userFallback");
  const maintenanceCalories = calculateMaintenanceCalories(
    user?.age,
    user?.weight,
    user?.height,
    user?.gender,
  );
  const todayCaloriesConsumed = foodLogs.reduce(
    (sum, log) => sum + Number(log.calories || 0),
    0,
  );
  const cutCalories = maintenanceCalories
    ? Math.max(1200, Math.round(maintenanceCalories - 350))
    : null;
  const bulkCalories = maintenanceCalories
    ? Math.round(maintenanceCalories + 250)
    : null;
  const comparisonTarget = maintenanceCalories;
  const calorieDelta = comparisonTarget
    ? Math.round(todayCaloriesConsumed - comparisonTarget)
    : null;
  const calorieStatusLabel =
    calorieDelta === null
      ? "Set age, weight, and height to see surplus/deficit."
      : calorieDelta > 0
        ? `Calorie Surplus: +${calorieDelta} kcal`
        : calorieDelta < 0
          ? `Calorie Deficit: ${calorieDelta} kcal`
          : "At maintenance level";
  const weeklyWithMaintenance = calorieTrend.filter(
    (point) => point.maintenance !== null,
  );
  const weeklyAvgConsumed =
    weeklyWithMaintenance.length > 0
      ? Math.round(
          weeklyWithMaintenance.reduce((sum, point) => sum + point.consumed, 0) /
            weeklyWithMaintenance.length,
        )
      : null;
  const weeklyAvgMaintenance =
    weeklyWithMaintenance.length > 0 && weeklyWithMaintenance[0].maintenance
      ? Math.round(weeklyWithMaintenance[0].maintenance as number)
      : null;
  const weeklyDelta =
    weeklyAvgConsumed !== null && weeklyAvgMaintenance !== null
      ? weeklyAvgConsumed - weeklyAvgMaintenance
      : null;
  const weeklyStatus =
    weeklyDelta === null
      ? t("home.weeklyStatusNeedProfile")
      : Math.abs(weeklyDelta) <= 150
        ? t("home.weeklyStatusOnTrack")
        : weeklyDelta > 0
          ? t("home.weeklyStatusSurplus", { value: weeklyDelta })
          : t("home.weeklyStatusDeficit", { value: Math.abs(weeklyDelta) });

  useEffect(() => {
    setStats(null);
    setActivities([]);
    setFoodLogs([]);
    setCalorieTrend([]);
    fetchDashboardData();
  }, [token, user?.id]);

  const fetchDashboardData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    if (!token) {
      setStats(null);
      setActivities([]);
      setFoodLogs([]);
      setCalorieTrend([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const today = toLocalDateString(new Date());
      const trendDates = getPastLocalDates(7);

      const [statsResponse, activityResponse, logsResponse, trendResponses] =
        await Promise.all([
          api.getDashboardStats(token),
          api.getRecentActivity(token, 5),
          api.getDailyLogs(today, token),
          Promise.all(trendDates.map((date) => api.getDailyLogs(date, token))),
        ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (activityResponse.success && activityResponse.data) {
        setActivities(activityResponse.data.activities);
      }

      if (logsResponse.success && logsResponse.data) {
        setFoodLogs(logsResponse.data.logs || []);
      }

      const trend = trendDates.map((date, index) => {
        const response = trendResponses[index];
        const logs =
          response.success && response.data ? response.data.logs || [] : [];
        const consumed = logs.reduce(
          (sum, log) => sum + Number(log.calories || 0),
          0,
        );
        return {
          date,
          label: formatWeekday(date),
          consumed: Math.round(consumed),
          maintenance: maintenanceCalories,
        };
      });
      setCalorieTrend(trend);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleQuickWorkout = () => {
    router.push("/(tabs)/workout");
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <PageHeader
          title={`${firstName} 👋`}
          subtitle={t("home.welcomeBack")}
          icon="home"
        />

        {isLoading && (
          <Box className="justify-center items-center py-10">
            <ActivityIndicator size="large" color={colors.accent} />
          </Box>
        )}

        {!isLoading && (
          <SectionCard className="mb-6">
            <Text className="mb-3" style={{ color: colors.textMuted }}>{t("home.todaysProgress")}</Text>
            <HStack space="md">
              <VStack className="flex-1 items-center rounded-2xl p-3" style={{ backgroundColor: colors.surfaceAlt }}>
                <MaterialIcons
                  name="fitness-center"
                  size={24}
                  color={colors.accent}
                />
                <Text className="mt-1 font-bold text-lg">
                  {stats?.today.workouts || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.textMuted }}>{t("home.workouts")}</Text>
              </VStack>

              <VStack className="flex-1 items-center rounded-2xl p-3" style={{ backgroundColor: colors.surfaceAlt }}>
                <MaterialIcons
                  name="local-fire-department"
                  size={24}
                  color={colors.warning}
                />
                <Text className="mt-1 font-bold text-lg">
                  {stats?.today.calories || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.textMuted }}>{t("home.calories")}</Text>
              </VStack>

              <VStack className="flex-1 items-center rounded-2xl p-3" style={{ backgroundColor: colors.surfaceAlt }}>
                <MaterialIcons name="schedule" size={24} color={colors.info} />
                <Text className="mt-1 font-bold text-lg">
                  {stats?.today.minutes || 0}
                </Text>
                <Text className="text-xs" style={{ color: colors.textMuted }}>{t("home.minutes")}</Text>
              </VStack>
            </HStack>

            <Box
              className="mt-4 rounded-2xl border p-4"
              style={{ borderColor: colors.border, backgroundColor: colors.surfaceAlt }}
            >
              <HStack className="items-center justify-between">
                <Text className="font-semibold" style={{ color: colors.text }}>Calorie Balance</Text>
                <Text
                  className={`text-xs font-semibold ${
                    calorieDelta === null
                      ? ""
                      : calorieDelta > 0
                        ? "text-amber-300"
                        : calorieDelta < 0
                          ? "text-sky-300"
                          : ""
                  }`}
                  style={{
                    color:
                      calorieDelta === null
                        ? colors.textMuted
                        : calorieDelta > 0
                          ? colors.warning
                          : calorieDelta < 0
                            ? colors.info
                            : colors.accent,
                  }}
                >
                  {calorieStatusLabel}
                </Text>
              </HStack>
              {calorieTrend.length > 0 ? (
                <Box className="mt-3">
                  <CalorieTrendChart data={calorieTrend} gridColor={colors.border} labelColor={colors.textSubtle} />
                  <HStack className="mt-2 justify-between">
                    <Text className="text-xs" style={{ color: colors.textMuted }}>
                      Today: {Math.round(todayCaloriesConsumed)} kcal
                    </Text>
                    <Text className="text-xs" style={{ color: colors.textSubtle }}>
                      Maintenance: {comparisonTarget ? `${comparisonTarget} kcal` : "--"}
                    </Text>
                  </HStack>
                </Box>
              ) : (
                <Text className="mt-3 text-xs" style={{ color: colors.textSubtle }}>
                  No calorie trend data yet.
                </Text>
              )}
            </Box>
          </SectionCard>
        )}

        <Pressable
          className="mb-6 p-4 rounded-2xl"
          style={{ backgroundColor: colors.accent }}
          onPress={handleQuickWorkout}
        >
          <HStack className="justify-center items-center" space="sm">
            <MaterialIcons name="play-arrow" size={28} color={colors.accentText} />
            <Text className="font-bold text-lg" style={{ color: colors.accentText }}>
              {t("home.startQuickWorkout")}
            </Text>
          </HStack>
        </Pressable>

        <SectionCard className="mb-6">
          <HStack className="items-center justify-between">
            <VStack className="flex-1">
              <Text className="text-xs" style={{ color: colors.textMuted }}>{t("home.estimatedMaintenance")}</Text>
              <Heading size="md" style={{ color: colors.text }}>
                {maintenanceCalories ? t("home.kcalPerDay", { value: maintenanceCalories }) : "--"}
              </Heading>
              <Text className="text-xs" style={{ color: colors.textSubtle }}>
                {t("home.basedOnUserStats")}
              </Text>
            </VStack>
            <Box className="p-3 rounded-xl" style={{ backgroundColor: colors.surfaceAlt }}>
              <MaterialIcons name="monitor-weight" size={22} color={colors.warning} />
            </Box>
          </HStack>
        </SectionCard>

        <SectionCard className="mb-6">
          <HStack className="items-start justify-between">
            <VStack className="flex-1">
              <Text className="text-xs" style={{ color: colors.textMuted }}>{t("home.smartCalorieGuide")}</Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSubtle }}>
                {t("home.maintainTarget")}:{" "}
                {maintenanceCalories ? `${maintenanceCalories} ${t("common.kcal")}` : "--"}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSubtle }}>
                {t("home.cutTarget")}: {cutCalories ? `${cutCalories} ${t("common.kcal")}` : "--"}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSubtle }}>
                {t("home.bulkTarget")}:{" "}
                {bulkCalories ? `${bulkCalories} ${t("common.kcal")}` : "--"}
              </Text>
            </VStack>
            <Box className="p-3 rounded-xl" style={{ backgroundColor: colors.surfaceAlt }}>
              <MaterialIcons name="local-fire-department" size={22} color={colors.warning} />
            </Box>
          </HStack>
        </SectionCard>

        <SectionCard className="mb-6">
          <HStack className="items-start justify-between">
            <VStack className="flex-1">
              <Text className="text-xs" style={{ color: colors.textMuted }}>{t("home.weeklyStatusTitle")}</Text>
              <Heading size="sm" className="mt-1" style={{ color: colors.text }}>
                {weeklyStatus}
              </Heading>
              <Text className="text-xs mt-1" style={{ color: colors.textSubtle }}>
                {t("home.weeklyAvgConsumed")}:{" "}
                {weeklyAvgConsumed !== null
                  ? `${weeklyAvgConsumed} ${t("common.kcal")}`
                  : "--"}
              </Text>
              <Text className="text-xs mt-1" style={{ color: colors.textSubtle }}>
                {t("home.weeklyAvgMaintenance")}:{" "}
                {weeklyAvgMaintenance !== null
                  ? `${weeklyAvgMaintenance} ${t("common.kcal")}`
                  : "--"}
              </Text>
            </VStack>
            <Box className="p-3 rounded-xl" style={{ backgroundColor: colors.surfaceAlt }}>
              <MaterialIcons name="insights" size={22} color={colors.accent} />
            </Box>
          </HStack>
        </SectionCard>

        <HStack className="justify-between items-center mb-4">
          <Heading size="md" style={{ color: colors.text }}>{t("home.todaysFoodLog")}</Heading>
          <Pressable onPress={() => router.push("/(tabs)/nutrition")}>
            <Text style={{ color: isDark ? colors.accent : "#000000" }}>{t("home.openNutrition")}</Text>
          </Pressable>
        </HStack>

        {!isLoading && foodLogs.length === 0 && (
          <SectionCard className="items-center p-6 mb-6">
            <MaterialIcons name="restaurant" size={36} color={colors.icon} />
            <Text className="mt-2" style={{ color: colors.textMuted }}>{t("home.noFoodLoggedToday")}</Text>
            <Text className="text-sm" style={{ color: colors.textSubtle }}>
              {t("home.addFoodsFromNutrition")}
            </Text>
          </SectionCard>
        )}

        {!isLoading && foodLogs.length > 0 && (
          <VStack space="sm" className="mb-6">
            {foodLogs.slice(0, 4).map((log) => (
                <SectionCard
                  key={log.id}
                  className="p-4"
                >
                <HStack className="justify-between items-center">
                  <VStack className="flex-1">
                    <Text className="font-semibold capitalize">{log.name}</Text>
                    <Text className="text-xs" style={{ color: colors.textMuted }}>
                      {Number(log.calories || 0).toFixed(0)} kcal •{" "}
                      {Number(log.serving_size || 0).toFixed(0)} g
                    </Text>
                  </VStack>
                  <MaterialIcons name="check-circle" size={18} color="#34d399" />
                </HStack>
              </SectionCard>
            ))}
          </VStack>
        )}

        <HStack className="justify-between items-center mb-4">
          <Heading size="md" style={{ color: colors.text }}>{t("home.recentActivity")}</Heading>
          <Pressable>
            <Text style={{ color: isDark ? colors.accent : "#000000" }}>{t("home.seeAll")}</Text>
          </Pressable>
        </HStack>

        {!isLoading && activities.length === 0 && (
          <SectionCard className="items-center p-6">
            <MaterialIcons name="history" size={40} color={colors.icon} />
            <Text className="mt-2" style={{ color: colors.textMuted }}>{t("home.noRecentActivity")}</Text>
            <Text className="text-sm" style={{ color: colors.textSubtle }}>
              {t("home.startWorkoutToSee")}
            </Text>
          </SectionCard>
        )}

        {!isLoading && activities.length > 0 && (
          <VStack space="sm">
            {activities.map((activity) => (
              <Pressable key={activity.id}>
                <HStack
                  className="justify-between items-center p-4 border rounded-2xl"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <HStack space="md" className="items-center">
                    <Box className="p-3 rounded-xl" style={{ backgroundColor: colors.surfaceAlt }}>
                      <MaterialIcons
                        name="fitness-center"
                        size={24}
                        color={colors.icon}
                      />
                    </Box>
                    <VStack>
                      <Text className="font-semibold" style={{ color: colors.text }}>{activity.title}</Text>
                      <Text className="text-sm" style={{ color: colors.textMuted }}>
                        {activity.duration || "--"} • {activity.calories || 0}{" "}
                        kcal
                      </Text>
                    </VStack>
                  </HStack>

                  <Text className="text-sm" style={{ color: colors.textSubtle }}>{activity.date}</Text>
                </HStack>
              </Pressable>
            ))}
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
