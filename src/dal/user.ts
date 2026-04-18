import { eq, sql, and } from 'drizzle-orm';
import { type Database } from '../db/client';
import * as schema from '../db/schema';
import type { ProfileStats } from '../types';

const DEFAULT_USER_ID = 1;

export async function getUser(db: Database) {
  const results = await db.select().from(schema.users).where(eq(schema.users.id, DEFAULT_USER_ID)).limit(1);
  return results[0] ?? null;
}

export async function updateUser(
  db: Database,
  data: { name?: string; username?: string; location?: string; profilePhoto?: string }
) {
  await db.update(schema.users).set(data).where(eq(schema.users.id, DEFAULT_USER_ID));
}

export async function getProfileStats(db: Database, userId: number): Promise<ProfileStats> {
  const wantedResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.saves)
    .where(sql`${schema.saves.userId} = ${userId} AND ${schema.saves.status} = 'want'`);

  // All visit-based stats join with saves to only count hotels actively marked
  // as 'been' (slept). This prevents deleted or de-listed hotels from inflating stats.
  const beenJoin = and(
    eq(schema.visits.hotelId, schema.saves.hotelId),
    eq(schema.visits.userId, schema.saves.userId)
  );

  const visitedResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${schema.visits.hotelId})` })
    .from(schema.visits)
    .innerJoin(schema.saves, beenJoin)
    .where(
      sql`${schema.visits.userId} = ${userId}
          AND ${schema.saves.status} = 'been'
          AND ${schema.visits.rank} IS NOT NULL`
    );

  const avgResult = await db
    .select({ avg: sql<number | null>`AVG(${schema.visits.rating})` })
    .from(schema.visits)
    .innerJoin(schema.saves, beenJoin)
    .where(
      sql`${schema.visits.userId} = ${userId}
          AND ${schema.saves.status} = 'been'
          AND ${schema.visits.rating} IS NOT NULL
          AND ${schema.visits.rank} IS NOT NULL`
    );

  const topCities = await db
    .select({
      city: schema.hotels.city,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.visits)
    .innerJoin(schema.hotels, eq(schema.visits.hotelId, schema.hotels.id))
    .innerJoin(schema.saves, beenJoin)
    .where(
      sql`${schema.visits.userId} = ${userId}
          AND ${schema.saves.status} = 'been'
          AND ${schema.visits.rank} IS NOT NULL`
    )
    .groupBy(schema.hotels.city)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5);

  const countriesResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${schema.hotels.country})` })
    .from(schema.visits)
    .innerJoin(schema.hotels, eq(schema.visits.hotelId, schema.hotels.id))
    .innerJoin(schema.saves, beenJoin)
    .where(
      sql`${schema.visits.userId} = ${userId}
          AND ${schema.saves.status} = 'been'
          AND ${schema.visits.rank} IS NOT NULL`
    );

  const topTags = await db
    .select({
      tag: schema.tags.name,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.visits)
    .innerJoin(schema.hotelTags, eq(schema.visits.hotelId, schema.hotelTags.hotelId))
    .innerJoin(schema.tags, eq(schema.hotelTags.tagId, schema.tags.id))
    .innerJoin(schema.saves, beenJoin)
    .where(
      sql`${schema.visits.userId} = ${userId}
          AND ${schema.saves.status} = 'been'
          AND ${schema.visits.rank} IS NOT NULL`
    )
    .groupBy(schema.tags.name)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5);

  return {
    hotelsWanted: wantedResult[0]?.count ?? 0,
    hotelsVisited: visitedResult[0]?.count ?? 0,
    averageRating: avgResult[0]?.avg ?? null,
    topCities,
    topTags,
    countriesVisited: countriesResult[0]?.count ?? 0,
  };
}
