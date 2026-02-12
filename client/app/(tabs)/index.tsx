import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Box, Heading, VStack } from '@gluestack-ui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { Link } from 'expo-router';

const Card = ({ title, href }: { title: string, href: string }) => (
  <Link href={href} asChild>
    <Pressable>
      <Box
        bg="rgba(255, 255, 255, 0.1)"
        p="$4"
        borderRadius="$lg"
        w="100%"
        sx={{
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
        <Heading size="md" color="$textLight50" textAlign="center">
          {title}
        </Heading>
      </Box>
    </Pressable>
  </Link>
);

export default function HomeScreen() {
  return (
    <Box flex={1}>
      <LinearGradient
        // Modern purple/blue tones
        colors={['#2A2D4F', '#3F3B6C', '#613C70']}
        style={styles.gradient}
      />
      <VStack flex={1} p="$6" space="md" alignItems="center" paddingTop={100}>
        <FontAwesome5 name="robot" size={48} color="white" />
        <Heading color="$textLight50" mt="$4" size="2xl">
          AI Fitness Coach
        </Heading>

        <VStack space="lg" mt="$10" width="100%">
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