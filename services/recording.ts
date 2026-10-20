import { AudioQuality } from '@/types';
import { QUALITY_SETTINGS } from '@/constants';

export interface RecorderCallbacks {
  onStateChange: (state: 'idle' | 'recording' | 'paused') => void;
  onElapsed: (elapsed: number) => void;
  onAudioLevel: (level: number) => void;
  onComplete: (blob: Blob, duration: number) => void;
  onError: (message: string, code?: string) => void;
}

function describeError(err: unknown): { message: string; code: string } {
  const name = (err as DOMException)?.name ?? 'UnknownError';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return {
        code: 'NotAllowedError',
        message:
          'Microphone permission is blocked. Allow microphone access for this site in your browser settings and try again.',
      };
    case 'NotFoundError':
    case 'OverconstrainedError':
      return { code: name, message: 'No microphone was found on this device.' };
    case 'NotReadableError':
    case 'AbortError':
      return {
        code: name,
        message: 'Could not start recording. The microphone may be in use by another app.',
      };
    default:
      return { code: name, message: `Could not start recording (${name}).` };
  }
}

class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: Blob[] = [];
  private callbacks: RecorderCallbacks | null = null;
  private startTimestamp = 0;
  private accumulatedDuration = 0;
  private animationFrameId = 0;
  private lastEmittedSecond = -1;
  private state: 'idle' | 'recording' | 'paused' = 'idle';

  setCallbacks(callbacks: RecorderCallbacks) {
    this.callbacks = callbacks;
  }

  getState() {
    return this.state;
  }

  getElapsed(): number {
    if (this.state === 'recording') {
      return this.accumulatedDuration + (performance.now() - this.startTimestamp) / 1000;
    }
    return this.accumulatedDuration;
  }

  /** Never throws. Returns null when the browser can't tell (iOS Safari). */
  async checkPermission(): Promise<boolean | null> {
    try {
      if (!navigator.permissions?.query) return null;
      const res = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (res.state === 'granted') return true;
      if (res.state === 'denied') return false;
      return null;
    } catch {
      return null;
    }
  }

  /** Optional. start() already asks for permission, so the hook doesn't need this. */
  async requestPermission(): Promise<boolean> {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      console.error('getUserMedia unavailable. Use https:// or localhost.');
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch (err) {
      console.error('Mic permission error:', err);
      return false;
    }
  }

  async start(quality: AudioQuality = 'medium'): Promise<boolean> {
    if (this.state !== 'idle') return false;

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      this.callbacks?.onError(
        'Microphone access needs a secure connection. Open this site over https:// (or localhost).',
        'InsecureContext',
      );
      return false;
    }
    if (typeof MediaRecorder === 'undefined') {
      this.callbacks?.onError('Audio recording is not supported in this browser.', 'NoMediaRecorder');
      return false;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      console.error('getUserMedia failed:', err);
      const { message, code } = describeError(err);
      this.callbacks?.onError(message, code);
      return false;
    }

    try {
      const mimeType = this.getSupportedMimeType();
      const options: MediaRecorderOptions = { ...QUALITY_SETTINGS[quality] };
      if (mimeType) options.mimeType = mimeType;

      try {
        this.mediaRecorder = new MediaRecorder(this.stream, options);
      } catch {
        this.mediaRecorder = new MediaRecorder(this.stream);
      }

      this.chunks = [];
      this.accumulatedDuration = 0;
      this.lastEmittedSecond = -1;

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const type = this.mediaRecorder?.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type });
        // stop() already added the last segment, so don't call getElapsed() here
        const duration = this.accumulatedDuration;
        this.cleanup();
        this.state = 'idle';
        this.callbacks?.onStateChange('idle');
        if (blob.size === 0) {
          this.callbacks?.onError('No audio was captured. Please try again.', 'EmptyRecording');
          return;
        }
        this.callbacks?.onComplete(blob, duration);
      };

      this.mediaRecorder.onerror = () => {
        this.cleanup();
        this.state = 'idle';
        this.callbacks?.onError('Recording error occurred', 'RecorderError');
      };

      this.setupAnalyser();
      this.mediaRecorder.start(1000);
    } catch (err) {
      console.error('Recorder setup failed:', err);
      this.cleanup();
      this.state = 'idle';
      this.callbacks?.onError('Could not start recording on this device.', 'RecorderInitError');
      return false;
    }

    this.state = 'recording';
    this.startTimestamp = performance.now();
    this.callbacks?.onStateChange('recording');
    this.startAnimationLoop();
    return true;
  }

  pause(): void {
    if (this.state !== 'recording' || !this.mediaRecorder) return;
    if (this.mediaRecorder.state === 'recording') {
      this.accumulatedDuration += (performance.now() - this.startTimestamp) / 1000;
      this.mediaRecorder.pause();
      this.state = 'paused';
      this.stopAnimationLoop();
      this.callbacks?.onStateChange('paused');
      this.callbacks?.onAudioLevel(0);
      this.callbacks?.onElapsed(Math.floor(this.accumulatedDuration));
    }
  }

  resume(): void {
    if (this.state !== 'paused' || !this.mediaRecorder) return;
    if (this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.state = 'recording';
      this.startTimestamp = performance.now();
      this.callbacks?.onStateChange('recording');
      this.startAnimationLoop();
    }
  }

  stop(): void {
    if (this.state === 'idle' || !this.mediaRecorder) return;
    if (this.state === 'recording') {
      this.accumulatedDuration += (performance.now() - this.startTimestamp) / 1000;
      // Freeze the clock so nothing counts this segment twice
      this.state = 'paused';
    }
    this.stopAnimationLoop();
    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  cancel(): void {
    const hadSession = this.state !== 'idle' || this.mediaRecorder !== null;
    this.chunks = [];
    this.accumulatedDuration = 0;
    this.state = 'idle';
    this.stopAnimationLoop();
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onerror = null;
      if (this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch {
          /* already stopped */
        }
      }
    }
    this.cleanup();
    if (hadSession) {
      this.callbacks?.onStateChange('idle');
      this.callbacks?.onElapsed(0);
    }
  }

  private setupAnalyser() {
    // The meter is cosmetic. If it fails, recording must still work.
    try {
      const Ctx: typeof AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx || !this.stream) return;
      this.audioContext = new Ctx();
      void this.audioContext.resume(); // iOS creates it suspended
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
    } catch (err) {
      console.warn('Audio meter unavailable:', err);
      this.analyser = null;
    }
  }

  private getAudioLevel(): number {
    if (!this.analyser) return 0;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / data.length) * 3);
  }

  private startAnimationLoop() {
    const tick = () => {
      if (this.state !== 'recording') return;
      // Only notify React when the whole second changes
      const sec = Math.floor(this.getElapsed());
      if (sec !== this.lastEmittedSecond) {
        this.lastEmittedSecond = sec;
        this.callbacks?.onElapsed(sec);
      }
      this.callbacks?.onAudioLevel(this.getAudioLevel());
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stopAnimationLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  private cleanup() {
    this.stopAnimationLoop();
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;
    this.mediaRecorder = null;
  }

  private getSupportedMimeType(): string | undefined {
    if (typeof MediaRecorder === 'undefined') return undefined;
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4', // iOS Safari
      'audio/ogg;codecs=opus',
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t));
  }
}

export const recordingService = new RecordingService();