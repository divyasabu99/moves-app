import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { StopCard } from '@/components/StopCard';
import { useMoves } from '@/context/MovesContext';

export default function MoveDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { moves, updateMoveStatus, removeMove } = useMoves();

  const move = moves.find(m => m.id === id);
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  if (!move) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Move not found
          </Text>
        </View>
      </View>
    );
  }

  const dateLabel = new Date(move.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const totalDurationMins = move.stops.reduce((sum, s) => sum + s.estimatedDurationMinutes, 0);
  const hrs = Math.floor(totalDurationMins / 60);
  const mins = totalDurationMins % 60;
  const durationLabel = hrs > 0 ? `${hrs}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
  const totalCostAll = move.totalEstimatedCostPerPerson * move.partySize;
  const isDone = move.status === 'done';

  const handleToggleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateMoveStatus(move.id, isDone ? 'saved' : 'done');
  };

  const handleDelete = () => {
    removeMove(move.id);
    router.back();
  };

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
        <Text style={[styles.vibeLabel, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
          {move.vibe.toUpperCase()}
        </Text>
        <TouchableOpacity onPress={handleDelete} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            {move.title}
          </Text>
          <View style={styles.heroMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {dateLabel}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {move.startTime} · {durationLabel} total
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {move.partySize} {move.partySize === 1 ? 'person' : 'people'}
              </Text>
            </View>
            {move.neighborhood !== 'Any' && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {move.neighborhood}
                </Text>
              </View>
            )}
          </View>

          {/* Cost summary card */}
          <View style={[styles.costCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.costItem}>
              <Text style={[styles.costLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Per person
              </Text>
              <Text style={[styles.costValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                ~${move.totalEstimatedCostPerPerson}
              </Text>
            </View>
            <View style={[styles.costDivider, { backgroundColor: colors.border }]} />
            <View style={styles.costItem}>
              <Text style={[styles.costLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Total
              </Text>
              <Text style={[styles.costValue, { color: colors.accent, fontFamily: 'Inter_700Bold' }]}>
                ~${totalCostAll}
              </Text>
            </View>
            <View style={[styles.costDivider, { backgroundColor: colors.border }]} />
            <View style={styles.costItem}>
              <Text style={[styles.costLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Stops
              </Text>
              <Text style={[styles.costValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                {move.stops.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Itinerary */}
        <View style={styles.itinerarySection}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            ITINERARY
          </Text>
          {move.stops.map((stop, i) => (
            <StopCard
              key={stop.placeId + i}
              stop={stop}
              index={i}
              isLast={i === move.stops.length - 1}
            />
          ))}
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={handleToggleDone}
          activeOpacity={0.8}
          style={[styles.doneBtn, {
            backgroundColor: isDone ? colors.muted : colors.primary,
            borderColor: isDone ? colors.border : colors.primary,
          }]}
        >
          <Ionicons
            name={isDone ? 'refresh-outline' : 'checkmark-circle-outline'}
            size={18}
            color={isDone ? colors.mutedForeground : colors.primaryForeground}
          />
          <Text style={[styles.doneBtnText, {
            color: isDone ? colors.mutedForeground : colors.primaryForeground,
            fontFamily: 'Inter_600SemiBold',
          }]}>
            {isDone ? 'Mark as Upcoming' : 'Mark as Done'}
          </Text>
        </TouchableOpacity>
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
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  vibeLabel: { fontSize: 12, letterSpacing: 1.5 },
  scroll: { padding: 20, gap: 0 },
  hero: { gap: 16, marginBottom: 28 },
  heroTitle: { fontSize: 30, lineHeight: 36 },
  heroMeta: { gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14 },
  costCard: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1,
    padding: 18, alignItems: 'center',
  },
  costItem: { flex: 1, alignItems: 'center', gap: 4 },
  costLabel: { fontSize: 11, letterSpacing: 0.5 },
  costValue: { fontSize: 22 },
  costDivider: { width: 1, height: 36, marginHorizontal: 8 },
  itinerarySection: { gap: 10, marginBottom: 24 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5 },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14, borderWidth: 1,
  },
  doneBtnText: { fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16 },
});
