import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { UserPreferences } from '@/types';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const STEPS = [
  {
    key: 'music' as const,
    title: "What's your music vibe?",
    subtitle: 'Pick everything that fits you',
    options: [
      { label: 'Hip-Hop', emoji: '🎤' },
      { label: 'R&B / Soul', emoji: '🎵' },
      { label: 'Pop', emoji: '✨' },
      { label: 'Electronic', emoji: '🎛️' },
      { label: 'Rock / Indie', emoji: '🎸' },
      { label: 'Jazz', emoji: '🎷' },
      { label: 'Latin', emoji: '💃' },
      { label: 'Classical', emoji: '🎼' },
    ],
  },
  {
    key: 'events' as const,
    title: "What are you into?",
    subtitle: 'The more you pick, the better your plan',
    options: [
      { label: 'Nightlife', emoji: '🌙' },
      { label: 'Live Music', emoji: '🎶' },
      { label: 'Art & Culture', emoji: '🎨' },
      { label: 'Food & Drinks', emoji: '🍽️' },
      { label: 'Outdoors', emoji: '🌿' },
      { label: 'Comedy', emoji: '😂' },
      { label: 'Markets', emoji: '🛍️' },
      { label: 'Sports', emoji: '🏀' },
    ],
  },
  {
    key: 'food' as const,
    title: "What do you love to eat?",
    subtitle: 'We\'ll prioritize spots that match your taste',
    options: [
      { label: 'American', emoji: '🍔' },
      { label: 'Italian', emoji: '🍝' },
      { label: 'Japanese', emoji: '🍣' },
      { label: 'Mexican', emoji: '🌮' },
      { label: 'Chinese', emoji: '🥡' },
      { label: 'Indian', emoji: '🍛' },
      { label: 'Korean', emoji: '🥩' },
      { label: 'Thai', emoji: '🌶️' },
      { label: 'Mediterranean', emoji: '🫒' },
      { label: 'Caribbean', emoji: '🍹' },
    ],
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, completeOnboarding } = useUser();

  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({
    music: [], events: [], food: [],
  });
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentStep = STEPS[step];
  const currentSelections = selections[currentStep.key] ?? [];

  const toggle = (label: string) => {
    Haptics.selectionAsync();
    setSelections(prev => {
      const cur = prev[currentStep.key] ?? [];
      const next = cur.includes(label) ? cur.filter(l => l !== label) : [...cur, label];
      return { ...prev, [currentStep.key]: next };
    });
  };

  const animateTransition = (cb: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      cb();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      animateTransition(() => setStep(s => s + 1));
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    if (step < STEPS.length - 1) {
      animateTransition(() => setStep(s => s + 1));
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    const prefs: UserPreferences = {
      music: selections.music,
      events: selections.events,
      food: selections.food,
    };
    try {
      if (user?.token) {
        await fetch(`${BASE_URL()}/user/preferences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify(prefs),
        });
      }
    } catch { /* best-effort */ } finally {
      await completeOnboarding(prefs);
      // AuthGuard routes to /(tabs)
    }
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 24 : 12);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[
              styles.dot,
              { backgroundColor: i === step ? colors.primary : colors.border },
              i === step && styles.dotActive,
            ]} />
          ))}
        </View>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.6} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {step < STEPS.length - 1 ? 'Skip' : 'Skip for now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View style={[styles.contentWrap, { opacity: fadeAnim }]}>
        <View style={styles.titles}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            {currentStep.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {currentStep.subtitle}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep.options.map(opt => {
            const selected = currentSelections.includes(opt.label);
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => toggle(opt.label)}
                activeOpacity={0.75}
                style={[
                  styles.pill,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={styles.pillEmoji}>{opt.emoji}</Text>
                <Text style={[
                  styles.pillLabel,
                  {
                    color: selected ? colors.primaryForeground : colors.foreground,
                    fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  },
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={saving}
          style={[
            styles.nextBtn,
            {
              backgroundColor: currentSelections.length > 0 ? colors.primary : colors.card,
              borderColor: currentSelections.length > 0 ? colors.primary : colors.border,
              opacity: saving ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[
            styles.nextText,
            {
              color: currentSelections.length > 0 ? colors.primaryForeground : colors.mutedForeground,
              fontFamily: 'Inter_600SemiBold',
            },
          ]}>
            {step < STEPS.length - 1 ? 'Continue' : (saving ? 'Setting up…' : 'Let\'s go')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.stepCount, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {step + 1} of {STEPS.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 8,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 24 },
  skipBtn: { padding: 8 },
  skipText: { fontSize: 14 },
  contentWrap: { flex: 1, paddingHorizontal: 24 },
  titles: { paddingVertical: 24, gap: 6 },
  title: { fontSize: 26, lineHeight: 32 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingBottom: 16,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 100, borderWidth: 1.5,
  },
  pillEmoji: { fontSize: 18 },
  pillLabel: { fontSize: 14 },
  footer: { paddingHorizontal: 24, gap: 12, alignItems: 'center' },
  nextBtn: {
    width: '100%', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1,
  },
  nextText: { fontSize: 16 },
  stepCount: { fontSize: 13 },
});
