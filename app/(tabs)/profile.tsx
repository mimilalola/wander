import React, { useState, useCallback, useRef } from 'react';
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
import { Typography } from '../../src/constants/typography';
import { TagChip } from '../../src/components/TagChip';
import { createDb } from '../../src/db/client';
import { getUser, getProfileStats, getPassportBadges } from '../../src/dal/user';
import type { ProfileStats, PassportBadge } from '../../src/types';

interface UserData {
  name: string;
  username: string;
  location: string | null;
  profilePhoto: string | null;
  bio: string | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [user, setUser] = useState<UserData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [badges, setBadges] = useState<PassportBadge[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const passportY = useRef(0);

  const loadProfile = useCallback(async () => {
    const userData = await getUser(db);
    if (userData) {
      setUser({
        name: userData.name,
        username: userData.username,
        location: userData.location,
        profilePhoto: userData.profilePhoto,
        bio: (userData as Record<string, unknown>).bio as string | null,
      });
    }
    const profileStats = await getProfileStats(db, 1);
    setStats(profileStats);
    const passportBadges = await getPassportBadges(db, 1);
    setBadges(passportBadges);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const isEmpty = stats && stats.hotelsSlept === 0 && stats.hotelsSaved === 0;

  const scrollToPassport = () => {
    if (passportY.current > 0) {
      scrollRef.current?.scrollTo({ y: passportY.current, animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scrollRef} style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header — centered */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={Colors.textLight} />
          </View>
          <Text style={styles.name}>{user?.name ?? 'Curator'}</Text>
          {user?.bio ? (
            <Text style={styles.bio}>{user.bio}</Text>
          ) : null}
          {user?.location && (
            <Text style={styles.locationText}>{user.location}</Text>
          )}
        </View>

        {/* Stats — "X hotels • Z cities • V nights" */}
        {stats && !isEmpty && (
          <View style={styles.statsSection}>
            <Text style={styles.statsLine}>
              <Text onPress={() => router.push('/(tabs)/list')}>
                <Text style={styles.statNumber}>{stats.hotelsSlept}</Text>
                <Text style={styles.statLabel}> hotels</Text>
              </Text>
              {'  \u2022  '}
              <Text onPress={scrollToPassport}>
                <Text style={styles.statNumber}>{stats.citiesVisited}</Text>
                <Text style={styles.statLabel}> cities</Text>
              </Text>
              {'  \u2022  '}
              <Text style={styles.statNumber}>{stats.totalNights}</Text>
              <Text style={styles.statLabel}> nights</Text>
            </Text>
            {stats.totalNights > 0 && (
              <Text style={styles.subtitle}>
                {stats.totalNights} nights away from home
              </Text>
            )}
          </View>
        )}

        {/* Your traveler profile */}
        {stats?.tasteSummary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your traveler profile</Text>
            <Text style={styles.tasteSummarySmallCaps}>{stats.tasteSummary}</Text>
            <View style={styles.tagsRow}>
              {stats.topTags.map((t) => (
                <TagChip key={t.tag} name={t.tag} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Cities */}
        {stats && stats.topCities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cities</Text>
            {stats.topCities.map((c) => (
              <View key={c.city} style={styles.cityRow}>
                <View>
                  <Text style={styles.cityName}>{c.city}</Text>
                  <Text style={styles.cityCountry}>{c.country}</Text>
                </View>
                <Text style={styles.cityCount}>
                  {c.count} hotel{c.count !== 1 ? 's' : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Passport */}
        {badges.length > 0 && (
          <View
            style={styles.section}
            onLayout={(e) => { passportY.current = e.nativeEvent.layout.y; }}
          >
            <Text style={styles.sectionTitle}>Passport</Text>
            <View style={styles.badgeGrid}>
              {badges.map((badge, i) => (
                <View key={i} style={styles.badgeCard}>
                  <View style={styles.badgeStampAccent} />
                  <Text style={styles.badgeTitle}>{badge.title}</Text>
                  <Text style={styles.badgeSubtitle}>{badge.subtitle}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty */}
        {isEmpty && (
          <View style={styles.emptySection}>
            <Ionicons name="compass-outline" size={40} color={Colors.textLight} />
            <Text style={styles.emptyText}>
              Start exploring to build your taste profile
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/search')}
              activeOpacity={0.7}
            >
              <Text style={styles.exploreButtonText}>Search Hotels</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
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
    paddingHorizontal: Layout.padding,
    paddingTop: 24,
    paddingBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  name: {
    ...Typography.heading1,
    color: Colors.text,
    textAlign: 'center',
  },
  bio: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 22,
    textAlign: 'center',
  },
  locationText: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsSection: {
    alignItems: 'center',
    paddingHorizontal: Layout.padding,
    paddingBottom: 8,
  },
  statsLine: {
    fontSize: Typography.body.fontSize,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.accent,
  },
  statLabel: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  subtitle: {
    fontSize: Typography.caption.fontSize,
    fontStyle: 'italic',
    color: Colors.textLight,
    marginTop: 6,
  },
  section: {
    paddingHorizontal: Layout.padding,
    paddingTop: Layout.sectionGap,
  },
  sectionTitle: {
    ...Typography.heading2,
    color: Colors.text,
    marginBottom: 14,
  },
  tasteSummarySmallCaps: {
    fontSize: Typography.small.fontSize,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cityName: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    color: Colors.text,
  },
  cityCountry: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textLight,
    marginTop: 1,
  },
  cityCount: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    borderRadius: Layout.borderRadius,
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: '45%',
    flexGrow: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  badgeStampAccent: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    opacity: 0.12,
  },
  badgeTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  badgeSubtitle: {
    fontSize: Typography.small.fontSize,
    color: Colors.textSecondary,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  exploreButton: {
    marginTop: 20,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Layout.borderRadius,
  },
  exploreButtonText: {
    color: Colors.white,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
});
