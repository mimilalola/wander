import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { SearchBar } from '../src/components/SearchBar';
import { HotelListItem } from '../src/components/HotelListItem';
import { Colors } from '../src/constants/colors';
import { Layout } from '../src/constants/layout';
import { createDb } from '../src/db/client';
import * as schema from '../src/db/schema';
import { createHotel, addTagsToHotel, searchLocalHotels } from '../src/dal/hotels';
import { toggleSave } from '../src/dal/saves';
import { mockHotels } from '../src/data/mock-hotels';

export default function SearchScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);

  const [query, setQuery] = useState('');
  // savedNames = hotels with status 'want', sleptNames = hotels with status 'been'
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
  const [sleptNames, setSleptNames] = useState<Set<string>>(new Set());

  const loadStatuses = useCallback(async () => {
    const rows = await db
      .select({
        name: schema.hotels.name,
        status: schema.saves.status,
      })
      .from(schema.saves)
      .innerJoin(schema.hotels, eq(schema.saves.hotelId, schema.hotels.id))
      .where(eq(schema.saves.userId, 1));

    const nextSaved = new Set<string>();
    const nextSlept = new Set<string>();

    for (const row of rows) {
      if (row.status === 'want') nextSaved.add(row.name);
      if (row.status === 'been') nextSlept.add(row.name);
    }

    setSavedNames(nextSaved);
    setSleptNames(nextSlept);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadStatuses();
    }, [loadStatuses])
  );

  useEffect(() => {
    loadStatuses();
  }, [loadStatuses]);

  const filteredResults = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return mockHotels
      .filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.city.toLowerCase().includes(q) ||
          h.country.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [query]);

  /** Resolve or create the local hotel record, returning its id. */
  const getOrCreateHotelId = useCallback(
    async (hotel: (typeof mockHotels)[0]): Promise<number> => {
      const existing = await searchLocalHotels(db, hotel.name);
      if (existing.length > 0 && existing[0].name === hotel.name) {
        return existing[0].id;
      }
      const created = await createHotel(db, {
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        priceLevel: hotel.priceLevel,
      });
      await addTagsToHotel(db, created.id, hotel.tags);
      return created.id;
    },
    [db]
  );

  const handleSelectHotel = useCallback(
    async (hotel: (typeof mockHotels)[0]) => {
      const hotelId = await getOrCreateHotelId(hotel);
      router.replace(`/hotel/${hotelId}`);
    },
    [getOrCreateHotelId, router]
  );

  /**
   * Toggle saved (want) state with an optimistic UI update.
   * A hotel that is already slept ('been') cannot be re-added to the wishlist
   * — the star button is a no-op for those.
   */
  const handleToggleSaved = useCallback(
    async (hotel: (typeof mockHotels)[0]) => {
      if (sleptNames.has(hotel.name)) return;

      // Optimistic update: flip the star instantly so the user sees feedback
      // before the DB round-trip completes.
      const wasSaved = savedNames.has(hotel.name);
      setSavedNames((prev) => {
        const next = new Set(prev);
        wasSaved ? next.delete(hotel.name) : next.add(hotel.name);
        return next;
      });

      const hotelId = await getOrCreateHotelId(hotel);
      await toggleSave(db, 1, hotelId, 'want');
      // Re-sync from DB to handle any edge cases (e.g. concurrent changes)
      await loadStatuses();
    },
    [db, getOrCreateHotelId, loadStatuses, savedNames, sleptNames]
  );

  /**
   * Navigate to the hotel detail screen so the user can go through the full
   * rating/ranking flow via the "Been" button there.
   *
   * We intentionally do NOT directly toggle the 'been' status here because:
   *   1. It would bypass the rating/comparison/ranking flow entirely.
   *   2. A hotel marked 'been' without a visit record would have no rank data,
   *      corrupting the ranking list.
   *   3. If the hotel is already slept, calling toggleSave('been') would
   *      cascade-DELETE all its visits and photos.
   *
   * The "Been" button on the hotel detail screen has the correct guards and
   * navigates to the rating flow.
   */
  const handleNavigateToHotel = useCallback(
    async (hotel: (typeof mockHotels)[0]) => {
      const hotelId = await getOrCreateHotelId(hotel);
      router.push(`/hotel/${hotelId}`);
    },
    [getOrCreateHotelId, router]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Search Hotels</Text>
          </View>

          <SearchBar
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Where's your next adventure?"
          />
        </View>

        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <HotelListItem
              name={item.name}
              city={item.city}
              country={item.country}
              priceLevel={item.priceLevel}
              isSaved={savedNames.has(item.name)}
              isSlept={sleptNames.has(item.name)}
              onToggleSaved={() => handleToggleSaved(item)}
              onToggleSlept={() => handleNavigateToHotel(item)}
              onPress={() => handleSelectHotel(item)}
            />
          )}
          ListFooterComponent={
            query.length >= 2 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push(`/add-hotel?name=${encodeURIComponent(query)}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.accent} />
                <Text style={styles.addText}>Add "{query}" manually</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            query.length >= 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results for "{query}"</Text>
                <Text style={styles.emptySubtext}>Try a different search or add it manually</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={40} color={Colors.textLight} />
                <Text style={styles.emptyText}>Search for a hotel</Text>
                <Text style={styles.emptySubtext}>Type at least 2 characters to search</Text>
              </View>
            )
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
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  addText: {
    fontSize: 15,
    color: Colors.accent,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 4,
  },
});
