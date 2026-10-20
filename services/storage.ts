import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Directory, Paths } from 'expo-file-system';

const SETTINGS_KEY = 'settings';

export async function getSettings<T extends object>(defaults: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

export async function saveSettings<T extends object>(settings: T): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const INDEX_KEY = 'recordings:index';

export interface Recording {
  id: string;
  title: string;
  fileName: string; // stored by name, because the app folder path can change between app updates
  uri: string; // full path, rebuilt every time we read
  duration: number; // seconds
  createdAt: number; // timestamp in ms
}

type StoredRecording = Omit<Recording, 'uri'>;

function getDir(): Directory {
  const dir = new Directory(Paths.document, 'recordings');
  if (!dir.exists) dir.create();
  return dir;
}

function toRecording(r: StoredRecording): Recording {
  return { ...r, uri: new File(getDir(), r.fileName).uri };
}

async function readIndex(): Promise<StoredRecording[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as StoredRecording[]) : [];
  } catch {
    return [];
  }
}

async function writeIndex(items: StoredRecording[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(items));
}

/** Moves the recorded file out of the cache into permanent storage and saves its details. */
export async function saveRecording(
  title: string,
  sourceUri: string,
  duration: number,
): Promise<Recording> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = sourceUri.split('.').pop()?.split('?')[0] || 'm4a';
  const fileName = `${id}.${ext}`;

  const dest = new File(getDir(), fileName);
  new File(sourceUri).move(dest);

  const stored: StoredRecording = {
    id,
    title,
    fileName,
    duration,
    createdAt: Date.now(),
  };
  const items = await readIndex();
  await writeIndex([stored, ...items]);
  return toRecording(stored);
}

export async function getRecordings(): Promise<Recording[]> {
  const items = await readIndex();
  return items.map(toRecording);
}

export async function getRecording(id: string): Promise<Recording | null> {
  const items = await readIndex();
  const found = items.find((r) => r.id === id);
  return found ? toRecording(found) : null;
}

export async function renameRecording(id: string, title: string): Promise<void> {
  const items = await readIndex();
  await writeIndex(items.map((r) => (r.id === id ? { ...r, title } : r)));
}

export async function deleteRecording(id: string): Promise<void> {
  const items = await readIndex();
  const target = items.find((r) => r.id === id);
  if (target) {
    try {
      const file = new File(getDir(), target.fileName);
      if (file.exists) file.delete();
    } catch (e) {
      console.warn('Could not delete file:', e);
    }
  }
  await writeIndex(items.filter((r) => r.id !== id));
}