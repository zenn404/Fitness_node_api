import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { getThemePalette } from "@/lib/theme-palette";
import { Activity, api, ProgressData, WeeklyChartItem } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";

const CHART_HEIGHT = 180;
const BAR_RADIUS = 6;
const screenWidth = Dimensions.get("window").width;

function WeeklyBarChart({
  data,
  trackColor,
  activeColor,
  labelColor,
}: {
  data: WeeklyChartItem[];
  trackColor: string;
  activeColor: string;
  labelColor: string;
}) {
  const chartWidth = screenWidth - 64;
  const maxWorkouts = Math.max(...data.map((d) => d.workouts), 1);
  const barWidth = (chartWidth - data.length * 8) / data.length;

  return (
    <Svg width={chartWidth} height={CHART_HEIGHT + 28}>
      {data.map((item, index) => {
        const barHeight =
          maxWorkouts > 0
            ? (item.workouts / maxWorkouts) * (CHART_HEIGHT - 20)
            : 0;
        const x = index * (barWidth + 8) + 4;
        const y = CHART_HEIGHT - 20 - barHeight;
        const isActive = item.workouts > 0;

        return (
          <React.Fragment key={item.day}>
            <Rect
              x={x}
              y={0}
              width={barWidth}
              height={CHART_HEIGHT - 20}
              rx={BAR_RADIUS}
              ry={BAR_RADIUS}
              fill={trackColor}
            />
            {isActive && (
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={BAR_RADIUS}
                ry={BAR_RADIUS}
                fill={activeColor}
              />
            )}
            {isActive && (
              <SvgText
                x={x + barWidth / 2}
                y={y - 6}
                fontSize={11}
                fontWeight="bold"
                fill={activeColor}
                textAnchor="middle"
              >
                {item.workouts}
              </SvgText>
            )}
            <SvgText
              x={x + barWidth / 2}
              y={CHART_HEIGHT + 12}
              fontSize={11}
              fill={labelColor}
              textAnchor="middle"
            >
              {item.day}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function CaloriesBarChart({
  data,
  trackColor,
  activeColor,
  labelColor,
}: {
  data: WeeklyChartItem[];
  trackColor: string;
  activeColor: string;
  labelColor: string;
}) {
  const chartWidth = screenWidth - 64;
  const maxCalories = Math.max(...data.map((d) => d.calories), 1);
  const barWidth = (chartWidth - data.length * 8) / data.length;

  return (
    <Svg width={chartWidth} height={CHART_HEIGHT + 28}>
      {data.map((item, index) => {
        const barHeight =
          maxCalories > 0
            ? (item.calories / maxCalories) * (CHART_HEIGHT - 20)
            : 0;
        const x = index * (barWidth + 8) + 4;
        const y = CHART_HEIGHT - 20 - barHeight;
        const isActive = item.calories > 0;

        return (
          <React.Fragment key={item.day}>
            <Rect
              x={x}
              y={0}
              width={barWidth}
              height={CHART_HEIGHT - 20}
              rx={BAR_RADIUS}
              ry={BAR_RADIUS}
              fill={trackColor}
            />
            {isActive && (
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={BAR_RADIUS}
                ry={BAR_RADIUS}
                fill={activeColor}
              />
            )}
            {isActive && (
              <SvgText
                x={x + barWidth / 2}
                y={y - 6}
                fontSize={11}
                fontWeight="bold"
                fill={activeColor}
                textAnchor="middle"
              >
                {item.calories}
              </SvgText>
            )}
            <SvgText
              x={x + barWidth / 2}
              y={CHART_HEIGHT + 12}
              fontSize={11}
              fill={labelColor}
              textAnchor="middle"
            >
              {item.day}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function ProgressScreen() {
  const { token } = useAuthStore();
  const { theme } = useThemeStore();
  const colors = getThemePalette(theme);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchProgressData();
  }, [token]);

  const fetchProgressData = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const [progressResponse, activityResponse] = await Promise.all([
        api.getProgressData(token),
        api.getRecentActivity(token, 10),
      ]);

      if (progressResponse.success && progressResponse.data) {
        setProgressData(progressResponse.data);
      }

      if (activityResponse.success && activityResponse.data) {
        setActivities(activityResponse.data.activities);
      }
    } catch (error) {
      console.error("Error fetching progress data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchProgressData(true);
  };

  const weeklyTotal =
    progressData?.weeklyChart.reduce((sum, d) => sum + d.workouts, 0) || 0;
  const weeklyCalories =
    progressData?.weeklyChart.reduce((sum, d) => sum + d.calories, 0) || 0;
  const weeklyMinutes =
    progressData?.weeklyChart.reduce((sum, d) => sum + d.minutes, 0) || 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
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
        <VStack className="mt-4 mb-6">
          <Heading size="2xl" style={{ color: colors.text }}>{t("progress.title")}</Heading>
          <Text style={{ color: colors.textMuted }}>{t("progress.trackJourney")}</Text>
        </VStack>

        {isLoading && (
          <Box className="justify-center items-center py-10">
            <ActivityIndicator size="large" color={colors.accent} />
          </Box>
        )}

        {!isLoading && (
          <>
            <Box
              className="mb-6 p-4 border rounded-2xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <HStack className="justify-between items-center mb-4">
                <VStack>
                  <Text className="text-sm" style={{ color: colors.textMuted }}>
                    {t("progress.thisWeek")}
                  </Text>
                  <Heading size="lg" style={{ color: colors.text }}>{t("progress.weeklyActivity")}</Heading>
                </VStack>
                <Box className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.accentSoft }}>
                  <Text className="font-semibold text-sm" style={{ color: colors.accent }}>
                    {t("progress.workoutCount", { count: weeklyTotal })}
                  </Text>
                </Box>
              </HStack>

              <Box className="items-center">
                {progressData?.weeklyChart && (
                  <WeeklyBarChart
                    data={progressData.weeklyChart}
                    trackColor={colors.surfaceAlt}
                    activeColor={colors.accent}
                    labelColor={colors.textSubtle}
                  />
                )}
              </Box>
            </Box>

            <Box
              className="mb-6 p-4 border rounded-2xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <HStack className="justify-between items-center mb-4">
                <VStack>
                  <Text className="text-sm" style={{ color: colors.textMuted }}>
                    {t("progress.thisWeek")}
                  </Text>
                  <Heading size="lg" style={{ color: colors.text }}>{t("progress.caloriesBurned")}</Heading>
                </VStack>
                <Box className="px-3 py-1 rounded-full" style={{ backgroundColor: "rgba(249,115,22,0.18)" }}>
                  <Text className="font-semibold text-sm" style={{ color: colors.warning }}>
                    {weeklyCalories} {t("common.kcal")}
                  </Text>
                </Box>
              </HStack>

              <Box className="items-center">
                {progressData?.weeklyChart && (
                  <CaloriesBarChart
                    data={progressData.weeklyChart}
                    trackColor={colors.surfaceAlt}
                    activeColor={colors.warning}
                    labelColor={colors.textSubtle}
                  />
                )}
              </Box>
            </Box>

            <Box
              className="mb-6 p-4 border rounded-2xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <Heading size="md" className="mb-3" style={{ color: colors.text }}>
                {t("progress.allTimeStats")}
              </Heading>
              <VStack space="md">
                <HStack className="justify-between items-center">
                  <HStack className="items-center" space="sm">
                    <MaterialIcons
                      name="fitness-center"
                      size={20}
                      color={colors.accent}
                    />
                    <Text style={{ color: colors.textMuted }}>
                      {t("progress.totalWorkouts")}
                    </Text>
                  </HStack>
                  <Text className="font-bold text-lg" style={{ color: colors.text }}>
                    {progressData?.totalStats.workouts || 0}
                  </Text>
                </HStack>
                <HStack className="justify-between items-center">
                  <HStack className="items-center" space="sm">
                    <MaterialIcons
                      name="local-fire-department"
                      size={20}
                      color={colors.warning}
                    />
                    <Text style={{ color: colors.textMuted }}>
                      {t("progress.totalCalories")}
                    </Text>
                  </HStack>
                  <Text className="font-bold text-lg" style={{ color: colors.text }}>
                    {progressData?.totalStats.calories || 0} {t("common.kcal")}
                  </Text>
                </HStack>
                <HStack className="justify-between items-center">
                  <HStack className="items-center" space="sm">
                    <MaterialIcons name="schedule" size={20} color={colors.info} />
                    <Text style={{ color: colors.textMuted }}>
                      {t("progress.totalMinutes")}
                    </Text>
                  </HStack>
                  <Text className="font-bold text-lg" style={{ color: colors.text }}>
                    {progressData?.totalStats.minutes || 0} {t("common.min")}
                  </Text>
                </HStack>
              </VStack>
            </Box>

            <Box
              className="mb-6 p-4 border rounded-2xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <HStack className="justify-between items-center">
                <Heading size="md" style={{ color: colors.text }}>{t("progress.thisWeek")}</Heading>
                <Text style={{ color: colors.textMuted }}>
                  {weeklyMinutes} {t("common.min")}
                </Text>
              </HStack>
            </Box>

            {activities.length > 0 && (
              <Box
                className="mb-6 p-4 border rounded-2xl"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              >
                <Heading size="md" className="mb-3" style={{ color: colors.text }}>
                  {t("home.recentActivity")}
                </Heading>
                <VStack space="sm">
                  {activities.slice(0, 5).map((activity) => (
                    <HStack key={activity.id} className="justify-between items-center">
                      <Text className="flex-1" style={{ color: colors.textMuted }}>{activity.title}</Text>
                      <Text style={{ color: colors.textSubtle }}>{activity.date}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
