import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Place } from '@/types';
import { useUser } from '@/context/UserContext';

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
const STORAGE_KEY = '@moves_places';


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
  const { user, isAuthenticated, isNewRegistration } = useUser();

  // ── Initial load from AsyncStorage ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setPlaces(JSON.parse(stored));
        }
        // else: stay empty — user will add places or sync from server
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Server sync: pull on login, push local if server is empty ────────────
  const syncedUserRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !user || loading) return;
    if (syncedUserRef.current === user.userId) return; // already synced this session
    syncedUserRef.current = user.userId;

    const token = user.token;
    const isNew = isNewRegistration;
    ;(async () => {
      try {
        const res = await fetch(`${BASE_URL}/sync/places`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.places) && data.places.length > 0) {
          // Server has data — use it (returning user on a new device)
          setPlaces(data.places);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.places));
        } else if (isNew) {
          // Brand-new user — start with an empty library; push empty to server
          setPlaces([]);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
          await fetch(`${BASE_URL}/sync/places`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ places: [] }),
          });
        } else {
          // Existing user re-installing — push whatever they have locally
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          const localPlaces: Place[] = stored ? JSON.parse(stored) : [];
          if (localPlaces.length > 0) {
            await fetch(`${BASE_URL}/sync/places`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ places: localPlaces }),
            });
          }
        }
      } catch {
        // Offline — keep using local
      }
    })();
  }, [isAuthenticated, user?.userId, loading]);

  // ── Push to server on every change (debounced 1.5 s) ────────────────────
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushToServer = useCallback((list: Place[], token: string) => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      fetch(`${BASE_URL}/sync/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ places: list }),
      }).catch(() => {});
    }, 1500);
  }, []);

  // ── Background enrichment ─────────────────────────────────────────────────
  const enrichedRef = useRef(false);
  useEffect(() => {
    if (loading || enrichedRef.current) return;
    enrichedRef.current = true;
    const toEnrich = places.filter(p => !p.vibeDescription);
    if (toEnrich.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const place of toEnrich) {
        if (cancelled) break;
        try {
          const res = await fetch(`${BASE_URL}/lookup-place`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: place.name }),
          });
          const data = await res.json();
          if (!cancelled) {
            const patch: Partial<Place> = {};
            if (data.vibeDescription) patch.vibeDescription = data.vibeDescription;
            if (!place.address && data.address) patch.address = data.address;
            if (Object.keys(patch).length > 0) {
              setPlaces(prev => {
                const updated = prev.map(p => p.id === place.id ? { ...p, ...patch } : p);
                AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
              });
            }
          }
        } catch { /* silently skip */ }
        await new Promise(r => setTimeout(r, 400));
      }
    })();
    return () => { cancelled = true; };
  }, [loading]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const persist = useCallback((list: Place[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (isAuthenticated && user) pushToServer(list, user.token);
  }, [isAuthenticated, user, pushToServer]);

  const addPlace = useCallback((placeData: Omit<Place, 'id' | 'createdAt'>) => {
    const newPlace: Place = {
      ...placeData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setPlaces(prev => { const next = [newPlace, ...prev]; persist(next); return next; });
  }, [persist]);

  const addPlaces = useCallback((newPlaces: Place[]) => {
    setPlaces(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const fresh = newPlaces.filter(p => !existingIds.has(p.id));
      const next = [...fresh, ...prev];
      persist(next);
      return next;
    });
  }, [persist]);

  const updatePlace = useCallback((id: string, patch: Partial<Place>) => {
    setPlaces(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...patch } : p);
      persist(next);
      return next;
    });
  }, [persist]);

  const removePlace = useCallback((id: string) => {
    setPlaces(prev => { const next = prev.filter(p => p.id !== id); persist(next); return next; });
  }, [persist]);

  return (
    <PlacesContext.Provider value={{ places, addPlace, addPlaces, updatePlace, removePlace, loading }}>
      {children}
    </PlacesContext.Provider>
  );
}

export const usePlaces = () => useContext(PlacesContext);
