import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeViewGestureHandler } from 'react-native-gesture-handler';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { eq, sql, desc } from 'drizzle-orm';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
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
  rank: number | null;
}

export default function ListScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = useMemo(() => createDb(sqlite), [sqlite]);
  const [filter, setFilter] = useState('All');
  const [hotels, setHotels] = useState<SavedHotel[]>([]);
  // Ref used by each swipeable's simultaneousHandlers so the FlatList scroll
  // gesture and the swipe gesture are recognised at the same time — prevents
  // the "multiple swipes needed" issue where the list scroll gesture consumed
  // the first swipe attempt.
  const scrollHandlerRef = useRef(null);
  // Track all rendered swipeables by hotel id so we can close others on open
  const swipeableRefs = useRef<Map<number, { close: () => void }>>(new Map());

  // Close any open swipeable when the user switches filter tabs so nothing
  // remains stuck open as the list contents change.
  useEffect(() => {
    swipeableRefs.current.forEach((ref) => ref.close());
  }, [filter]);

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

    const withRanks: SavedHotel[] = [];
    for (const h of results) {
      // Only 'been' hotels have visit/rank data; 'want' hotels have neither.
      if (h.saveStatus === 'been') {
        const visit = await db
          .select({ rank: schema.visits.rank })
          .from(schema.visits)
          .where(sql`${schema.visits.userId} = 1 AND ${schema.visits.hotelId} = ${h.id} AND ${schema.visits.rank} IS NOT NULL`)
          .orderBy(desc(schema.visits.createdAt))
          .limit(1);
        withRanks.push({
          ...h,
          saveStatus: h.saveStatus as SaveStatus,
          rank: visit[0]?.rank ?? null,
        });
      } else {
        withRanks.push({ ...h, saveStatus: h.saveStatus as SaveStatus, rank: null });
      }
    }
    setHotels(withRanks);
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
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              swipeableRefs.current.get(hotel.id)?.close();
            },
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              // Optimistically remove the item from the UI immediately so the
              // swipeable doesn't stay open while the DB operation runs.
              setHotels((prev) => prev.filter((h) => h.id !== hotel.id));
              // Cascade-delete save → visits → photos from the database.
              await removeSave(db, 1, hotel.id);
              // Reload so any rank promotions (e.g. a new #1 after deleting
              // the previous top-ranked hotel) are reflected in the UI.
              await loadHotels();
            },
          },
        ]
      );
    },
    [db, loadHotels]
  );

  // Memoised per-item renderer.
  // Keeping this stable (not inline in JSX) prevents React from creating a new
  // ref-callback function on every parent render, which would cause
  // ReanimatedSwipeable to receive a null→element ref call and reset its open/
  // closed state mid-gesture — the root cause of "swipe requires multiple tries".
  const renderItem = useCallback(
    ({ item }: { item: SavedHotel }) => (
      <ReanimatedSwipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
          else swipeableRefs.current.delete(item.id);
        }}
        simultaneousHandlers={scrollHandlerRef}
        onSwipeableOpen={() => {
          swipeableRefs.current.forEach((ref, id) => {
            if (id !== item.id) ref.close();
          });
        }}
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => handleDelete(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.white} />
            <Text style={styles.deleteActionText}>Delete</Text>
          </TouchableOpacity>
        )}
        friction={1}
        rightThreshold={40}
        overshootRight={false}
        overshootFriction={8}
      >
        <HotelCard
          name={item.name}
          city={item.city}
          country={item.country}
          priceLevel={item.priceLevel}
          coverPhoto={item.coverPhoto}
          saveStatus={item.saveStatus}
          rating={item.rank}
          onPress={() => {
            swipeableRefs.current.forEach((ref) => ref.close());
            router.push(`/hotel/${item.id}`);
          }}
        />
      </ReanimatedSwipeable>
    ),
    [handleDelete, router]
  );

  // Filter using the correct DB status values ('want' = Saved, 'been' = Slept)
  const filtered = hotels.filter((h) => {
    if (filter === 'Saved') return h.saveStatus === 'want';
    if (filter === 'Slept') return h.saveStatus === 'been';
    return true;
  });

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

        {/*
          NativeViewGestureHandler wraps the FlatList so its scroll gesture
          and the swipeable's pan gesture are handled simultaneously.
          The ref is forwarded to each ReanimatedSwipeable via simultaneousHandlers
          which tells RNGH to let both gestures recognise at once instead of
          competing — fixing the "swipe absorbed by scroll" bug.
        */}
        <NativeViewGestureHandler ref={scrollHandlerRef}>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
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
        </NativeViewGestureHandler>
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
