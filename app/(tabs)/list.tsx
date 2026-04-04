import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { eq, sql, desc } from 'drizzle-orm';
import { SegmentControl } from '../../src/components/SegmentControl';
import { RatingStamp } from '../../src/components/RatingStamp';
import { EmptyState } from '../../src/components/EmptyState';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';
import { createDb } from '../../src/db/client';
import * as schema from '../../src/db/schema';
import { formatEmotion } from '../../src/utils/format';
import type { SaveStatus, EmotionTier } from '../../src/types';

interface ListHotel {
  id: number;
  name: string;
  city: string;
  country: string;
  coverPhoto: string | null;
  saveStatus: SaveStatus;
  rating: number | null;
  emotion: EmotionTier | null;
}

export default function ListScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [filter, setFilter] = useState('Slept');
  const [hotels, setHotels] = useState<ListHotel[]>([]);

  const loadHotels = useCallback(async () => {
    const results = await db
      .select({
        id: schema.hotels.id,
        name: schema.hotels.name,
        city: schema.hotels.city,
        country: schema.hotels.country,
        coverPhoto: schema.hotels.coverPhoto,
        saveStatus: schema.saves.status,
      })
      .from(schema.saves)
      .innerJoin(schema.hotels, eq(schema.saves.hotelId, schema.hotels.id))
      .where(eq(schema.saves.userId, 1))
      .orderBy(desc(schema.saves.createdAt));

    const withVisitData: ListHotel[] = [];
    for (const h of results) {
      const visit = await db
        .select({
          rating: schema.visits.rating,
          emotion: schema.visits.emotion,
          rank: schema.visits.rank,
        })
        .from(schema.visits)
        .where(sql`${schema.visits.userId} = 1 AND ${schema.visits.hotelId} = ${h.id}`)
        .orderBy(desc(schema.visits.createdAt))
        .limit(1);
      withVisitData.push({
        ...h,
        saveStatus: h.saveStatus as SaveStatus,
        rating: visit[0]?.rating ?? null,
        emotion: (visit[0]?.emotion as EmotionTier) ?? null,
      });
    }
    setHotels(withVisitData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHotels();
    }, [loadHotels])
  );

  const sleptHotels = hotels
    .filter((h) => h.saveStatus === 'been')
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const savedHotels = hotels.filter((h) => h.saveStatus === 'want');

  const filtered = filter === 'Slept' ? sleptHotels : savedHotels;

  const renderSleptItem = ({ item, index }: { item: ListHotel; index: number }) => (
    <TouchableOpacity
      style={styles.sleptItem}
      onPress={() => router.push(`/hotel/${item.id}`)}
      activeOpacity={0.7}
    >
      <Text style={styles.rank}>{index + 1}</Text>
      <View style={styles.sleptInfo}>
        <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.hotelLocation}>
          {item.city}, {item.country}
          {item.emotion ? ` \u00B7 ${formatEmotion(item.emotion)}` : ''}
        </Text>
      </View>
      <RatingStamp score={item.rating} size="small" />
    </TouchableOpacity>
  );

  const renderSavedItem = ({ item }: { item: ListHotel }) => (
    <TouchableOpacity
      style={styles.savedItem}
      onPress={() => router.push(`/hotel/${item.id}`)}
      activeOpacity={0.7}
    >
      <Ionicons name="star-outline" size={16} color={Colors.textSecondary} />
      <View style={styles.savedInfo}>
        <Text style={styles.hotelName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.hotelLocation}>{item.city}, {item.country}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My List</Text>
        </View>

        <View style={styles.segmentContainer}>
          <SegmentControl
            options={['Slept', 'Saved']}
            selected={filter}
            onChange={setFilter}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={filter === 'Slept' ? renderSleptItem : renderSavedItem}
          ListEmptyComponent={
            <EmptyState
              icon={filter === 'Slept' ? 'bed-outline' : 'star-outline'}
              message={
                filter === 'Slept'
                  ? 'No hotels rated yet'
                  : 'No hotels saved yet'
              }
              actionLabel="Search Hotels"
              onAction={() => router.push('/search')}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.padding,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    ...Typography.heading1,
    color: Colors.text,
  },
  segmentContainer: {
    paddingHorizontal: Layout.padding,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: Layout.padding,
    paddingBottom: 20,
  },
  sleptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  rank: {
    width: 24,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sleptInfo: {
    flex: 1,
  },
  hotelName: {
    ...Typography.bodyBold,
    fontFamily: Typography.heading3.fontFamily,
    color: Colors.text,
  },
  hotelLocation: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  savedInfo: {
    flex: 1,
  },
});
