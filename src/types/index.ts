export type SaveStatus = 'want' | 'been';

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
  hotelsWanted: number;
  hotelsVisited: number;
  averageRating: number | null;
  topCities: { city: string; count: number }[];
  topTags: { tag: string; count: number }[];
  countriesVisited: number;
}
