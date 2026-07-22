import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { usePlaces } from '@/context/PlacesContext';
import { Place, PlaceCategory } from '@/types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/itinerary';

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type Step = 'input' | 'loading' | 'review' | 'error';

interface ImportedPlace extends Place {
  isDuplicate: boolean;
}

export default function ImportPlacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { places, addPlaces } = usePlaces();

  const [step, setStep] = useState<Step>('input');
  const [url, setUrl] = useState('');
  const [listName, setListName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState<ImportedPlace[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + 24;

  const existingNames = new Set(places.map(p => p.name.toLowerCase()));

  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setUrl(text.trim());
    } catch { /* clipboard unavailable */ }
  }, []);

  const handleImport = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${BASE_URL}/import/google-maps-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.');
        setStep('error');
        return;
      }

      const imported: Place[] = data.places ?? [];

      if (imported.length === 0) {
        setErrorMsg(
          'No NYC places found in that list. Make sure the list is set to \u201cAnyone with the link\u201d in Google Maps, then try again.'
        );
        setStep('error');
        return;
      }

      const annotated: ImportedPlace[] = imported.map(p => ({
        ...p,
        isDuplicate: existingNames.has(p.name.toLowerCase()),
      }));

      // Pre-select all non-duplicates
      const initialSelected = new Set(
        annotated.filter(p => !p.isDuplicate).map(p => p.id)
      );

      setListName(data.listName ?? 'Google Maps List');
      setResults(annotated);
      setSelected(initialSelected);
      setStep('review');
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Network error — check your connection and try again.');
      setStep('error');
    }
  }, [url, existingNames]);

  const toggleSelect = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const toAdd = results.filter(p => selected.has(p.id));
    if (toAdd.length === 0) {
      router.back();
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPlaces(toAdd);
    router.back();
  }, [results, selected, addPlaces]);

  const newCount = results.filter(p => selected.has(p.id)).length;
  const dupCount = results.filter(p => p.isDuplicate).length;

  // ── Header ───────────────────────────────────────────────────────────────────
  const renderHeader = (title: string) => (
    <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
        <Ionicons name="close" size={22} color={colors.foreground} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
        {title}
      </Text>
      <View style={styles.headerBtn} />
    </View>
  );

  // ── Step: input ──────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {renderHeader('Import from Google Maps')}

        <ScrollView
          contentContainerStyle={[styles.inputContent, { paddingBottom: botPad }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instruction card */}
          <View style={[styles.instructCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.instructTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              How to share a list
            </Text>
            {[
              'Open Google Maps and go to Saved',
              'Tap the list you want to import',
              'Tap ··· → Share list → Copy link',
              'Paste the link below',
            ].map((step, i) => (
              <View key={i} style={styles.instructRow}>
                <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.stepNumText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[styles.instructText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {step}
                </Text>
              </View>
            ))}
            <View style={[styles.instructNote, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.instructNoteText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {`List must be set to \u201cAnyone with the link\u201d`}
              </Text>
            </View>
          </View>

          {/* URL input */}
          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              GOOGLE MAPS LINK
            </Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                placeholder="https://maps.app.goo.gl/..."
                placeholderTextColor={colors.mutedForeground + '80'}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="go"
                onSubmitEditing={handleImport}
              />
              <TouchableOpacity onPress={handlePaste} style={styles.pasteBtn} activeOpacity={0.7}>
                <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleImport}
            disabled={!url.trim()}
            style={[
              styles.primaryBtn,
              { backgroundColor: url.trim() ? colors.primary : colors.muted },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={18} color={url.trim() ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[
              styles.primaryBtnText,
              { color: url.trim() ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_600SemiBold' },
            ]}>
              Scan List
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Step: loading ────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {renderHeader('Import from Google Maps')}
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Scanning list…
          </Text>
        </View>
      </View>
    );
  }

  // ── Step: error ──────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {renderHeader('Import from Google Maps')}
        <View style={styles.center}>
          <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            Couldn't read this list
          </Text>
          <Text style={[styles.errorBody, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {errorMsg}
          </Text>
          <TouchableOpacity
            onPress={() => setStep('input')}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
              Try another link
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Step: review ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {renderHeader(listName)}

      {/* Summary badge */}
      <View style={[styles.summaryBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.badge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.badgeText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
            {results.filter(p => !p.isDuplicate).length} new
          </Text>
        </View>
        {dupCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.badgeText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {dupCount} already saved
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => {
            if (selected.size === results.length) {
              setSelected(new Set());
            } else {
              setSelected(new Set(results.map(p => p.id)));
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectAllText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
            {selected.size === results.length ? 'Deselect all' : 'Select all'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={p => p.id}
        contentContainerStyle={[styles.resultList, { paddingBottom: botPad + 80 }]}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.id);
          const icon = CATEGORY_ICONS[item.category as PlaceCategory] ?? 'location';
          return (
            <TouchableOpacity
              onPress={() => toggleSelect(item.id)}
              activeOpacity={0.75}
              style={[
                styles.resultRow,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? colors.primary + '50' : colors.border,
                  opacity: item.isDuplicate && !isSelected ? 0.55 : 1,
                },
              ]}
            >
              {/* Checkbox */}
              <View style={[
                styles.checkbox,
                {
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}>
                {isSelected && <Ionicons name="checkmark" size={13} color={colors.primaryForeground} />}
              </View>

              {/* Icon */}
              <View style={[styles.resultIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name={icon as any} size={16} color={colors.primary} />
              </View>

              {/* Info */}
              <View style={styles.resultInfo}>
                <Text style={[styles.resultName, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.resultMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                  {item.neighborhood} · {CATEGORY_LABELS[item.category as PlaceCategory] ?? item.category}
                  {item.address ? ` · ${item.address}` : ''}
                </Text>
              </View>

              {/* Duplicate badge */}
              {item.isDuplicate && (
                <View style={[styles.dupBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.dupText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    saved
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Sticky confirm bar */}
      <View style={[
        styles.confirmBar,
        { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: botPad },
      ]}>
        <TouchableOpacity
          onPress={handleConfirm}
          style={[styles.primaryBtn, { backgroundColor: colors.primary, flex: 1 }]}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.primaryForeground} />
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
            {newCount > 0 ? `Add ${newCount} place${newCount === 1 ? '' : 's'}` : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerBtn: { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, textAlign: 'center', marginHorizontal: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  inputContent: { padding: 16, gap: 16 },

  instructCard: {
    borderRadius: 16, borderWidth: 1, padding: 18, gap: 12,
  },
  instructTitle: { fontSize: 15, marginBottom: 2 },
  instructRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 11 },
  instructText: { fontSize: 13, flex: 1, lineHeight: 18 },
  instructNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, marginTop: 4,
  },
  instructNoteText: { fontSize: 12, flex: 1, lineHeight: 16 },

  inputCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  inputLabel: { fontSize: 11, letterSpacing: 1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
  },
  textInput: { flex: 1, fontSize: 14, paddingVertical: 12 },
  pasteBtn: { paddingLeft: 10, paddingVertical: 12 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
  },
  primaryBtnText: { fontSize: 15 },

  loadingText: { fontSize: 15, marginTop: 8 },

  errorIcon: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 18, textAlign: 'center' },
  errorBody: { fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 300 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, marginTop: 4 },

  summaryBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1,
  },
  badgeText: { fontSize: 12 },
  selectAllText: { fontSize: 13, marginLeft: 'auto' },

  resultList: { padding: 12, gap: 8 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 12, gap: 10,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  resultIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1, gap: 3 },
  resultName: { fontSize: 14 },
  resultMeta: { fontSize: 12 },
  dupBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  dupText: { fontSize: 11 },

  confirmBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12,
  },
});
