import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Bird, Mic, Library, AlertCircle, X, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecorder } from '@/hooks/useRecorder';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/components/ThemeProvider';
import { RecordButton } from '@/components/RecordButton';
import { TimerDisplay } from '@/components/TimerDisplay';
import { Waveform } from '@/components/Waveform';
import { StatusBadge } from '@/components/StatusBadge';
import { AudioQuality } from '@/types';

export default function RecorderScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { settings } = useSettings();
  const router = useRouter();
  const recorder = useRecorder(settings.audioQuality);

  const handleButton = () => {
    if (recorder.state === 'idle' || recorder.state === 'error') {
      recorder.start();
    } else if (recorder.state === 'recording') {
      recorder.pause();
    } else if (recorder.state === 'paused') {
      recorder.resume();
    }
  };

  const canStop = recorder.state === 'recording' || recorder.state === 'paused';
  const canCancel = recorder.state === 'recording' || recorder.state === 'paused';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
            <Bird size={24} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Bird Recorder</Text>
        </View>

        {/* Status badge */}
        <View style={styles.statusWrap}>
          <StatusBadge state={recorder.state} />
        </View>

        {/* Waveform */}
        <View style={styles.waveformSection}>
          <Waveform
            level={recorder.audioLevel}
            active={recorder.state === 'recording'}
          />
        </View>

        {/* Timer */}
        <TimerDisplay elapsed={recorder.elapsed} />

        {/* Main record button */}
        <View style={styles.buttonSection}>
          <RecordButton state={recorder.state} onPress={handleButton} />
        </View>

        {/* Secondary controls */}
        <View style={styles.secondaryControls}>
          {canCancel && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={recorder.cancel}
            >
              <Trash2 size={18} color={colors.danger} />
              <Text style={[styles.secondaryText, { color: colors.danger }]}>Cancel</Text>
            </TouchableOpacity>
          )}
          {canStop && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  borderColor: colors.danger,
                  backgroundColor: colors.dangerGlow,
                },
              ]}
              onPress={recorder.stop}
            >
              <View style={[styles.stopSmall, { backgroundColor: colors.danger }]} />
              <Text style={[styles.secondaryText, { color: colors.danger }]}>Stop & Save</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Error */}
        {recorder.error && (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerGlow, borderColor: colors.danger }]}>
            <AlertCircle size={18} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{recorder.error}</Text>
            <TouchableOpacity onPress={recorder.clearError} style={styles.errorClose}>
              <X size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}

        {/* Saved notification */}
        {recorder.lastSavedId && recorder.state === 'idle' && (
          <TouchableOpacity
            style={[styles.savedBox, { backgroundColor: colors.primaryGlow, borderColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/recordings')}
          >
            <Text style={[styles.savedText, { color: colors.primary }]}>
              Recording saved! Tap to view in library.
            </Text>
          </TouchableOpacity>
        )}

        {/* Quality display */}
        <View style={styles.qualityRow}>
          <Text style={[styles.qualityLabel, { color: colors.textMuted }]}>
            Quality: {settings.audioQuality}
          </Text>
        </View>

        {/* Library shortcut */}
        {recorder.state === 'idle' && (
          <TouchableOpacity
            style={[styles.libraryLink, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => router.push('/(tabs)/recordings')}
          >
            <Library size={20} color={colors.primary} />
            <Text style={[styles.libraryLinkText, { color: colors.text }]}>View Recordings</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  statusWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  waveformSection: {
    marginVertical: 16,
  },
  buttonSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stopSmall: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  errorClose: {
    padding: 4,
  },
  savedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  savedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  qualityRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  qualityLabel: {
    fontSize: 13,
  },
  libraryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  libraryLinkText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
