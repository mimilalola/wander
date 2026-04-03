import { eq } from 'drizzle-orm';
import { type Database } from '../db/client';
import * as schema from '../db/schema';

export async function addPhoto(db: Database, visitId: number, imageUri: string) {
  const result = await db
    .insert(schema.photos)
    .values({ visitId, imageUri })
    .returning();
  return result[0];
}

export async function getPhotosByVisit(db: Database, visitId: number) {
  return db.select().from(schema.photos).where(eq(schema.photos.visitId, visitId));
}

export async function addPhotos(db: Database, visitId: number, imageUris: string[]) {
  for (const uri of imageUris) {
    await addPhoto(db, visitId, uri);
  }
}
