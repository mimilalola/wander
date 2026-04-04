export type SaveStatus = 'want' | 'been';

export type EmotionTier = 'loved' | 'nice' | 'wouldnt_return';

// UI display mapping — DB stays 'want'/'been', UI shows 'Saved'/'Slept'
export function displayStatus(status: SaveStatus): string {
  return status === 'want' ? 'Saved' : 'Slept';
}

export function displayStatusIcon(status: SaveStatus): string {
  return status === 'want' ? 'star-outline' : 'bed-outline';
}

export function displayStatusIconActive(status: SaveStatus): string {
  return status === 'want' ? 'star' : 'bed';
}

export function displayEmotion(emotion: EmotionTier): string {
  switch (emotion) {
    case 'loved':
      return 'Loved it';
    case 'nice':
      return 'It was nice';
    case 'wouldnt_return':
      return "Wouldn't return";
  }
}

export interface Hotel {
  id: number;
  name: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  priceLevel: number | null;
  coverPhoto: string | null;
  createdAt: string;
}

export interface Save {
  id: number;
  userId: number;
  hotelId: number;
  status: SaveStatus;
  createdAt: string;
}

export interface Visit {
  id: number;
  userId: number;
  hotelId: number;
  rating: number | null;
  rank: number | null;
  notes: string | null;
  emotion: EmotionTier | null;
  nights: number | null;
  createdAt: string;
}

export interface Photo {
  id: number;
  visitId: number;
  imageUri: string;
  createdAt: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface HotelWithSave extends Hotel {
  saveStatus: SaveStatus | null;
  saveId: number | null;
  rating: number | null;
  visitCount: number;
}

export interface ProfileStats {
  hotelsSaved: number;
  hotelsSlept: number;
  averageRating: number | null;
  topCities: { city: string; count: number }[];
  topTags: { tag: string; count: number }[];
  countriesVisited: number;
  tasteSummary: string;
}
