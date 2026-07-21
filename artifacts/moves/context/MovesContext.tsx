import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Move, GeneratedItinerary, PlanInput } from '@/types';

const STORAGE_KEY = '@moves_saved';

interface MovesContextType {
  moves: Move[];
  saveMove: (itinerary: GeneratedItinerary, input: PlanInput) => void;
  updateMoveStatus: (id: string, status: Move['status']) => void;
  removeMove: (id: string) => void;
  loading: boolean;
}

const MovesContext = createContext<MovesContextType>({
  moves: [],
  saveMove: () => {},
  updateMoveStatus: () => {},
  removeMove: () => {},
  loading: true,
});

export function MovesProvider({ children }: { children: React.ReactNode }) {
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setMoves(JSON.parse(stored));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveMove = useCallback((itinerary: GeneratedItinerary, input: PlanInput) => {
    const newMove: Move = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: itinerary.title,
      vibe: input.vibe,
      date: input.date,
      startTime: input.startTime,
      partySize: input.partySize,
      budgetLevel: input.budgetLevel,
      neighborhood: input.neighborhood,
      stops: itinerary.stops,
      totalEstimatedCostPerPerson: itinerary.totalEstimatedCostPerPerson,
      status: 'saved',
      createdAt: new Date().toISOString(),
    };
    setMoves(prev => {
      const newList = [newMove, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);

  const updateMoveStatus = useCallback((id: string, status: Move['status']) => {
    setMoves(prev => {
      const newList = prev.map(m => (m.id === id ? { ...m, status } : m));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);

  const removeMove = useCallback((id: string) => {
    setMoves(prev => {
      const newList = prev.filter(m => m.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  }, []);

  return (
    <MovesContext.Provider value={{ moves, saveMove, updateMoveStatus, removeMove, loading }}>
      {children}
    </MovesContext.Provider>
  );
}

export const useMoves = () => useContext(MovesContext);
