import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Place } from '@/types';
import { CATEGORY_LABELS, SOURCE_LABELS, CATEGORY_ICONS } from '@/lib/itinerary';

const BUDGET_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

interface PlaceCardProps {
  place: Place;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function PlaceCard({ place, onPress, onLongPress }: PlaceCardProps) {
  const colors = useColors();
  const iconName = CATEGORY_ICONS[place.category] ?? 'location';

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
        <Ionicons name={iconName as any} size={18} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}
          numberOfLines={1}
        >
          {place.name}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {place.neighborhood}
          </Text>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {CATEGORY_LABELS[place.category]}
          </Text>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <Text style={[styles.budget, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
            {BUDGET_LABELS[place.priceLevel]}
          </Text>
        </View>
      </View>
      <View style={[styles.sourceBadge, { backgroundColor: colors.muted }]}>
        <Text style={[styles.sourceText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {SOURCE_LABELS[place.source]?.split(' ')[0] ?? 'Added'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  budget: {
    fontSize: 12,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 11,
  },
});
