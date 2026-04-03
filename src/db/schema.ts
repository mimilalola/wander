import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().default('Traveler'),
  username: text('username').notNull().default('traveler'),
  email: text('email'),
  profilePhoto: text('profile_photo'),
  location: text('location'),
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const hotels = sqliteTable('hotels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  priceLevel: integer('price_level'),
  coverPhoto: text('cover_photo'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const saves = sqliteTable('saves', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  hotelId: integer('hotel_id').notNull().references(() => hotels.id),
  status: text('status').notNull().$type<'want' | 'been'>(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex('saves_user_hotel_idx').on(table.userId, table.hotelId),
]);

export const visits = sqliteTable('visits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  hotelId: integer('hotel_id').notNull().references(() => hotels.id),
  rating: integer('rating'),
  rank: real('rank').default(1500),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const photos = sqliteTable('photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  visitId: integer('visit_id').notNull().references(() => visits.id),
  imageUri: text('image_uri').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const hotelTags = sqliteTable('hotel_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hotelId: integer('hotel_id').notNull().references(() => hotels.id),
  tagId: integer('tag_id').notNull().references(() => tags.id),
}, (table) => [
  uniqueIndex('hotel_tags_idx').on(table.hotelId, table.tagId),
]);

export const follows = sqliteTable('follows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  followerUserId: integer('follower_user_id').notNull().references(() => users.id),
  followingUserId: integer('following_user_id').notNull().references(() => users.id),
});
