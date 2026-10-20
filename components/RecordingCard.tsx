import { StyleSheet, Text, View, TouchableOpacity, Animated, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Play, Pause, Bird, Trash2, Pencil, Square, MoreVertical } from 'lucide-react-native';
import { useTheme } from '@/components/ThemeProvider';
import { Recording, PlaybackMode } from '@/types';
import { formatDuration, formatDate, formatBytes } from '@/utils/format';

interface RecordingCardProps {
  recording: Recording;
  isPlaying: boolean;
  playingMode: PlaybackMode | null;
  playbackProgress: number;
  playbackDuration: number;
  onPlay: () => void;
  onPlayBird: () => void;
  onStop: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export function RecordingCard({
  recording,
  isPlaying,
  playingMode,
  playbackProgress,
  playbackDuration,
  onPlay,
  onPlayBird,
  onStop,
  onDelete,
  onRename,
}: RecordingCardProps) {
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(recording.title);
  const menuAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [menuOpen]);

  const haptic = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isActive = isPlaying;
  const progress = playbackDuration > 0 ? playbackProgress / playbackDuration : 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: '#000',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {renaming ? (
            <View style={styles.renameRow}>
              <input
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '600',
                  outline: 'none',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.primary,
                }}
                value={title}
                autoFocus
                onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onRename(title || recording.title);
                    setRenaming(false);
                  }
                  if (e.key === 'Escape') {
                    setTitle(recording.title);
                    setRenaming(false);
                  }
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  onRename(title || recording.title);
                  setRenaming(false);
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {recording.title}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => {
            haptic();
            setMenuOpen(!menuOpen);
          }}
          style={styles.menuButton}
        >
          <MoreVertical size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={[styles.menu, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              setRenaming(true);
            }}
          >
            <Pencil size={16} color={colors.textSecondary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Rename</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              haptic();
              onDelete();
            }}
          >
            <Trash2 size={16} color={colors.danger} />
            <Text style={[styles.menuText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.metaRow}>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {formatDate(recording.createdAt)}
        </Text>
        <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {formatDuration(recording.duration)}
        </Text>
        <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
          {formatBytes(recording.size)}
        </Text>
      </View>

      {isActive && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: playingMode === 'bird' ? colors.accent : colors.primary,
                  width: `${Math.min(100, progress * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {formatDuration(playbackProgress)} / {formatDuration(playbackDuration)}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.primaryAction,
            {
              backgroundColor: isActive && playingMode === 'recording' ? colors.danger : colors.primary,
            },
          ]}
          onPress={() => {
            haptic();
            if (isActive && playingMode === 'recording') {
              onStop();
            } else {
              onPlay();
            }
          }}
        >
          {isActive && playingMode === 'recording' ? (
            <Square size={18} color="#fff" fill="#fff" />
          ) : (
            <Play size={18} color="#fff" fill="#fff" />
          )}
          <Text style={styles.actionText}>
            {isActive && playingMode === 'recording' ? 'Stop' : 'Play'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.birdAction,
            {
              backgroundColor: isActive && playingMode === 'bird' ? colors.danger : colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
          onPress={() => {
            haptic();
            if (isActive && playingMode === 'bird') {
              onStop();
            } else {
              onPlayBird();
            }
          }}
        >
          {isActive && playingMode === 'bird' ? (
            <Square size={18} color="#fff" fill="#fff" />
          ) : (
            <Bird size={18} color={colors.accent} />
          )}
          <Text
            style={[
              styles.actionText,
              { color: isActive && playingMode === 'bird' ? '#fff' : colors.text },
            ]}
          >
            {isActive && playingMode === 'bird' ? 'Stop' : 'Bird Prank'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuButton: {
    padding: 4,
  },
  menu: {
    position: 'absolute',
    top: 48,
    right: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
  },
  metaDot: {
    fontSize: 13,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryAction: {
    flex: 1,
  },
  birdAction: {
    flex: 1,
    borderWidth: 1,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
