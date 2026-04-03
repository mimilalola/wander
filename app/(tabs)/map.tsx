import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { eq, sql, desc } from 'drizzle-orm';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import { createDb } from '../../src/db/client';
import * as schema from '../../src/db/schema';
import type { SaveStatus } from '../../src/types';

interface MapHotel {
  id: number;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  saveStatus: SaveStatus;
  rating: number | null;
}

let MapView: any;
let Marker: any;
let Callout: any;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Callout = Maps.Callout;
} catch {
  // Maps not available (web)
}

export default function MapScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [hotels, setHotels] = useState<MapHotel[]>([]);

  const loadHotels = useCallback(async () => {
    const results = await db
      .select({
        id: schema.hotels.id,
        name: schema.hotels.name,
        city: schema.hotels.city,
        country: schema.hotels.country,
        latitude: schema.hotels.latitude,
        longitude: schema.hotels.longitude,
        saveStatus: schema.saves.status,
      })
      .from(schema.saves)
      .innerJoin(schema.hotels, eq(schema.saves.hotelId, schema.hotels.id))
      .where(
        sql`${schema.saves.userId} = 1 AND ${schema.hotels.latitude} IS NOT NULL AND ${schema.hotels.longitude} IS NOT NULL`
      );

    const withRatings: MapHotel[] = [];
    for (const h of results) {
      const visit = await db
        .select({ rating: schema.visits.rating })
        .from(schema.visits)
        .where(sql`${schema.visits.userId} = 1 AND ${schema.visits.hotelId} = ${h.id}`)
        .orderBy(desc(schema.visits.createdAt))
        .limit(1);
      withRatings.push({
        ...h,
        latitude: h.latitude!,
        longitude: h.longitude!,
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

  if (!MapView) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Map</Text>
          <Text style={styles.fallbackText}>
            Map view is available on iOS and Android devices.
          </Text>
          {hotels.length > 0 && (
            <View style={styles.hotelList}>
              {hotels.map((h) => (
                <TouchableOpacity
                  key={h.id}
                  style={styles.hotelItem}
                  onPress={() => router.push(`/hotel/${h.id}`)}
                >
                  <Text style={styles.hotelName}>{h.name}</Text>
                  <Text style={styles.hotelLocation}>{h.city}, {h.country}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Map</Text>
          <Text style={styles.count}>{hotels.length} hotels</Text>
        </View>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 45,
            longitude: 10,
            latitudeDelta: 30,
            longitudeDelta: 30,
          }}
        >
          {hotels.map((hotel) => (
            <Marker
              key={hotel.id}
              coordinate={{ latitude: hotel.latitude, longitude: hotel.longitude }}
              pinColor={hotel.saveStatus === 'been' ? Colors.been : Colors.want}
            >
              <Callout onPress={() => router.push(`/hotel/${hotel.id}`)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName}>{hotel.name}</Text>
                  <Text style={styles.calloutLocation}>{hotel.city}</Text>
                  {hotel.rating !== null && (
                    <Text style={styles.calloutRating}>{hotel.rating}/10</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
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
  map: {
    flex: 1,
  },
  callout: {
    padding: 8,
    minWidth: 120,
  },
  calloutName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  calloutLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  calloutRating: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: 4,
  },
  fallback: {
    flex: 1,
    padding: Layout.padding,
    paddingTop: 20,
  },
  fallbackTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  fallbackText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 24,
  },
  hotelList: {
    gap: 8,
  },
  hotelItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: Layout.borderRadiusSmall,
    ...Layout.cardShadow,
  },
  hotelName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  hotelLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
