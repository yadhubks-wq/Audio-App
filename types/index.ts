export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing' | 'error';

export interface Recording {
  id: string;
  title: string;
  createdAt: number;
  duration: number;
  size: number;
  blob: Blob;
  url: string;
}

export interface RecordingMetadata {
  id: string;
  title: string;
  createdAt: number;
  duration: number;
  size: number;
}

export type PlaybackMode = 'recording' | 'bird';

export type ThemeMode = 'dark' | 'light';

export type AudioQuality = 'low' | 'medium' | 'high';

export type SortOption = 'date-desc' | 'date-asc' | 'duration-desc' | 'duration-asc';

export interface Settings {
  theme: ThemeMode;
  defaultPlaybackMode: PlaybackMode;
  audioQuality: AudioQuality;
}

export interface PlaybackState {
  recordingId: string | null;
  mode: PlaybackMode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
}
