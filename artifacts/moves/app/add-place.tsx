import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
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

interface Suggestion {
  name: string;
  category: PlaceCategory;
  neighborhood: string;
  priceLevel: BudgetLevel;
  address: string;
  vibes: string[];
  vibeDescription?: string;
}

export default function AddPlaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPlace } = usePlaces();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('restaurant');
  const [neighborhood, setNeighborhood] = useState('');
  const [priceLevel, setPriceLevel] = useState<BudgetLevel>(2);
  const [address, setAddress] = useState('');
  const [vibeDescription, setVibeDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [showNeighborhoodSuggestions, setShowNeighborhoodSuggestions] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuery = useRef('');

  const canSave = name.trim().length > 0 && neighborhood.trim().length > 0;
  const filteredNeighborhoods = neighborhood.length > 1
    ? NEIGHBORHOODS.filter(n => n.toLowerCase().includes(neighborhood.toLowerCase())).slice(0, 5)
    : [];

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  // ── Get user location once on mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch { /* location optional */ }
    })();
  }, []);

  // ── Autocomplete debounce ─────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (query: string) => {
    if (lastQuery.current === query) return;
    lastQuery.current = query;
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${BASE_URL()}/places/autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lat: coords?.lat, lng: coords?.lng }),
      });
      const data = await res.json();
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [coords]);

  useEffect(() => {
    const trimmed = name.trim();
    // Clear suggestions if name was wiped or selected
    if (trimmed.length < 2) { setSuggestions([]); lastQuery.current = ''; return; }
    // Don't re-fetch if auto-filled and name unchanged
    if (autoFilled) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(trimmed), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [name, fetchSuggestions, autoFilled]);

  // ── Apply a suggestion ────────────────────────────────────────────────────
  const applySuggestion = (s: Suggestion) => {
    Haptics.selectionAsync();
    setName(s.name);
    setCategory(s.category ?? 'restaurant');
    setNeighborhood(s.neighborhood ?? '');
    setPriceLevel(s.priceLevel ?? 2);
    setAddress(s.address ?? '');
    setVibeDescription(s.vibeDescription ?? '');
    setSuggestions([]);
    setAutoFilled(true);
    lastQuery.current = s.name;
  };

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
      vibeDescription: vibeDescription.trim() || undefined,
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
        {/* Name + autocomplete */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              NAME
            </Text>
            {loadingSuggestions && (
              <View style={styles.badge}>
                <ActivityIndicator size="small" color={colors.primary} style={{ transform: [{ scale: 0.65 }] }} />
                <Text style={[styles.badgeText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                  Searching…
                </Text>
              </View>
            )}
            {autoFilled && !loadingSuggestions && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="sparkles" size={11} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                  Auto-filled
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={name}
              onChangeText={t => { setName(t); if (autoFilled) setAutoFilled(false); }}
              placeholder="Start typing a place name…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              autoFocus
              returnKeyType="done"
            />
          </View>

          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={`${s.name}-${i}`}
                  onPress={() => applySuggestion(s)}
                  activeOpacity={0.7}
                  style={[
                    styles.dropdownRow,
                    { borderBottomColor: colors.border },
                    i === suggestions.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.dropdownIcon, { backgroundColor: colors.muted }]}>
                    <Ionicons name="location-outline" size={14} color={colors.primary} />
                  </View>
                  <View style={styles.dropdownInfo}>
                    <Text style={[styles.dropdownName, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={[styles.dropdownMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                      {s.neighborhood} · {CATEGORY_LABELS[s.category] ?? s.category}
                      {s.address ? ` · ${s.address}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
              onChangeText={t => { setNeighborhood(t); setShowNeighborhoodSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowNeighborhoodSuggestions(false), 150)}
              placeholder="e.g. West Village"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
            />
          </View>
          {showNeighborhoodSuggestions && filteredNeighborhoods.length > 0 && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {filteredNeighborhoods.map((n, i) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => { setNeighborhood(n); setShowNeighborhoodSuggestions(false); }}
                  style={[
                    styles.dropdownRow,
                    { borderBottomColor: colors.border },
                    i === filteredNeighborhoods.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={[styles.dropdownName, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
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

        {/* Address */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            ADDRESS <Text style={{ fontWeight: '400', letterSpacing: 0 }}>(optional)</Text>
          </Text>
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
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            NOTES <Text style={{ fontWeight: '400', letterSpacing: 0 }}>(optional)</Text>
          </Text>
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
  field: { marginBottom: 22 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 11, letterSpacing: 1.5 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
  },
  badgeText: { fontSize: 11 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13,
  },
  textInput: { flex: 1, fontSize: 15, padding: 0 },
  notesWrap: { alignItems: 'flex-start', paddingVertical: 10 },
  notesInput: { minHeight: 70, textAlignVertical: 'top' },
  // Autocomplete dropdown
  dropdown: {
    marginTop: 4, borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  dropdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownIcon: {
    width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
  },
  dropdownInfo: { flex: 1 },
  dropdownName: { fontSize: 14 },
  dropdownMeta: { fontSize: 12, marginTop: 1 },
  // Category chips
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  // Budget
  budgetRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  budgetChip: {
    paddingVertical: 11, borderRadius: 12, borderWidth: 1, alignItems: 'center',
  },
  budgetText: { fontSize: 15 },
});
