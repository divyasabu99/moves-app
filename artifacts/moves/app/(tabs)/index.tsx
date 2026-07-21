import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { VibeSelector } from '@/components/VibeSelector';
import { BudgetLevel, PlanInput } from '@/types';
import { NEIGHBORHOODS } from '@/lib/itinerary';

const BUDGET_OPTIONS: { level: BudgetLevel; label: string; desc: string }[] = [
  { level: 1, label: '$', desc: 'Cheap' },
  { level: 2, label: '$$', desc: 'Moderate' },
  { level: 3, label: '$$$', desc: 'Upscale' },
  { level: 4, label: '$$$$', desc: 'Splurge' },
];

const TIME_OPTIONS = [
  '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
];

function getDateOptions(): { label: string; value: string }[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const shortLabel = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const options: { label: string; value: string }[] = [
    { label: 'Today', value: fmt(today) },
  ];

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  options.push({ label: 'Tomorrow', value: fmt(tomorrow) });

  // Next two days after tomorrow
  for (let i = 2; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    options.push({ label: shortLabel(d), value: fmt(d) });
  }

  return options;
}

export default function PlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [vibe, setVibe] = useState('Dinner & Drinks');
  const [selectedDate, setSelectedDate] = useState(getDateOptions()[0].value);
  const [startTime, setStartTime] = useState('7:00 PM');
  const [partySize, setPartySize] = useState(2);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>(2);
  const [neighborhood, setNeighborhood] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generating, setGenerating] = useState(false);

  const dateOptions = getDateOptions();
  const filteredNeighborhoods = neighborhood.length > 1
    ? NEIGHBORHOODS.filter(n => n.toLowerCase().includes(neighborhood.toLowerCase())).slice(0, 5)
    : [];

  const handleGenerate = async () => {
    if (generating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    await new Promise(r => setTimeout(r, 500));
    setGenerating(false);
    const plan: PlanInput = {
      vibe,
      date: selectedDate,
      startTime,
      partySize,
      budgetLevel,
      neighborhood: neighborhood.trim() || 'Any',
    };
    router.push({ pathname: '/results', params: { plan: JSON.stringify(plan) } });
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 20);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 90);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
            MOVES
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            plan your next outing
          </Text>
        </View>

        {/* Vibe */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            VIBE
          </Text>
          <VibeSelector
            selected={vibe}
            onSelect={v => { setVibe(v); Haptics.selectionAsync(); }}
          />
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            WHEN
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {dateOptions.map(opt => {
              const active = opt.value === selectedDate;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { setSelectedDate(opt.value); Haptics.selectionAsync(); }}
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
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            START TIME
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {TIME_OPTIONS.map(t => {
              const active = t === startTime;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => { setStartTime(t); Haptics.selectionAsync(); }}
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
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Party size + Budget */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              PEOPLE
            </Text>
            <View style={[styles.stepper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => { if (partySize > 1) { setPartySize(p => p - 1); Haptics.selectionAsync(); } }}
                style={styles.stepBtn}
                activeOpacity={0.6}
              >
                <Ionicons name="remove" size={20} color={partySize > 1 ? colors.foreground : colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.stepValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                {partySize}
              </Text>
              <TouchableOpacity
                onPress={() => { if (partySize < 12) { setPartySize(p => p + 1); Haptics.selectionAsync(); } }}
                style={styles.stepBtn}
                activeOpacity={0.6}
              >
                <Ionicons name="add" size={20} color={partySize < 12 ? colors.foreground : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              BUDGET
            </Text>
            <View style={styles.budgetRow}>
              {BUDGET_OPTIONS.map(opt => {
                const active = opt.level === budgetLevel;
                return (
                  <TouchableOpacity
                    key={opt.level}
                    onPress={() => { setBudgetLevel(opt.level); Haptics.selectionAsync(); }}
                    activeOpacity={0.75}
                    style={[styles.budgetChip, {
                      backgroundColor: active ? colors.accent : colors.card,
                      borderColor: active ? colors.accent : colors.border,
                      flex: 1,
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
        </View>

        {/* Neighborhood */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            NEIGHBORHOOD <Text style={{ color: colors.border }}>· optional</Text>
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="location-outline" size={16} color={colors.mutedForeground} />
            <TextInput
              value={neighborhood}
              onChangeText={t => { setNeighborhood(t); setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="West Village, Williamsburg..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              autoCorrect={false}
            />
            {neighborhood.length > 0 && (
              <TouchableOpacity onPress={() => setNeighborhood('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
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
      </ScrollView>

      {/* Generate button */}
      <View style={[styles.footer, {
        paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8),
        backgroundColor: colors.background,
        borderTopColor: colors.border,
      }]}>
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generating}
          activeOpacity={0.85}
          style={[styles.generateBtn, { backgroundColor: colors.primary }]}
        >
          {generating ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color={colors.primaryForeground} />
              <Text style={[styles.generateText, { color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }]}>
                Generate Moves
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { paddingBottom: 28, gap: 4 },
  logo: { fontSize: 34, letterSpacing: 5 },
  tagline: { fontSize: 13, letterSpacing: 0.5 },
  section: { marginBottom: 22, gap: 10 },
  label: { fontSize: 11, letterSpacing: 1.5 },
  row: { flexDirection: 'row', gap: 14 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1,
  },
  chipText: { fontSize: 14 },
  budgetRow: { flexDirection: 'row', gap: 6 },
  budgetChip: {
    paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    alignItems: 'center',
  },
  budgetText: { fontSize: 13 },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
  },
  stepBtn: { padding: 10, width: 40, alignItems: 'center' },
  stepValue: { flex: 1, textAlign: 'center', fontSize: 20 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  textInput: { flex: 1, fontSize: 14, padding: 0 },
  suggestions: {
    borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: -4,
  },
  suggestion: { paddingHorizontal: 14, paddingVertical: 12 },
  suggestionText: { fontSize: 14 },
  footer: {
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1,
  },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16,
  },
  generateText: { fontSize: 16, letterSpacing: 0.5 },
});
