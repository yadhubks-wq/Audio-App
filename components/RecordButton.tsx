import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/components/ThemeProvider';

interface RecordButtonProps {
  state: 'idle' | 'recording' | 'paused' | 'processing' | 'error';
  onPress: () => void;
}

export function RecordButton({ state, onPress }: RecordButtonProps) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'recording') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [state, pulseAnim]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const isRecording = state === 'recording';
  const isPaused = state === 'paused';
  const isProcessing = state === 'processing';
  const isError = state === 'error';

  const buttonColor = isRecording ? colors.danger : isError ? colors.danger : isPaused ? colors.primary : colors.primary;
  const glowColor = isRecording ? colors.dangerGlow : colors.primaryGlow;

  return (
    <View style={styles.outer}>
      {isRecording && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              borderColor: glowColor,
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.15],
                outputRange: [0.6, 0],
              }),
            },
          ]}
        />
      )}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: glowColor,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        disabled={isProcessing}
        style={styles.touchable}
      >
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: buttonColor,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {isRecording ? (
            <View style={styles.stopIcon} />
          ) : isPaused ? (
            <View style={styles.pauseIconContainer}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          ) : isProcessing ? (
            <View style={styles.processingDot} />
          ) : (
            <View style={styles.micIcon} />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  touchable: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.3,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  pauseIconContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  pauseBar: {
    width: 10,
    height: 36,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  micIcon: {
    width: 24,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  processingDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
});
