import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const {t}=useTranslation();
  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: "#1f2937" },
        tabBarActiveTintColor: "#c0eb6a",
        tabBarInactiveTintColor: "#ffffff",
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: "#1f2937",
            height: 90,
            paddingBottom: 20,
            paddingTop: 10,
          },
          default: {
            backgroundColor: "#1f2937",
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: t("tabs.workout"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="extension" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t("tabs.nutrition"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="restaurant-menu" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tabs.chat"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="wechat" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t("tabs.progress"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="candlestick-chart" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="account-circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
