import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@moves_user_id';
const DISPLAY_NAME_KEY = '@moves_display_name';

function generateUUID(): string {
  // RFC 4122 v4 UUID — safe in all JS environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UserContextType {
  userId: string;
  displayName: string;
  setDisplayName: (name: string) => Promise<void>;
  ready: boolean;
}

const UserContext = createContext<UserContextType>({
  userId: '', displayName: '', setDisplayName: async () => {}, ready: false,
});

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

async function syncUser(userId: string, displayName: string) {
  try {
    await fetch(`${BASE_URL()}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, displayName }),
    });
  } catch {
    // Offline — silently skip, will sync on next launch
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState('');
  const [displayName, setDisplayNameState] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      let id = await AsyncStorage.getItem(USER_ID_KEY);
      if (!id) {
        id = generateUUID();
        await AsyncStorage.setItem(USER_ID_KEY, id);
      }
      const name = (await AsyncStorage.getItem(DISPLAY_NAME_KEY)) ?? '';
      setUserId(id);
      setDisplayNameState(name);
      setReady(true);
      syncUser(id, name || 'Anonymous');
    })();
  }, []);

  const setDisplayName = useCallback(async (name: string) => {
    const trimmed = name.trim().slice(0, 80);
    setDisplayNameState(trimmed);
    await AsyncStorage.setItem(DISPLAY_NAME_KEY, trimmed);
    if (userId) await syncUser(userId, trimmed || 'Anonymous');
  }, [userId]);

  return (
    <UserContext.Provider value={{ userId, displayName, setDisplayName, ready }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
