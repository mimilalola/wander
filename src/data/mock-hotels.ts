export interface MockHotel {
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  priceLevel: number;
  tags: string[];
}

export const mockHotels: MockHotel[] = [
  { name: 'Hotel Costes', city: 'Paris', country: 'France', latitude: 48.8682, longitude: 2.3282, priceLevel: 4, tags: ['city', 'design', 'good bar'] },
  { name: 'Aman Tokyo', city: 'Tokyo', country: 'Japan', latitude: 35.6855, longitude: 139.7631, priceLevel: 5, tags: ['city', 'luxury', 'modern', 'spa'] },
  { name: 'Belmond Hotel Cipriani', city: 'Venice', country: 'Italy', latitude: 45.4263, longitude: 12.3412, priceLevel: 5, tags: ['romantic', 'luxury', 'historic'] },
  { name: 'Chiltern Firehouse', city: 'London', country: 'United Kingdom', latitude: 51.5225, longitude: -0.1538, priceLevel: 4, tags: ['city', 'good bar', 'design'] },
  { name: 'Hotel Il Pellicano', city: 'Porto Ercole', country: 'Italy', latitude: 42.3950, longitude: 11.2058, priceLevel: 5, tags: ['beach', 'romantic', 'luxury'] },
  { name: 'Soho House Barcelona', city: 'Barcelona', country: 'Spain', latitude: 41.3784, longitude: 2.1899, priceLevel: 3, tags: ['city', 'rooftop', 'design'] },
  { name: 'The Brando', city: 'Tetiaroa', country: 'French Polynesia', latitude: -17.0134, longitude: -149.5878, priceLevel: 5, tags: ['beach', 'eco', 'luxury', 'spa'] },
  { name: 'Ace Hotel Kyoto', city: 'Kyoto', country: 'Japan', latitude: 35.0042, longitude: 135.7584, priceLevel: 3, tags: ['city', 'design', 'modern'] },
  { name: 'La Mamounia', city: 'Marrakech', country: 'Morocco', latitude: 31.6213, longitude: -8.0101, priceLevel: 4, tags: ['luxury', 'spa', 'historic'] },
  { name: 'The Ned', city: 'London', country: 'United Kingdom', latitude: 51.5131, longitude: -0.0888, priceLevel: 4, tags: ['city', 'rooftop', 'good bar', 'design'] },
  { name: 'Fogo Island Inn', city: 'Fogo Island', country: 'Canada', latitude: 49.7155, longitude: -54.1693, priceLevel: 5, tags: ['countryside', 'design', 'eco', 'modern'] },
  { name: 'Casa Cook Rhodes', city: 'Rhodes', country: 'Greece', latitude: 36.4045, longitude: 28.2224, priceLevel: 2, tags: ['beach', 'design', 'boutique'] },
  { name: 'Amangiri', city: 'Canyon Point', country: 'United States', latitude: 37.0138, longitude: -111.8103, priceLevel: 5, tags: ['countryside', 'spa', 'luxury', 'modern'] },
  { name: 'The Hoxton Amsterdam', city: 'Amsterdam', country: 'Netherlands', latitude: 52.3780, longitude: 4.8925, priceLevel: 2, tags: ['city', 'boutique', 'design'] },
  { name: 'Singita Kruger National Park', city: 'Kruger Park', country: 'South Africa', latitude: -24.9850, longitude: 31.5949, priceLevel: 5, tags: ['countryside', 'luxury', 'eco'] },
  { name: 'Hotel Kinloch', city: 'Taupo', country: 'New Zealand', latitude: -38.7114, longitude: 175.8725, priceLevel: 4, tags: ['countryside', 'luxury', 'spa'] },
  { name: 'Mama Shelter Paris', city: 'Paris', country: 'France', latitude: 48.8619, longitude: 2.3900, priceLevel: 2, tags: ['city', 'design', 'good bar', 'budget'] },
  { name: 'Six Senses Laamu', city: 'Laamu Atoll', country: 'Maldives', latitude: 1.9303, longitude: 73.4675, priceLevel: 5, tags: ['beach', 'eco', 'luxury', 'spa'] },
  { name: 'The Standard High Line', city: 'New York', country: 'United States', latitude: 40.7408, longitude: -74.0080, priceLevel: 3, tags: ['city', 'rooftop', 'good bar', 'modern'] },
  { name: 'Masseria Moroseta', city: 'Ostuni', country: 'Italy', latitude: 40.7364, longitude: 17.5681, priceLevel: 3, tags: ['countryside', 'design', 'boutique', 'romantic'] },
  { name: 'Park Hyatt Sydney', city: 'Sydney', country: 'Australia', latitude: -33.8580, longitude: 151.2115, priceLevel: 4, tags: ['city', 'luxury', 'modern'] },
  { name: 'Can Bordoy Grand House', city: 'Palma de Mallorca', country: 'Spain', latitude: 39.5716, longitude: 2.6487, priceLevel: 4, tags: ['city', 'boutique', 'design', 'spa'] },
  { name: 'Treehouse Hotel London', city: 'London', country: 'United Kingdom', latitude: 51.5219, longitude: -0.1497, priceLevel: 3, tags: ['city', 'rooftop', 'design', 'modern'] },
  { name: 'Awasi Patagonia', city: 'Torres del Paine', country: 'Chile', latitude: -51.0300, longitude: -73.0700, priceLevel: 5, tags: ['countryside', 'luxury', 'eco'] },
  { name: 'The Silo Hotel', city: 'Cape Town', country: 'South Africa', latitude: -33.9085, longitude: 18.4224, priceLevel: 4, tags: ['city', 'design', 'rooftop', 'luxury'] },
  { name: 'Generator Barcelona', city: 'Barcelona', country: 'Spain', latitude: 41.3887, longitude: 2.1652, priceLevel: 1, tags: ['city', 'budget', 'design'] },
  { name: 'Borgo Egnazia', city: 'Savelletri', country: 'Italy', latitude: 40.8800, longitude: 17.3900, priceLevel: 5, tags: ['beach', 'luxury', 'spa', 'family'] },
  { name: 'Riad Yasmine', city: 'Marrakech', country: 'Morocco', latitude: 31.6275, longitude: -7.9867, priceLevel: 2, tags: ['boutique', 'romantic', 'design'] },
  { name: 'Nomad Hotel Los Angeles', city: 'Los Angeles', country: 'United States', latitude: 34.0451, longitude: -118.2567, priceLevel: 3, tags: ['city', 'rooftop', 'design', 'good bar'] },
  { name: 'Soneva Fushi', city: 'Baa Atoll', country: 'Maldives', latitude: 5.1112, longitude: 73.0729, priceLevel: 5, tags: ['beach', 'eco', 'luxury', 'family'] },
  { name: 'Hotel Elephant', city: 'Weimar', country: 'Germany', latitude: 50.9797, longitude: 11.3296, priceLevel: 3, tags: ['city', 'historic', 'boutique'] },
  { name: 'Mandarin Oriental Bangkok', city: 'Bangkok', country: 'Thailand', latitude: 13.7224, longitude: 100.5130, priceLevel: 4, tags: ['city', 'luxury', 'spa', 'historic'] },
  { name: 'Le Sirenuse', city: 'Positano', country: 'Italy', latitude: 40.6294, longitude: 14.4853, priceLevel: 5, tags: ['beach', 'romantic', 'luxury'] },
  { name: 'Whitepod', city: 'Monthey', country: 'Switzerland', latitude: 46.2667, longitude: 6.9500, priceLevel: 3, tags: ['ski', 'eco', 'countryside', 'romantic'] },
  { name: 'Artist Residence London', city: 'London', country: 'United Kingdom', latitude: 51.4901, longitude: -0.1623, priceLevel: 2, tags: ['city', 'boutique', 'design'] },
  { name: 'COMO Castello Del Nero', city: 'Tavarnelle Val di Pesa', country: 'Italy', latitude: 43.5562, longitude: 11.1715, priceLevel: 4, tags: ['countryside', 'spa', 'luxury', 'romantic'] },
  { name: 'Hotel Café Royal', city: 'London', country: 'United Kingdom', latitude: 51.5103, longitude: -0.1362, priceLevel: 5, tags: ['city', 'luxury', 'spa', 'historic'] },
  { name: 'Hoshinoya Fuji', city: 'Fujikawaguchiko', country: 'Japan', latitude: 35.5036, longitude: 138.7639, priceLevel: 4, tags: ['countryside', 'design', 'modern', 'eco'] },
  { name: 'The Calile', city: 'Brisbane', country: 'Australia', latitude: -27.4698, longitude: 153.0251, priceLevel: 3, tags: ['city', 'design', 'modern', 'rooftop'] },
  { name: 'Coqui Coqui Coba', city: 'Coba', country: 'Mexico', latitude: 20.4920, longitude: -87.7364, priceLevel: 3, tags: ['boutique', 'romantic', 'spa', 'countryside'] },
  { name: 'Santa Monica Proper', city: 'Los Angeles', country: 'United States', latitude: 34.0157, longitude: -118.4958, priceLevel: 3, tags: ['beach', 'city', 'design', 'modern'] },
  { name: 'Hotel Neri', city: 'Barcelona', country: 'Spain', latitude: 41.3834, longitude: 2.1761, priceLevel: 3, tags: ['city', 'boutique', 'historic', 'romantic'] },
  { name: 'Raffles Singapore', city: 'Singapore', country: 'Singapore', latitude: 1.2948, longitude: 103.8543, priceLevel: 5, tags: ['city', 'luxury', 'historic', 'good bar'] },
  { name: 'Vik Chile', city: 'Millahue', country: 'Chile', latitude: -34.5200, longitude: -71.1700, priceLevel: 4, tags: ['countryside', 'design', 'luxury', 'modern'] },
  { name: 'The Londoner', city: 'London', country: 'United Kingdom', latitude: 51.5085, longitude: -0.1276, priceLevel: 4, tags: ['city', 'luxury', 'design', 'good bar'] },
  { name: 'andBeyond Mnemba Island', city: 'Zanzibar', country: 'Tanzania', latitude: -5.8230, longitude: 39.3830, priceLevel: 5, tags: ['beach', 'luxury', 'eco', 'romantic'] },
  { name: 'Potato Head Bali', city: 'Seminyak', country: 'Indonesia', latitude: -8.6859, longitude: 115.1543, priceLevel: 3, tags: ['beach', 'design', 'rooftop', 'good bar'] },
  { name: 'Casa de São Lourenço', city: 'Manteigas', country: 'Portugal', latitude: 40.3667, longitude: -7.5333, priceLevel: 2, tags: ['countryside', 'design', 'boutique', 'modern'] },
  { name: 'Claridges', city: 'London', country: 'United Kingdom', latitude: 51.5127, longitude: -0.1479, priceLevel: 5, tags: ['city', 'luxury', 'historic', 'good bar'] },
  { name: 'Azulik', city: 'Tulum', country: 'Mexico', latitude: 20.2118, longitude: -87.4290, priceLevel: 4, tags: ['beach', 'eco', 'design', 'spa'] },
];
