import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Platform, Modal, ScrollView,
  Animated, Pressable, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { PlaceCard } from '@/components/PlaceCard';
import { PlacesMapView } from '@/components/PlacesMapView';
import { usePlaces } from '@/context/PlacesContext';
import { Place, PlaceCategory, BudgetLevel } from '@/types';
import { CATEGORY_LABELS } from '@/lib/itinerary';

type ViewMode = 'list' | 'map';
type CategoryKey = 'all' | PlaceCategory;
type SortOrder = 'newest' | 'oldest';

const CATEGORY_OPTIONS: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'restaurant', label: 'Restaurants' },
  { key: 'bar', label: 'Bars' },
  { key: 'cafe', label: 'Cafes' },
  { key: 'museum', label: 'Museums' },
  { key: 'activity', label: 'Activities' },
  { key: 'park', label: 'Parks' },
  { key: 'shop', label: 'Shops' },
];

const PRICE_OPTIONS: { level: BudgetLevel; label: string }[] = [
  { level: 1, label: '$' },
  { level: 2, label: '$$' },
  { level: 3, label: '$$$' },
  { level: 4, label: '$$$$' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 1, label: '1★+' },
  { value: 2, label: '2★+' },
  { value: 3, label: '3★+' },
  { value: 4, label: '4★+' },
  { value: 5, label: '5★' },
];

// ── Filter Sheet ──────────────────────────────────────────────────────────────
function FilterSheet({
  visible,
  onClose,
  category,
  setCategory,
  prices,
  setPrices,
  neighborhoods,
  setNeighborhoods,
  sort,
  setSort,
  minRating,
  setMinRating,
  cuisines,
  setCuisines,
  allNeighborhoods,
  allCuisines,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  category: CategoryKey;
  setCategory: (v: CategoryKey) => void;
  prices: BudgetLevel[];
  setPrices: (v: BudgetLevel[]) => void;
  neighborhoods: string[];
  setNeighborhoods: (v: string[]) => void;
  sort: SortOrder;
  setSort: (v: SortOrder) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  cuisines: string[];
  setCuisines: (v: string[]) => void;
  allNeighborhoods: string[];
  allCuisines: string[];
  onClear: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const togglePrice = (level: BudgetLevel) => {
    Haptics.selectionAsync();
    setPrices(prices.includes(level) ? prices.filter(p => p !== level) : [...prices, level]);
  };

  const toggleNeighborhood = (n: string) => {
    Haptics.selectionAsync();
    setNeighborhoods(
      neighborhoods.includes(n) ? neighborhoods.filter(x => x !== n) : [...neighborhoods, n]
    );
  };

  const toggleCuisine = (c: string) => {
    Haptics.selectionAsync();
    setCuisines(cuisines.includes(c) ? cuisines.filter(x => x !== c) : [...cuisines, c]);
  };

  const activeCount =
    (category !== 'all' ? 1 : 0) +
    (prices.length > 0 ? 1 : 0) +
    (neighborhoods.length > 0 ? 1 : 0) +
    (sort !== 'newest' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (cuisines.length > 0 ? 1 : 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom + 20,
          }]}
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              Filter & Sort
            </Text>
            {activeCount > 0 && (
              <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onClear(); }} activeOpacity={0.7}>
                <Text style={[styles.clearBtn, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                  Clear all
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
            {/* Category */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
              CATEGORY
            </Text>
            <View style={styles.chipWrap}>
              {CATEGORY_OPTIONS.map(opt => {
                const active = category === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => { Haptics.selectionAsync(); setCategory(opt.key); }}
                    activeOpacity={0.75}
                    style={[styles.filterChip, {
                      backgroundColor: active ? colors.primary : colors.secondary,
                      borderColor: active ? colors.primary : colors.border,
                    }]}
                  >
                    <Text style={[styles.filterChipText, {
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sort */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
              SORT
            </Text>
            <View style={styles.chipRow}>
              {([
                { key: 'newest', label: 'Newest first' },
                { key: 'oldest', label: 'Oldest first' },
              ] as { key: SortOrder; label: string }[]).map(opt => {
                const active = sort === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => { Haptics.selectionAsync(); setSort(opt.key); }}
                    activeOpacity={0.75}
                    style={[styles.filterChip, {
                      backgroundColor: active ? colors.primary : colors.secondary,
                      borderColor: active ? colors.primary : colors.border,
                    }]}
                  >
                    <Text style={[styles.filterChipText, {
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Price */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
              PRICE
            </Text>
            <View style={styles.chipRow}>
              {PRICE_OPTIONS.map(({ level, label }) => {
                const active = prices.includes(level);
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => togglePrice(level)}
                    activeOpacity={0.75}
                    style={[styles.filterChip, {
                      backgroundColor: active ? colors.primary : colors.secondary,
                      borderColor: active ? colors.primary : colors.border,
                      minWidth: 54,
                    }]}
                  >
                    <Text style={[styles.filterChipText, {
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Rating */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
              MINIMUM RATING
            </Text>
            <View style={styles.chipRow}>
              {RATING_OPTIONS.map(opt => {
                const active = minRating === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => { Haptics.selectionAsync(); setMinRating(opt.value); }}
                    activeOpacity={0.75}
                    style={[styles.filterChip, {
                      backgroundColor: active ? colors.primary : colors.secondary,
                      borderColor: active ? colors.primary : colors.border,
                    }]}
                  >
                    <Text style={[styles.filterChipText, {
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cuisine */}
            {allCuisines.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  CUISINE
                </Text>
                <View style={styles.chipWrap}>
                  {allCuisines.map(c => {
                    const active = cuisines.includes(c);
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => toggleCuisine(c)}
                        activeOpacity={0.75}
                        style={[styles.filterChip, {
                          backgroundColor: active ? colors.primary : colors.secondary,
                          borderColor: active ? colors.primary : colors.border,
                        }]}
                      >
                        <Text style={[styles.filterChipText, {
                          color: active ? colors.primaryForeground : colors.foreground,
                          fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        }]}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Neighborhoods */}
            {allNeighborhoods.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  NEIGHBORHOOD
                </Text>
                <View style={styles.chipWrap}>
                  {allNeighborhoods.map(n => {
                    const active = neighborhoods.includes(n);
                    return (
                      <TouchableOpacity
                        key={n}
                        onPress={() => toggleNeighborhood(n)}
                        activeOpacity={0.75}
                        style={[styles.filterChip, {
                          backgroundColor: active ? colors.primary : colors.secondary,
                          borderColor: active ? colors.primary : colors.border,
                        }]}
                      >
                        <Text style={[styles.filterChipText, {
                          color: active ? colors.primaryForeground : colors.foreground,
                          fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        }]}>
                          {n}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>

          {/* Apply */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            style={[styles.applyBtn, { backgroundColor: colors.primary, marginHorizontal: 20, marginTop: 12 }]}
          >
            <Text style={[styles.applyBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
              {activeCount > 0 ? `Apply (${activeCount} active)` : 'Done'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PlacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { places, removePlace, loading } = usePlaces();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryKey>('all');
  const [prices, setPrices] = useState<BudgetLevel[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOrder>('newest');
  const [minRating, setMinRating] = useState(0);
  const [cuisines, setCuisines] = useState<string[]>([]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 16);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 100);

  const allNeighborhoods = useMemo(
    () => [...new Set(places.map(p => p.neighborhood))].sort(),
    [places]
  );

  const allCuisines = useMemo(
    () => [...new Set(places.map(p => p.cuisine).filter((c): c is string => !!c))].sort(),
    [places]
  );

  const filtered = useMemo(() => {
    let result = places;
    if (category !== 'all') result = result.filter(p => p.category === category);
    if (prices.length > 0) result = result.filter(p => prices.includes(p.priceLevel));
    if (neighborhoods.length > 0) result = result.filter(p => neighborhoods.includes(p.neighborhood));
    if (minRating > 0) result = result.filter(p => p.rating !== undefined && p.rating >= minRating);
    if (cuisines.length > 0) result = result.filter(p => p.cuisine && cuisines.includes(p.cuisine));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        (p.address ?? '').toLowerCase().includes(q) ||
        (p.vibeDescription ?? '').toLowerCase().includes(q) ||
        p.vibes.some(v => v.toLowerCase().includes(q)) ||
        (p.cuisine ?? '').toLowerCase().includes(q) ||
        (p.tags ?? []).some(t => t.toLowerCase().includes(q)) ||
        (p.notes ?? '').toLowerCase().includes(q)
      );
    }
    if (sort === 'oldest') result = [...result].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return result;
  }, [places, category, prices, neighborhoods, sort, minRating, search]);

  const activeFilterCount =
    (category !== 'all' ? 1 : 0) +
    (prices.length > 0 ? 1 : 0) +
    (neighborhoods.length > 0 ? 1 : 0) +
    (sort !== 'newest' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (cuisines.length > 0 ? 1 : 0);

  const clearFilters = useCallback(() => {
    setCategory('all');
    setPrices([]);
    setNeighborhoods([]);
    setSort('newest');
    setMinRating(0);
    setCuisines([]);
  }, []);

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

  const isEmpty = !loading && filtered.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>

        {/* Row 1: Title + action buttons */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              My Places
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {filtered.length !== places.length
                ? `${filtered.length} of ${places.length} places`
                : `${places.length} ${places.length === 1 ? 'place' : 'places'} saved`}
            </Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity
              onPress={() => router.push('/import-places')}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
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

        {/* Row 2: Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: search ? colors.primary + '55' : colors.border }]}>
          <Ionicons name="search-outline" size={16} color={search ? colors.primary : colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, tag, cuisine, address…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
            returnKeyType="search"
            clearButtonMode="never"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Row 3: View toggle + Filter button */}
        <View style={styles.controlRow}>
          {/* List / Map toggle */}
          <View style={[styles.viewToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setViewMode('list'); }}
              activeOpacity={0.75}
              style={[styles.toggleBtn, viewMode === 'list' && { backgroundColor: colors.card }]}
            >
              <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? colors.foreground : colors.mutedForeground} />
              <Text style={[styles.toggleLabel, {
                color: viewMode === 'list' ? colors.foreground : colors.mutedForeground,
                fontFamily: viewMode === 'list' ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }]}>
                List
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setViewMode('map'); }}
              activeOpacity={0.75}
              style={[styles.toggleBtn, viewMode === 'map' && { backgroundColor: colors.card }]}
            >
              <Ionicons name="map-outline" size={16} color={viewMode === 'map' ? colors.foreground : colors.mutedForeground} />
              <Text style={[styles.toggleLabel, {
                color: viewMode === 'map' ? colors.foreground : colors.mutedForeground,
                fontFamily: viewMode === 'map' ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }]}>
                Map
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter button */}
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); setFilterOpen(true); }}
            activeOpacity={0.8}
            style={[styles.filterBtn, {
              backgroundColor: activeFilterCount > 0 ? colors.primary + '18' : colors.card,
              borderColor: activeFilterCount > 0 ? colors.primary + '55' : colors.border,
            }]}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={activeFilterCount > 0 ? colors.primary : colors.foreground}
            />
            <Text style={[styles.filterBtnText, {
              color: activeFilterCount > 0 ? colors.primary : colors.foreground,
              fontFamily: activeFilterCount > 0 ? 'Inter_600SemiBold' : 'Inter_400Regular',
            }]}>
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 4: Category chips (list view only) */}
        {viewMode === 'list' && (
          <FlatList
            data={CATEGORY_OPTIONS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.key}
            contentContainerStyle={styles.categoryRow}
            renderItem={({ item }) => {
              const active = category === item.key;
              return (
                <TouchableOpacity
                  onPress={() => { Haptics.selectionAsync(); setCategory(item.key); }}
                  activeOpacity={0.75}
                  style={[styles.categoryChip, {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={[styles.categoryText, {
                    color: active ? colors.primaryForeground : colors.foreground,
                    fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : viewMode === 'map' ? (
        <PlacesMapView places={filtered} />
      ) : isEmpty ? (
        <View style={styles.emptyState}>
          {activeFilterCount > 0 ? (
            <>
              <Ionicons name="filter-outline" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                No matches
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Try adjusting or clearing your filters.
              </Text>
              <TouchableOpacity
                onPress={clearFilters}
                style={[styles.emptyBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.emptyBtnText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                  Clear filters
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="map-outline" size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                Your list is empty
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Save spots you want to hit, or pull in your existing Google Maps list in seconds.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/import-places')}
                style={[styles.emptyBtnPrimary, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-google" size={16} color={colors.primaryForeground} />
                <Text style={[styles.emptyBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  Import from Google Maps
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/add-place')}
                style={[styles.emptyBtnSecondary, { borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={colors.foreground} />
                <Text style={[styles.emptyBtnText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                  Add a place manually
                </Text>
              </TouchableOpacity>
            </>
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

      {/* ── Filter Sheet ── */}
      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        category={category}
        setCategory={setCategory}
        prices={prices}
        setPrices={setPrices}
        neighborhoods={neighborhoods}
        setNeighborhoods={setNeighborhoods}
        sort={sort}
        setSort={setSort}
        minRating={minRating}
        setMinRating={setMinRating}
        cuisines={cuisines}
        setCuisines={setCuisines}
        allNeighborhoods={allNeighborhoods}
        allCuisines={allCuisines}
        onClear={clearFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 26 },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0, height: 20 },

  // View toggle + filter row
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    flex: 1,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleLabel: { fontSize: 13 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterBtnText: { fontSize: 13 },

  // Category chips
  categoryRow: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 100, borderWidth: 1,
  },
  categoryText: { fontSize: 13 },

  // Content
  list: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 14,
  },
  emptyTitle: { fontSize: 22, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, marginTop: 8, borderWidth: 1,
  },
  emptyBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 14, width: '100%', marginTop: 4,
  },
  emptyBtnSecondary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 24, paddingVertical: 13,
    borderRadius: 14, width: '100%', borderWidth: 1,
  },
  emptyBtnText: { fontSize: 14 },

  // Filter sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18 },
  clearBtn: { fontSize: 14 },
  sheetBody: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 100, borderWidth: 1,
  },
  filterChipText: { fontSize: 13 },
  applyBtn: {
    paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  applyBtnText: { fontSize: 15 },
});
