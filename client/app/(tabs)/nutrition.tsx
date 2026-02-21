import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  api,
  CreateDailyLogPayload,
  DailyLog,
  NutritionItem,
} from "@/services/api";

const screenWidth = Dimensions.get("window").width;
const CHART_HEIGHT = 180;
const BAR_RADIUS = 6;

const toLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  return new Date(year, month - 1, day);
};

const formatNumber = (value: number, decimals = 1) =>
  Number.isFinite(value) ? value.toFixed(decimals) : "0.0";

const buildLogPayload = (
  item: NutritionItem,
  logDate: string
): CreateDailyLogPayload => ({
  name: item.name,
  calories: item.calories,
  protein: item.protein_g,
  carbs: item.carbohydrates_total_g,
  fat: item.fat_total_g,
  sugar: item.sugar_g,
  fiber: item.fiber_g,
  serving_size: item.serving_size_g,
  log_date: logDate,
});

function NativeBarChart({ data }: { data: { label: string; value: number }[] }) {
  const chartWidth = screenWidth - 64;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = (chartWidth - data.length * 12) / data.length;

  return (
    <Svg width={chartWidth} height={CHART_HEIGHT + 28}>
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * (CHART_HEIGHT - 20);
        const x = index * (barWidth + 12) + 6;
        const y = CHART_HEIGHT - 20 - barHeight;

        return (
          <React.Fragment key={item.label}>
            <Rect
              x={x}
              y={0}
              width={barWidth}
              height={CHART_HEIGHT - 20}
              rx={BAR_RADIUS}
              ry={BAR_RADIUS}
              fill="#1f2937"
            />
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={BAR_RADIUS}
              ry={BAR_RADIUS}
              fill="#C0EB6A"
            />
            <SvgText
              x={x + barWidth / 2}
              y={y - 6}
              fontSize={11}
              fontWeight="bold"
              fill="#C0EB6A"
              textAnchor="middle"
            >
              {Math.round(item.value)}
            </SvgText>
            <SvgText
              x={x + barWidth / 2}
              y={CHART_HEIGHT + 12}
              fontSize={11}
              fill="#9ca3af"
              textAnchor="middle"
            >
              {item.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function TotalsChart({ data }: { data: { label: string; value: number }[] }) {
  if (Platform.OS === "web") {
    try {
      const recharts = require("recharts");
      const {
        BarChart,
        Bar,
        XAxis,
        YAxis,
        Tooltip,
        ResponsiveContainer,
        CartesianGrid,
      } = recharts;

      return (
        <Box className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  borderColor: "#1f2937",
                  color: "#f9fafb",
                }}
              />
              <Bar dataKey="value" fill="#C0EB6A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      );
    } catch (error) {
      console.warn("Recharts not available:", error);
    }
  }

  return <NativeBarChart data={data} />;
}

export default function NutritionScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NutritionItem[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(toLocalDateString(new Date()));
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [activeAdd, setActiveAdd] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs(selectedDate);
  }, [selectedDate]);

  const fetchLogs = async (date: string) => {
    setIsLoadingLogs(true);
    setErrorMessage(null);
    try {
      const response = await api.getDailyLogs(date);
      if (response.success && response.data) {
        setLogs(response.data.logs || []);
      } else {
        setErrorMessage(response.message || "Unable to fetch logs");
      }
    } catch (error) {
      console.error("Fetch logs error:", error);
      setErrorMessage("Unable to fetch logs");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert("Missing search", "Enter a food query to search");
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    try {
      const response = await api.searchNutrition(query.trim());
      if (response.success && response.data) {
        setResults(response.data.items || []);
      } else {
        setResults([]);
        setErrorMessage(response.message || "No results found");
      }
    } catch (error) {
      console.error("Nutrition search error:", error);
      setErrorMessage("Unable to fetch nutrition data");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddLog = async (item: NutritionItem, index: number) => {
    const key = `${item.name}-${index}`;
    setActiveAdd(key);
    setErrorMessage(null);

    try {
      const payload = buildLogPayload(item, selectedDate);
      const response = await api.createDailyLog(payload);
      if (response.success) {
        await fetchLogs(selectedDate);
      } else {
        setErrorMessage(response.message || "Unable to add log");
      }
    } catch (error) {
      console.error("Add log error:", error);
      setErrorMessage("Unable to add log");
    } finally {
      setActiveAdd(null);
    }
  };

  const handleDeleteLog = async (id: string) => {
    setErrorMessage(null);
    try {
      const response = await api.deleteDailyLog(id);
      if (response.success) {
        await fetchLogs(selectedDate);
      } else {
        setErrorMessage(response.message || "Unable to delete log");
      }
    } catch (error) {
      console.error("Delete log error:", error);
      setErrorMessage("Unable to delete log");
    }
  };

  const shiftDate = (direction: "prev" | "next") => {
    const base = parseLocalDate(selectedDate);
    const delta = direction === "prev" ? -1 : 1;
    const nextDate = new Date(base.getFullYear(), base.getMonth(), base.getDate() + delta);
    setSelectedDate(toLocalDateString(nextDate));
  };

  const totals = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        acc.calories += log.calories || 0;
        acc.protein += log.protein || 0;
        acc.carbs += log.carbs || 0;
        acc.fat += log.fat || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [logs]);

  const chartData = useMemo(
    () => [
      { label: "Calories", value: totals.calories },
      { label: "Protein", value: totals.protein },
      { label: "Carbs", value: totals.carbs },
      { label: "Fat", value: totals.fat },
    ],
    [totals]
  );

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        <VStack className="mt-4 mb-6" space="xs">
          <Heading size="2xl">Nutrition</Heading>
          <Text className="text-gray-400">
            Search foods, track your intake, and review daily totals.
          </Text>
        </VStack>

        <Box className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
          <VStack space="md">
            <Text className="text-gray-300 text-sm">Search Food</Text>
            <HStack space="sm" className="items-center">
              <Box className="flex-1">
                <Input size="lg">
                  <InputField
                    placeholder="e.g. 2 eggs and rice"
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                  />
                </Input>
              </Box>
              <Button size="md" onPress={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <ButtonSpinner color="white" />
                ) : (
                  <ButtonText>Search</ButtonText>
                )}
              </Button>
            </HStack>

            <HStack className="items-center justify-between">
              <Text className="text-gray-400 text-sm">Log Date</Text>
              <HStack space="sm" className="items-center">
                <Pressable
                  className="bg-gray-800 p-2 rounded-full"
                  onPress={() => shiftDate("prev")}
                >
                  <MaterialIcons name="chevron-left" size={20} color="#C0EB6A" />
                </Pressable>
                <Input size="sm">
                  <InputField
                    value={selectedDate}
                    onChangeText={setSelectedDate}
                    autoCapitalize="none"
                  />
                </Input>
                <Pressable
                  className="bg-gray-800 p-2 rounded-full"
                  onPress={() => shiftDate("next")}
                >
                  <MaterialIcons name="chevron-right" size={20} color="#C0EB6A" />
                </Pressable>
              </HStack>
            </HStack>
          </VStack>
        </Box>

        {errorMessage && (
          <Box className="bg-red-900/40 border border-red-500 rounded-xl p-3 mb-6">
            <Text className="text-red-300">{errorMessage}</Text>
          </Box>
        )}

        <Box className="mb-6">
          <HStack className="items-center justify-between mb-3">
            <Heading size="md">Results</Heading>
            <Text className="text-gray-400 text-sm">{results.length} items</Text>
          </HStack>

          {isSearching && (
            <Box className="items-center py-6">
              <ActivityIndicator color="#C0EB6A" />
            </Box>
          )}

          {!isSearching && results.length === 0 && (
            <Box className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <Text className="text-gray-400">
                Search for foods to see nutrition results.
              </Text>
            </Box>
          )}

          {!isSearching && results.length > 0 && (
            <VStack space="md">
              {results.map((item, index) => {
                const key = `${item.name}-${index}`;
                return (
                  <Box
                    key={key}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
                  >
                    <HStack className="justify-between items-center mb-2">
                      <VStack className="flex-1" space="xs">
                        <Heading size="sm" className="capitalize">
                          {item.name}
                        </Heading>
                        <Text className="text-gray-400 text-xs">
                          Serving size: {formatNumber(item.serving_size_g, 0)} g
                        </Text>
                      </VStack>
                      <Button
                        size="sm"
                        onPress={() => handleAddLog(item, index)}
                        disabled={activeAdd === key}
                      >
                        {activeAdd === key ? (
                          <ButtonSpinner color="white" />
                        ) : (
                          <ButtonText>Add to Log</ButtonText>
                        )}
                      </Button>
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-gray-300 text-xs">Calories</Text>
                      <Text className="text-gray-200 text-xs">
                        {formatNumber(item.calories, 0)}
                      </Text>
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-gray-300 text-xs">Protein</Text>
                      <Text className="text-gray-200 text-xs">
                        {formatNumber(item.protein_g)} g
                      </Text>
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-gray-300 text-xs">Carbs</Text>
                      <Text className="text-gray-200 text-xs">
                        {formatNumber(item.carbohydrates_total_g)} g
                      </Text>
                    </HStack>
                    <HStack className="justify-between">
                      <Text className="text-gray-300 text-xs">Fat</Text>
                      <Text className="text-gray-200 text-xs">
                        {formatNumber(item.fat_total_g)} g
                      </Text>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>

        <Box className="mb-6">
          <HStack className="items-center justify-between mb-3">
            <Heading size="md">Daily Log</Heading>
            <Text className="text-gray-400 text-sm">{selectedDate}</Text>
          </HStack>

          {isLoadingLogs && (
            <Box className="items-center py-6">
              <ActivityIndicator color="#C0EB6A" />
            </Box>
          )}

          {!isLoadingLogs && logs.length === 0 && (
            <Box className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <Text className="text-gray-400">
                No entries yet. Add foods from your search results.
              </Text>
            </Box>
          )}

          {!isLoadingLogs && logs.length > 0 && (
            <VStack space="md">
              {logs.map((log) => (
                <Box
                  key={log.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4"
                >
                  <HStack className="items-center justify-between mb-2">
                    <Heading size="sm" className="capitalize">
                      {log.name}
                    </Heading>
                    <Pressable
                      className="p-2 bg-gray-800 rounded-full"
                      onPress={() => handleDeleteLog(log.id)}
                    >
                      <MaterialIcons name="delete" size={18} color="#f87171" />
                    </Pressable>
                  </HStack>
                  <HStack className="justify-between">
                    <Text className="text-gray-300 text-xs">Calories</Text>
                    <Text className="text-gray-200 text-xs">
                      {formatNumber(log.calories, 0)}
                    </Text>
                  </HStack>
                  <HStack className="justify-between">
                    <Text className="text-gray-300 text-xs">Protein</Text>
                    <Text className="text-gray-200 text-xs">
                      {formatNumber(log.protein)} g
                    </Text>
                  </HStack>
                  <HStack className="justify-between">
                    <Text className="text-gray-300 text-xs">Carbs</Text>
                    <Text className="text-gray-200 text-xs">
                      {formatNumber(log.carbs)} g
                    </Text>
                  </HStack>
                  <HStack className="justify-between">
                    <Text className="text-gray-300 text-xs">Fat</Text>
                    <Text className="text-gray-200 text-xs">
                      {formatNumber(log.fat)} g
                    </Text>
                  </HStack>
                  <HStack className="justify-between">
                    <Text className="text-gray-300 text-xs">Serving</Text>
                    <Text className="text-gray-200 text-xs">
                      {formatNumber(log.serving_size, 0)} g
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>

        <Box className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6">
          <HStack className="items-center justify-between mb-3">
            <Heading size="md">Daily Summary</Heading>
            <Text className="text-gray-400 text-xs">Totals</Text>
          </HStack>
          <HStack className="justify-between mb-2">
            <Text className="text-gray-400 text-xs">Calories</Text>
            <Text className="text-gray-200 text-xs">
              {formatNumber(totals.calories, 0)}
            </Text>
          </HStack>
          <HStack className="justify-between mb-2">
            <Text className="text-gray-400 text-xs">Protein</Text>
            <Text className="text-gray-200 text-xs">
              {formatNumber(totals.protein)} g
            </Text>
          </HStack>
          <HStack className="justify-between mb-2">
            <Text className="text-gray-400 text-xs">Carbs</Text>
            <Text className="text-gray-200 text-xs">
              {formatNumber(totals.carbs)} g
            </Text>
          </HStack>
          <HStack className="justify-between">
            <Text className="text-gray-400 text-xs">Fat</Text>
            <Text className="text-gray-200 text-xs">
              {formatNumber(totals.fat)} g
            </Text>
          </HStack>
        </Box>

        <Box className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <HStack className="items-center justify-between mb-3">
            <Heading size="md">Macros Chart</Heading>
            <Text className="text-gray-400 text-xs">Daily totals</Text>
          </HStack>
          <TotalsChart data={chartData} />
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
