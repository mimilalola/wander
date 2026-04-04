import React, { useState, useCallback } from 'react';
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
import { Typography } from '../../src/constants/typography';
import { PriceLevel } from '../../src/components/PriceLevel';
import { TagChip } from '../../src/components/TagChip';
import { RatingStamp } from '../../src/components/RatingStamp';
import { PhotoGrid } from '../../src/components/PhotoGrid';
import { createDb } from '../../src/db/client';
import { getHotelWithDetails } from '../../src/dal/hotels';
import { toggleSave, removeSave } from '../../src/dal/saves';
import { formatDate, formatEmotion, formatNights } from '../../src/utils/format';
import type { EmotionTier } from '../../src/types';

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
  visits: {
    id: number;
    rating: number | null;
    notes: string | null;
    rank: number | null;
    emotion: EmotionTier | null;
    nights: number | null;
    createdAt: string;
  }[];
  tags: string[];
  photos: { id: number; imageUri: string }[];
}

export default function HotelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);
  const [hotel, setHotel] = useState<HotelDetails | null>(null);

  const loadHotel = useCallback(async () => {
    if (!id) return;
    const data = await getHotelWithDetails(db, parseInt(id), 1);
    setHotel(data as HotelDetails);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadHotel();
    }, [loadHotel])
  );

  const handleSave = async () => {
    if (!hotel) return;
    await toggleSave(db, 1, hotel.id, 'want');
    loadHotel();
  };

  const handleSlept = () => {
    if (!hotel) return;
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
          loadHotel();
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
  const isSaved = hotel.save?.status === 'want';
  const isSlept = hotel.save?.status === 'been';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          {hotel.coverPhoto ? (
            <Image source={{ uri: hotel.coverPhoto }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="bed-outline" size={48} color={Colors.textLight} />
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          {latestVisit?.rating !== null && latestVisit?.rating !== undefined && (
            <View style={styles.stampContainer}>
              <RatingStamp score={latestVisit.rating} size="default" />
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
          <View style={styles.tagsRow}>
            {hotel.tags.map((tag) => (
              <TagChip key={tag} name={tag} />
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, isSaved && styles.actionActive]}
            onPress={handleSave}
            onLongPress={hotel.save ? handleRemoveSave : undefined}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSaved ? 'star' : 'star-outline'}
              size={18}
              color={isSaved ? Colors.accent : Colors.text}
            />
            <Text style={[styles.actionText, isSaved && styles.actionTextActive]}>
              Saved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isSlept && styles.actionActive]}
            onPress={handleSlept}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSlept ? 'bed' : 'bed-outline'}
              size={18}
              color={isSlept ? Colors.accent : Colors.text}
            />
            <Text style={[styles.actionText, isSlept && styles.actionTextActive]}>
              Slept
            </Text>
          </TouchableOpacity>
        </View>

        {/* Your Stay */}
        {latestVisit && (
          <View style={styles.section}>
            <Text style={styles.editorialLabel}>YOUR STAY</Text>
            <View style={styles.stayDetails}>
              {latestVisit.emotion && (
                <Text style={styles.emotionText}>
                  {formatEmotion(latestVisit.emotion)}
                </Text>
              )}
              {latestVisit.nights && (
                <Text style={styles.nightsText}>
                  {formatNights(latestVisit.nights)}
                </Text>
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
            <Text style={styles.editorialLabel}>PHOTOS</Text>
            <PhotoGrid photos={hotel.photos} />
          </View>
        )}

        {/* All Visits */}
        {hotel.visits.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.editorialLabel}>
              ALL VISITS ({hotel.visits.length})
            </Text>
            {hotel.visits.map((visit) => (
              <View key={visit.id} style={styles.visitItem}>
                <View>
                  <Text style={styles.visitItemDate}>{formatDate(visit.createdAt)}</Text>
                  {visit.emotion && (
                    <Text style={styles.visitItemEmotion}>
                      {formatEmotion(visit.emotion)}
                    </Text>
                  )}
                </View>
                {visit.rating !== null && (
                  <RatingStamp score={visit.rating} size="small" />
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
    height: 300,
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(247,247,245,0.92)',
    borderRadius: 30,
    padding: 2,
  },
  infoSection: {
    paddingHorizontal: Layout.padding,
    paddingTop: 20,
    paddingBottom: 8,
  },
  hotelName: {
    ...Typography.heading1,
    color: Colors.text,
  },
  location: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  priceRow: {
    marginTop: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.padding,
    paddingVertical: 8,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: Layout.padding,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Layout.borderRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  actionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  actionText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.text,
  },
  actionTextActive: {
    color: Colors.accent,
  },
  section: {
    paddingHorizontal: Layout.padding,
    paddingTop: Layout.sectionGap,
  },
  editorialLabel: {
    ...Typography.editorial,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  stayDetails: {
    gap: 6,
  },
  emotionText: {
    ...Typography.heading3,
    color: Colors.text,
  },
  nightsText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
  },
  notes: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 4,
  },
  visitDate: {
    fontSize: Typography.small.fontSize,
    color: Colors.textLight,
    marginTop: 4,
  },
  visitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  visitItemDate: {
    fontSize: Typography.body.fontSize,
    color: Colors.text,
  },
  visitItemEmotion: {
    fontSize: Typography.caption.fontSize,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
