"use client";

import * as React from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
} from "react-native-reanimated";
import { Audio } from "expo-av";
import { Card } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Volume2, VolumeX } from "lucide-react-native";
import { useEffect, useState, useRef } from "react";

export default function Screen() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [breathePhase, setBreathePhase] = useState<"inhale" | "exhale">(
    "inhale"
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const breatheRef = useRef<NodeJS.Timeout | null>(null);
  const scale = useSharedValue(1);
  const soundRef = useRef<Audio.Sound | null>(null);

  const loadSound = async () => {
    if (soundRef.current) return;
    const { sound } = await Audio.Sound.createAsync(
      require("~/assets/audio/breathing.mp3"),
      { shouldPlay: false, isLooping: true }
    );
    soundRef.current = sound;
  };

  const playSound = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
    }
  };

  const stopSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
    }
  };

  const toggleMute = async () => {
    setIsMuted((prev) => !prev);
    if (soundRef.current) {
      await soundRef.current.setIsMutedAsync(!isMuted);
    }
  };

  useEffect(() => {
    loadSound();

    if (isRunning) {
      playSound();

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            stopSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      breatheRef.current = setInterval(() => {
        setBreathePhase((prev) => {
          if (prev === "inhale") {
            scale.value = withTiming(1.2, {
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
            });
            return "exhale";
          } else {
            scale.value = withTiming(1, {
              duration: 4000,
              easing: Easing.inOut(Easing.ease),
            });
            return "inhale";
          }
        });
      }, 4000);
    } else {
      stopSound(); // Stop sound when paused
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (breatheRef.current) clearInterval(breatheRef.current);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(60);
    setBreathePhase("inhale");
    scale.value = 1;
    stopSound();
  };

  return (
    <View className="flex-1 justify-center items-center bg-[#98d5cd] dark:bg-[#111111]">
      <Card className="w-[90%] max-w-sm p-6 rounded-3xl bg-white/20">
        <View className="items-center mb-8">
          <Text className="text-2xl font-bold text-white">
            {formatTime(timeLeft)}
          </Text>
        </View>

        <View className="items-center justify-center mb-8">
          <Animated.View
            style={[
              useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] })),
            ]}
            className="items-center justify-center"
          >
            <View className="w-40 h-40 rounded-full border-4 border-white/50 items-center justify-center">
              <Text className="text-xl font-semibold text-white">
                {breathePhase === "inhale" ? "Inhale" : "Exhale"}
              </Text>
            </View>
          </Animated.View>
        </View>

        <View className="flex-row justify-between items-center mb-4">
          <Button variant="ghost" onPress={toggleMute} className="p-2">
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </Button>

          <Button
            variant="outline"
            onPress={toggleTimer}
            className="px-6 py-2 bg-white/20 border-white"
          >
            <Text className="text-white font-semibold">
              {isRunning ? "Pause" : "Start"}
            </Text>
          </Button>

          <Button variant="ghost" onPress={resetTimer} className="p-2">
            <Text className="text-white">Reset</Text>
          </Button>
        </View>
      </Card>
    </View>
  );
}
