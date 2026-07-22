import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY       = '@moves_token';
const USER_ID_KEY     = '@moves_user_id';
const DISPLAY_NAME_KEY = '@moves_display_name';
const EMAIL_KEY       = '@moves_email';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export interface AuthUser {
  userId: string;
  displayName: string;
  email: string;
  token: string;
}

interface UserContextType {
  // Auth
  user: AuthUser | null;
  isAuthenticated: boolean;
  authReady: boolean;           // true once we've checked AsyncStorage
  login: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => void;
  // Legacy compat — some older code reads these directly
  userId: string;
  displayName: string;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  authReady: false,
  login: async () => {},
  logout: async () => {},
  updateDisplayName: () => {},
  userId: '',
  displayName: '',
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Restore session on launch
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        const userId = await AsyncStorage.getItem(USER_ID_KEY);
        const displayName = await AsyncStorage.getItem(DISPLAY_NAME_KEY) ?? '';
        const email = await AsyncStorage.getItem(EMAIL_KEY) ?? '';

        if (token && userId) {
          // Quick server-side verify to ensure token still valid
          try {
            const res = await fetch(`${BASE_URL()}/auth/verify`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              setUser({ userId: data.userId, displayName: data.displayName, email, token });
            } else {
              // Token expired — clear storage
              await clearStorage();
            }
          } catch {
            // Offline — restore from storage optimistically
            setUser({ userId, displayName, email, token });
          }
        }
      } catch {
        // ignore
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (authUser: AuthUser) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, authUser.token],
      [USER_ID_KEY, authUser.userId],
      [DISPLAY_NAME_KEY, authUser.displayName],
      [EMAIL_KEY, authUser.email],
    ]);
    setUser(authUser);
  }, []);

  const logout = useCallback(async () => {
    await clearStorage();
    setUser(null);
  }, []);

  const updateDisplayName = useCallback((name: string) => {
    if (!user) return;
    const updated = { ...user, displayName: name };
    setUser(updated);
    AsyncStorage.setItem(DISPLAY_NAME_KEY, name);
  }, [user]);

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated: !!user,
      authReady,
      login,
      logout,
      updateDisplayName,
      // Legacy compat
      userId: user?.userId ?? '',
      displayName: user?.displayName ?? '',
    }}>
      {children}
    </UserContext.Provider>
  );
}

async function clearStorage() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_ID_KEY, DISPLAY_NAME_KEY, EMAIL_KEY]);
}

export const useUser = () => useContext(UserContext);
