import { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';

interface WaveformProps {
  level: number;
  active: boolean;
  barCount?: number;
}

export function Waveform({ level, active, barCount = 32 }: WaveformProps) {
  const { colors } = useTheme();
  const animRef = useRef<Animated.Value[]>([]);
  const seedRef = useRef<number[]>([]);

  if (seedRef.current.length === 0) {
    seedRef.current = Array.from({ length: barCount }, () => Math.random());
  }

  if (animRef.current.length === 0) {
    animRef.current = Array.from({ length: barCount }, () => new Animated.Value(0.15));
  }

  useEffect(() => {
    if (!active) {
      animRef.current.forEach((anim) =>
        Animated.timing(anim, {
          toValue: 0.1,
          duration: 300,
          useNativeDriver: false,
        }).start()
      );
      return;
    }

    const interval = setInterval(() => {
      animRef.current.forEach((anim, i) => {
        const variance = 0.3 + Math.sin(Date.now() / 200 + seedRef.current[i] * 10) * 0.2;
        const target = Math.min(1, level * variance + 0.15);
        Animated.timing(anim, {
          toValue: target,
          duration: 80,
          useNativeDriver: false,
        }).start();
      });
    }, 80);

    return () => clearInterval(interval);
  }, [level, active]);

  return (
    <View style={styles.container}>
      {animRef.current.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: active ? colors.waveform : colors.border,
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['10%', '100%'],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 80,
    width: '100%',
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
