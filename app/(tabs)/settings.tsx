import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useMemo, useState, useEffect } from 'react';
import { Bird, Moon, Sun, Mic, Bell, Lock, Info, HardDrive, Shield } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/components/ThemeProvider';
import { useRecordings } from '@/hooks/useRecordings';
import { ThemeMode, AudioQuality, PlaybackMode } from '@/types';
import { APP_VERSION } from '@/constants';
import { formatBytes } from '@/utils/format';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { settings, setTheme, setAudioQuality, setDefaultPlaybackMode } = useSettings();
  const { recordings } = useRecordings();
  const [micPermission, setMicPermission] = useState<string>('Checking...');
  const [notifPermission] = useState<string>('Not available in preview');

  const totalStorage = useMemo(
    () => recordings.reduce((sum, r) => sum + r.size, 0),
    [recordings]
  );

  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          setMicPermission('Check by recording');
          return;
        }
        setMicPermission('Ready to record');
      } catch {
        setMicPermission('Check by recording');
      }
    };

    checkMicPermission();
  }, []);

  const permissionColor = (state: string) => {
    if (state === 'granted') return colors.primary;
    if (state === 'denied') return colors.danger;
    return colors.textSecondary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.themeRow}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      settings.theme === 'dark' ? colors.primary : colors.surfaceElevated,
                    borderColor: settings.theme === 'dark' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTheme('dark')}
              >
                <Moon size={20} color={settings.theme === 'dark' ? '#fff' : colors.textSecondary} />
                <Text
                  style={{
                    color: settings.theme === 'dark' ? '#fff' : colors.textSecondary,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Dark
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      settings.theme === 'light' ? colors.primary : colors.surfaceElevated,
                    borderColor: settings.theme === 'light' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setTheme('light')}
              >
                <Sun size={20} color={settings.theme === 'light' ? '#fff' : colors.textSecondary} />
                <Text
                  style={{
                    color: settings.theme === 'light' ? '#fff' : colors.textSecondary,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  Light
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Playback */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Playback</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Default Playback Mode</Text>
            <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
              What plays when you tap a recording
            </Text>
            <View style={styles.optionRow}>
              {(['recording', 'bird'] as PlaybackMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.optionPill,
                    {
                      backgroundColor:
                        settings.defaultPlaybackMode === mode ? colors.primary : colors.surfaceElevated,
                      borderColor: settings.defaultPlaybackMode === mode ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setDefaultPlaybackMode(mode)}
                >
                  <Text
                    style={{
                      color: settings.defaultPlaybackMode === mode ? '#fff' : colors.text,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {mode === 'recording' ? 'Real Audio' : 'Bird Prank'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Audio Quality */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recording</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Audio Quality</Text>
            <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
              Higher quality uses more storage
            </Text>
            <View style={styles.optionRow}>
              {(['low', 'medium', 'high'] as AudioQuality[]).map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.optionPill,
                    {
                      backgroundColor: settings.audioQuality === q ? colors.primary : colors.surfaceElevated,
                      borderColor: settings.audioQuality === q ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setAudioQuality(q)}
                >
                  <Text
                    style={{
                      color: settings.audioQuality === q ? '#fff' : colors.text,
                      fontSize: 13,
                      fontWeight: '600',
                      textTransform: 'capitalize',
                    }}
                  >
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Storage */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Storage</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceElevated }]}>
                <HardDrive size={18} color={colors.accent} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Total Used</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  {recordings.length} recordings · {formatBytes(totalStorage)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Permissions</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Mic size={18} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Microphone</Text>
                <Text style={[styles.settingDesc, { color: permissionColor(micPermission) }]}>
                  {micPermission}
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Bell size={18} color={colors.accent} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Notifications</Text>
                <Text style={[styles.settingDesc, { color: permissionColor(notifPermission) }]}>
                  {notifPermission}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Privacy</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Lock size={18} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Lock-Screen Notifications
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Browser-based preview does not support lock-screen notifications. On a native Android build, recording status with a live timer would appear on the lock screen.
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Shield size={18} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Data Privacy</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  All recordings stay on your device. Nothing is uploaded to a server.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Bird size={18} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Bird Recorder</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  Version {APP_VERSION}
                </Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.settingRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceElevated }]}>
                <Info size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                  A voice recorder app with a bird-sound prank playback feature. Record real audio, play it back, or prank with bird chirps.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Bird Recorder · Made with care
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  optionPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
  },
});
