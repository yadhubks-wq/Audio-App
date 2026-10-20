import { useState, useEffect, useCallback } from 'react';
import { Recording, PlaybackMode, PlaybackState } from '@/types';
import { playbackService } from '@/services/playback';

const INITIAL_STATE: PlaybackState = {
  recordingId: null,
  mode: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  error: null,
};

export interface UsePlaybackResult {
  state: PlaybackState;
  playRecording: (recording: Recording) => void;
  playBirdPrank: (recording: Recording) => void;
  stop: () => void;
  clearError: () => void;
}

export function usePlayback(): UsePlaybackResult {
  const [state, setState] = useState<PlaybackState>(INITIAL_STATE);

  useEffect(() => {
    playbackService.setCallbacks({
      onStateChange: (playing) =>
        setState((prev) => ({ ...prev, isPlaying: playing })),
      onTimeUpdate: (currentTime, duration) =>
        setState((prev) => ({ ...prev, currentTime, duration })),
      onEnd: () =>
        setState({
          ...INITIAL_STATE,
          recordingId: playbackService.getRecordingId(),
          mode: playbackService.getCurrentMode(),
        }),
      onError: (message) =>
        setState({ ...INITIAL_STATE, error: message }),
    });

    return () => {
      playbackService.stop();
    };
  }, []);

  const playRecording = useCallback((recording: Recording) => {
    setState({ ...INITIAL_STATE, recordingId: recording.id, mode: 'recording' });
    playbackService.playRecording(recording);
  }, []);

  const playBirdPrank = useCallback((recording: Recording) => {
    setState({
      ...INITIAL_STATE,
      recordingId: recording.id,
      mode: 'bird',
      duration: 12,
    });
    playbackService.playBirdPrank(recording);
  }, []);

  const stop = useCallback(() => {
    playbackService.stop();
    setState(INITIAL_STATE);
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { state, playRecording, playBirdPrank, stop, clearError };
}
