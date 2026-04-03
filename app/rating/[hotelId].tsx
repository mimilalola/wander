import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import { RatingSlider } from '../../src/components/RatingSlider';
import { ComparisonCard } from '../../src/components/ComparisonCard';
import { createDb } from '../../src/db/client';
import { getHotelById } from '../../src/dal/hotels';
import { toggleSave } from '../../src/dal/saves';
import { createVisit, getComparisonCandidates, updateVisitRank } from '../../src/dal/visits';
import { addPhotos } from '../../src/dal/photos';
import { calculateElo } from '../../src/utils/ranking';

type Step = 'rate' | 'compare' | 'notes' | 'photos' | 'confirm';

interface CompCandidate {
  visit: { id: number; rating: number | null; rank: number | null };
  hotel: { id: number; name: string; city: string; country: string };
}

export default function RatingScreen() {
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);

  const [step, setStep] = useState<Step>('rate');
  const [hotelName, setHotelName] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [comparisons, setComparisons] = useState<CompCandidate[]>([]);
  const [compIndex, setCompIndex] = useState(0);
  const [newVisitId, setNewVisitId] = useState<number | null>(null);
  const [newVisitRank, setNewVisitRank] = useState(1500);

  useEffect(() => {
    if (!hotelId) return;
    (async () => {
      const hotel = await getHotelById(db, parseInt(hotelId));
      if (hotel) setHotelName(hotel.name);
    })();
  }, [hotelId, db]);

  const loadComparisons = useCallback(async () => {
    if (!hotelId) return;
    const candidates = await getComparisonCandidates(db, 1, parseInt(hotelId));
    setComparisons(candidates as CompCandidate[]);
  }, [hotelId, db]);

  const handleNext = async () => {
    switch (step) {
      case 'rate':
        if (rating === null) {
          Alert.alert('Rate this hotel', 'Please select a rating from 1 to 10');
          return;
        }
        // Create the visit record now
        const visit = await createVisit(db, {
          userId: 1,
          hotelId: parseInt(hotelId!),
          rating,
          notes: null,
        });
        setNewVisitId(visit.id);
        // Mark as been
        await toggleSave(db, 1, parseInt(hotelId!), 'been');
        // Load comparisons and go to compare or notes
        const candidates = await getComparisonCandidates(db, 1, parseInt(hotelId!));
        setComparisons(candidates as CompCandidate[]);
        if (candidates.length > 0) {
          setStep('compare');
        } else {
          setStep('notes');
        }
        break;
      case 'compare':
        setStep('notes');
        break;
      case 'notes':
        setStep('photos');
        break;
      case 'photos':
        setStep('confirm');
        break;
      case 'confirm':
        await handleSave();
        break;
    }
  };

  const handleComparison = async (winnerId: number, loserId: number) => {
    if (!newVisitId) return;

    const winnerComp = comparisons.find((c) => c.hotel.id === winnerId);
    const isNewHotelWinner = winnerId === parseInt(hotelId!);

    const winnerRank = isNewHotelWinner ? newVisitRank : (winnerComp?.visit.rank ?? 1500);
    const loserRank = isNewHotelWinner ? (comparisons[compIndex]?.visit.rank ?? 1500) : newVisitRank;

    const { newWinnerRank, newLoserRank } = calculateElo(winnerRank, loserRank);

    if (isNewHotelWinner) {
      setNewVisitRank(newWinnerRank);
      const loserVisitId = comparisons[compIndex]?.visit.id;
      if (loserVisitId) await updateVisitRank(db, loserVisitId, newLoserRank);
    } else {
      setNewVisitRank(newLoserRank);
      if (winnerComp) await updateVisitRank(db, winnerComp.visit.id, newWinnerRank);
    }

    if (compIndex < comparisons.length - 1) {
      setCompIndex(compIndex + 1);
    } else {
      setStep('notes');
    }
  };

  const handlePickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleSave = async () => {
    if (!newVisitId) return;

    // Update notes and rank on the visit
    await sqlite.runAsync(
      `UPDATE visits SET notes = ?, rank = ? WHERE id = ?`,
      [notes || null, newVisitRank, newVisitId]
    );

    // Save photos
    if (photoUris.length > 0) {
      await addPhotos(db, newVisitId, photoUris);
    }

    router.back();
  };

  const handleSkip = () => {
    switch (step) {
      case 'compare':
        setStep('notes');
        break;
      case 'notes':
        setStep('photos');
        break;
      case 'photos':
        setStep('confirm');
        break;
    }
  };

  const currentComparison = comparisons[compIndex];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{hotelName}</Text>
        <View style={styles.stepIndicator}>
          {['rate', 'compare', 'notes', 'photos', 'confirm'].map((s, i) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                step === s && styles.stepDotActive,
                ['rate', 'compare', 'notes', 'photos', 'confirm'].indexOf(step) > i && styles.stepDotDone,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {step === 'rate' && (
          <View>
            <Text style={styles.stepTitle}>Rate your stay</Text>
            <Text style={styles.stepSubtitle}>How was {hotelName}?</Text>
            {rating !== null && (
              <View style={styles.bigRating}>
                <Text style={styles.bigRatingText}>{rating}</Text>
              </View>
            )}
            <RatingSlider value={rating} onChange={setRating} />
          </View>
        )}

        {step === 'compare' && currentComparison && (
          <View>
            <Text style={styles.stepTitle}>Compare</Text>
            <Text style={styles.stepSubtitle}>
              {compIndex + 1} of {comparisons.length}
            </Text>
            <ComparisonCard
              hotelA={{
                id: parseInt(hotelId!),
                name: hotelName,
                city: '',
                country: '',
                rating,
              }}
              hotelB={{
                id: currentComparison.hotel.id,
                name: currentComparison.hotel.name,
                city: currentComparison.hotel.city,
                country: currentComparison.hotel.country,
                rating: currentComparison.visit.rating,
              }}
              onSelectA={() => handleComparison(parseInt(hotelId!), currentComparison.hotel.id)}
              onSelectB={() => handleComparison(currentComparison.hotel.id, parseInt(hotelId!))}
            />
          </View>
        )}

        {step === 'notes' && (
          <View>
            <Text style={styles.stepTitle}>Add notes</Text>
            <Text style={styles.stepSubtitle}>What made this stay special?</Text>
            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Great rooftop bar, amazing breakfast, beautiful views..."
              placeholderTextColor={Colors.textLight}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>
        )}

        {step === 'photos' && (
          <View>
            <Text style={styles.stepTitle}>Add photos</Text>
            <Text style={styles.stepSubtitle}>Share memories from your stay</Text>
            <View style={styles.photosGrid}>
              {photoUris.map((uri, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => setPhotoUris((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <Ionicons name="close-circle" size={22} color={Colors.accent} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickPhotos}>
                <Ionicons name="camera-outline" size={28} color={Colors.textSecondary} />
                <Text style={styles.addPhotoText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'confirm' && (
          <View>
            <Text style={styles.stepTitle}>All set!</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryHotel}>{hotelName}</Text>
              {rating !== null && (
                <View style={styles.summaryRating}>
                  <Text style={styles.summaryRatingNum}>{rating}</Text>
                  <Text style={styles.summaryRatingMax}>/10</Text>
                </View>
              )}
              {notes ? <Text style={styles.summaryNotes}>{notes}</Text> : null}
              <Text style={styles.summaryPhotos}>
                {photoUris.length} photo{photoUris.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step !== 'rate' && step !== 'confirm' && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.7}>
          <Text style={styles.nextText}>
            {step === 'confirm' ? 'Save Visit' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Layout.padding,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: Layout.padding,
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.borderLight,
  },
  stepDotActive: {
    backgroundColor: Colors.accent,
    width: 20,
  },
  stepDotDone: {
    backgroundColor: Colors.accent,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: Layout.paddingLarge,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  bigRating: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  bigRatingText: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.accent,
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumb: {
    width: 100,
    height: 100,
    borderRadius: Layout.borderRadiusSmall,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: Layout.borderRadiusSmall,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadius,
    padding: 24,
    alignItems: 'center',
    ...Layout.cardShadow,
  },
  summaryHotel: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  summaryRating: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  summaryRatingNum: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.accent,
  },
  summaryRatingMax: {
    fontSize: 20,
    color: Colors.textSecondary,
    marginLeft: 2,
  },
  summaryNotes: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryPhotos: {
    fontSize: 13,
    color: Colors.textLight,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.padding,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  skipButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: Layout.borderRadius,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: Layout.borderRadius,
    alignItems: 'center',
  },
  nextText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
