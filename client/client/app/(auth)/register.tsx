import React, { useState } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";

import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { useAuthStore } from "@/store/auth-store";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { register, isLoading, error } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    const success = await register(name, email, password);

    if (success) {
      router.replace("/(tabs)");
    }
  };

  const goToLogin = () => {
    router.push("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <VStack className="flex-1 justify-center px-6 py-8" space="lg">
            <VStack className="items-center mb-6">
              <Box className="justify-center items-center bg-primary-500 mb-4 rounded-2xl w-20 h-20">
                <Text className="text-4xl">🏋️</Text>
              </Box>
              <Heading size="2xl" className="text-center">
                Create Account
              </Heading>
              <Text className="text-gray-400 text-center">
                Start your fitness journey
              </Text>
            </VStack>

            {error && (
              <Box className="bg-red-900/50 p-3 border border-red-500 rounded-lg">
                <Text className="text-red-400 text-center">{error}</Text>
              </Box>
            )}

            <VStack space="xs">
              <Text className="text-gray-400">Full Name</Text>
              <Input size="xl">
                <InputField
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text className="text-gray-400">Email</Text>
              <Input size="xl">
                <InputField
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text className="text-gray-400">Password</Text>
              <Input size="xl">
                <InputField
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </Input>
            </VStack>

            <VStack space="xs">
              <Text className="text-gray-400">Confirm Password</Text>
              <Input size="xl">
                <InputField
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </Input>
            </VStack>

            <Button
              size="xl"
              className="mt-4"
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ButtonSpinner color="white" />
              ) : (
                <ButtonText>Create Account</ButtonText>
              )}
            </Button>

            <HStack className="justify-center mt-4" space="xs">
              <Text className="text-gray-400">Already have an account?</Text>
              <Pressable onPress={goToLogin}>
                <Text className="font-semibold text-primary-500">Sign In</Text>
              </Pressable>
            </HStack>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}