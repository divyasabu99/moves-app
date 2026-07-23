import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { UserPreferences } from '@/types';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const PREF_STEPS: { key: keyof UserPreferences; label: string; options: { label: string; emoji: string }[] }[] = [
  {
    key: 'music',
    label: 'MUSIC',
    options: [
      { label: 'Hip-Hop',     emoji: '🎤' },
      { label: 'R&B / Soul',  emoji: '🎵' },
      { label: 'Pop',         emoji: '✨' },
      { label: 'Electronic',  emoji: '🎛️' },
      { label: 'Rock / Indie',emoji: '🎸' },
      { label: 'Jazz',        emoji: '🎷' },
      { label: 'Latin',       emoji: '💃' },
      { label: 'Classical',   emoji: '🎼' },
    ],
  },
  {
    key: 'events',
    label: 'EVENTS',
    options: [
      { label: 'Nightlife',    emoji: '🌙' },
      { label: 'Live Music',   emoji: '🎶' },
      { label: 'Art & Culture',emoji: '🎨' },
      { label: 'Food & Drinks',emoji: '🍽️' },
      { label: 'Outdoors',     emoji: '🌿' },
      { label: 'Comedy',       emoji: '😂' },
      { label: 'Markets',      emoji: '🛍️' },
      { label: 'Sports',       emoji: '🏀' },
    ],
  },
  {
    key: 'food',
    label: 'FOOD',
    options: [
      { label: 'American',     emoji: '🍔' },
      { label: 'Italian',      emoji: '🍝' },
      { label: 'Japanese',     emoji: '🍣' },
      { label: 'Mexican',      emoji: '🌮' },
      { label: 'Chinese',      emoji: '🥡' },
      { label: 'Indian',       emoji: '🍛' },
      { label: 'Korean',       emoji: '🥩' },
      { label: 'Thai',         emoji: '🌶️' },
      { label: 'Mediterranean',emoji: '🫒' },
      { label: 'Caribbean',    emoji: '🍹' },
    ],
  },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, preferences, logout, updateDisplayName, updatePreferences } = useUser();

  const [name, setName] = useState(user?.displayName ?? '');
  const [prefs, setPrefs] = useState<UserPreferences>(
    preferences ?? { music: [], events: [], food: [] }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const originalName = user?.displayName ?? '';
  const nameChanged = name.trim() !== originalName && name.trim().length > 0;
  const prefsChanged = JSON.stringify(prefs) !== JSON.stringify(preferences ?? { music: [], events: [], food: [] });
  const dirty = nameChanged || prefsChanged;

  const togglePref = (key: keyof UserPreferences, label: string) => {
    Haptics.selectionAsync();
    setPrefs(prev => {
      const cur = prev[key];
      const next = cur.includes(label) ? cur.filter(l => l !== label) : [...cur, label];
      return { ...prev, [key]: next };
    });
  };

  const handleSave = async () => {
    if (!dirty || saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      if (nameChanged) {
        const trimmedName = name.trim();
        await fetch(`${BASE_URL()}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: user?.userId, displayName: trimmedName }),
        });
        updateDisplayName(trimmedName);
      }
      if (prefsChanged) {
        await fetch(`${BASE_URL()}/user/preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(prefs),
        });
        updatePreferences(prefs);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logout();
          },
        },
      ]
    );
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 16 : 8);
  const avatarLetter = (name || user?.displayName || 'M').charAt(0).toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
          Settings
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!dirty || saving}
          activeOpacity={0.7}
          style={styles.headerBtn}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveText, {
              color: saved ? '#34C759' : dirty ? colors.primary : colors.border,
              fontFamily: 'Inter_600SemiBold',
            }]}>
              {saved ? 'Saved ✓' : 'Save'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Avatar ───────────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50' }]}>
            <Text style={[styles.avatarLetter, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
              {avatarLetter}
            </Text>
          </View>
        </View>

        {/* ── Profile ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            PROFILE
          </Text>

          {/* Name */}
          <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              Display name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.fieldInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              maxLength={80}
              returnKeyType="done"
              autoCorrect={false}
            />
          </View>

          {/* Email (read-only) */}
          <View style={[styles.field, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              Email
            </Text>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldValue, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                {user?.email ?? '—'}
              </Text>
              <Ionicons name="lock-closed-outline" size={13} color={colors.border} style={{ marginLeft: 6 }} />
            </View>
          </View>
        </View>

        {/* ── Preferences ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            YOUR VIBE
          </Text>

          {PREF_STEPS.map((step, idx) => (
            <View key={step.key} style={[styles.prefGroup, idx < PREF_STEPS.length - 1 && styles.prefGroupGap]}>
              <Text style={[styles.prefGroupLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                {step.label}
              </Text>
              <View style={styles.chips}>
                {step.options.map(opt => {
                  const selected = prefs[step.key].includes(opt.label);
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      onPress={() => togglePref(step.key, opt.label)}
                      activeOpacity={0.75}
                      style={[styles.chip, {
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      }]}
                    >
                      <Text style={styles.chipEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.chipLabel, {
                        color: selected ? colors.primaryForeground : colors.foreground,
                        fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* ── Sign out ─────────────────────────────────────────────────── */}
        <View style={styles.dangerSection}>
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.8}
            style={[styles.signOutBtn, { borderColor: '#FF3B3055' }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
            <Text style={[styles.signOutText, { fontFamily: 'Inter_600SemiBold' }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 56, alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 6 },
  headerTitle: { flex: 1, fontSize: 17, textAlign: 'center' },
  saveText: { fontSize: 15 },

  // Scroll
  scroll: { paddingHorizontal: 20, paddingTop: 4 },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 34 },

  // Sections
  section: { marginBottom: 32, gap: 12 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5 },

  // Fields
  field: {
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14, gap: 6,
  },
  fieldLabel: { fontSize: 11, letterSpacing: 0.5 },
  fieldInput: { fontSize: 15, padding: 0 },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldValue: { fontSize: 15, flex: 1 },

  // Preferences
  prefGroup: { gap: 10 },
  prefGroupGap: { marginBottom: 20 },
  prefGroupLabel: { fontSize: 11, letterSpacing: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1.5,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 13 },

  // Sign out
  dangerSection: { marginTop: 4 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16, borderWidth: 1,
  },
  signOutText: { fontSize: 15, color: '#FF3B30' },
});
