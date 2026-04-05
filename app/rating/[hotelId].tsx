import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/constants/colors';
import { Layout } from '../../src/constants/layout';
import { Typography } from '../../src/constants/typography';
import { TagChip } from '../../src/components/TagChip';
import { NightsPicker } from '../../src/components/NightsPicker';
import { EmotionPicker } from '../../src/components/EmotionPicker';
import { TextComparison } from '../../src/components/TextComparison';
import { RatingStamp } from '../../src/components/RatingStamp';
import { createDb } from '../../src/db/client';
import { getHotelById, getAllTags, addTagsToHotel, getHotelTags } from '../../src/dal/hotels';
import { setSave } from '../../src/dal/saves';
import {
  createVisit,
  getComparisonCandidates,
  updateVisitRank,
  updateVisitRating,
  getVisitsByTier,
} from '../../src/dal/visits';
import { addPhotos } from '../../src/dal/photos';
import { calculateElo, computeTierScore } from '../../src/utils/ranking';
import type { EmotionTier } from '../../src/types';

type Step = 'tags' | 'nights' | 'emotion' | 'compare' | 'confirm';

interface CompCandidate {
  visit: { id: number; rating: number | null; rank: number | null };
  hotel: { id: number; name: string; city: string; country: string };
}

export default function RatingScreen() {
  const { hotelId } = useLocalSearchParams<{ hotelId: string }>();
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);

  const [step, setStep] = useState<Step>('tags');
  const [hotelName, setHotelName] = useState('');

  const [allTags, setAllTags] = useState<{ id: number; name: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [nights, setNights] = useState<number | null>(null);
  const [emotion, setEmotion] = useState<EmotionTier | null>(null);

  const [comparisons, setComparisons] = useState<CompCandidate[]>([]);
  const [compIndex, setCompIndex] = useState(0);
  const [newVisitId, setNewVisitId] = useState<number | null>(null);
  const [newVisitRank, setNewVisitRank] = useState(1500);

  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [derivedScore, setDerivedScore] = useState<number | null>(null);

  useEffect(() => {
    if (!hotelId) return;
    (async () => {
      const hotel = await getHotelById(db, parseInt(hotelId));
      if (hotel) setHotelName(hotel.name);
      const tags = await getAllTags(db);
      setAllTags(tags);
      const existing = await getHotelTags(db, parseInt(hotelId));
      setExistingTags(existing);
      setSelectedTags(existing);
    })();
  }, [hotelId]);

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const createVisitAndCompare = async () => {
    if (!emotion) return;

    const visit = await createVisit(db, {
      userId: 1,
      hotelId: parseInt(hotelId!),
      emotion,
      nights,
    });
    setNewVisitId(visit.id);

    // Use setSave (non-toggling) so re-slept doesn't remove
    await setSave(db, 1, parseInt(hotelId!), 'been');

    const newTags = selectedTags.filter((t) => !existingTags.includes(t));
    if (newTags.length > 0) {
      await addTagsToHotel(db, parseInt(hotelId!), newTags);
    }

    const candidates = await getComparisonCandidates(db, 1, parseInt(hotelId!), emotion);

    if (emotion === 'wouldnt_return') {
      setComparisons((candidates as CompCandidate[]).slice(0, 2));
    } else {
      setComparisons(candidates as CompCandidate[]);
    }

    return { visitId: visit.id, candidates: candidates as CompCandidate[] };
  };

  const computeAndSetScore = async (visitId: number, rank: number, emotionTier: EmotionTier) => {
    const tierVisits = await getVisitsByTier(db, 1, emotionTier);
    const allRanks = tierVisits.map((v) => ({ rank: v.rank }));
    const withNew = [...allRanks.filter((v) => v.rank !== rank), { rank }];
    const score = computeTierScore(rank, withNew, emotionTier);
    setDerivedScore(score);
    await updateVisitRating(db, visitId, score);
    return score;
  };

  const handleBack = () => {
    const STEPS: Step[] = ['tags', 'nights', 'emotion', 'compare', 'confirm'];
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex <= 0) {
      router.back();
    } else {
      setStep(STEPS[currentIndex - 1]);
    }
  };

  const handleNext = async () => {
    switch (step) {
      case 'tags':
        setStep('nights');
        break;
      case 'nights':
        setStep('emotion');
        break;
      case 'emotion': {
        if (!emotion) return;
        const result = await createVisitAndCompare();
        if (result && result.candidates.length > 0) {
          setStep('compare');
        } else if (result) {
          await computeAndSetScore(result.visitId, newVisitRank, emotion);
          setStep('confirm');
        }
        break;
      }
      case 'compare':
        if (newVisitId && emotion) {
          await computeAndSetScore(newVisitId, newVisitRank, emotion);
        }
        setStep('confirm');
        break;
      case 'confirm':
        await handleSave();
        break;
    }
  };

  const handleComparison = async (winner: 'a' | 'b') => {
    if (!newVisitId) return;
    const current = comparisons[compIndex];
    if (!current) return;

    const isNewWinner = winner === 'a';
    const winnerRank = isNewWinner ? newVisitRank : (current.visit.rank ?? 1500);
    const loserRank = isNewWinner ? (current.visit.rank ?? 1500) : newVisitRank;

    const { newWinnerRank, newLoserRank } = calculateElo(winnerRank, loserRank);

    if (isNewWinner) {
      setNewVisitRank(newWinnerRank);
      await updateVisitRank(db, current.visit.id, newLoserRank);
    } else {
      setNewVisitRank(newLoserRank);
      await updateVisitRank(db, current.visit.id, newWinnerRank);
    }

    await updateVisitRank(db, newVisitId, isNewWinner ? newWinnerRank : newLoserRank);

    if (compIndex < comparisons.length - 1) {
      setCompIndex(compIndex + 1);
    } else {
      const finalRank = isNewWinner ? newWinnerRank : newLoserRank;
      if (emotion) {
        await computeAndSetScore(newVisitId, finalRank, emotion);
      }
      setStep('confirm');
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
    if (notes) {
      await sqlite.runAsync('UPDATE visits SET notes = ? WHERE id = ?', [notes, newVisitId]);
    }
    if (photoUris.length > 0) {
      await addPhotos(db, newVisitId, photoUris);
    }
    router.back();
  };

  const handleSkip = () => {
    switch (step) {
      case 'tags':
        setStep('nights');
        break;
      case 'nights':
        setStep('emotion');
        break;
      case 'compare':
        handleNext();
        break;
    }
  };

  const STEPS: Step[] = ['tags', 'nights', 'emotion', 'compare', 'confirm'];
  const stepIndex = STEPS.indexOf(step);
  const currentComparison = comparisons[compIndex];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerLeft}>
          <Ionicons name={step === 'tags' ? 'close' : 'arrow-back'} size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{hotelName}</Text>
        <View style={styles.headerRight} />
        <View style={styles.stepIndicator}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={[styles.stepLine, i <= stepIndex && styles.stepLineActive]}
            />
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {step === 'tags' && (
          <View style={styles.stepCenter}>
            <Text style={styles.stepTitle}>What defined this stay?</Text>
            <View style={styles.tagsWrap}>
              {allTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  name={tag.name}
                  selected={selectedTags.includes(tag.name)}
                  onPress={() => toggleTag(tag.name)}
                />
              ))}
            </View>
          </View>
        )}

        {step === 'nights' && (
          <View style={styles.stepCenter}>
            <Text style={styles.stepTitle}>How many nights was your stay?</Text>
            <View style={styles.pickerContainer}>
              <NightsPicker selected={nights} onSelect={setNights} />
            </View>
          </View>
        )}

        {step === 'emotion' && (
          <View style={styles.stepCenter}>
            <Text style={styles.stepTitle}>Your feeling</Text>
            <EmotionPicker selected={emotion} onSelect={setEmotion} />
          </View>
        )}

        {step === 'compare' && currentComparison && (
          <View style={styles.stepCenter}>
            <TextComparison
              hotelA={hotelName}
              hotelB={currentComparison.hotel.name}
              onChoose={handleComparison}
            />
          </View>
        )}

        {step === 'confirm' && (
          <View style={styles.confirmContainer}>
            <View style={styles.stampCenter}>
              <RatingStamp score={derivedScore} size="large" animated />
            </View>
            <Text style={styles.hotelNameConfirm}>{hotelName}</Text>

            <TextInput
              style={styles.notesInput}
              multiline
              placeholder="Add a note about your stay..."
              placeholderTextColor={Colors.textLight}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />

            <View style={styles.photosSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photoUris.map((uri, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Image source={{ uri }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.removePhoto}
                      onPress={() => setPhotoUris((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <Ionicons name="close-circle" size={20} color={Colors.accent} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickPhotos}>
                  <Ionicons name="camera-outline" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        {step !== 'emotion' && step !== 'confirm' && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            step === 'emotion' && !emotion && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          activeOpacity={0.7}
          disabled={step === 'emotion' && !emotion}
        >
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
    alignItems: 'center',
  },
  headerLeft: {
    position: 'absolute',
    top: 12,
    left: Layout.padding,
    padding: 4,
  },
  headerRight: {
    position: 'absolute',
    top: 12,
    right: Layout.padding,
    width: 30,
  },
  headerTitle: {
    ...Typography.captionBold,
    color: Colors.text,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 14,
    width: '100%',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 1,
  },
  stepLineActive: {
    backgroundColor: Colors.accent,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  contentInner: {
    padding: Layout.padding,
    paddingTop: 8,
    flexGrow: 1,
  },
  stepCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  stepTitle: {
    ...Typography.heading2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 28,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pickerContainer: {
    paddingTop: 8,
  },
  confirmContainer: {
    alignItems: 'center',
  },
  stampCenter: {
    marginVertical: 24,
  },
  hotelNameConfirm: {
    ...Typography.heading2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 28,
  },
  notesInput: {
    width: '100%',
    borderRadius: Layout.borderRadius,
    padding: 16,
    fontSize: Typography.body.fontSize,
    color: Colors.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    backgroundColor: Colors.white,
    marginBottom: 20,
  },
  photosSection: {
    width: '100%',
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: Layout.borderRadiusSmall,
    overflow: 'hidden',
    marginRight: 8,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: Layout.borderRadiusSmall,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.padding,
    paddingVertical: 12,
    gap: 12,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: Layout.borderRadius,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.4,
  },
  nextText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    color: Colors.white,
  },
});
