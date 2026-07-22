import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { PlaceCard } from '@/components/PlaceCard';
import { usePlaces } from '@/context/PlacesContext';
import { Place, PlaceCategory } from '@/types';
import { CATEGORY_LABELS } from '@/lib/itinerary';

type FilterKey = 'all' | PlaceCategory;

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'restaurant', label: 'Restaurants' },
  { key: 'bar', label: 'Bars' },
  { key: 'cafe', label: 'Cafes' },
  { key: 'museum', label: 'Museums' },
  { key: 'activity', label: 'Activities' },
  { key: 'park', label: 'Parks' },
];

export default function PlacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { places, removePlace, loading } = usePlaces();
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = filter === 'all' ? places : places.filter(p => p.category === filter);
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 16);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 100);

  const handleLongPress = (place: Place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      place.name,
      'Remove this place from your collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removePlace(place.id) },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              My Places
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {places.length} {places.length === 1 ? 'place' : 'places'} saved
            </Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              onPress={() => router.push('/import-places')}
              style={[styles.importBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/add-place')}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={FILTER_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                onPress={() => setFilter(item.key)}
                activeOpacity={0.75}
                style={[styles.filterChip, {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                }]}
              >
                <Text style={[styles.filterText, {
                  color: active ? colors.primaryForeground : colors.foreground,
                  fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={44} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            {filter === 'all' ? 'No places yet' : `No ${CATEGORY_LABELS[filter as PlaceCategory] ?? filter}s saved`}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {filter === 'all'
              ? 'Tap + to add your first spot.'
              : 'Try another category or add a new place.'}
          </Text>
          {filter === 'all' && (
            <TouchableOpacity
              onPress={() => router.push('/add-place')}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={colors.primaryForeground} />
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                Add a Place
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              onPress={() => router.push(`/place-detail?id=${item.id}`)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 26 },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  filterRow: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 100, borderWidth: 1,
  },
  filterText: { fontSize: 13 },
  list: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12,
  },
  emptyTitle: { fontSize: 20, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  emptyBtnText: { fontSize: 14 },
});
