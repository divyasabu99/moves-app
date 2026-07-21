import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, Modal, FlatList, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { VibeSelector } from '@/components/VibeSelector';
import { DropdownPicker, DropdownOption } from '@/components/DropdownPicker';
import { useMoves } from '@/context/MovesContext';
import { usePlaces } from '@/context/PlacesContext';
import { BudgetLevel, Place, Stop } from '@/types';
import { NEIGHBORHOODS, parseTimeToMinutes } from '@/lib/itinerary';

// ── Date + Time helpers (same as Plan screen) ────────────────────────────────
function getDateOptions(): DropdownOption[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    return { label, value: fmt(d) };
  });
}

const ALL_TIMES: DropdownOption[] = [
  '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
  '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM','12:00 AM',
].map(t => ({ label: t, value: t }));

function endTimeOptions(start: string): DropdownOption[] {
  const sm = parseTimeToMinutes(start);
  return ALL_TIMES.filter(o => {
    const tm = parseTimeToMinutes(o.value);
    const diff = tm > sm ? tm - sm : (1440 - sm) + tm;
    return diff >= 60 && diff <= 600;
  }).map(o => {
    const tm = parseTimeToMinutes(o.value);
    const diff = tm > sm ? tm - sm : (1440 - sm) + tm;
    const h = Math.floor(diff / 60), m = diff % 60;
    return { ...o, sub: h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m` };
  });
}

const BUDGET_OPTIONS: { level: BudgetLevel; label: string; desc: string }[] = [
  { level: 1, label: '$', desc: 'Cheap' },
  { level: 2, label: '$$', desc: 'Moderate' },
  { level: 3, label: '$$$', desc: 'Upscale' },
  { level: 4, label: '$$$$', desc: 'Splurge' },
];

const DURATION_OPTS = [
  { label: '30m', value: 30 }, { label: '45m', value: 45 }, { label: '1h', value: 60 },
  { label: '1.5h', value: 90 }, { label: '2h', value: 120 }, { label: '3h', value: 180 },
];

type OpenKey = 'date' | 'start' | 'end' | null;

// ── Stop picker modal ─────────────────────────────────────────────────────────
function StopPickerModal({
  visible, places, existing,
  onAdd, onClose,
}: {
  visible: boolean;
  places: Place[];
  existing: string[];
  onAdd: (stop: Stop) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Place | null>(null);
  const [duration, setDuration] = useState(60);
  const [costInput, setCostInput] = useState('');

  const filtered = useMemo(() =>
    places.filter(p =>
      !existing.includes(p.id) &&
      (search.length === 0 || p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.neighborhood.toLowerCase().includes(search.toLowerCase()))
    ), [places, existing, search]);

  const reset = () => { setSearch(''); setSelected(null); setDuration(60); setCostInput(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleAdd = () => {
    if (!selected) return;
    const cost = parseFloat(costInput) || selected.priceLevel * 15;
    onAdd({
      placeId: selected.id, place: selected,
      estimatedDurationMinutes: duration,
      estimatedCostPerPerson: Math.round(cost),
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalRoot, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            {selected ? selected.name : 'Add a Stop'}
          </Text>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {!selected ? (
          <>
            <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search your places..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                autoFocus
              />
            </View>
            {filtered.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="location-outline" size={36} color={colors.mutedForeground} />
                <Text style={[styles.modalEmptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {places.length === 0 ? 'Save some places first in the Places tab.' : 'No places match your search.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={p => p.id}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => { setSelected(item); Haptics.selectionAsync(); }}
                    activeOpacity={0.75}
                    style={[styles.placeRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.placeRowLeft}>
                      <Text style={[styles.placeRowName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.placeRowSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                        {item.neighborhood} · {'$'.repeat(item.priceLevel)}
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.stopConfig} keyboardShouldPersistTaps="handled">
            {/* Place info */}
            <View style={[styles.selectedPlace, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.selectedPlaceName, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                {selected.name}
              </Text>
              <Text style={[styles.selectedPlaceSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {selected.neighborhood} · {'$'.repeat(selected.priceLevel)}
              </Text>
            </View>

            {/* Duration */}
            <Text style={[styles.configLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              HOW LONG?
            </Text>
            <View style={styles.durationRow}>
              {DURATION_OPTS.map(d => (
                <TouchableOpacity
                  key={d.value}
                  onPress={() => { setDuration(d.value); Haptics.selectionAsync(); }}
                  activeOpacity={0.75}
                  style={[styles.durationChip, {
                    flex: 1,
                    backgroundColor: duration === d.value ? colors.primary : colors.card,
                    borderColor: duration === d.value ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[styles.durationChipText, {
                    color: duration === d.value ? colors.primaryForeground : colors.foreground,
                    fontFamily: duration === d.value ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cost */}
            <Text style={[styles.configLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              COST PER PERSON ($)
            </Text>
            <View style={[styles.costInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.costDollar, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>$</Text>
              <TextInput
                value={costInput}
                onChangeText={setCostInput}
                placeholder={String(selected.priceLevel * 15)}
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                style={[styles.costInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              />
            </View>

            <View style={styles.stopActions}>
              <TouchableOpacity
                onPress={() => setSelected(null)}
                activeOpacity={0.7}
                style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="arrow-back" size={16} color={colors.foreground} />
                <Text style={[styles.backBtnText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
                activeOpacity={0.85}
                style={[styles.addStopBtn, { backgroundColor: colors.primary, flex: 1 }]}
              >
                <Ionicons name="add" size={18} color={colors.primaryForeground} />
                <Text style={[styles.addStopBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  Add to Move
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AddMoveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addManualMove } = useMoves();
  const { places } = usePlaces();
  const DATE_OPTIONS = useMemo(getDateOptions, []);

  const [title, setTitle] = useState('');
  const [vibe, setVibe] = useState('Dinner & Drinks');
  const [date, setDate] = useState(DATE_OPTIONS[0].value);
  const [startTime, setStartTime] = useState('7:00 PM');
  const [endTime, setEndTime] = useState('10:00 PM');
  const [partySize, setPartySize] = useState(2);
  const [budgetLevels, setBudgetLevels] = useState<BudgetLevel[]>([2]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [hoodSearch, setHoodSearch] = useState('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [openDropdown, setOpenDropdown] = useState<OpenKey>(null);
  const [stopPickerVisible, setStopPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateLabel = DATE_OPTIONS.find(o => o.value === date)?.label ?? date;
  const etOpts = useMemo(() => endTimeOptions(startTime), [startTime]);
  const existingPlaceIds = stops.map(s => s.placeId);
  const totalCost = stops.reduce((s, st) => s + st.estimatedCostPerPerson, 0);

  const toggleBudget = (level: BudgetLevel) => {
    Haptics.selectionAsync();
    setBudgetLevels(prev =>
      prev.includes(level) ? (prev.length > 1 ? prev.filter(l => l !== level) : prev) : [...prev, level].sort() as BudgetLevel[]
    );
  };

  const removeStop = (placeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStops(prev => prev.filter(s => s.placeId !== placeId));
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Give your move a name before saving.');
      return;
    }
    if (stops.length === 0) {
      Alert.alert('Add a stop', 'Add at least one stop to your move.');
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addManualMove({
      title: title.trim(),
      vibe, date, startTime, endTime, partySize,
      budgetLevel: budgetLevels,
      neighborhood: neighborhoods,
      stops,
      totalEstimatedCostPerPerson: totalCost,
    });
    router.back();
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 16);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
          New Move
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setOpenDropdown(null)}
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>TITLE</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Name this move..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              maxLength={80}
              autoFocus
            />
          </View>
        </View>

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
            selectedValue={date}
            onSelect={setDate}
            isOpen={openDropdown === 'date'}
            onToggle={() => setOpenDropdown(p => p === 'date' ? null : 'date')}
          />
        </View>

        {/* Time */}
        <View style={[styles.row, { zIndex: 20 }]}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>START</Text>
            <DropdownPicker
              displayValue={startTime}
              options={ALL_TIMES}
              selectedValue={startTime}
              onSelect={t => { setStartTime(t); if (!etOpts.find(o => o.value === endTime)) setEndTime(etOpts[1]?.value ?? t); }}
              isOpen={openDropdown === 'start'}
              onToggle={() => setOpenDropdown(p => p === 'start' ? null : 'start')}
            />
          </View>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>END</Text>
            <DropdownPicker
              displayValue={endTime}
              options={etOpts}
              selectedValue={endTime}
              onSelect={setEndTime}
              isOpen={openDropdown === 'end'}
              onToggle={() => setOpenDropdown(p => p === 'end' ? null : 'end')}
              accentColor={colors.accent}
            />
          </View>
        </View>

        {/* Party size */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>PEOPLE</Text>
          <View style={[styles.stepper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity onPress={() => { if (partySize > 1) { setPartySize(p => p - 1); Haptics.selectionAsync(); } }} style={styles.stepBtn}>
              <Ionicons name="remove" size={20} color={partySize > 1 ? colors.foreground : colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.stepValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>{partySize}</Text>
            <TouchableOpacity onPress={() => { if (partySize < 12) { setPartySize(p => p + 1); Haptics.selectionAsync(); } }} style={styles.stepBtn}>
              <Ionicons name="add" size={20} color={partySize < 12 ? colors.foreground : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>BUDGET</Text>
          <View style={styles.budgetRow}>
            {BUDGET_OPTIONS.map(opt => {
              const active = budgetLevels.includes(opt.level);
              return (
                <TouchableOpacity key={opt.level} onPress={() => toggleBudget(opt.level)} activeOpacity={0.75}
                  style={[styles.budgetChip, { flex: 1, backgroundColor: active ? colors.accent : colors.card, borderColor: active ? colors.accent : colors.border }]}>
                  <Text style={[styles.budgetLabel, { color: active ? colors.accentForeground : colors.foreground, fontFamily: active ? 'Inter_700Bold' : 'Inter_400Regular' }]}>{opt.label}</Text>
                  <Text style={[styles.budgetDesc, { color: active ? colors.accentForeground : colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{opt.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Neighborhoods */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            NEIGHBORHOODS <Text style={[styles.labelHint, { color: colors.border }]}>· optional</Text>
          </Text>
          {neighborhoods.length > 0 && (
            <View style={styles.selectedTags}>
              {neighborhoods.map(n => (
                <TouchableOpacity key={n} onPress={() => setNeighborhoods(prev => prev.filter(h => h !== n))} activeOpacity={0.7}
                  style={[styles.selectedTag, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.selectedTagText, { color: colors.primaryForeground, fontFamily: 'Inter_500Medium' }]}>{n}</Text>
                  <Ionicons name="close" size={12} color={colors.primaryForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
            <TextInput
              value={hoodSearch}
              onChangeText={setHoodSearch}
              placeholder="Search neighborhoods..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              autoCorrect={false}
            />
          </View>
          <View style={styles.suggestChips}>
            {NEIGHBORHOODS.filter(n => !neighborhoods.includes(n) && (hoodSearch.length === 0 || n.toLowerCase().includes(hoodSearch.toLowerCase()))).slice(0, 6).map(n => (
              <TouchableOpacity key={n} onPress={() => { setNeighborhoods(p => [...p, n]); setHoodSearch(''); Haptics.selectionAsync(); }} activeOpacity={0.7}
                style={[styles.suggestChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="add" size={13} color={colors.mutedForeground} />
                <Text style={[styles.suggestChipText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stops */}
        <View style={styles.section}>
          <View style={styles.stopsHeader}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>STOPS</Text>
            {stops.length > 0 && (
              <Text style={[styles.totalCost, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
                ~${totalCost}/pp total
              </Text>
            )}
          </View>
          {stops.map((stop, i) => (
            <View key={stop.placeId} style={[styles.stopRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.stopIdx, { backgroundColor: i === 0 ? colors.primary : colors.muted }]}>
                <Text style={[styles.stopIdxText, { color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }]}>{i + 1}</Text>
              </View>
              <View style={styles.stopInfo}>
                <Text style={[styles.stopName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                  {stop.place.name}
                </Text>
                <Text style={[styles.stopMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {stop.estimatedDurationMinutes >= 60 ? `${Math.floor(stop.estimatedDurationMinutes / 60)}h${stop.estimatedDurationMinutes % 60 > 0 ? ` ${stop.estimatedDurationMinutes % 60}m` : ''}` : `${stop.estimatedDurationMinutes}m`}
                  {' · '}~${stop.estimatedCostPerPerson}/pp
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeStop(stop.placeId)} activeOpacity={0.7} style={styles.removeStop}>
                <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setStopPickerVisible(true)}
            activeOpacity={0.8}
            style={[styles.addStopChip, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={[styles.addStopChipText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
              Add Stop from My Places
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8), backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="checkmark" size={18} color={colors.primaryForeground} />
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }]}>
            Save Move
          </Text>
        </TouchableOpacity>
      </View>

      <StopPickerModal
        visible={stopPickerVisible}
        places={places}
        existing={existingPlaceIds}
        onAdd={stop => { setStops(prev => [...prev, stop]); setStopPickerVisible(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
        onClose={() => setStopPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 22, gap: 10 },
  label: { fontSize: 11, letterSpacing: 1.5 },
  labelHint: { fontSize: 11, letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 12 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  textInput: { flex: 1, fontSize: 14, padding: 0 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1 },
  stepBtn: { padding: 10, width: 44, alignItems: 'center' },
  stepValue: { flex: 1, textAlign: 'center', fontSize: 22 },
  budgetRow: { flexDirection: 'row', gap: 8 },
  budgetChip: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 2 },
  budgetLabel: { fontSize: 16 },
  budgetDesc: { fontSize: 10 },
  selectedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100 },
  selectedTagText: { fontSize: 13 },
  suggestChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  suggestChipText: { fontSize: 13 },
  stopsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalCost: { fontSize: 13 },
  stopRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, gap: 12 },
  stopIdx: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stopIdxText: { fontSize: 13 },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14 },
  stopMeta: { fontSize: 12, marginTop: 2 },
  removeStop: { padding: 4 },
  addStopChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 14,
  },
  addStopChipText: { fontSize: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  saveBtnText: { fontSize: 16 },
  // Modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 16, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  modalList: { paddingHorizontal: 16, gap: 8, paddingBottom: 24 },
  placeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  placeRowLeft: { flex: 1 },
  placeRowName: { fontSize: 15 },
  placeRowSub: { fontSize: 12, marginTop: 2 },
  modalEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  modalEmptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  stopConfig: { padding: 20, gap: 16 },
  selectedPlace: { borderRadius: 14, borderWidth: 1, padding: 16 },
  selectedPlaceName: { fontSize: 18 },
  selectedPlaceSub: { fontSize: 13, marginTop: 2 },
  configLabel: { fontSize: 11, letterSpacing: 1.5 },
  durationRow: { flexDirection: 'row', gap: 6 },
  durationChip: { paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  durationChipText: { fontSize: 13 },
  costInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  costDollar: { fontSize: 16 },
  costInput: { flex: 1, fontSize: 16, padding: 0 },
  stopActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  backBtnText: { fontSize: 14 },
  addStopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  addStopBtnText: { fontSize: 15 },
});
