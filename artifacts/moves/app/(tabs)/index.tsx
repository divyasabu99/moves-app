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
import { DropdownPicker, DropdownOption } from '@/components/DropdownPicker';
import { BudgetLevel, PlanInput } from '@/types';
import { NEIGHBORHOODS, parseTimeToMinutes } from '@/lib/itinerary';

// ── Date options ─────────────────────────────────────────────────────────────
function getDateOptions(): DropdownOption[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const options: DropdownOption[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const isToday = i === 0;
    const isTomorrow = i === 1;
    const longLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'long' });
    options.push({ label, value: fmt(d), sub: isToday || isTomorrow ? longLabel : undefined });
  }
  return options;
}

// ── Time options ──────────────────────────────────────────────────────────────
const ALL_TIME_OPTIONS: DropdownOption[] = [
  '8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM',
  '3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM',
  '10:00 PM','11:00 PM','12:00 AM','1:00 AM',
].map(t => ({ label: t, value: t }));

function getEndTimeOptions(startTime: string): DropdownOption[] {
  const startMins = parseTimeToMinutes(startTime);
  return ALL_TIME_OPTIONS.filter(opt => {
    const tMins = parseTimeToMinutes(opt.value);
    const diff = tMins > startMins ? tMins - startMins : (24 * 60 - startMins) + tMins;
    return diff >= 60 && diff <= 480;
  }).map(opt => {
    const tMins = parseTimeToMinutes(opt.value);
    const diff = tMins > startMins ? tMins - startMins : (24 * 60 - startMins) + tMins;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    const dur = hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`;
    return { ...opt, sub: dur };
  });
}

const BUDGET_OPTIONS: { level: BudgetLevel; label: string; desc: string }[] = [
  { level: 1, label: '$', desc: 'Cheap' },
  { level: 2, label: '$$', desc: 'Moderate' },
  { level: 3, label: '$$$', desc: 'Upscale' },
  { level: 4, label: '$$$$', desc: 'Splurge' },
];

type OpenKey = 'date' | 'start' | 'end' | null;
type Mode = 'form' | 'chat';

export default function PlanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const DATE_OPTIONS = getDateOptions();

  // Mode
  const [mode, setMode] = useState<Mode>('form');

  // Form state
  const [vibe, setVibe] = useState('Dinner & Drinks');
  const [selectedDate, setSelectedDate] = useState(DATE_OPTIONS[0].value);
  const [startTime, setStartTime] = useState('7:00 PM');
  const [endTime, setEndTime] = useState('10:00 PM');
  const [partySize, setPartySize] = useState(2);
  const [budgetLevels, setBudgetLevels] = useState<BudgetLevel[]>([2]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [hoodSearch, setHoodSearch] = useState('');
  const [showHoodSuggestions, setShowHoodSuggestions] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<OpenKey>(null);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [generating, setGenerating] = useState(false);

  const endTimeOptions = getEndTimeOptions(startTime);

  // Dropdown helpers
  const toggleDropdown = (key: OpenKey) =>
    setOpenDropdown(prev => (prev === key ? null : key));

  const dateLabel = DATE_OPTIONS.find(o => o.value === selectedDate)?.label ?? selectedDate;

  // Ensure endTime stays valid when startTime changes
  const handleStartTimeChange = (t: string) => {
    setStartTime(t);
    const opts = getEndTimeOptions(t);
    if (!opts.find(o => o.value === endTime)) {
      setEndTime(opts[1]?.value ?? opts[0]?.value ?? t);
    }
  };

  // Budget multi-select
  const toggleBudget = (level: BudgetLevel) => {
    Haptics.selectionAsync();
    setBudgetLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level].sort()
    );
  };

  // Neighborhood multi-select
  const filteredNeighborhoods = hoodSearch.length > 0
    ? NEIGHBORHOODS.filter(
        n => n.toLowerCase().includes(hoodSearch.toLowerCase()) && !neighborhoods.includes(n)
      ).slice(0, 6)
    : NEIGHBORHOODS.filter(n => !neighborhoods.includes(n)).slice(0, 6);

  const addNeighborhood = (n: string) => {
    Haptics.selectionAsync();
    setNeighborhoods(prev => [...prev, n]);
    setHoodSearch('');
    setShowHoodSuggestions(false);
  };

  const removeNeighborhood = (n: string) => {
    Haptics.selectionAsync();
    setNeighborhoods(prev => prev.filter(h => h !== n));
  };

  const buildPlan = (): PlanInput => ({
    vibe, date: selectedDate, startTime, endTime,
    partySize, budgetLevel: budgetLevels.length ? budgetLevels : [1, 2, 3, 4],
    neighborhood: neighborhoods,
  });

  const handleGenerate = async () => {
    if (generating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    await new Promise(r => setTimeout(r, 300));
    setGenerating(false);
    router.push({ pathname: '/results', params: { plan: JSON.stringify(buildPlan()) } });
  };

  const handleChatSubmit = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChatLoading(true);
    setChatError('');
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const res = await fetch(`https://${domain}/api/chat/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const plan = await res.json() as PlanInput;
      router.push({ pathname: '/results', params: { plan: JSON.stringify(plan) } });
    } catch {
      setChatError('Could not parse your request. Try again or use the form.');
    } finally {
      setChatLoading(false);
    }
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 20);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setOpenDropdown(null)}
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
          <View style={styles.chatSection}>
            <Text style={[styles.chatHint, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Describe what you want and we'll build the move for you.
            </Text>
            <View style={[styles.chatInputWrap, {
              backgroundColor: colors.card,
              borderColor: chatError ? colors.primary : colors.border,
            }]}>
              <TextInput
                value={chatInput}
                onChangeText={t => { setChatInput(t); setChatError(''); }}
                placeholder="Dinner for 2 in Williamsburg Saturday 7–11pm, moderate budget"
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
          <>
            {/* Vibe */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>VIBE</Text>
              <VibeSelector selected={vibe} onSelect={v => { setVibe(v); Haptics.selectionAsync(); }} />
            </View>

            {/* Date */}
            <View style={[styles.section, { zIndex: 30 }]}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>DATE</Text>
              <DropdownPicker
                displayValue={dateLabel}
                options={DATE_OPTIONS}
                selectedValue={selectedDate}
                onSelect={setSelectedDate}
                isOpen={openDropdown === 'date'}
                onToggle={() => toggleDropdown('date')}
              />
            </View>

            {/* Start / End time */}
            <View style={styles.row}>
              <View style={[styles.section, { flex: 1, zIndex: 20 }]}>
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>START</Text>
                <DropdownPicker
                  displayValue={startTime}
                  options={ALL_TIME_OPTIONS}
                  selectedValue={startTime}
                  onSelect={handleStartTimeChange}
                  isOpen={openDropdown === 'start'}
                  onToggle={() => toggleDropdown('start')}
                />
              </View>
              <View style={[styles.section, { flex: 1, zIndex: 20 }]}>
                <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>END</Text>
                <DropdownPicker
                  displayValue={endTime}
                  options={endTimeOptions}
                  selectedValue={endTime}
                  onSelect={setEndTime}
                  isOpen={openDropdown === 'end'}
                  onToggle={() => toggleDropdown('end')}
                  accentColor={colors.accent}
                />
              </View>
            </View>

            {/* Party size */}
            <View style={styles.section}>
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

            {/* Budget multi-select */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                BUDGET <Text style={[styles.labelHint, { color: colors.border }]}>· pick one or more</Text>
              </Text>
              <View style={styles.budgetRow}>
                {BUDGET_OPTIONS.map(opt => {
                  const active = budgetLevels.includes(opt.level);
                  return (
                    <TouchableOpacity
                      key={opt.level}
                      onPress={() => toggleBudget(opt.level)}
                      activeOpacity={0.75}
                      style={[styles.budgetChip, {
                        flex: 1,
                        backgroundColor: active ? colors.accent : colors.card,
                        borderColor: active ? colors.accent : colors.border,
                      }]}
                    >
                      <Text style={[styles.budgetLabel, {
                        color: active ? colors.accentForeground : colors.foreground,
                        fontFamily: active ? 'Inter_700Bold' : 'Inter_400Regular',
                      }]}>{opt.label}</Text>
                      <Text style={[styles.budgetDesc, {
                        color: active ? colors.accentForeground : colors.mutedForeground,
                        fontFamily: 'Inter_400Regular',
                      }]}>{opt.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Neighborhood multi-select */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                NEIGHBORHOODS <Text style={[styles.labelHint, { color: colors.border }]}>· optional, pick multiple</Text>
              </Text>

              {/* Selected tags */}
              {neighborhoods.length > 0 && (
                <View style={styles.selectedTags}>
                  {neighborhoods.map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => removeNeighborhood(n)}
                      activeOpacity={0.7}
                      style={[styles.selectedTag, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[styles.selectedTagText, { color: colors.primaryForeground, fontFamily: 'Inter_500Medium' }]}>
                        {n}
                      </Text>
                      <Ionicons name="close" size={12} color={colors.primaryForeground} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Search input */}
              <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
                <TextInput
                  value={hoodSearch}
                  onChangeText={t => { setHoodSearch(t); setShowHoodSuggestions(true); }}
                  onFocus={() => setShowHoodSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowHoodSuggestions(false), 150)}
                  placeholder="Search or browse neighborhoods..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                  autoCorrect={false}
                />
                {hoodSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setHoodSearch('')} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Suggestion chips */}
              {(showHoodSuggestions || hoodSearch.length === 0) && filteredNeighborhoods.length > 0 && (
                <View style={styles.suggestChips}>
                  {filteredNeighborhoods.map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => addNeighborhood(n)}
                      activeOpacity={0.7}
                      style={[styles.suggestChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Ionicons name="add" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.suggestChipText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
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
        paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8),
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
              <Ionicons name="sparkles" size={18} color={(mode === 'chat' && !chatInput.trim()) ? colors.mutedForeground : colors.primaryForeground} />
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
    justifyContent: 'space-between', paddingBottom: 24,
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
  section: { marginBottom: 20, gap: 10 },
  label: { fontSize: 11, letterSpacing: 1.5 },
  labelHint: { fontSize: 11, letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 12 },
  // Party size stepper
  stepper: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1,
  },
  stepBtn: { padding: 10, width: 44, alignItems: 'center' },
  stepValue: { flex: 1, textAlign: 'center', fontSize: 22 },
  // Budget
  budgetRow: { flexDirection: 'row', gap: 8 },
  budgetChip: {
    paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', gap: 2,
  },
  budgetLabel: { fontSize: 16 },
  budgetDesc: { fontSize: 10 },
  // Neighborhood
  selectedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100,
  },
  selectedTagText: { fontSize: 13 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  textInput: { flex: 1, fontSize: 14, padding: 0 },
  suggestChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, borderWidth: 1,
  },
  suggestChipText: { fontSize: 13 },
  // Chat
  chatSection: { gap: 14 },
  chatHint: { fontSize: 14, lineHeight: 20 },
  chatInputWrap: { borderRadius: 16, borderWidth: 1, padding: 14, minHeight: 120 },
  chatInput: { fontSize: 15, lineHeight: 22, textAlignVertical: 'top' },
  chatError: { fontSize: 13 },
  chatExamples: { gap: 8, marginTop: 4 },
  exampleChip: { borderRadius: 12, borderWidth: 1, padding: 12 },
  exampleText: { fontSize: 13, lineHeight: 18 },
  // Footer
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16,
  },
  generateText: { fontSize: 16, letterSpacing: 0.5 },
});
