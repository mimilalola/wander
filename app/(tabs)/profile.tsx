import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import { TagChip } from '../../src/components/TagChip';
import { createDb } from '../../src/db/client';
import { getUser } from '../../src/dal/user';
import { getProfileStats } from '../../src/dal/user';
import type { ProfileStats } from '../../src/types';

interface UserData {
  name: string;
  username: string;
  location: string | null;
  profilePhoto: string | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  const loadProfile = useCallback(async () => {
    const userData = await getUser(db);
    if (userData) {
      setUser({
        name: userData.name,
        username: userData.username,
        location: userData.location,
        profilePhoto: userData.profilePhoto,
      });
    }
    const profileStats = await getProfileStats(db, 1);
    setStats(profileStats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={36} color={Colors.textLight} />
            </View>
          </View>
          <Text style={styles.name}>{user?.name ?? 'Traveler'}</Text>
          <Text style={styles.username}>@{user?.username ?? 'traveler'}</Text>
          {user?.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.location}>{user.location}</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.hotelsWanted ?? 0}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.hotelsVisited ?? 0}</Text>
            <Text style={styles.statLabel}>Visited</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.countriesVisited ?? 0}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {stats?.averageRating !== null && stats?.averageRating !== undefined
                ? stats.averageRating.toFixed(1)
                : '-'}
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </View>
        </View>

        {/* Top Tags */}
        {stats && stats.topTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Taste</Text>
            <View style={styles.tagsRow}>
              {stats.topTags.map((t) => (
                <TagChip key={t.tag} name={`${t.tag} (${t.count})`} />
              ))}
            </View>
          </View>
        )}

        {/* Top Cities */}
        {stats && stats.topCities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Cities</Text>
            {stats.topCities.map((c) => (
              <View key={c.city} style={styles.cityRow}>
                <Ionicons name="location" size={16} color={Colors.accent} />
                <Text style={styles.cityName}>{c.city}</Text>
                <Text style={styles.cityCount}>{c.count} hotel{c.count !== 1 ? 's' : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {stats && stats.hotelsVisited === 0 && stats.hotelsWanted === 0 && (
          <View style={styles.emptySection}>
            <Ionicons name="compass-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>Start exploring to build your taste profile</Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/search')}
              activeOpacity={0.7}
            >
              <Text style={styles.exploreButtonText}>Search Hotels</Text>
            </TouchableOpacity>
          </View>
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
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: Colors.white,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  username: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  location: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginTop: 8,
    paddingVertical: 20,
    paddingHorizontal: Layout.padding,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: 8,
    paddingHorizontal: Layout.padding,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 8,
  },
  cityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  cityCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  exploreButton: {
    marginTop: 20,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
