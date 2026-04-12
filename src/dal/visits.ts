import { eq, sql, and, desc } from 'drizzle-orm';
import { type Database } from '../db/client';
import * as schema from '../db/schema';

export async function createVisit(
  db: Database,
  data: {
    userId: number;
    hotelId: number;
    rating: number | null;
    notes: string | null;
  }
) {
  const result = await db
    .insert(schema.visits)
    .values({
      userId: data.userId,
      hotelId: data.hotelId,
      rating: data.rating,
      notes: data.notes,
      rank: null, // unranked until comparisons complete
    })
    .returning();
  return result[0];
}

export async function getLatestVisit(db: Database, userId: number, hotelId: number) {
  const results = await db
    .select()
    .from(schema.visits)
    .where(and(eq(schema.visits.userId, userId), eq(schema.visits.hotelId, hotelId)))
    .orderBy(desc(schema.visits.createdAt))
    .limit(1);
  return results[0] ?? null;
}

export async function getVisitedHotels(db: Database, userId: number) {
  return db
    .select({
      visit: schema.visits,
      hotel: schema.hotels,
    })
    .from(schema.visits)
    .innerJoin(schema.hotels, eq(schema.visits.hotelId, schema.hotels.id))
    .innerJoin(
      schema.saves,
      and(
        eq(schema.visits.hotelId, schema.saves.hotelId),
        eq(schema.visits.userId, schema.saves.userId)
      )
    )
    .where(
      and(
        eq(schema.visits.userId, userId),
        eq(schema.saves.status, 'been')
      )
    )
    .orderBy(desc(schema.visits.createdAt));
}

export async function updateVisitRank(db: Database, visitId: number, newRank: number) {
  await db.update(schema.visits).set({ rank: newRank }).where(eq(schema.visits.id, visitId));
}

/**
 * Get all valid (0–10 scale) scores for a user's visits, sorted descending.
 * Only includes hotels still marked as 'been' (slept) — excludes any orphaned
 * visit records that no longer have an active save entry.
 * Also excludes legacy Elo scores (which are > 10).
 */
export async function getAllVisitScoresForUser(
  db: Database,
  userId: number
): Promise<number[]> {
  const results = await db
    .select({ rank: schema.visits.rank })
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
          AND ${schema.visits.rank} <= 10.0`
    );

  return results.map((r) => r.rank as number).sort((a, b) => b - a);
}

/**
 * Get the visit currently holding the top rank (10.0), if any.
 * Only considers hotels with an active 'been' save record.
 */
export async function getTopRankedVisit(db: Database, userId: number) {
  const results = await db
    .select({
      id: schema.visits.id,
      userId: schema.visits.userId,
      hotelId: schema.visits.hotelId,
      rating: schema.visits.rating,
      rank: schema.visits.rank,
      notes: schema.visits.notes,
      createdAt: schema.visits.createdAt,
    })
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
  return results[0] ?? null;
}

/**
 * Get up to 5 comparison candidates within the same tier score range.
 * The current top-ranked hotel (10.0) is always placed first if present in the tier,
 * ensuring the new hotel always gets a chance to compete for the top spot.
 * Only includes hotels with an active 'been' save record.
 */
export async function getComparisonCandidates(
  db: Database,
  userId: number,
  excludeHotelId: number,
  tierMin: number,
  tierMax: number
) {
  return db
    .select({
      visit: schema.visits,
      hotel: schema.hotels,
    })
    .from(schema.visits)
    .innerJoin(schema.hotels, eq(schema.visits.hotelId, schema.hotels.id))
    .innerJoin(
      schema.saves,
      and(
        eq(schema.visits.hotelId, schema.saves.hotelId),
        eq(schema.visits.userId, schema.saves.userId)
      )
    )
    .where(
      sql`${schema.visits.userId} = ${userId}
          AND ${schema.visits.hotelId} != ${excludeHotelId}
          AND ${schema.saves.status} = 'been'
          AND ${schema.visits.rank} IS NOT NULL
          AND ${schema.visits.rank} >= ${tierMin}
          AND ${schema.visits.rank} <= ${tierMax}`
    )
    // Sort: current top (10.0) first so new hotel always compares against #1, then random
    .orderBy(sql`CASE WHEN ${schema.visits.rank} = 10.0 THEN 0 ELSE 1 END, RANDOM()`)
    .limit(5);
}

/**
 * Cascade-delete all visits (and their photos) for a hotel by a user.
 */
export async function deleteVisitsByHotel(
  db: Database,
  userId: number,
  hotelId: number
) {
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
