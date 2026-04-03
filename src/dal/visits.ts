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
      rank: 1500,
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
    .where(eq(schema.visits.userId, userId))
    .orderBy(desc(schema.visits.createdAt));
}

export async function updateVisitRank(db: Database, visitId: number, newRank: number) {
  await db.update(schema.visits).set({ rank: newRank }).where(eq(schema.visits.id, visitId));
}

export async function getComparisonCandidates(db: Database, userId: number, excludeHotelId: number) {
  return db
    .select({
      visit: schema.visits,
      hotel: schema.hotels,
    })
    .from(schema.visits)
    .innerJoin(schema.hotels, eq(schema.visits.hotelId, schema.hotels.id))
    .where(
      sql`${schema.visits.userId} = ${userId} AND ${schema.visits.hotelId} != ${excludeHotelId}`
    )
    .orderBy(sql`RANDOM()`)
    .limit(5);
}
