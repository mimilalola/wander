import { eq, and } from 'drizzle-orm';
import { type Database } from '../db/client';
import * as schema from '../db/schema';
import type { SaveStatus } from '../types';

export async function toggleSave(db: Database, userId: number, hotelId: number, status: SaveStatus) {
  const existing = await db
    .select()
    .from(schema.saves)
    .where(and(eq(schema.saves.userId, userId), eq(schema.saves.hotelId, hotelId)))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].status === status) {
      // Toggle off: remove the save record only (visits/photos are preserved)
      await db.delete(schema.saves).where(eq(schema.saves.id, existing[0].id));
      return null;
    }
    // Change status (e.g. want → been removes from Saved, adds to Slept)
    await db
      .update(schema.saves)
      .set({ status })
      .where(eq(schema.saves.id, existing[0].id));
    return { ...existing[0], status };
  }

  const result = await db.insert(schema.saves).values({ userId, hotelId, status }).returning();
  return result[0];
}

export async function getSaveForHotel(db: Database, userId: number, hotelId: number) {
  const results = await db
    .select()
    .from(schema.saves)
    .where(and(eq(schema.saves.userId, userId), eq(schema.saves.hotelId, hotelId)))
    .limit(1);
  return results[0] ?? null;
}

/**
 * Fully remove a hotel from a user's list.
 * Cascades: photos → visits → save record.
 * This ensures no orphaned data and full consistency across stats and rankings.
 */
export async function removeSave(db: Database, userId: number, hotelId: number) {
  // 1. Find all visits for this hotel by this user
  const visits = await db
    .select({ id: schema.visits.id })
    .from(schema.visits)
    .where(and(eq(schema.visits.userId, userId), eq(schema.visits.hotelId, hotelId)));

  // 2. Delete photos for each visit
  for (const visit of visits) {
    await db.delete(schema.photos).where(eq(schema.photos.visitId, visit.id));
  }

  // 3. Delete all visits for this hotel
  await db
    .delete(schema.visits)
    .where(and(eq(schema.visits.userId, userId), eq(schema.visits.hotelId, hotelId)));

  // 4. Delete the save record
  await db
    .delete(schema.saves)
    .where(and(eq(schema.saves.userId, userId), eq(schema.saves.hotelId, hotelId)));
}
