import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Move, GeneratedItinerary, PlanInput, BudgetLevel } from '@/types';
import { useUser } from '@/context/UserContext';

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
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
  saveMove: () => ({} as Move),
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
  const { user, isAuthenticated, isNewRegistration } = useUser();

  // ── Initial load ──────────────────────────────────────────────────────────
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

  // ── Server sync: pull on login, push local if server is empty ────────────
  const syncedUserRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !user || loading) return;
    if (syncedUserRef.current === user.userId) return;
    syncedUserRef.current = user.userId;

    const token = user.token;
    ;(async () => {
      try {
        const res = await fetch(`${BASE_URL}/sync/moves`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.exists) {
          // Server row exists — it is the source of truth (even if empty)
          const serverMoves = Array.isArray(data.moves) ? normalizeMoves(data.moves) : [];
          setMoves(serverMoves);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serverMoves));
        } else {
          // No server row yet — push local data up
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          const localMoves: Move[] = stored ? normalizeMoves(JSON.parse(stored)) : [];
          await fetch(`${BASE_URL}/sync/moves`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ moves: isNewRegistration ? [] : localMoves }),
          });
          if (isNewRegistration) {
            setMoves([]);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
          }
        }
      } catch {
        // Offline — keep local
      }
    })();
  }, [isAuthenticated, user?.userId, loading]);

  // ── Push to server on every change (debounced 1.5 s) ────────────────────
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushToServer = useCallback((list: Move[], token: string) => {
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      fetch(`${BASE_URL}/sync/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ moves: list }),
      }).catch(() => {});
    }, 1500);
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const persist = useCallback((list: Move[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    if (isAuthenticated && user) pushToServer(list, user.token);
  }, [isAuthenticated, user, pushToServer]);

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
      groupId: input.groupId,
      groupName: input.groupName,
    };
    setMoves(prev => { const next = [newMove, ...prev]; persist(next); return next; });
    return newMove;
  }, [persist]);

  const addManualMove = useCallback((partial: Omit<Move, 'id' | 'status' | 'createdAt'>): Move => {
    const newMove: Move = { ...partial, id: makeId(), status: 'saved', createdAt: new Date().toISOString() };
    setMoves(prev => { const next = [newMove, ...prev]; persist(next); return next; });
    return newMove;
  }, [persist]);

  const updateMoveStatus = useCallback((id: string, status: Move['status']) => {
    setMoves(prev => { const next = prev.map(m => m.id === id ? { ...m, status } : m); persist(next); return next; });
  }, [persist]);

  const removeMove = useCallback((id: string) => {
    setMoves(prev => { const next = prev.filter(m => m.id !== id); persist(next); return next; });
  }, [persist]);

  return (
    <MovesContext.Provider value={{ moves, saveMove, addManualMove, updateMoveStatus, removeMove, loading }}>
      {children}
    </MovesContext.Provider>
  );
}

export const useMoves = () => useContext(MovesContext);
