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
import { NEIGHBORHOODS, parseTimeToMinutes, minutesToTimeString } from '@/lib/itinerary';

const BUDGET_OPTIONS: { level: BudgetLevel; label: string }[] = [
  { level: 1, label: '$' },
  { level: 2, label: '$$' },
  { level: 3, label: '$$$' },
  { level: 4, label: '$$$$' },
];

const ALL_TIMES = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
  '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM',
];

function getEndTimeOptions(startTime: string): string[] {
  const startMins = parseTimeToMinutes(startTime);
  return ALL_TIMES.filter(t => {
    const tMins = parseTimeToMinutes(t);
    // Allow 1–6 hours after start (handle crossing midnight)
    const diff = tMins > startMins ? tMins - startMins : (24 * 60 - startMins) + tMins;
    return diff >= 60 && diff <= 360;
  });
}

function getDateOptions(): { label: string; value: string }[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const shortLabel = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const options = [
    { label: 'Today', value: fmt(today) },
  ];
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  options.push({ label: 'Tomorrow', value: fmt(tomorrow) });
  for (let i = 2; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    options.push({ label: shortLabel(d), value: fmt(d) });
  }
  return options;
}

type Mode = 'form' | 'chat';

export default function PlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // Mode
  const [mode, setMode] = useState<Mode>('form');

  // Form state
  const [vibe, setVibe] = useState('Dinner & Drinks');
  const [selectedDate, setSelectedDate] = useState(getDateOptions()[0].value);
  const [startTime, setStartTime] = useState('7:00 PM');
  const [endTime, setEndTime] = useState('10:00 PM');
  const [partySize, setPartySize] = useState(2);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>(2);
  const [neighborhood, setNeighborhood] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const [generating, setGenerating] = useState(false);
  const dateOptions = getDateOptions();
  const endTimeOptions = getEndTimeOptions(startTime);

  const filteredNeighborhoods = neighborhood.length > 1
    ? NEIGHBORHOODS.filter(n => n.toLowerCase().includes(neighborhood.toLowerCase())).slice(0, 5)
    : [];

  const handleStartTimeChange = (t: string) => {
    setStartTime(t);
    // Reset endTime if it no longer fits
    const newOptions = getEndTimeOptions(t);
    if (!newOptions.includes(endTime)) {
      setEndTime(newOptions[1] ?? newOptions[0] ?? t);
    }
    Haptics.selectionAsync();
  };

  const buildPlan = (): PlanInput => ({
    vibe, date: selectedDate, startTime, endTime,
    partySize, budgetLevel, neighborhood: neighborhood.trim() || 'Any',
  });

  const navigate = (plan: PlanInput) => {
    router.push({ pathname: '/results', params: { plan: JSON.stringify(plan) } });
  };

  const handleGenerate = async () => {
    if (generating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    await new Promise(r => setTimeout(r, 300));
    setGenerating(false);
    navigate(buildPlan());
  };

  const handleChatSubmit = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChatLoading(true);
    setChatError('');
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const url = `https://${domain}/api/chat/parse`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const plan = await res.json() as PlanInput;
      navigate(plan);
    } catch (err) {
      setChatError('Could not parse your request. Try again or use the form.');
    } finally {
      setChatLoading(false);
    }
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 20);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 8);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: 160 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header + mode toggle */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.logo, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
              MOVES
            </Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              plan your next outing
            </Text>
          </View>
          <View style={[styles.modeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(['form', 'chat'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => { setMode(m); Haptics.selectionAsync(); }}
                activeOpacity={0.8}
                style={[styles.modeBtn, { backgroundColor: mode === m ? colors.primary : 'transparent' }]}
              >
                <Ionicons
                  name={m === 'form' ? 'options-outline' : 'chatbubble-outline'}
                  size={15}
                  color={mode === m ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text style={[styles.modeBtnText, {
                  color: mode === m ? colors.primaryForeground : colors.mutedForeground,
                  fontFamily: mode === m ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }]}>
                  {m === 'form' ? 'Form' : 'Chat'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {mode === 'chat' ? (
          /* ── CHAT MODE ── */
          <View style={styles.chatSection}>
            <Text style={[styles.chatHint, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Describe what you want and we'll build the move for you.
            </Text>
            <View style={[styles.chatInputWrap, {
              backgroundColor: colors.card,
              borderColor: chatError ? '#FF4B6E' : colors.border,
            }]}>
              <TextInput
                value={chatInput}
                onChangeText={t => { setChatInput(t); setChatError(''); }}
                placeholder={'Dinner for 2 in Williamsburg on Saturday, moderate budget, starting around 7pm, done by midnight'}
                placeholderTextColor={colors.mutedForeground}
                multiline
                style={[styles.chatInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                autoFocus
              />
            </View>
            {chatError ? (
              <Text style={[styles.chatError, { color: colors.primary, fontFamily: 'Inter_400Regular' }]}>
                {chatError}
              </Text>
            ) : null}
            <View style={styles.chatExamples}>
              {[
                'Brunch for 4 in Park Slope Sunday morning',
                'Date night tonight in the West Village, fancy',
                'Low-key afternoon in Greenpoint, just 2 of us',
              ].map(ex => (
                <TouchableOpacity
                  key={ex}
                  onPress={() => { setChatInput(ex); setChatError(''); }}
                  activeOpacity={0.7}
                  style={[styles.exampleChip, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Text style={[styles.exampleText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {ex}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          /* ── FORM MODE ── */
          <>
            {/* Vibe */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>VIBE</Text>
              <VibeSelector selected={vibe} onSelect={v => { setVibe(v); Haptics.selectionAsync(); }} />
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>WHEN</Text>
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
                      }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Start + End time */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                START TIME
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {ALL_TIMES.map(t => {
                  const active = t === startTime;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => handleStartTimeChange(t)}
                      activeOpacity={0.75}
                      style={[styles.chip, {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      }]}
                    >
                      <Text style={[styles.chipText, {
                        color: active ? colors.primaryForeground : colors.foreground,
                        fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      }]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                END TIME
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {endTimeOptions.map(t => {
                  const active = t === endTime;
                  const startMins = parseTimeToMinutes(startTime);
                  const tMins = parseTimeToMinutes(t);
                  const diff = tMins > startMins ? tMins - startMins : (24 * 60 - startMins) + tMins;
                  const hrs = Math.floor(diff / 60);
                  const mins = diff % 60;
                  const dur = hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => { setEndTime(t); Haptics.selectionAsync(); }}
                      activeOpacity={0.75}
                      style={[styles.chip, {
                        backgroundColor: active ? colors.accent : colors.card,
                        borderColor: active ? colors.accent : colors.border,
                      }]}
                    >
                      <Text style={[styles.chipText, {
                        color: active ? colors.accentForeground : colors.foreground,
                        fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      }]}>{t}</Text>
                      <Text style={[styles.chipSub, {
                        color: active ? colors.accentForeground : colors.mutedForeground,
                        fontFamily: 'Inter_400Regular',
                      }]}>{dur}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Party size + Budget */}
            <View style={styles.row}>
              <View style={[styles.section, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>PEOPLE</Text>
                <View style={[styles.stepper, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    onPress={() => { if (partySize > 1) { setPartySize(p => p - 1); Haptics.selectionAsync(); } }}
                    style={styles.stepBtn} activeOpacity={0.6}
                  >
                    <Ionicons name="remove" size={20} color={partySize > 1 ? colors.foreground : colors.mutedForeground} />
                  </TouchableOpacity>
                  <Text style={[styles.stepValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                    {partySize}
                  </Text>
                  <TouchableOpacity
                    onPress={() => { if (partySize < 12) { setPartySize(p => p + 1); Haptics.selectionAsync(); } }}
                    style={styles.stepBtn} activeOpacity={0.6}
                  >
                    <Ionicons name="add" size={20} color={partySize < 12 ? colors.foreground : colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.section, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>BUDGET</Text>
                <View style={styles.budgetRow}>
                  {BUDGET_OPTIONS.map(opt => {
                    const active = opt.level === budgetLevel;
                    return (
                      <TouchableOpacity
                        key={opt.level}
                        onPress={() => { setBudgetLevel(opt.level); Haptics.selectionAsync(); }}
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
                        }]}>{opt.label}</Text>
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
          </>
        )}
      </ScrollView>

      {/* Generate / Plan button */}
      <View style={[styles.footer, {
        paddingBottom: botPad + (insets.bottom > 0 ? 0 : 20),
        backgroundColor: colors.background,
        borderTopColor: colors.border,
      }]}>
        <TouchableOpacity
          onPress={mode === 'chat' ? handleChatSubmit : handleGenerate}
          disabled={generating || chatLoading || (mode === 'chat' && !chatInput.trim())}
          activeOpacity={0.85}
          style={[styles.generateBtn, {
            backgroundColor: (mode === 'chat' && !chatInput.trim()) ? colors.muted : colors.primary,
          }]}
        >
          {(generating || chatLoading) ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <>
              <Ionicons
                name={mode === 'chat' ? 'sparkles' : 'sparkles'}
                size={18}
                color={(mode === 'chat' && !chatInput.trim()) ? colors.mutedForeground : colors.primaryForeground}
              />
              <Text style={[styles.generateText, {
                color: (mode === 'chat' && !chatInput.trim()) ? colors.mutedForeground : colors.primaryForeground,
                fontFamily: 'Inter_700Bold',
              }]}>
                {mode === 'chat' ? 'Plan It' : 'Generate Moves'}
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
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', paddingBottom: 28,
  },
  logo: { fontSize: 34, letterSpacing: 5 },
  tagline: { fontSize: 13, letterSpacing: 0.5, marginTop: 2 },
  modeToggle: {
    flexDirection: 'row', borderRadius: 12, borderWidth: 1,
    padding: 3, gap: 2, marginTop: 6,
  },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9,
  },
  modeBtnText: { fontSize: 13 },
  section: { marginBottom: 22, gap: 10 },
  label: { fontSize: 11, letterSpacing: 1.5 },
  row: { flexDirection: 'row', gap: 14 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1, alignItems: 'center',
  },
  chipText: { fontSize: 14 },
  chipSub: { fontSize: 10, marginTop: 1 },
  budgetRow: { flexDirection: 'row', gap: 6 },
  budgetChip: {
    paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center',
  },
  budgetText: { fontSize: 13 },
  stepper: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1,
  },
  stepBtn: { padding: 10, width: 40, alignItems: 'center' },
  stepValue: { flex: 1, textAlign: 'center', fontSize: 20 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  textInput: { flex: 1, fontSize: 14, padding: 0 },
  suggestions: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: -4 },
  suggestion: { paddingHorizontal: 14, paddingVertical: 12 },
  suggestionText: { fontSize: 14 },
  // Chat mode
  chatSection: { gap: 14 },
  chatHint: { fontSize: 14, lineHeight: 20 },
  chatInputWrap: {
    borderRadius: 16, borderWidth: 1, padding: 14, minHeight: 120,
  },
  chatInput: { fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  chatError: { fontSize: 13 },
  chatExamples: { gap: 8, marginTop: 4 },
  exampleChip: {
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  exampleText: { fontSize: 13, lineHeight: 18 },
  footer: {
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1,
  },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16,
  },
  generateText: { fontSize: 16, letterSpacing: 0.5 },
});
