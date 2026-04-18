import { eq, like, or, sql } from 'drizzle-orm';
import { type Database } from '../db/client';
import * as schema from '../db/schema';

export async function getHotelById(db: Database, id: number) {
  const results = await db.select().from(schema.hotels).where(eq(schema.hotels.id, id)).limit(1);
  return results[0] ?? null;
}

export async function searchLocalHotels(db: Database, query: string) {
  const pattern = `%${query}%`;
  return db
    .select()
    .from(schema.hotels)
    .where(
      or(
        like(schema.hotels.name, pattern),
        like(schema.hotels.city, pattern),
        like(schema.hotels.country, pattern)
      )
    )
    .limit(20);
}

export async function createHotel(
  db: Database,
  data: {
    name: string;
    city: string;
    country: string;
    latitude?: number | null;
    longitude?: number | null;
    priceLevel?: number | null;
    coverPhoto?: string | null;
  }
) {
  const result = await db.insert(schema.hotels).values({
    name: data.name,
    city: data.city,
    country: data.country,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    priceLevel: data.priceLevel ?? null,
    coverPhoto: data.coverPhoto ?? null,
  }).returning();
  return result[0];
}

export async function getHotelWithDetails(db: Database, hotelId: number, userId: number) {
  const hotel = await getHotelById(db, hotelId);
  if (!hotel) return null;

  const save = await db
    .select()
    .from(schema.saves)
    .where(sql`${schema.saves.userId} = ${userId} AND ${schema.saves.hotelId} = ${hotelId}`)
    .limit(1);

  // Only include completed (ranked) visits. NULL-rank visits are orphaned records
  // from abandoned rating sessions — they have no insertion score and must not
  // appear in the hotel detail or affect any downstream logic.
  const visitsList = await db
    .select()
    .from(schema.visits)
    .where(sql`${schema.visits.userId} = ${userId} AND ${schema.visits.hotelId} = ${hotelId} AND ${schema.visits.rank} IS NOT NULL`)
    .orderBy(sql`${schema.visits.createdAt} DESC`);

  const tagRows = await db
    .select({ name: schema.tags.name })
    .from(schema.hotelTags)
    .innerJoin(schema.tags, eq(schema.hotelTags.tagId, schema.tags.id))
    .where(eq(schema.hotelTags.hotelId, hotelId));

  const allPhotos = [];
  for (const visit of visitsList) {
    const visitPhotos = await db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.visitId, visit.id));
    allPhotos.push(...visitPhotos);
  }

  return {
    ...hotel,
    save: save[0] ?? null,
    visits: visitsList,
    tags: tagRows.map((t) => t.name),
    photos: allPhotos,
  };
}

export async function addTagsToHotel(db: Database, hotelId: number, tagNames: string[]) {
  for (const name of tagNames) {
    const existing = await db.select().from(schema.tags).where(eq(schema.tags.name, name)).limit(1);
    let tagId: number;
    if (existing.length > 0) {
      tagId = existing[0].id;
    } else {
      const result = await db.insert(schema.tags).values({ name }).returning();
      tagId = result[0].id;
    }
    await db.insert(schema.hotelTags).values({ hotelId, tagId }).onConflictDoNothing();
  }
}
