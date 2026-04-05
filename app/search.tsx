import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '../src/components/SearchBar';
import { HotelListItem } from '../src/components/HotelListItem';
import { Colors } from '../src/constants/colors';
import { Layout } from '../src/constants/layout';
import { createDb } from '../src/db/client';
import { createHotel, addTagsToHotel, searchLocalHotels } from '../src/dal/hotels';
import { mockHotels } from '../src/data/mock-hotels';

export default function SearchScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [query, setQuery] = useState('');

  const filteredResults = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return mockHotels.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [query]);

  const handleSelectHotel = useCallback(
    async (hotel: (typeof mockHotels)[0]) => {
      // Check if already in local DB
      const existing = await searchLocalHotels(db, hotel.name);
      let hotelId: number;

      if (existing.length > 0 && existing[0].name === hotel.name) {
        hotelId = existing[0].id;
      } else {
        const created = await createHotel(db, {
          name: hotel.name,
          city: hotel.city,
          country: hotel.country,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          priceLevel: hotel.priceLevel,
        });
        hotelId = created.id;
        await addTagsToHotel(db, hotelId, hotel.tags);
      }

      router.replace(`/hotel/${hotelId}`);
    },
    [db, router]
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
          <SearchBar   value={query}   onChangeText={setQuery}   autoFocus   placeholder="Where's your next adventure?" />
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
