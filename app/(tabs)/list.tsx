import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { eq, sql, desc } from 'drizzle-orm';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { HotelCard } from '../../src/components/HotelCard';
import { SegmentControl } from '../../src/components/SegmentControl';
import { EmptyState } from '../../src/components/EmptyState';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import { createDb } from '../../src/db/client';
import * as schema from '../../src/db/schema';
import { removeSave } from '../../src/dal/saves';
import type { SaveStatus } from '../../src/types';

interface SavedHotel {
  id: number;
  name: string;
  city: string;
  country: string;
  priceLevel: number | null;
  coverPhoto: string | null;
  saveStatus: SaveStatus;
  rating: number | null;
}

export default function ListScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [filter, setFilter] = useState('All');
  const [hotels, setHotels] = useState<SavedHotel[]>([]);
  // Track open swipeable so we can close it when another opens
  const openSwipeableRef = useRef<Swipeable | null>(null);

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
      })
      .from(schema.saves)
      .innerJoin(schema.hotels, eq(schema.saves.hotelId, schema.hotels.id))
      .where(eq(schema.saves.userId, 1))
      .orderBy(desc(schema.saves.createdAt));

    const withRatings: SavedHotel[] = [];
    for (const h of results) {
      const visit = await db
        .select({ rating: schema.visits.rating })
        .from(schema.visits)
        .where(sql`${schema.visits.userId} = 1 AND ${schema.visits.hotelId} = ${h.id}`)
        .orderBy(desc(schema.visits.createdAt))
        .limit(1);
      withRatings.push({
        ...h,
        saveStatus: h.saveStatus as SaveStatus,
        rating: visit[0]?.rating ?? null,
      });
    }
    setHotels(withRatings);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHotels();
    }, [loadHotels])
  );

  const handleDelete = useCallback(
    async (hotel: SavedHotel) => {
      const isSlept = hotel.saveStatus === 'been';
      Alert.alert(
        'Remove Hotel',
        isSlept
          ? `Remove ${hotel.name}? This will also delete your visit history and photos.`
          : `Remove ${hotel.name} from your wishlist?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              await removeSave(db, 1, hotel.id);
              await loadHotels();
            },
          },
        ]
      );
    },
    [db, loadHotels]
  );

  // Filter using the correct DB status values ('want' = Saved, 'been' = Slept)
  const filtered = hotels.filter((h) => {
    if (filter === 'Saved') return h.saveStatus === 'want';
    if (filter === 'Slept') return h.saveStatus === 'been';
    return true;
  });

  const renderRightActions = useCallback(
    (hotel: SavedHotel) => (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(hotel)}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={22} color={Colors.white} />
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    ),
    [handleDelete]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Hotels</Text>
          <Text style={styles.count}>{filtered.length} hotels</Text>
        </View>

        <View style={styles.segmentContainer}>
          <SegmentControl
            options={['All', 'Saved', 'Slept']}
            selected={filter}
            onChange={setFilter}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Swipeable
              ref={(ref) => {
                // Close the previously open swipeable when a new one opens
                if (ref && openSwipeableRef.current && openSwipeableRef.current !== ref) {
                  openSwipeableRef.current.close();
                }
              }}
              onSwipeableOpen={() => {}}
              renderRightActions={() => renderRightActions(item)}
              friction={2}
              rightThreshold={40}
              overshootRight={false}
            >
              <HotelCard
                name={item.name}
                city={item.city}
                country={item.country}
                priceLevel={item.priceLevel}
                coverPhoto={item.coverPhoto}
                saveStatus={item.saveStatus}
                rating={item.rating}
                onPress={() => {
                  // Close any open swipeable before navigating
                  openSwipeableRef.current?.close();
                  router.push(`/hotel/${item.id}`);
                }}
              />
            </Swipeable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-outline"
              message={
                filter === 'Saved'
                  ? 'No hotels on your wishlist yet'
                  : filter === 'Slept'
                  ? "You haven't marked any hotels as visited"
                  : 'Start saving hotels to build your list'
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
    paddingBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  count: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  segmentContainer: {
    paddingHorizontal: Layout.padding,
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: Layout.padding,
    paddingBottom: 20,
  },
  deleteAction: {
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: Layout.borderRadius,
    marginBottom: 12,
    marginLeft: 8,
    gap: 4,
  },
  deleteActionText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
