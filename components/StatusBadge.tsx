import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { RecordingState } from '@/types';

interface StatusBadgeProps {
  state: RecordingState;
}

export function StatusBadge({ state }: StatusBadgeProps) {
  const { colors } = useTheme();

  const config = {
    idle: { label: 'Ready to Record', color: colors.textSecondary, dot: colors.textMuted },
    recording: { label: 'Recording', color: colors.danger, dot: colors.danger },
    paused: { label: 'Paused', color: colors.primary, dot: colors.primary },
    processing: { label: 'Saving...', color: colors.accent, dot: colors.accent },
    error: { label: 'Error', color: colors.danger, dot: colors.danger },
  };

  const { label, color, dot } = config[state] || config.idle;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: dot,
            shadowColor: dot,
            shadowOpacity: state === 'recording' ? 0.8 : 0.3,
            shadowRadius: state === 'recording' ? 6 : 2,
          },
        ]}
      />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
