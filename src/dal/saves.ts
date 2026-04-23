import { eq, and, sql, desc } from 'drizzle-orm';
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
      // Toggle off: removing the record entirely.
      // For 'been' (slept) hotels, cascade-delete ALL visit data (ranked + photos)
      // so no orphaned records affect stats or rankings.
      if (status === 'been') {
        const visits = await db
          .select({ id: schema.visits.id })
          .from(schema.visits)
          .where(and(eq(schema.visits.userId, userId), eq(schema.visits.hotelId, hotelId)));
        for (const visit of visits) {
          await db.delete(schema.photos).where(eq(schema.photos.visitId, visit.id));
        }
        await db
          .delete(schema.visits)
          .where(and(eq(schema.visits.userId, userId), eq(schema.visits.hotelId, hotelId)));
      }
      // For 'want' (saved) hotels, clean up any orphaned unranked visits that
      // were created during a cancelled rating session. These have rank = NULL
      // and are invisible to stats/rankings but must not accumulate in the DB.
      if (status === 'want') {
        await db
          .delete(schema.visits)
          .where(
            and(
              eq(schema.visits.userId, userId),
              eq(schema.visits.hotelId, hotelId),
              sql`${schema.visits.rank} IS NULL`
            )
          );
      }
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
 *
 * Invariant maintenance: if the deleted hotel held the top rank (10.0), the
 * next highest hotel in the same tier (loved: 6.6–10.0) is promoted to 10.0
 * so the "top item is always 10.0" rule is never violated.
 */
export async function removeSave(db: Database, userId: number, hotelId: number) {
  // 0. Check whether the hotel being deleted currently holds rank = 10.0.
  //    We must do this BEFORE deleting its visits so we can still read the rank.
  const topCheck = await db
    .select({ id: schema.visits.id })
    .from(schema.visits)
    .where(
      sql`${schema.visits.userId} = ${userId}
          AND ${schema.visits.hotelId} = ${hotelId}
          AND ${schema.visits.rank} = 10.0`
    )
    .limit(1);
  const wasTop = topCheck.length > 0;

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

  // 5. If the deleted hotel was the top-ranked (10.0), promote the next highest
  //    hotel in the loved tier (rank 6.6–10.0) to 10.0 so the invariant holds.
  if (wasTop) {
    const nextTop = await db
      .select({ id: schema.visits.id })
      .from(schema.visits)
      .innerJoin(
        schema.saves,
        and(
          eq(schema.visits.hotelId, schema.saves.hotelId),
          eq(schema.visits.userId, schema.saves.userId)
        )
      )
      .where(
        sql`${schema.visits.userId} = ${userId}
            AND ${schema.saves.status} = 'been'
            AND ${schema.visits.rank} IS NOT NULL
            AND ${schema.visits.rank} < 10.0
            AND ${schema.visits.rank} >= 6.6`
      )
      .orderBy(desc(schema.visits.rank))
      .limit(1);

    if (nextTop.length > 0) {
      await db
        .update(schema.visits)
        .set({ rank: 10.0 })
        .where(eq(schema.visits.id, nextTop[0].id));
    }
  }
}
