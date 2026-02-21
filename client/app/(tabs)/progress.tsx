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
import { Activity, api, ProgressData, WeeklyChartItem } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";

const CHART_HEIGHT = 180;
const BAR_RADIUS = 6;
const screenWidth = Dimensions.get("window").width;

function WeeklyBarChart({ data }: { data: WeeklyChartItem[] }) {
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
              fill="#1f2937"
            />
            {isActive && (
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={BAR_RADIUS}
                ry={BAR_RADIUS}
                fill="#C0EB6A"
              />
            )}
            {isActive && (
              <SvgText
                x={x + barWidth / 2}
                y={y - 6}
                fontSize={11}
                fontWeight="bold"
                fill="#C0EB6A"
                textAnchor="middle"
              >
                {item.workouts}
              </SvgText>
            )}
            <SvgText
              x={x + barWidth / 2}
              y={CHART_HEIGHT + 12}
              fontSize={11}
              fill="#9ca3af"
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

function CaloriesBarChart({ data }: { data: WeeklyChartItem[] }) {
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
              fill="#1f2937"
            />
            {isActive && (
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={BAR_RADIUS}
                ry={BAR_RADIUS}
                fill="#f97316"
              />
            )}
            {isActive && (
              <SvgText
                x={x + barWidth / 2}
                y={y - 6}
                fontSize={11}
                fontWeight="bold"
                fill="#f97316"
                textAnchor="middle"
              >
                {item.calories}
              </SvgText>
            )}
            <SvgText
              x={x + barWidth / 2}
              y={CHART_HEIGHT + 12}
              fontSize={11}
              fill="#9ca3af"
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
    <SafeAreaView className="flex-1">
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#C0EB6A"
            colors={["#C0EB6A"]}
          />
        }
      >
        <VStack className="mt-4 mb-6">
          <Heading size="2xl">{t("progress.title")}</Heading>
          <Text className="text-gray-400">{t("progress.trackJourney")}</Text>
        </VStack>

        {isLoading && (
          <Box className="justify-center items-center py-10">
            <ActivityIndicator size="large" color="#C0EB6A" />
          </Box>
        )}

        {!isLoading && (
          <>
            {/* Weekly Activity Chart */}
            <Box className="bg-gray-900 mb-6 p-4 border border-gray-800 rounded-2xl">
              <HStack className="justify-between items-center mb-4">
                <VStack>
                  <Text className="text-gray-400 text-sm">
                    {t("progress.thisWeek")}
                  </Text>
                  <Heading size="lg">{t("progress.weeklyActivity")}</Heading>
                </VStack>
                <Box className="bg-primary-500/20 px-3 py-1 rounded-full">
                  <Text className="text-primary-500 font-semibold text-sm">
                    {t("progress.workoutCount", { count: weeklyTotal })}
                  </Text>
                </Box>
              </HStack>

              <Box className="items-center">
                {progressData?.weeklyChart && (
                  <WeeklyBarChart data={progressData.weeklyChart} />
                )}
              </Box>
            </Box>

            {/* Calories Burned Chart */}
            <Box className="bg-gray-900 mb-6 p-4 border border-gray-800 rounded-2xl">
              <HStack className="justify-between items-center mb-4">
                <VStack>
                  <Text className="text-gray-400 text-sm">
                    {t("progress.thisWeek")}
                  </Text>
                  <Heading size="lg">{t("progress.caloriesBurned")}</Heading>
                </VStack>
                <Box className="bg-orange-500/20 px-3 py-1 rounded-full">
                  <Text className="text-orange-500 font-semibold text-sm">
                    {weeklyCalories} {t("common.kcal")}
                  </Text>
                </Box>
              </HStack>

              <Box className="items-center">
                {progressData?.weeklyChart && (
                  <CaloriesBarChart data={progressData.weeklyChart} />
                )}
              </Box>
            </Box>

            {/* All-Time Stats */}
            <Box className="bg-gray-900 mb-6 p-4 border border-gray-800 rounded-2xl">
              <Heading size="md" className="mb-3">
                {t("progress.allTimeStats")}
              </Heading>
              <VStack space="md">
                <HStack className="justify-between items-center">
                  <HStack className="items-center" space="sm">
                    <MaterialIcons
                      name="fitness-center"
                      size={20}
                      color="#C0EB6A"
                    />
                    <Text className="text-gray-300">
                      {t("progress.totalWorkouts")}
                    </Text>
                  </HStack>
                  <Text className="font-bold text-lg">
                    {progressData?.totalStats.workouts || 0}
                  </Text>
                </HStack>
                <HStack className="justify-between items-center">
                  <HStack className="items-center" space="sm">
                    <MaterialIcons
                      name="local-fire-department"
                      size={20}
                      color="#f97316"
                    />
                    <Text className="text-gray-300">
                      {t("progress.totalCalories")}
                    </Text>
                  </HStack>
                  <Text className="font-bold text-lg">
                    {progressData?.totalStats.calories || 0} {t("common.kcal")}
                  </Text>
                </HStack>
                <HStack className="justify-between items-center">
                  <HStack className="items-center" space="sm">
                    <MaterialIcons name="schedule" size={20} color="#3b82f6" />
                    <Text className="text-gray-300">
                      {t("progress.totalMinutes")}
                    </Text>
                  </HStack>
                  <Text className="font-bold text-lg">
                    {progressData?.totalStats.minutes || 0} {t("common.min")}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}