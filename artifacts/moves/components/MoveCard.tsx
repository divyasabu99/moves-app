import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Move } from '@/types';

const BUDGET_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

interface MoveCardProps {
  move: Move;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function MoveCard({ move, onPress, onLongPress }: MoveCardProps) {
  const colors = useColors();
  const dateObj = new Date(move.date + 'T00:00:00');
  const dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const isDone = move.status === 'done';

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={[styles.vibe, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
            {move.vibe.toUpperCase()}
          </Text>
          {isDone && (
            <View style={[styles.doneBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.doneText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                Done
              </Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      </View>

      <Text
        style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}
        numberOfLines={1}
      >
        {move.title}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {dateLabel}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {move.startTime}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {move.partySize}
          </Text>
        </View>
      </View>

      <View style={[styles.stopsRow, { borderTopColor: colors.border }]}>
        <View style={styles.stopsLeft}>
          {move.stops.slice(0, 3).map((stop, i) => (
            <View key={stop.placeId} style={styles.stopItem}>
              <View style={[styles.stopDot, { backgroundColor: i === 0 ? colors.primary : colors.border }]} />
              <Text
                style={[styles.stopName, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                numberOfLines={1}
              >
                {stop.place.name}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.cost, { color: colors.accent, fontFamily: 'Inter_700Bold' }]}>
          ~${move.totalEstimatedCostPerPerson}
          <Text style={[styles.costSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>/pp</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vibe: {
    fontSize: 11,
    letterSpacing: 1,
  },
  doneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doneText: {
    fontSize: 11,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  stopsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  stopsLeft: {
    flex: 1,
    gap: 5,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  stopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stopName: {
    fontSize: 13,
    flex: 1,
  },
  cost: {
    fontSize: 16,
    marginLeft: 10,
  },
  costSub: {
    fontSize: 12,
  },
});
