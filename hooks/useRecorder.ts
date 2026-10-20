import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';
import { RecordingState, AudioQuality } from '@/types';
import { saveRecording } from '@/services/storage';

export interface UseRecorderResult {
  state: RecordingState;
  elapsed: number;
  audioLevel: number;
  error: string | null;
  permissionGranted: boolean | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => Promise<void>;
  cancel: () => void;
  clearError: () => void;
  lastSavedId: string | null;
}

function buildOptions(quality: AudioQuality): RecordingOptions {
  const base = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };
  switch (quality) {
    case 'low':
      return {
        ...base,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 32000,
      };
    case 'medium':
      return {
        ...base,
        sampleRate: 22050,
        numberOfChannels: 1,
        bitRate: 64000,
      };
    default:
      return base;
  }
}

export function useRecorder(
  quality: AudioQuality = 'medium',
): UseRecorderResult {
  const options = useMemo(() => buildOptions(quality), [quality]);
  const recorder = useAudioRecorder(options);
  const recorderState = useAudioRecorderState(recorder, 200);

  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const durationRef = useRef(0);
  const stateRef = useRef<RecordingState>('idle');
  const busyRef = useRef(false);

  durationRef.current = recorderState.durationMillis ?? 0;
  stateRef.current = state;

  const active = state === 'recording' || state === 'paused';
  const elapsed = active
    ? Math.floor((recorderState.durationMillis ?? 0) / 1000)
    : 0;

  // metering is in dB (about -60 quiet to 0 loud). Map it to 0..1.
  const db = recorderState.metering;
  const audioLevel =
    state === 'recording' && typeof db === 'number'
      ? Math.max(0, Math.min(1, (db + 60) / 60))
      : 0;

  useEffect(() => {
    AudioModule.getRecordingPermissionsAsync()
      .then((p) =>
        setPermissionGranted(p.granted ? true : p.canAskAgain ? null : false),
      )
      .catch(() => setPermissionGranted(null));

    return () => {
      // Unmount: discard, never save a half recording
      if (stateRef.current === 'recording' || stateRef.current === 'paused') {
        recorder.stop().catch(() => {});
      }
    };
  }, [recorder]);

  const resetAudioMode = useCallback(async () => {
    try {
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      /* ignore */
    }
  }, []);

  const start = useCallback(async () => {
    if (
      busyRef.current ||
      stateRef.current === 'recording' ||
      stateRef.current === 'paused'
    )
      return;
    busyRef.current = true;
    setError(null);
    setLastSavedId(null);

    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionGranted(perm.granted);
      if (!perm.granted) {
        setError(
          perm.canAskAgain
            ? 'Microphone permission is required to record audio.'
            : 'Microphone permission is blocked. Enable it for this app in your phone settings.',
        );
        setState('error');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('recording');
    } catch (e) {
      console.error('Start recording failed:', e);
      setError('Could not start recording. The microphone may be in use.');
      setState('error');
      await resetAudioMode();
    } finally {
      busyRef.current = false;
    }
  }, [recorder, resetAudioMode]);

  const pause = useCallback(() => {
    if (stateRef.current !== 'recording') return;
    try {
      recorder.pause();
      setState('paused');
    } catch (e) {
      console.error('Pause failed:', e);
    }
  }, [recorder]);

  const resume = useCallback(() => {
    if (stateRef.current !== 'paused') return;
    try {
      recorder.record();
      setState('recording');
    } catch (e) {
      console.error('Resume failed:', e);
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    if (busyRef.current) return;
    if (stateRef.current !== 'recording' && stateRef.current !== 'paused')
      return;
    busyRef.current = true;

    const durationSeconds = durationRef.current / 1000;
    setState('processing');

    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording file was produced');

      // Your saveRecording expects a Blob, so read the file as one
      const title = `Recording ${new Date().toLocaleString()}`;
      const saved = await saveRecording(title, uri, durationSeconds);
      setLastSavedId(saved.id);
      setState('idle');
    } catch (e) {
      console.error('Stop/save failed:', e);
      setError('Failed to save recording.');
      setState('error');
    } finally {
      await resetAudioMode();
      busyRef.current = false;
    }
  }, [recorder, resetAudioMode]);

  const cancel = useCallback(() => {
    const wasActive =
      stateRef.current === 'recording' || stateRef.current === 'paused';
    setError(null);
    setState('idle');
    if (wasActive) {
      recorder.stop().catch(() => {});
    }
    void resetAudioMode();
  }, [recorder, resetAudioMode]);

  const clearError = useCallback(() => {
    setError(null);
    setState('idle');
  }, []);

  return {
    state,
    elapsed,
    audioLevel,
    error,
    permissionGranted,
    start,
    pause,
    resume,
    stop,
    cancel,
    clearError,
    lastSavedId,
  };
}
