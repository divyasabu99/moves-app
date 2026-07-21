import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { usePlaces } from '@/context/PlacesContext';
import { PlaceCategory, PlaceSource, BudgetLevel } from '@/types';
import { CATEGORY_LABELS, SOURCE_LABELS, NEIGHBORHOODS } from '@/lib/itinerary';

const CATEGORIES: PlaceCategory[] = ['restaurant', 'bar', 'cafe', 'museum', 'activity', 'park', 'shop'];
const SOURCES: PlaceSource[] = ['google_maps', 'beli', 'yelp', 'manual'];
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
  const [source, setSource] = useState<PlaceSource>('google_maps');
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const canSave = name.trim().length > 0 && neighborhood.trim().length > 0;
  const filteredNeighborhoods = neighborhood.length > 1
    ? NEIGHBORHOODS.filter(n => n.toLowerCase().includes(neighborhood.toLowerCase())).slice(0, 5)
    : [];

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  const handleSave = () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPlace({ name: name.trim(), category, neighborhood: neighborhood.trim(), priceLevel, source, vibes: [], notes: notes.trim() || undefined });
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
          }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>NAME</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Via Carota"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              autoFocus
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

        {/* Source */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            SAVED FROM
          </Text>
          <View style={styles.sourceGrid}>
            {SOURCES.map(src => {
              const active = src === source;
              return (
                <TouchableOpacity
                  key={src}
                  onPress={() => { setSource(src); Haptics.selectionAsync(); }}
                  activeOpacity={0.75}
                  style={[styles.sourceChip, {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[styles.sourceText, {
                    color: active ? colors.primaryForeground : colors.foreground,
                    fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  }]}>
                    {SOURCE_LABELS[src]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            NOTES <Text style={{ color: colors.border }}>· optional</Text>
          </Text>
          <View style={[styles.inputWrap, styles.notesWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything to remember about this place..."
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
  label: { fontSize: 11, letterSpacing: 1.5 },
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
  sourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1,
  },
  sourceText: { fontSize: 14 },
  suggestions: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: -4 },
  suggestion: { paddingHorizontal: 14, paddingVertical: 12 },
  suggestionText: { fontSize: 14 },
});
