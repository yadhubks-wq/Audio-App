import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useMemo, useState } from 'react';
import { Search, Music, Bird, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecordings, sortRecordings } from '@/hooks/useRecordings';
import { usePlayback } from '@/hooks/usePlayback';
import { useTheme } from '@/components/ThemeProvider';
import { RecordingCard } from '@/components/RecordingCard';
import { SortOption, Recording } from '@/types';

export default function RecordingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { recordings, loading, error, remove, rename } = useRecordings();
  const playback = usePlayback();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('date-desc');
  const [confirmDelete, setConfirmDelete] = useState<Recording | null>(null);

  const filtered = useMemo(() => {
    let result = recordings;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }
    return sortRecordings(result, sort);
  }, [recordings, search, sort]);

  const sortLabels: Record<SortOption, string> = {
    'date-desc': 'Newest',
    'date-asc': 'Oldest',
    'duration-desc': 'Longest',
    'duration-asc': 'Shortest',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Recordings</Text>
        <Text style={[styles.count, { color: colors.textSecondary }]}>
          {recordings.length} {recordings.length === 1 ? 'recording' : 'recordings'}
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search recordings..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort buttons */}
      <View style={styles.sortRow}>
        {(Object.keys(sortLabels) as SortOption[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.sortButton,
              {
                backgroundColor: sort === key ? colors.primary : colors.surface,
                borderColor: sort === key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSort(key)}
          >
            <Text
              style={[
                styles.sortText,
                { color: sort === key ? '#fff' : colors.textSecondary },
              ]}
            >
              {sortLabels[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Playback error */}
      {playback.state.error && (
        <View style={[styles.playError, { backgroundColor: colors.dangerGlow }]}>
          <Text style={[styles.playErrorText, { color: colors.danger }]}>
            {playback.state.error}
          </Text>
          <TouchableOpacity onPress={playback.clearError}>
            <X size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={[styles.emptyText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerContent}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <Music size={40} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {search ? 'No recordings found' : 'No recordings yet'}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {search ? 'Try a different search' : 'Tap record to create your first recording'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isThisPlaying =
              playback.state.isPlaying && playback.state.recordingId === item.id;
            return (
              <View style={styles.cardWrap}>
                <RecordingCard
                  recording={item}
                  isPlaying={isThisPlaying}
                  playingMode={isThisPlaying ? playback.state.mode : null}
                  playbackProgress={playback.state.currentTime}
                  playbackDuration={playback.state.duration}
                  onPlay={() => playback.playRecording(item)}
                  onPlayBird={() => playback.playBirdPrank(item)}
                  onStop={() => playback.stop()}
                  onDelete={() => setConfirmDelete(item)}
                  onRename={(title) => rename(item.id, title)}
                />
              </View>
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Recording?</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              "{confirmDelete.title}" will be permanently deleted. This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel, { borderColor: colors.border }]}
                onPress={() => setConfirmDelete(null)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDelete, { backgroundColor: colors.danger }]}
                onPress={() => {
                  remove(confirmDelete.id);
                  if (playback.state.recordingId === confirmDelete.id) {
                    playback.stop();
                  }
                  setConfirmDelete(null);
                }}
              >
                <Text style={styles.modalButtonTextWhite}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  count: {
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
  },
  playError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  playErrorText: {
    flex: 1,
    fontSize: 14,
  },
  list: {
    paddingBottom: 40,
  },
  cardWrap: {
    marginBottom: 12,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    width: '85%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancel: {
    borderWidth: 1,
  },
  modalDelete: {},
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextWhite: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
