import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';
import { Layout } from '../src/constants/layout';
import { TagChip } from '../src/components/TagChip';
import { createDb } from '../src/db/client';
import { createHotel, addTagsToHotel } from '../src/dal/hotels';

const AVAILABLE_TAGS = [
  'beach', 'countryside', 'city', 'boutique', 'spa',
  'romantic', 'ski', 'design', 'good bar', 'rooftop',
  'historic', 'modern', 'eco', 'family', 'luxury', 'budget',
];

const PRICE_LEVELS = [1, 2, 3, 4, 5];

export default function AddHotelScreen() {
  const { name: prefillName } = useLocalSearchParams<{ name?: string }>();
  const router = useRouter();
  const sqlite = useSQLiteContext();
  const db = createDb(sqlite);

  const [name, setName] = useState(prefillName ?? '');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [priceLevel, setPriceLevel] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter a hotel name');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Missing info', 'Please enter a city');
      return;
    }
    if (!country.trim()) {
      Alert.alert('Missing info', 'Please enter a country');
      return;
    }

    const hotel = await createHotel(db, {
      name: name.trim(),
      city: city.trim(),
      country: country.trim(),
      priceLevel,
    });

    if (selectedTags.length > 0) {
      await addTagsToHotel(db, hotel.id, selectedTags);
    }

    router.replace(`/hotel/${hotel.id}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Hotel</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.field}>
          <Text style={styles.label}>Hotel Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Hotel Costes"
            placeholderTextColor={Colors.textLight}
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>City *</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Paris"
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Country *</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder="e.g. France"
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Price Level</Text>
          <View style={styles.priceRow}>
            {PRICE_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.priceButton, priceLevel === level && styles.priceActive]}
                onPress={() => setPriceLevel(priceLevel === level ? null : level)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.priceText,
                    priceLevel === level && styles.priceActiveText,
                  ]}
                >
                  {'€'.repeat(level)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagsContainer}>
            {AVAILABLE_TAGS.map((tag) => (
              <TagChip
                key={tag}
                name={tag}
                selected={selectedTags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>
        </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.padding,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
  },
  content: {
    flex: 1,
    padding: Layout.padding,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Layout.borderRadiusSmall,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Layout.borderRadiusSmall,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  priceActiveText: {
    color: Colors.white,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
