import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { eq, sql, desc } from 'drizzle-orm';
import { SearchBar } from '../../src/components/SearchBar';
import { HotelCard } from '../../src/components/HotelCard';
import { SegmentControl } from '../../src/components/SegmentControl';
import { EmptyState } from '../../src/components/EmptyState';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import { createDb } from '../../src/db/client';
import * as schema from '../../src/db/schema';
import type { SaveStatus } from '../../src/types';

interface HotelRow {
  id: number;
  name: string;
  city: string;
  country: string;
  priceLevel: number | null;
  coverPhoto: string | null;
  saveStatus: SaveStatus | null;
  rating: number | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [viewMode, setViewMode] = useState('Recent');

  const loadHotels = useCallback(async () => {
    const results = await db
      .select({
        id: schema.hotels.id,
        name: schema.hotels.name,
        city: schema.hotels.city,
        country: schema.hotels.country,
        priceLevel: schema.hotels.priceLevel,
        coverPhoto: schema.hotels.coverPhoto,
        saveStatus: schema.saves.status,
        rating: schema.visits.rating,
      })
      .from(schema.saves)
      .innerJoin(schema.hotels, eq(schema.saves.hotelId, schema.hotels.id))
      .leftJoin(
        schema.visits,
        sql`${schema.visits.hotelId} = ${schema.hotels.id} AND ${schema.visits.userId} = ${schema.saves.userId}`
      )
      .where(eq(schema.saves.userId, 1))
      .orderBy(desc(schema.saves.createdAt))
      .limit(50);

    const deduped = new Map<number, HotelRow>();
    for (const r of results) {
      if (!deduped.has(r.id)) {
        deduped.set(r.id, r as HotelRow);
      }
    }
    setHotels(Array.from(deduped.values()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHotels();
    }, [loadHotels])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Wander</Text>
          <Text style={styles.subtitle}>Your hotel journal</Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar onPress={() => router.push('/search')} editable={false} />
        </View>

        <View style={styles.segmentContainer}>
          <SegmentControl
            options={['Recent', 'Top Rated', 'Want']}
            selected={viewMode}
            onChange={setViewMode}
          />
        </View>

        <FlatList
          data={hotels.filter((h) => {
            if (viewMode === 'Want') return h.saveStatus === 'want';
            if (viewMode === 'Top Rated') return h.rating !== null;
            return true;
          }).sort((a, b) => {
            if (viewMode === 'Top Rated') return (b.rating ?? 0) - (a.rating ?? 0);
            return 0;
          })}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <HotelCard
              name={item.name}
              city={item.city}
              country={item.country}
              priceLevel={item.priceLevel}
              coverPhoto={item.coverPhoto}
              saveStatus={item.saveStatus}
              rating={item.rating}
              onPress={() => router.push(`/hotel/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              message="No hotels saved yet. Start by searching for hotels you love."
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
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: Layout.padding,
    paddingVertical: 12,
  },
  segmentContainer: {
    paddingHorizontal: Layout.padding,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: Layout.padding,
    paddingBottom: 20,
  },
});
