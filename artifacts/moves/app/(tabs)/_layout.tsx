import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';

// NativeTabLayout with Liquid Glass is iOS 26+ only. We guard with a lazy
// require so a missing or crashing native module never breaks the tab bar on
// older devices. ClassicTabLayout is always the safe fallback.
function tryGetNativeLayout(): (() => React.JSX.Element) | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const glassEffect = require('expo-glass-effect');
    if (!glassEffect?.isLiquidGlassAvailable?.()) return null;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nativeTabs = require('expo-router/unstable-native-tabs');
    const { NativeTabs, Icon, Label } = nativeTabs;
    if (!NativeTabs) return null;

    return function NativeTabLayout() {
      return (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
            <Label>Plan</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="places">
            <Icon sf={{ default: 'bookmark', selected: 'bookmark.fill' }} />
            <Label>Places</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="moves">
            <Icon sf={{ default: 'map', selected: 'map.fill' }} />
            <Label>Moves</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="groups">
            <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
            <Label>Groups</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      );
    };
  } catch {
    return null;
  }
}

// Resolve once at module load — avoids repeated require() on every render
const NativeTabLayout = tryGetNativeLayout();

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          title: 'Places',
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="moves"
        options={{
          title: 'Moves',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (NativeTabLayout) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
