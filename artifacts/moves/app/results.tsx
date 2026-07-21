import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { StopCard } from '@/components/StopCard';
import { usePlaces } from '@/context/PlacesContext';
import { useMoves } from '@/context/MovesContext';
import { generateItineraries } from '@/lib/itinerary';
import { PlanInput, GeneratedItinerary } from '@/types';

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plan: planParam } = useLocalSearchParams<{ plan: string }>();
  const { places } = usePlaces();
  const { saveMove } = useMoves();
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());

  const { plan, itineraries } = useMemo(() => {
    if (!planParam) return { plan: null, itineraries: [] as GeneratedItinerary[] };
    try {
      const parsed = JSON.parse(planParam) as PlanInput;
      return { plan: parsed, itineraries: generateItineraries(places, parsed) };
    } catch {
      return { plan: null, itineraries: [] as GeneratedItinerary[] };
    }
  }, [planParam, places]);

  const handleSave = (itinerary: GeneratedItinerary, index: number) => {
    if (!plan || savedIndices.has(index)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveMove(itinerary, plan);
    setSavedIndices(prev => new Set(prev).add(index));
  };

  const dateLabel = plan
    ? new Date(plan.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : '';

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: topPad,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            Your Moves
          </Text>
          {plan && (
            <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {plan.vibe} · {dateLabel}
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {itineraries.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={44} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            No matches found
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Add more places to your collection so we can build a move.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/add-place')}
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={colors.primaryForeground} />
            <Text style={[styles.emptyBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
              Add Places
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Plan summary */}
          {plan && (
            <View style={styles.planMeta}>
              <View style={styles.planMetaItem}>
                <Ionicons name="people-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.planMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {plan.partySize} {plan.partySize === 1 ? 'person' : 'people'}
                </Text>
              </View>
              <View style={styles.planMetaItem}>
                <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.planMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {plan.startTime}
                </Text>
              </View>
              {plan.neighborhood !== 'Any' && (
                <View style={styles.planMetaItem}>
                  <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.planMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {plan.neighborhood}
                  </Text>
                </View>
              )}
            </View>
          )}

          {itineraries.map((itinerary, idx) => (
            <View
              key={idx}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.optionBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.optionNum, { color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }]}>
                      {idx + 1}
                    </Text>
                  </View>
                  <View style={styles.cardTitleInfo}>
                    <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                      {itinerary.title}
                    </Text>
                    <Text style={[styles.cardDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {itinerary.description}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.totalCost, { color: colors.accent, fontFamily: 'Inter_700Bold' }]}>
                  ~${itinerary.totalEstimatedCostPerPerson}
                  <Text style={[styles.costSub, { color: colors.mutedForeground }]}>/pp</Text>
                </Text>
              </View>

              <View style={styles.stops}>
                {itinerary.stops.map((stop, i) => (
                  <StopCard
                    key={stop.placeId + i}
                    stop={stop}
                    index={i}
                    isLast={i === itinerary.stops.length - 1}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={() => handleSave(itinerary, idx)}
                disabled={savedIndices.has(idx)}
                activeOpacity={0.8}
                style={[styles.saveBtn, {
                  backgroundColor: savedIndices.has(idx) ? colors.muted : colors.primary,
                }]}
              >
                <Ionicons
                  name={savedIndices.has(idx) ? 'checkmark-circle' : 'bookmark-outline'}
                  size={16}
                  color={savedIndices.has(idx) ? colors.mutedForeground : colors.primaryForeground}
                />
                <Text style={[styles.saveBtnText, {
                  color: savedIndices.has(idx) ? colors.mutedForeground : colors.primaryForeground,
                  fontFamily: 'Inter_600SemiBold',
                }]}>
                  {savedIndices.has(idx) ? 'Saved to My Moves' : 'Save This Move'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, gap: 8,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 18 },
  headerSub: { fontSize: 12, textAlign: 'center' },
  scroll: { padding: 16, gap: 16 },
  planMeta: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginBottom: 4 },
  planMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planMetaText: { fontSize: 13 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14 },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 8,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  optionBadge: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  optionNum: { fontSize: 14 },
  cardTitleInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 18, lineHeight: 22 },
  cardDesc: { fontSize: 12 },
  totalCost: { fontSize: 16 },
  costSub: { fontSize: 13 },
  stops: { gap: 0 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
  },
  saveBtnText: { fontSize: 14 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12,
  },
  emptyTitle: { fontSize: 20, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  emptyBtnText: { fontSize: 14 },
});
