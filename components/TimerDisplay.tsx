import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { formatTime } from '@/utils/format';

interface TimerDisplayProps {
  elapsed: number;
}

export function TimerDisplay({ elapsed }: TimerDisplayProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.timer,
          {
            color: colors.text,
            textShadowColor: colors.primaryGlow,
          },
        ]}
      >
        {formatTime(elapsed)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  timer: {
    fontSize: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
