import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Move, GeneratedItinerary, PlanInput, BudgetLevel } from '@/types';

const STORAGE_KEY = '@moves_saved';

interface MovesContextType {
  moves: Move[];
  saveMove: (itinerary: GeneratedItinerary, input: PlanInput) => Move;
  addManualMove: (move: Omit<Move, 'id' | 'status' | 'createdAt'>) => Move;
  updateMoveStatus: (id: string, status: Move['status']) => void;
  removeMove: (id: string) => void;
  loading: boolean;
}

const MovesContext = createContext<MovesContextType>({
  moves: [],
  saveMove: () => {},
  addManualMove: () => ({} as Move),
  updateMoveStatus: () => {},
  removeMove: () => {},
  loading: true,
});

function normalizeMoves(raw: unknown[]): Move[] {
  return raw.map((m: any) => ({
    ...m,
    endTime: m.endTime ?? m.startTime ?? '10:00 PM',
    budgetLevel: Array.isArray(m.budgetLevel) ? m.budgetLevel : [m.budgetLevel as BudgetLevel],
    neighborhood: Array.isArray(m.neighborhood)
      ? m.neighborhood
      : m.neighborhood && m.neighborhood !== 'Any'
        ? [m.neighborhood as string]
        : [],
  }));
}

function makeId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function MovesProvider({ children }: { children: React.ReactNode }) {
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setMoves(normalizeMoves(Array.isArray(parsed) ? parsed : []));
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = (list: Move[]) =>
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  const saveMove = useCallback((itinerary: GeneratedItinerary, input: PlanInput): Move => {
    const budgetLevels: BudgetLevel[] = Array.isArray(input.budgetLevel)
      ? input.budgetLevel : [input.budgetLevel as unknown as BudgetLevel];
    const neighborhoods: string[] = Array.isArray(input.neighborhood)
      ? input.neighborhood
      : input.neighborhood && input.neighborhood !== 'Any'
        ? [input.neighborhood as unknown as string] : [];

    const newMove: Move = {
      id: makeId(),
      title: itinerary.title,
      vibe: input.vibe,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      partySize: input.partySize,
      budgetLevel: budgetLevels,
      neighborhood: neighborhoods,
      stops: itinerary.stops,
      totalEstimatedCostPerPerson: itinerary.totalEstimatedCostPerPerson,
      status: 'saved',
      createdAt: new Date().toISOString(),
    };
    setMoves(prev => {
      const next = [newMove, ...prev];
      persist(next);
      return next;
    });
    return newMove;
  }, []);

  const addManualMove = useCallback((partial: Omit<Move, 'id' | 'status' | 'createdAt'>): Move => {
    const newMove: Move = {
      ...partial,
      id: makeId(),
      status: 'saved',
      createdAt: new Date().toISOString(),
    };
    setMoves(prev => {
      const next = [newMove, ...prev];
      persist(next);
      return next;
    });
    return newMove;
  }, []);

  const updateMoveStatus = useCallback((id: string, status: Move['status']) => {
    setMoves(prev => {
      const next = prev.map(m => m.id === id ? { ...m, status } : m);
      persist(next);
      return next;
    });
  }, []);

  const removeMove = useCallback((id: string) => {
    setMoves(prev => {
      const next = prev.filter(m => m.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return (
    <MovesContext.Provider value={{ moves, saveMove, addManualMove, updateMoveStatus, removeMove, loading }}>
      {children}
    </MovesContext.Provider>
  );
}

export const useMoves = () => useContext(MovesContext);
