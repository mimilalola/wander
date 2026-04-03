import { useSQLiteContext } from 'expo-sqlite';
import { createDb } from '../db/client';

export function useDatabase() {
  const sqlite = useSQLiteContext();
  return createDb(sqlite);
}
