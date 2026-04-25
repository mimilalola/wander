import { type SQLiteDatabase } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'wander.db';

export function createDb(sqlite: SQLiteDatabase) {
  return drizzle(sqlite, { schema });
}

export type Database = ReturnType<typeof createDb>;

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'Traveler',
      username TEXT NOT NULL DEFAULT 'traveler',
      email TEXT,
      profile_photo TEXT,
      location TEXT,
      is_private INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      price_level INTEGER,
      cover_photo TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      hotel_id INTEGER NOT NULL REFERENCES hotels(id),
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS saves_user_hotel_idx ON saves(user_id, hotel_id);

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      hotel_id INTEGER NOT NULL REFERENCES hotels(id),
      rating INTEGER,
      rank REAL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id INTEGER NOT NULL REFERENCES visits(id),
      image_uri TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS hotel_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL REFERENCES hotels(id),
      tag_id INTEGER NOT NULL REFERENCES tags(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS hotel_tags_idx ON hotel_tags(hotel_id, tag_id);

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_user_id INTEGER NOT NULL REFERENCES users(id),
      following_user_id INTEGER NOT NULL REFERENCES users(id)
    );

    INSERT OR IGNORE INTO users (id, name, username) VALUES (1, 'Traveler', 'traveler');

    -- Nullify legacy Elo scores (rank = 1500 from old system).
    -- These are not valid insertion scores and must not affect rankings or stats.
    UPDATE visits SET rank = NULL WHERE rank > 10.0;

    -- Remove orphaned photos whose visit was deleted without cascading.
    DELETE FROM photos WHERE visit_id NOT IN (SELECT id FROM visits);

    -- Remove orphaned visits that have no corresponding save record.
    -- This cleans up stale data from any previous delete bugs and ensures
    -- stats/rankings are never contaminated by invisible records.
    DELETE FROM visits WHERE NOT EXISTS (
      SELECT 1 FROM saves
      WHERE saves.user_id = visits.user_id
        AND saves.hotel_id = visits.hotel_id
    );

    INSERT OR IGNORE INTO tags (name) VALUES
      ('beach'), ('countryside'), ('city'), ('boutique'),
      ('spa'), ('romantic'), ('ski'), ('design'),
      ('good bar'), ('rooftop'), ('historic'), ('modern'),
      ('eco'), ('family'), ('luxury'), ('budget');
  `);
}
