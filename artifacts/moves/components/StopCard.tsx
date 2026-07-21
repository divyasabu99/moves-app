import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Stop } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/itinerary';

const BUDGET_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

interface StopCardProps {
  stop: Stop;
  index: number;
  isLast?: boolean;
}

export function StopCard({ stop, index, isLast }: StopCardProps) {
  const colors = useColors();
  const iconName = CATEGORY_ICONS[stop.place.category] ?? 'location';
  const hours = Math.floor(stop.estimatedDurationMinutes / 60);
  const mins = stop.estimatedDurationMinutes % 60;
  const durationLabel = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <View style={[styles.indexBubble, { backgroundColor: colors.primary }]}>
          <Text style={[styles.indexText, { color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }]}>
            {index + 1}
          </Text>
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
      </View>
      <View style={[styles.card, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
            <Ionicons name={iconName as any} size={16} color={colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text
              style={[styles.placeName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}
              numberOfLines={1}
            >
              {stop.place.name}
            </Text>
            <Text style={[styles.placeCategory, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {stop.place.neighborhood} · {CATEGORY_LABELS[stop.place.category]}
            </Text>
          </View>
          <Text style={[styles.budget, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
            {BUDGET_LABELS[stop.place.priceLevel]}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {durationLabel}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="card-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              ~${stop.estimatedCostPerPerson}/pp
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  leftCol: {
    alignItems: 'center',
    width: 28,
    paddingTop: 2,
  },
  indexBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 13,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
    minHeight: 12,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  placeName: {
    fontSize: 14,
  },
  placeCategory: {
    fontSize: 11,
  },
  budget: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
});
