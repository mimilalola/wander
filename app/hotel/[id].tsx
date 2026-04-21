import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import { PriceLevel } from '../../src/components/PriceLevel';
import { TagChip } from '../../src/components/TagChip';
import { StatusBadge } from '../../src/components/StatusBadge';
import { PhotoGrid } from '../../src/components/PhotoGrid';
import { createDb } from '../../src/db/client';
import { getHotelWithDetails } from '../../src/dal/hotels';
import { toggleSave, removeSave } from '../../src/dal/saves';
import { formatDate } from '../../src/utils/format';

interface HotelDetails {
  id: number;
  name: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  priceLevel: number | null;
  coverPhoto: string | null;
  createdAt: string;
  save: { id: number; status: 'want' | 'been' } | null;
  visits: { id: number; rating: number | null; notes: string | null; rank: number | null; createdAt: string }[];
  tags: string[];
  photos: { id: number; imageUri: string }[];
}

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = useMemo(() => createDb(sqlite), [sqlite]);
  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  // Prevent double-tap from pushing two rating screens before the transition completes.
  const isNavigatingRef = useRef(false);

  const loadHotel = useCallback(async () => {
    if (!id) return;
    const data = await getHotelWithDetails(db, parseInt(id), 1);
    setHotel(data as HotelDetails);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      isNavigatingRef.current = false;
      loadHotel();
    }, [loadHotel])
  );

  const handleWant = async () => {
    if (!hotel) return;
    // A slept hotel cannot be re-saved as 'want' — it must be explicitly
    // deleted first. Allowing the transition would leave visit data in an
    // inconsistent state (orphaned visits affecting stats and rankings).
    if (hotel.save?.status === 'been') return;
    await toggleSave(db, 1, hotel.id, 'want');
    loadHotel();
  };

  const handleBeen = () => {
    if (!hotel) return;
    // A hotel that is already slept must not re-open the ranking flow.
    // Doing so would cause toggleSave('been') inside the rating screen to
    // toggle OFF the save (cascade-deleting all visit data), and would create
    // a second unintended visit record for the same hotel.
    if (hotel.save?.status === 'been') return;
    // Guard against double-tap pushing two rating screens before transition.
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    router.push(`/rating/${hotel.id}`);
  };

  const handleRemoveSave = async () => {
    if (!hotel) return;
    Alert.alert('Remove Hotel', 'Remove this hotel from your list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeSave(db, 1, hotel.id);
          router.back();
        },
      },
    ]);
  };

  if (!hotel) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const latestVisit = hotel.visits.length > 0 ? hotel.visits[0] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.heroContainer}>
          {hotel.coverPhoto ? (
            <Image source={{ uri: hotel.coverPhoto }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="bed-outline" size={48} color={Colors.textLight} />
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          {hotel.save && (
            <View style={styles.statusContainer}>
              <StatusBadge status={hotel.save.status} />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.hotelName}>{hotel.name}</Text>
          <Text style={styles.location}>
            {hotel.city}, {hotel.country}
          </Text>
          {hotel.priceLevel && (
            <View style={styles.priceRow}>
              <PriceLevel level={hotel.priceLevel} />
            </View>
          )}
        </View>

        {/* Tags */}
        {hotel.tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.tagsRow}>
              {hotel.tags.map((tag) => (
                <TagChip key={tag} name={tag} />
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              hotel.save?.status === 'want' && styles.activeWant,
            ]}
            onPress={handleWant}
            onLongPress={hotel.save ? handleRemoveSave : undefined}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hotel.save?.status === 'want' ? 'heart' : 'heart-outline'}
              size={20}
              color={hotel.save?.status === 'want' ? Colors.white : Colors.saved}
            />
            <Text
              style={[
                styles.actionText,
                hotel.save?.status === 'want' && styles.activeActionText,
              ]}
            >
              Want
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              hotel.save?.status === 'been' && styles.activeBeen,
            ]}
            onPress={handleBeen}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hotel.save?.status === 'been' ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={20}
              color={hotel.save?.status === 'been' ? Colors.white : Colors.slept}
            />
            <Text
              style={[
                styles.actionText,
                hotel.save?.status === 'been' && styles.activeActionText,
              ]}
            >
              Been
            </Text>
          </TouchableOpacity>
        </View>

        {/* Visit Details */}
        {latestVisit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Visit</Text>
            <View style={styles.visitCard}>
              {latestVisit.rating !== null && (
                <View style={styles.ratingDisplay}>
                  <Text style={styles.ratingNumber}>{latestVisit.rating}</Text>
                  <Text style={styles.ratingMax}>/10</Text>
                </View>
              )}
              {latestVisit.notes && (
                <Text style={styles.notes}>{latestVisit.notes}</Text>
              )}
              <Text style={styles.visitDate}>{formatDate(latestVisit.createdAt)}</Text>
            </View>
          </View>
        )}

        {/* Photos */}
        {hotel.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <PhotoGrid photos={hotel.photos} />
          </View>
        )}

        {/* Multiple visits */}
        {hotel.visits.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              All Visits ({hotel.visits.length})
            </Text>
            {hotel.visits.map((visit) => (
              <View key={visit.id} style={styles.visitItem}>
                <Text style={styles.visitItemDate}>{formatDate(visit.createdAt)}</Text>
                {visit.rating !== null && (
                  <Text style={styles.visitItemRating}>{visit.rating}/10</Text>
                )}
              </View>
            ))}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  heroContainer: {
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Layout.cardShadow,
  },
  statusContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  infoSection: {
    padding: Layout.padding,
    backgroundColor: Colors.white,
  },
  hotelName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  location: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  priceRow: {
    marginTop: 8,
  },
  section: {
    paddingHorizontal: Layout.padding,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: Layout.padding,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: Colors.white,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Layout.borderRadius,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  activeWant: {
    backgroundColor: Colors.want,
    borderColor: Colors.want,
  },
  activeBeen: {
    backgroundColor: Colors.been,
    borderColor: Colors.been,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  activeActionText: {
    color: Colors.white,
  },
  visitCard: {
    backgroundColor: Colors.borderLight,
    borderRadius: Layout.borderRadiusSmall,
    padding: 16,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.accent,
  },
  ratingMax: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  notes: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  visitDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  visitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  visitItemDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  visitItemRating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
});
