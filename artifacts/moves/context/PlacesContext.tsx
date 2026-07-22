import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place } from '@/types';

const STORAGE_KEY = '@moves_places';

const SEED_PLACES: Place[] = [
  { id: 's1', name: "Russ & Daughters Cafe", category: 'cafe', neighborhood: 'Lower East Side', priceLevel: 2, source: 'google_maps', vibes: ['brunch', 'classic'], rating: 4.7, createdAt: new Date().toISOString() },
  { id: 's2', name: "Momofuku Noodle Bar", category: 'restaurant', neighborhood: 'East Village', priceLevel: 2, source: 'beli', vibes: ['noodles', 'casual'], rating: 4.5, createdAt: new Date().toISOString() },
  { id: 's3', name: "Death & Co", category: 'bar', neighborhood: 'East Village', priceLevel: 3, source: 'google_maps', vibes: ['cocktails', 'date night'], rating: 4.6, createdAt: new Date().toISOString() },
  { id: 's4', name: "MoMA", category: 'museum', neighborhood: 'Midtown', priceLevel: 2, source: 'manual', vibes: ['art', 'culture'], rating: 4.6, createdAt: new Date().toISOString() },
  { id: 's5', name: "Little Island", category: 'park', neighborhood: 'West Village', priceLevel: 1, source: 'google_maps', vibes: ['outdoor', 'scenic'], rating: 4.7, createdAt: new Date().toISOString() },
  { id: 's6', name: "Roberta's", category: 'restaurant', neighborhood: 'Bushwick', priceLevel: 2, source: 'yelp', vibes: ['pizza', 'casual'], rating: 4.4, createdAt: new Date().toISOString() },
  { id: 's7', name: "Overstory", category: 'bar', neighborhood: 'Financial District', priceLevel: 4, source: 'beli', vibes: ['rooftop', 'upscale', 'cocktails'], rating: 4.5, createdAt: new Date().toISOString() },
  { id: 's8', name: "The Whitney Museum", category: 'museum', neighborhood: 'Meatpacking District', priceLevel: 2, source: 'manual', vibes: ['art', 'culture', 'date'], rating: 4.5, createdAt: new Date().toISOString() },
  { id: 's9', name: "Via Carota", category: 'restaurant', neighborhood: 'West Village', priceLevel: 3, source: 'beli', vibes: ['italian', 'date night', 'upscale'], rating: 4.8, createdAt: new Date().toISOString() },
  { id: 's10', name: "Cafe Regular", category: 'cafe', neighborhood: 'Park Slope', priceLevel: 1, source: 'google_maps', vibes: ['cozy', 'neighborhood'], rating: 4.5, createdAt: new Date().toISOString() },
  { id: 's11', name: "Nowadays", category: 'activity', neighborhood: 'Ridgewood', priceLevel: 2, source: 'yelp', vibes: ['nightlife', 'dancing'], rating: 4.3, createdAt: new Date().toISOString() },
  { id: 's12', name: "Lilia", category: 'restaurant', neighborhood: 'Williamsburg', priceLevel: 3, source: 'beli', vibes: ['italian', 'upscale', 'date night'], rating: 4.8, createdAt: new Date().toISOString() },
  { id: 's13', name: "Atta", category: 'bar', neighborhood: 'Williamsburg', priceLevel: 2, source: 'yelp', vibes: ['wine', 'low-key'], rating: 4.4, createdAt: new Date().toISOString() },
  { id: 's14', name: "High Line", category: 'park', neighborhood: 'Chelsea', priceLevel: 1, source: 'google_maps', vibes: ['outdoor', 'walking', 'scenic'], rating: 4.6, createdAt: new Date().toISOString() },
  { id: 's15', name: "Brooklyn Museum", category: 'museum', neighborhood: 'Crown Heights', priceLevel: 2, source: 'manual', vibes: ['art', 'culture'], rating: 4.5, createdAt: new Date().toISOString() },
  { id: 's16', name: "Dudley's", category: 'cafe', neighborhood: 'Lower East Side', priceLevel: 2, source: 'beli', vibes: ['brunch', 'all-day'], rating: 4.4, createdAt: new Date().toISOString() },
  { id: 's17', name: "Employees Only", category: 'bar', neighborhood: 'West Village', priceLevel: 3, source: 'google_maps', vibes: ['cocktails', 'speakeasy', 'date night'], rating: 4.5, createdAt: new Date().toISOString() },
  { id: 's18', name: "Brooklyn Boulders", category: 'activity', neighborhood: 'Gowanus', priceLevel: 2, source: 'yelp', vibes: ['active', 'climbing'], rating: 4.3, createdAt: new Date().toISOString() },
  { id: 's19', name: "Carbone", category: 'restaurant', neighborhood: 'Greenwich Village', priceLevel: 4, source: 'beli', vibes: ['italian', 'upscale', 'date night'], rating: 4.7, createdAt: new Date().toISOString() },
  { id: 's20', name: "Wren", category: 'bar', neighborhood: 'NoLIta', priceLevel: 2, source: 'yelp', vibes: ['neighborhood', 'casual', 'low-key'], rating: 4.3, createdAt: new Date().toISOString() },
];

interface PlacesContextType {
  places: Place[];
  addPlace: (place: Omit<Place, 'id' | 'createdAt'>) => void;
  addPlaces: (places: Place[]) => void;
  updatePlace: (id: string, patch: Partial<Place>) => void;
  removePlace: (id: string) => void;
  loading: boolean;
}

const PlacesContext = createContext<PlacesContextType>({
  places: [],
  addPlace: () => {},
  addPlaces: () => {},
  updatePlace: () => {},
  removePlace: () => {},
  loading: true,
});

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPlaces(JSON.parse(stored));
        } else {
          setPlaces(SEED_PLACES);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PLACES));
        }
      } catch {
        setPlaces(SEED_PLACES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addPlace = useCallback((placeData: Omit<Place, 'id' | 'createdAt'>) => {
    const newPlace: Place = {
      ...placeData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setPlaces(prev => {
      const newList = [newPlace, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);

  const addPlaces = useCallback((newPlaces: Place[]) => {
    setPlaces(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const fresh = newPlaces.filter(p => !existingIds.has(p.id));
      const newList = [...fresh, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);

  const updatePlace = useCallback((id: string, patch: Partial<Place>) => {
    setPlaces(prev => {
      const newList = prev.map(p => p.id === id ? { ...p, ...patch } : p);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);

  const removePlace = useCallback((id: string) => {
    setPlaces(prev => {
      const newList = prev.filter(p => p.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);

  return (
    <PlacesContext.Provider value={{ places, addPlace, addPlaces, updatePlace, removePlace, loading }}>
      {children}
    </PlacesContext.Provider>
  );
}

export const usePlaces = () => useContext(PlacesContext);
