import { useState, useEffect, useCallback } from 'react';
import { ThemeMode, Settings, AudioQuality, PlaybackMode } from '@/types';
import { getSettings, saveSettings } from '@/services/storage';

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  defaultPlaybackMode: 'recording',
  audioQuality: 'medium',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSettings<Settings>(DEFAULT_SETTINGS).then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => updateSettings({ theme }), [updateSettings]);
  const setDefaultPlaybackMode = useCallback(
    (defaultPlaybackMode: PlaybackMode) => updateSettings({ defaultPlaybackMode }),
    [updateSettings]
  );
  const setAudioQuality = useCallback(
    (audioQuality: AudioQuality) => updateSettings({ audioQuality }),
    [updateSettings]
  );

  return { settings, loaded, setTheme, setDefaultPlaybackMode, setAudioQuality, updateSettings };
}
