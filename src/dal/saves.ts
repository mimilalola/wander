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
    // Change status (e.g. want → been removes from Saved, adds to Slept).
    // Before committing the transition, purge any null-rank visits left from
    // previously cancelled rating sessions — they have no ranking value and
    // must not linger to affect queries or stats.
    if (existing[0].status === 'want' && status === 'been') {
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
 * Cascades: photos → visits → save record — all inside one transaction so a
 * mid-operation failure cannot leave orphaned data in the database.
 *
 * Invariant maintenance: if the deleted hotel held the top rank (10.0), the
 * next highest hotel in the same tier (loved: 6.6–10.0) is promoted to 10.0
 * so the "top item is always 10.0" rule is never violated.
 */
export async function removeSave(db: Database, userId: number, hotelId: number) {
  await db.transaction(async (tx) => {
    // 1. Find all visits for this hotel by this user
    const visits = await tx
      .select({ id: schema.visits.id })
      .from(schema.visits)
      .where(and(eq(schema.visits.userId, userId), eq(schema.visits.hotelId, hotelId)));

    // 2. Delete photos for each visit
    for (const visit of visits) {
      await tx.delete(schema.photos).where(eq(schema.photos.visitId, visit.id));
    }

    // 3. Delete all visits for this hotel — check for 10.0 rank before deleting
    //    so the promotion logic (step 6) knows whether to run.
    const topCheck = await tx
      .select({ id: schema.visits.id })
      .from(schema.visits)
      .where(
        sql`${schema.visits.userId} = ${userId}
            AND ${schema.visits.hotelId} = ${hotelId}
            AND ${schema.visits.rank} = 10.0`
      )
      .limit(1);
    const wasTop = topCheck.length > 0;

    await tx
      .delete(schema.visits)
      .where(and(eq(schema.visits.userId, userId), eq(schema.visits.hotelId, hotelId)));

    // 4. Delete the save record
    await tx
      .delete(schema.saves)
      .where(and(eq(schema.saves.userId, userId), eq(schema.saves.hotelId, hotelId)));

    // 5. Nothing to promote if the deleted hotel wasn't the top-ranked one.
    if (!wasTop) return;

    // 6. The deleted hotel held rank 10.0. Before promoting the next hotel,
    //    verify no other hotel already holds 10.0 (guards against corrupt state
    //    where two hotels both have rank=10.0 — promoting a third would compound
    //    the problem). Only promote when there is genuinely no current top.
    const existingAnotherTop = await tx
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
            AND ${schema.visits.rank} = 10.0`
      )
      .limit(1);

    if (existingAnotherTop.length > 0) return;

    // 7. Promote the next-highest hotel in the loved tier (6.6–10.0) to 10.0.
    //    Reads here see the already-deleted visits/saves, so the removed hotel is
    //    correctly excluded without needing an explicit hotelId filter.
    const nextTop = await tx
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
      await tx
        .update(schema.visits)
        .set({ rank: 10.0 })
        .where(eq(schema.visits.id, nextTop[0].id));
    }
  });
}
