import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { eq, sql, desc } from 'drizzle-orm';
import { SearchBar } from '../../src/components/SearchBar';
import { RatingStamp } from '../../src/components/RatingStamp';
import { EmptyState } from '../../src/components/EmptyState';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';
import { createDb } from '../../src/db/client';
import * as schema from '../../src/db/schema';
import type { SaveStatus, EmotionTier } from '../../src/types';

interface HotelRow {
  id: number;
  name: string;
  city: string;
  country: string;
  coverPhoto: string | null;
  saveStatus: SaveStatus;
  rating: number | null;
  emotion: EmotionTier | null;
}

export default function ReceptionScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [adventures, setAdventures] = useState<HotelRow[]>([]);
  const [saved, setSaved] = useState<HotelRow[]>([]);

  const loadData = useCallback(async () => {
    // Recent stays (been)
    const beenResults = await db
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
      .where(sql`${schema.saves.userId} = 1 AND ${schema.saves.status} = 'been'`)
      .orderBy(desc(schema.saves.createdAt))
      .limit(6);

    const adventureList: HotelRow[] = [];
    for (const h of beenResults) {
      const visit = await db
        .select({ rating: schema.visits.rating, emotion: schema.visits.emotion })
        .from(schema.visits)
        .where(sql`${schema.visits.userId} = 1 AND ${schema.visits.hotelId} = ${h.id}`)
        .orderBy(desc(schema.visits.createdAt))
        .limit(1);
      adventureList.push({
        ...h,
        saveStatus: h.saveStatus as SaveStatus,
        rating: visit[0]?.rating ?? null,
        emotion: (visit[0]?.emotion as EmotionTier) ?? null,
      });
    }
    setAdventures(adventureList);

    // Saved (want)
    const wantResults = await db
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
      .where(sql`${schema.saves.userId} = 1 AND ${schema.saves.status} = 'want'`)
      .orderBy(desc(schema.saves.createdAt))
      .limit(4);

    setSaved(
      wantResults.map((h) => ({
        ...h,
        saveStatus: h.saveStatus as SaveStatus,
        rating: null,
        emotion: null,
      }))
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const isEmpty = adventures.length === 0 && saved.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reception</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar onPress={() => router.push('/search')} editable={false} />
        </View>

        {isEmpty ? (
          <EmptyState
            message="No hotels saved yet. Start by searching for hotels you love."
            actionLabel="Search Hotels"
            onAction={() => router.push('/search')}
          />
        ) : (
          <>
            {/* Adventures */}
            {adventures.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.editorialLabel}>ADVENTURES</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                >
                  {adventures.map((hotel) => (
                    <TouchableOpacity
                      key={hotel.id}
                      style={styles.adventureCard}
                      onPress={() => router.push(`/hotel/${hotel.id}`)}
                      activeOpacity={0.7}
                    >
                      {hotel.coverPhoto ? (
                        <Image
                          source={{ uri: hotel.coverPhoto }}
                          style={styles.adventureImage}
                        />
                      ) : (
                        <View style={styles.adventurePlaceholder}>
                          <Ionicons name="bed-outline" size={24} color={Colors.textLight} />
                        </View>
                      )}
                      {hotel.rating !== null && (
                        <View style={styles.adventureStamp}>
                          <RatingStamp score={hotel.rating} size="small" />
                        </View>
                      )}
                      <Text style={styles.adventureName} numberOfLines={1}>
                        {hotel.name}
                      </Text>
                      <Text style={styles.adventureLocation} numberOfLines={1}>
                        {hotel.city}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Saved */}
            {saved.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.editorialLabel}>SAVED</Text>
                  <TouchableOpacity onPress={() => router.push('/(tabs)/list')}>
                    <Text style={styles.seeAll}>See all</Text>
                  </TouchableOpacity>
                </View>
                {saved.map((hotel) => (
                  <TouchableOpacity
                    key={hotel.id}
                    style={styles.savedItem}
                    onPress={() => router.push(`/hotel/${hotel.id}`)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="star-outline" size={16} color={Colors.textSecondary} />
                    <View style={styles.savedInfo}>
                      <Text style={styles.savedName} numberOfLines={1}>
                        {hotel.name}
                      </Text>
                      <Text style={styles.savedLocation}>
                        {hotel.city}, {hotel.country}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingBottom: 4,
  },
  title: {
    ...Typography.heading1,
    color: Colors.text,
  },
  searchContainer: {
    paddingHorizontal: Layout.padding,
    paddingVertical: 12,
  },
  section: {
    paddingTop: Layout.sectionGap,
    paddingHorizontal: Layout.padding,
  },
  editorialLabel: {
    ...Typography.editorial,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
    color: Colors.accent,
  },
  horizontalScroll: {
    marginHorizontal: -Layout.padding,
    paddingLeft: Layout.padding,
  },
  adventureCard: {
    width: 160,
    marginRight: 14,
  },
  adventureImage: {
    width: 160,
    height: 120,
    borderRadius: Layout.borderRadius,
  },
  adventurePlaceholder: {
    width: 160,
    height: 120,
    borderRadius: Layout.borderRadius,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adventureStamp: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(247,247,245,0.92)',
    borderRadius: 20,
    padding: 1,
  },
  adventureName: {
    ...Typography.bodyBold,
    fontFamily: Typography.heading3.fontFamily,
    color: Colors.text,
    marginTop: 8,
  },
  adventureLocation: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  savedInfo: {
    flex: 1,
  },
  savedName: {
    ...Typography.bodyBold,
    fontFamily: Typography.heading3.fontFamily,
    color: Colors.text,
  },
  savedLocation: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
