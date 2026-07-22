import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Stop, TransitMode } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/itinerary';

const BUDGET_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

const TRANSIT_META: Record<TransitMode, { icon: string; label: string; colorKey: 'walk' | 'subway' | 'rideshare' }> = {
  walk:      { icon: 'walk-outline',  label: 'walk',     colorKey: 'walk' },
  subway:    { icon: 'train-outline', label: 'subway',   colorKey: 'subway' },
  rideshare: { icon: 'car-outline',   label: 'rideshare', colorKey: 'rideshare' },
};

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

  const transit = !isLast ? stop.transitToNext : undefined;
  const transitMeta = transit ? TRANSIT_META[transit.mode] : null;
  const isSuggested = stop.place.source === 'ai_suggested';

  // Per-mode accent colours — subtle, informational
  const TRANSIT_COLORS: Record<'walk' | 'subway' | 'rideshare', string> = {
    walk:      '#4CAF82', // muted green
    subway:    '#5B9CF6', // muted blue
    rideshare: '#FF8C42', // accent orange (from brand)
  };

  const transitColor = transitMeta ? TRANSIT_COLORS[transitMeta.colorKey] : colors.mutedForeground;

  return (
    <View style={styles.wrapper}>
      {/* ── Stop row ── */}
      <View style={styles.container}>
        {/* Left column: bubble + line */}
        <View style={styles.leftCol}>
          <View style={[styles.indexBubble, { backgroundColor: colors.primary }]}>
            <Text style={[styles.indexText, { color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }]}>
              {index + 1}
            </Text>
          </View>
          {/* Line runs down through transit connector */}
          {!isLast && <View style={[styles.line, { backgroundColor: colors.border }]} />}
        </View>

        {/* Stop card */}
        <View style={[
          styles.card,
          {
            backgroundColor: isSuggested ? colors.primary + '14' : colors.secondary,
            borderColor: isSuggested ? colors.primary + '55' : colors.border,
          },
        ]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: isSuggested ? colors.primary + '25' : colors.muted }]}>
              <Ionicons name={iconName as any} size={16} color={colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.placeName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}
                  numberOfLines={1}
                >
                  {stop.place.name}
                </Text>
                {stop.place.source === 'ai_suggested' && (
                  <View style={[styles.newBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
                    <Ionicons name="sparkles" size={9} color={colors.primary} />
                    <Text style={[styles.newBadgeText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>New</Text>
                  </View>
                )}
              </View>
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

      {/* ── Transit connector (between this stop and the next) ── */}
      {transit && transitMeta && (
        <View style={styles.transitRow}>
          {/* Aligns with the left column — 28 px spacer matches bubble width */}
          <View style={styles.transitSpacer} />
          <View style={[styles.transitPill, {
            backgroundColor: colors.background,
            borderColor: transitColor + '44', // 27 % opacity border
          }]}>
            <Ionicons name={transitMeta.icon as any} size={13} color={transitColor} />
            <Text style={[styles.transitText, { color: transitColor, fontFamily: 'Inter_500Medium' }]}>
              {transit.estimatedMinutes} min
            </Text>
            <View style={[styles.transitDot, { backgroundColor: transitColor + '66' }]} />
            <Text style={[styles.transitMode, { color: transitColor, fontFamily: 'Inter_400Regular' }]}>
              {transitMeta.label}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // Each stop + its outgoing transit connector live here
  },
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
    marginBottom: 0,
    minHeight: 16,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 0,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  placeName: {
    fontSize: 14,
    flexShrink: 1,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  newBadgeText: {
    fontSize: 10,
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
  // Transit connector
  transitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: 10,
  },
  transitSpacer: {
    width: 28,   // matches leftCol width so pill aligns under the line
    alignItems: 'center',
  },
  transitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  transitText: {
    fontSize: 12,
  },
  transitDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  transitMode: {
    fontSize: 12,
  },
});
