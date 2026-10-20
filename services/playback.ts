import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { Recording, PlaybackMode } from '@/types';

export interface PlaybackCallbacks {
  onStateChange: (playing: boolean) => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnd: () => void;
  onError: (message: string) => void;
}

class PlaybackService {
  private player: AudioPlayer | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private callbacks: PlaybackCallbacks | null = null;
  private mode: PlaybackMode | null = null;
  private recordingId: string | null = null;

  setCallbacks(cb: PlaybackCallbacks) { this.callbacks = cb; }
  isPlaying() { return !!this.player?.playing; }
  getCurrentMode() { return this.mode; }
  getRecordingId() { return this.recordingId; }

  async playRecording(recording: Recording) {
    this.stop();
    try {
      // leave recording mode before playing
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

      console.log('Playing URI:', recording.url);
      const player = createAudioPlayer({ uri: recording.url });
      this.player = player;
      this.mode = 'recording';
      this.recordingId = recording.id;

      player.play();
      this.callbacks?.onStateChange(true);

      let started = false;
      this.timer = setInterval(() => {
        const p = this.player;
        if (!p) return;

        const duration = p.duration || 0;
        const current = p.currentTime || 0;
        if (p.playing) started = true;

        this.callbacks?.onTimeUpdate(current, duration);

        // finished: it was playing, now stopped near the end
        if (started && !p.playing && duration > 0 && current >= duration - 0.25) {
          this.stop();
          this.callbacks?.onEnd();
        }
      }, 200);
    } catch (e) {
      console.warn('Playback error', e);
      this.cleanup();
      this.callbacks?.onError('Unable to play this recording.');
    }
  }

  stop() {
    this.cleanup();
    this.callbacks?.onStateChange(false);
    this.mode = null;
    this.recordingId = null;
  }

  seekTo(time: number) {
    this.player?.seekTo(time);
  }

  private cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    try { this.player?.remove(); } catch {}
    this.player = null;
  }
}

export const playbackService = new PlaybackService();