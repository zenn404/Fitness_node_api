import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { VStack } from '@/components/ui/vstack';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Link } from 'expo-router';

const Card = ({ title, href }: { title: string, href: string }) => (
  <Link href={href} asChild>
    <Pressable>
      <Box
        className="bg-white/10 p-4 rounded-lg w-full"
        style={{
          // soft shadows
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Heading size="md" className="text-gray-100 text-center">
          {title}
        </Heading>
      </Box>
    </Pressable>
  </Link>
);

export default function HomeScreen() {
  return (
    <Box className="flex-1">
      <LinearGradient
        // Modern purple/blue tones
        colors={['#2A2D4F', '#3F3B6C', '#613C70']}
        style={styles.gradient}
      />
      <VStack className="flex-1 p-6 items-center pt-[100px]" space="md">
        <FontAwesome5 name="robot" size={48} color="white" />
        <Heading className="text-gray-100 mt-4" size="2xl">
          AI Fitness Coach
        </Heading>

        <VStack space="lg" className="mt-10 w-full">
          <Card title="Today's Diet Summary" href="/(tabs)/progress" />
          <Card title="Today's Workout" href="/(tabs)/workout" />
          <Card title="Progress Tracker" href="/(tabs)/progress" />
          <Card title="Find a Coach" href="/(tabs)/profile" />
        </VStack>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});