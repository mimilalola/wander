import { eq, sql } from 'drizzle-orm';
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
  data: { name?: string; username?: string; location?: string; profilePhoto?: string; bio?: string }
) {
  await db.update(schema.users).set(data).where(eq(schema.users.id, DEFAULT_USER_ID));
}

export async function getProfileStats(db: Database, userId: number): Promise<ProfileStats> {
  const savedResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.saves)
    .where(sql`${schema.saves.userId} = ${userId} AND ${schema.saves.status} = 'want'`);

  const sleptResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${schema.visits.hotelId})` })
    .from(schema.visits)
    .where(eq(schema.visits.userId, userId));

  const avgResult = await db
    .select({ avg: sql<number | null>`AVG(${schema.visits.rating})` })
    .from(schema.visits)
    .where(sql`${schema.visits.userId} = ${userId} AND ${schema.visits.rating} IS NOT NULL`);

  const topCities = await db
    .select({
      city: schema.hotels.city,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.visits)
    .innerJoin(schema.hotels, eq(schema.visits.hotelId, schema.hotels.id))
    .where(eq(schema.visits.userId, userId))
    .groupBy(schema.hotels.city)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5);

  const countriesResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${schema.hotels.country})` })
    .from(schema.visits)
    .innerJoin(schema.hotels, eq(schema.visits.hotelId, schema.hotels.id))
    .where(eq(schema.visits.userId, userId));

  const topTags = await db
    .select({
      tag: schema.tags.name,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.visits)
    .innerJoin(schema.hotelTags, eq(schema.visits.hotelId, schema.hotelTags.hotelId))
    .innerJoin(schema.tags, eq(schema.hotelTags.tagId, schema.tags.id))
    .where(eq(schema.visits.userId, userId))
    .groupBy(schema.tags.name)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5);

  // Build taste summary from top 3 tags
  const tasteWords = topTags.slice(0, 3).map((t) => {
    const word = t.tag.charAt(0).toUpperCase() + t.tag.slice(1);
    return word;
  });
  const tasteSummary = tasteWords.length > 0
    ? `Mostly ${tasteWords.join(' \u00B7 ')}`
    : '';

  return {
    hotelsSaved: savedResult[0]?.count ?? 0,
    hotelsSlept: sleptResult[0]?.count ?? 0,
    averageRating: avgResult[0]?.avg ?? null,
    topCities,
    topTags,
    countriesVisited: countriesResult[0]?.count ?? 0,
    tasteSummary,
  };
}
