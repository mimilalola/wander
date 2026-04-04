import { eq, sql, and, desc } from 'drizzle-orm';
import { type Database } from '../db/client';
import * as schema from '../db/schema';
import type { EmotionTier } from '../types';

export async function createVisit(
  db: Database,
  data: {
    userId: number;
    hotelId: number;
    rating?: number | null;
    notes?: string | null;
    emotion?: EmotionTier | null;
    nights?: number | null;
  }
) {
  const result = await db
    .insert(schema.visits)
    .values({
      userId: data.userId,
      hotelId: data.hotelId,
      rating: data.rating ?? null,
      notes: data.notes ?? null,
      emotion: data.emotion ?? null,
      nights: data.nights ?? null,
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

export async function updateVisitRating(db: Database, visitId: number, rating: number) {
  await db.update(schema.visits).set({ rating }).where(eq(schema.visits.id, visitId));
}

export async function getComparisonCandidates(
  db: Database,
  userId: number,
  excludeHotelId: number,
  emotionTier?: EmotionTier | null
) {
  let whereClause = sql`${schema.visits.userId} = ${userId} AND ${schema.visits.hotelId} != ${excludeHotelId}`;

  if (emotionTier) {
    whereClause = sql`${whereClause} AND ${schema.visits.emotion} = ${emotionTier}`;
  }

  return db
    .select({
      visit: schema.visits,
      hotel: schema.hotels,
    })
    .from(schema.visits)
    .innerJoin(schema.hotels, eq(schema.visits.hotelId, schema.hotels.id))
    .where(whereClause)
    .orderBy(sql`RANDOM()`)
    .limit(3);
}

export async function getVisitsByTier(db: Database, userId: number, emotion: EmotionTier) {
  return db
    .select()
    .from(schema.visits)
    .where(
      sql`${schema.visits.userId} = ${userId} AND ${schema.visits.emotion} = ${emotion}`
    )
    .orderBy(desc(schema.visits.rank));
}
