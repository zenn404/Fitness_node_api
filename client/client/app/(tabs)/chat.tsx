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
import {
  ChatMessage,
  FITNESS_SYSTEM_PROMPT,
  sendChatMessage,
} from "@/services/chatservice";

export default function ChatScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI fitness coach. Ask me anything about workouts, nutrition, or fitness goals! 💪",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Send to Hugging Face AI
      const response = await sendChatMessage(
        [...messages, userMessage],
        FITNESS_SYSTEM_PROMPT,
      );

      if (response.error) {
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, I encountered an error: ${response.error}. Please try again.`,
            timestamp: new Date(),
          },
        ]);
      } else {
        // Add AI response
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
          content:
            "Sorry, something went wrong. Please check your internet connection and try again.",
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
          className={`max-w-[80%] p-4 rounded-2xl ${
            isUser ? "bg-primary-500" : "bg-gray-800 border border-gray-700"
          }`}
        >
          <Text
            className={`${isUser ? "text-white" : "text-gray-100"} text-base`}
          >
            {item.content}
          </Text>
        </Box>
      </Box>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      {/* Header */}
      <Box className="border-b border-gray-800 px-4 py-3">
        <HStack className="justify-between items-center">
          <HStack className="items-center" space="sm">
            <Box className="bg-primary-500/20 p-2 rounded-xl">
              <MaterialIcons name="chat" size={24} color="#10b981" />
            </Box>
            <VStack>
              <Heading size="lg" className="text-white">
                AI Fitness Coach
              </Heading>
              <Text className="text-gray-400 text-sm">
                Powered by Hugging Face
              </Text>
            </VStack>
          </HStack>
        </HStack>
      </Box>

      {/* Messages */}
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

        {/* Input Area */}
        <Box
          className="border-t border-gray-800 p-4 bg-black"
          style={{
            marginBottom: Platform.OS === "ios" ? 90 : 0,
          }}
        >
          <HStack space="sm" className="items-center">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about workouts, nutrition..."
              placeholderTextColor="#6b7280"
              className="flex-1 bg-gray-900 text-white px-4 py-3 rounded-2xl border border-gray-800"
              multiline
              maxLength={500}
              editable={!isLoading}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <RNPressable
              onPress={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
              className={`p-3 rounded-2xl ${
                isLoading || !inputText.trim()
                  ? "bg-gray-800"
                  : "bg-primary-500"
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <MaterialIcons
                  name="send"
                  size={24}
                  color={!inputText.trim() ? "#6b7280" : "white"}
                />
              )}
            </RNPressable>
          </HStack>
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}