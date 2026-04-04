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
      // Toggle off: remove save
      await db.delete(schema.saves).where(eq(schema.saves.id, existing[0].id));
      return null;
    }
    // Change status
    await db
      .update(schema.saves)
      .set({ status })
      .where(eq(schema.saves.id, existing[0].id));
    return { ...existing[0], status };
  }

  const result = await db.insert(schema.saves).values({ userId, hotelId, status }).returning();
  return result[0];
}

export async function setSave(db: Database, userId: number, hotelId: number, status: SaveStatus) {
  const existing = await db
    .select()
    .from(schema.saves)
    .where(and(eq(schema.saves.userId, userId), eq(schema.saves.hotelId, hotelId)))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].status !== status) {
      await db.update(schema.saves).set({ status }).where(eq(schema.saves.id, existing[0].id));
    }
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

export async function removeSave(db: Database, userId: number, hotelId: number) {
  await db
    .delete(schema.saves)
    .where(and(eq(schema.saves.userId, userId), eq(schema.saves.hotelId, hotelId)));
}
