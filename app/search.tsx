import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '../src/components/SearchBar';
import { Colors } from '../src/constants/colors';
import { Layout } from '../src/constants/layout';
import { Typography } from '../src/constants/typography';
import { createDb } from '../src/db/client';
import { createHotel, addTagsToHotel, searchLocalHotels } from '../src/dal/hotels';
import { setSave } from '../src/dal/saves';
import { mockHotels } from '../src/data/mock-hotels';

export default function SearchScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [query, setQuery] = useState('');
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set());
  const [sleptNames, setSleptNames] = useState<Set<string>>(new Set());

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

  const ensureHotelInDb = useCallback(
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
      const hotelId = await ensureHotelInDb(hotel);
      router.replace(`/hotel/${hotelId}`);
    },
    [ensureHotelInDb, router]
  );

  const handleQuickSave = useCallback(
    async (hotel: (typeof mockHotels)[0]) => {
      const hotelId = await ensureHotelInDb(hotel);
      await setSave(db, 1, hotelId, 'want');
      setSavedNames((prev) => new Set(prev).add(hotel.name));
    },
    [ensureHotelInDb, db]
  );

  const handleQuickSlept = useCallback(
    async (hotel: (typeof mockHotels)[0]) => {
      const hotelId = await ensureHotelInDb(hotel);
      setSleptNames((prev) => new Set(prev).add(hotel.name));
      router.push(`/rating/${hotelId}`);
    },
    [ensureHotelInDb, router]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Search</Text>
          </View>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Where do you want to go?"
          />
        </View>

        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => {
            const isSaved = savedNames.has(item.name);
            const isSlept = sleptNames.has(item.name);
            return (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectHotel(item)}
                activeOpacity={0.7}
              >
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.resultLocation}>
                    {item.city}, {item.country}
                  </Text>
                </View>
                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={styles.quickAction}
                    onPress={() => handleQuickSave(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={isSaved ? 'star' : 'star-outline'}
                      size={18}
                      color={isSaved ? Colors.accent : Colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickAction}
                    onPress={() => handleQuickSlept(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={isSlept ? 'bed' : 'bed-outline'}
                      size={18}
                      color={isSlept ? Colors.accent : Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            query.length >= 2 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push(`/add-hotel?name=${encodeURIComponent(query)}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.accent} />
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
                <Ionicons name="search" size={36} color={Colors.textLight} />
                <Text style={styles.emptyText}>Find your next stay</Text>
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
    ...Typography.heading3,
    color: Colors.text,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.padding,
    paddingVertical: 14,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    fontFamily: Typography.heading3.fontFamily,
    color: Colors.text,
  },
  resultLocation: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 12,
  },
  quickAction: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.padding,
    paddingVertical: 16,
  },
  addText: {
    fontSize: Typography.body.fontSize,
    color: Colors.accent,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textLight,
    marginTop: 4,
  },
});
