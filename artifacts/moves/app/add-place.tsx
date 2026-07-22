import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { usePlaces } from '@/context/PlacesContext';
import { PlaceCategory, BudgetLevel } from '@/types';
import { CATEGORY_LABELS, NEIGHBORHOODS } from '@/lib/itinerary';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const CATEGORIES: PlaceCategory[] = ['restaurant', 'bar', 'cafe', 'museum', 'activity', 'park', 'shop'];
const BUDGET_OPTIONS: { level: BudgetLevel; label: string }[] = [
  { level: 1, label: '$' },
  { level: 2, label: '$$' },
  { level: 3, label: '$$$' },
  { level: 4, label: '$$$$' },
];

export default function AddPlaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPlace } = usePlaces();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('restaurant');
  const [neighborhood, setNeighborhood] = useState('');
  const [priceLevel, setPriceLevel] = useState<BudgetLevel>(2);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Lookup state
  const [looking, setLooking] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLookedUp = useRef('');

  const canSave = name.trim().length > 0 && neighborhood.trim().length > 0;
  const filteredNeighborhoods = neighborhood.length > 1
    ? NEIGHBORHOODS.filter(n => n.toLowerCase().includes(neighborhood.toLowerCase())).slice(0, 5)
    : [];

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  // ── AI debounce lookup ────────────────────────────────────────────────────
  const doLookup = useCallback(async (query: string) => {
    if (lastLookedUp.current === query) return;
    lastLookedUp.current = query;
    setLooking(true);
    setAutoFilled(false);
    try {
      const res = await fetch(`${BASE_URL()}/lookup-place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: query }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.category)     setCategory(data.category);
      if (data.neighborhood) setNeighborhood(data.neighborhood);
      if (data.priceLevel)   setPriceLevel(data.priceLevel);
      if (data.address)      setAddress(data.address);
      setAutoFilled(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { /* silent — user can fill in manually */ } finally {
      setLooking(false);
    }
  }, []);

  useEffect(() => {
    const trimmed = name.trim();
    // Reset auto-fill badge if name changed significantly
    if (autoFilled && trimmed !== lastLookedUp.current) setAutoFilled(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (trimmed.length < 3) return;

    debounceRef.current = setTimeout(() => doLookup(trimmed), 900);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [name, doLookup, autoFilled]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPlace({
      name: name.trim(),
      category,
      neighborhood: neighborhood.trim(),
      priceLevel,
      source: 'manual',
      vibes: [],
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
          Add a Place
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={!canSave} style={styles.headerBtn} activeOpacity={0.7}>
          <Text style={[styles.saveText, {
            color: canSave ? colors.primary : colors.mutedForeground,
            fontFamily: 'Inter_600SemiBold',
          }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name + lookup indicator */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              NAME
            </Text>
            {looking && (
              <View style={styles.lookingBadge}>
                <ActivityIndicator size="small" color={colors.primary} style={{ transform: [{ scale: 0.7 }] }} />
                <Text style={[styles.lookingText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                  Looking up…
                </Text>
              </View>
            )}
            {autoFilled && !looking && (
              <View style={[styles.lookingBadge, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="sparkles" size={11} color={colors.primary} />
                <Text style={[styles.lookingText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                  Auto-filled
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Via Carota"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              autoFocus
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {CATEGORIES.map(cat => {
              const active = cat === category;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => { setCategory(cat); Haptics.selectionAsync(); }}
                  activeOpacity={0.75}
                  style={[styles.chip, {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[styles.chipText, {
                    color: active ? colors.primaryForeground : colors.foreground,
                    fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  }]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Neighborhood */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>NEIGHBORHOOD</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={16} color={colors.mutedForeground} />
            <TextInput
              value={neighborhood}
              onChangeText={t => { setNeighborhood(t); setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="e.g. West Village"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
            />
          </View>
          {showSuggestions && filteredNeighborhoods.length > 0 && (
            <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {filteredNeighborhoods.map((n, i) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => { setNeighborhood(n); setShowSuggestions(false); }}
                  style={[styles.suggestion, {
                    borderBottomColor: colors.border,
                    borderBottomWidth: i < filteredNeighborhoods.length - 1 ? 1 : 0,
                  }]}
                >
                  <Text style={[styles.suggestionText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Price Level */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>PRICE LEVEL</Text>
          <View style={styles.budgetRow}>
            {BUDGET_OPTIONS.map(opt => {
              const active = opt.level === priceLevel;
              return (
                <TouchableOpacity
                  key={opt.level}
                  onPress={() => { setPriceLevel(opt.level); Haptics.selectionAsync(); }}
                  activeOpacity={0.75}
                  style={[styles.budgetChip, {
                    flex: 1,
                    backgroundColor: active ? colors.accent : colors.card,
                    borderColor: active ? colors.accent : colors.border,
                  }]}
                >
                  <Text style={[styles.budgetText, {
                    color: active ? colors.accentForeground : colors.mutedForeground,
                    fontFamily: active ? 'Inter_700Bold' : 'Inter_400Regular',
                  }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Address (shown when auto-filled or manually entered) */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>ADDRESS <Text style={{ fontWeight: '400', letterSpacing: 0 }}>(optional)</Text></Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Street address"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>NOTES <Text style={{ fontWeight: '400', letterSpacing: 0 }}>(optional)</Text></Text>
          <View style={[styles.inputWrap, styles.notesWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="What do you love about this spot?"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, styles.notesInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              multiline
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerBtn: { width: 50, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17 },
  saveText: { fontSize: 16 },
  content: { padding: 20 },
  field: { marginBottom: 22, gap: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 11, letterSpacing: 1.5 },
  lookingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
  },
  lookingText: { fontSize: 11 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13,
  },
  textInput: { flex: 1, fontSize: 15, padding: 0 },
  notesWrap: { alignItems: 'flex-start', paddingVertical: 10 },
  notesInput: { minHeight: 70, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  budgetRow: { flexDirection: 'row', gap: 8 },
  budgetChip: {
    paddingVertical: 11, borderRadius: 12, borderWidth: 1, alignItems: 'center',
  },
  budgetText: { fontSize: 15 },
  suggestions: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: -4 },
  suggestion: { paddingHorizontal: 14, paddingVertical: 12 },
  suggestionText: { fontSize: 14 },
});
