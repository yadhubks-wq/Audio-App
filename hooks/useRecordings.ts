import { useState, useEffect, useCallback, useRef } from 'react';
import { Recording, SortOption } from '@/types';
import { getAllRecordings, deleteRecording, renameRecording } from '@/services/storage';

export interface UseRecordingsResult {
  recordings: Recording[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
}

export function useRecordings(): UseRecordingsResult {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const all = await getAllRecordings();
      if (mountedRef.current) {
        setRecordings(all.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch {
      if (mountedRef.current) {
        setError('Could not load recordings.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteRecording(id);
      setRecordings((prev) => {
        const found = prev.find((r) => r.id === id);
        if (found) URL.revokeObjectURL(found.url);
        return prev.filter((r) => r.id !== id);
      });
    } catch {
      setError('Could not delete recording.');
    }
  }, []);

  const rename = useCallback(async (id: string, title: string) => {
    try {
      await renameRecording(id, title);
      setRecordings((prev) =>
        prev.map((r) => (r.id === id ? { ...r, title } : r))
      );
    } catch {
      setError('Could not rename recording.');
    }
  }, []);

  return { recordings, loading, error, refresh, remove, rename };
}

export function sortRecordings(recordings: Recording[], sort: SortOption): Recording[] {
  const sorted = [...recordings];
  switch (sort) {
    case 'date-desc':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'date-asc':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'duration-desc':
      return sorted.sort((a, b) => b.duration - a.duration);
    case 'duration-asc':
      return sorted.sort((a, b) => a.duration - b.duration);
    default:
      return sorted;
  }
}
