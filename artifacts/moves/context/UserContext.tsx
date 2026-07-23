import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '@/types';

const TOKEN_KEY          = '@moves_token';
const USER_ID_KEY        = '@moves_user_id';
const DISPLAY_NAME_KEY   = '@moves_display_name';
const EMAIL_KEY          = '@moves_email';
const VERIFIED_KEY       = '@moves_verified';
const ONBOARDING_KEY     = '@moves_onboarding_done';
const PREFERENCES_KEY    = '@moves_preferences';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export interface AuthUser {
  userId: string;
  displayName: string;
  email: string;
  token: string;
}

interface LoginOpts {
  emailVerified?: boolean; // default true
  isNew?: boolean;         // true when coming from registration
  devCode?: string;        // verification code shown on-screen when no email service
}

interface UserContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  authReady: boolean;
  isVerified: boolean;
  onboardingComplete: boolean;
  isNewRegistration: boolean;
  preferences: UserPreferences | null;
  devCode: string | null;

  login: (user: AuthUser, opts?: LoginOpts) => Promise<void>;
  logout: () => Promise<void>;
  setVerified: () => Promise<void>;
  clearDevCode: () => void;
  completeOnboarding: (prefs: UserPreferences) => Promise<void>;
  updateDisplayName: (name: string) => void;

  // Legacy compat
  userId: string;
  displayName: string;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isAuthenticated: false,
  authReady: false,
  isVerified: false,
  onboardingComplete: false,
  isNewRegistration: false,
  preferences: null,
  devCode: null,
  login: async () => {},
  logout: async () => {},
  setVerified: async () => {},
  clearDevCode: () => {},
  completeOnboarding: async () => {},
  updateDisplayName: () => {},
  userId: '',
  displayName: '',
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]                         = useState<AuthUser | null>(null);
  const [authReady, setAuthReady]               = useState(false);
  const [isVerified, setIsVerified]             = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isNewRegistration, setIsNewRegistration]   = useState(false);
  const [preferences, setPreferences]           = useState<UserPreferences | null>(null);
  const [devCode, setDevCode]                   = useState<string | null>(null);

  // ── Restore session on launch ────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [
          [, token], [, userId], [, displayName], [, email],
          [, verified], [, onboarded], [, prefsRaw],
        ] = await AsyncStorage.multiGet([
          TOKEN_KEY, USER_ID_KEY, DISPLAY_NAME_KEY, EMAIL_KEY,
          VERIFIED_KEY, ONBOARDING_KEY, PREFERENCES_KEY,
        ]);

        if (token && userId) {
          try {
            const res = await fetch(`${BASE_URL()}/auth/verify`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              setUser({ userId: data.userId, displayName: data.displayName, email: email ?? '', token });
            } else {
              await clearStorage();
              return;
            }
          } catch {
            // Offline — restore optimistically
            setUser({ userId, displayName: displayName ?? '', email: email ?? '', token });
          }
          setIsVerified(verified === 'true');
          setOnboardingComplete(onboarded === 'true');
          if (prefsRaw) {
            try { setPreferences(JSON.parse(prefsRaw)); } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (authUser: AuthUser, opts: LoginOpts = {}) => {
    const { emailVerified = true, isNew = false, devCode: code } = opts;
    if (code) setDevCode(code);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, authUser.token],
      [USER_ID_KEY, authUser.userId],
      [DISPLAY_NAME_KEY, authUser.displayName],
      [EMAIL_KEY, authUser.email],
      [VERIFIED_KEY, emailVerified ? 'true' : 'false'],
      // New users must complete onboarding; returning users already have — restore the flag
      [ONBOARDING_KEY, isNew ? 'false' : 'true'],
    ]);
    setUser(authUser);
    setIsVerified(emailVerified);
    setIsNewRegistration(isNew);
    setOnboardingComplete(!isNew);
  }, []);

  const logout = useCallback(async () => {
    await clearStorage();
    setUser(null);
    setIsVerified(false);
    setOnboardingComplete(false);
    setIsNewRegistration(false);
    setPreferences(null);
  }, []);

  const setVerified = useCallback(async () => {
    await AsyncStorage.setItem(VERIFIED_KEY, 'true');
    setIsVerified(true);
    setDevCode(null);
  }, []);

  const clearDevCode = useCallback(() => setDevCode(null), []);

  const completeOnboarding = useCallback(async (prefs: UserPreferences) => {
    await AsyncStorage.multiSet([
      [ONBOARDING_KEY, 'true'],
      [PREFERENCES_KEY, JSON.stringify(prefs)],
    ]);
    setOnboardingComplete(true);
    setPreferences(prefs);
    setIsNewRegistration(false);
  }, []);

  const updateDisplayName = useCallback((name: string) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, displayName: name } : prev);
    AsyncStorage.setItem(DISPLAY_NAME_KEY, name);
  }, [user]);

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated: !!user,
      authReady,
      isVerified,
      onboardingComplete,
      isNewRegistration,
      preferences,
      devCode,
      login,
      logout,
      setVerified,
      clearDevCode,
      completeOnboarding,
      updateDisplayName,
      userId: user?.userId ?? '',
      displayName: user?.displayName ?? '',
    }}>
      {children}
    </UserContext.Provider>
  );
}

async function clearStorage() {
  await AsyncStorage.multiRemove([
    TOKEN_KEY, USER_ID_KEY, DISPLAY_NAME_KEY, EMAIL_KEY,
    VERIFIED_KEY, ONBOARDING_KEY, PREFERENCES_KEY,
  ]);
}

export const useUser = () => useContext(UserContext);
