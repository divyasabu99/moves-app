import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PlacesProvider } from '@/context/PlacesContext';
import { MovesProvider } from '@/context/MovesContext';
import { UserProvider, useUser } from '@/context/UserContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGuard() {
  const { isAuthenticated, authReady, isVerified, onboardingComplete } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;

    const current = segments[0] as string | undefined;

    if (!isAuthenticated) {
      if (current !== 'auth') router.replace('/auth');
    } else if (!isVerified) {
      if (current !== 'verify-email') router.replace('/verify-email');
    } else if (!onboardingComplete) {
      if (current !== 'onboarding') router.replace('/onboarding');
    } else {
      if (current !== '(tabs)') router.replace('/(tabs)');
    }
  }, [isAuthenticated, authReady, isVerified, onboardingComplete, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerBackTitle: 'Back' }}>
        <Stack.Screen name="auth"         options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding"   options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"       options={{ headerShown: false }} />
        <Stack.Screen name="results"      options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add-place"    options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="add-move"     options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="import-places" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="place-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="move-detail"  options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="group-detail" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <UserProvider>
                <PlacesProvider>
                  <MovesProvider>
                    <RootLayoutNav />
                  </MovesProvider>
                </PlacesProvider>
              </UserProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
