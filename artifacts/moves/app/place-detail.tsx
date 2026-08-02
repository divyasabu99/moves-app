import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
  ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { usePlaces } from '@/context/PlacesContext';
import { CATEGORY_LABELS, CATEGORY_ICONS, SOURCE_LABELS } from '@/lib/itinerary';
import { PlaceCategory, BudgetLevel } from '@/types';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
const BUDGET_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
const BUDGET_FULL: Record<number, string> = {
  1: 'Budget-friendly', 2: 'Moderately priced', 3: 'Upscale', 4: 'Fine dining',
};
const CATEGORIES: PlaceCategory[] = ['restaurant', 'bar', 'cafe', 'museum', 'activity', 'park', 'shop'];
const PRICE_LEVELS: BudgetLevel[] = [1, 2, 3, 4];

// ── Star rating ───────────────────────────────────────────────────────────────
function StarRating({
  value, onChange, readonly, colors,
}: {
  value?: number; onChange?: (v: number) => void; readonly?: boolean; colors: any;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={starStyles.row}>
      {stars.map(s => {
        const filled = value !== undefined && s <= Math.round(value);
        return (
          <TouchableOpacity
            key={s}
            onPress={() => {
              if (readonly || !onChange) return;
              Haptics.selectionAsync();
              // Tap same star again → clear rating
              onChange(value !== undefined && Math.round(value) === s ? 0 : s);
            }}
            activeOpacity={readonly ? 1 : 0.65}
            disabled={readonly}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={readonly ? 16 : 28}
              color={filled ? '#F59E0B' : colors.border}
            />
          </TouchableOpacity>
        );
      })}
      {value !== undefined && value > 0 && (
        <Text style={[starStyles.label, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          {value % 1 === 0 ? value.toFixed(1) : value.toFixed(1)}
        </Text>
      )}
    </View>
  );
}
const starStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 13, marginLeft: 4 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PlaceDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { places, removePlace, updatePlace, loading } = usePlaces();

  const place = places.find(p => p.id === id);
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  // ── Enrichment (auto-fetch vibe/address/cuisine/tags) ────────────────────
  const [enriching, setEnriching] = useState(false);
  const [localVibe, setLocalVibe] = useState<string | undefined>(undefined);
  const [localAddress, setLocalAddress] = useState<string | undefined>(undefined);
  const [localCuisine, setLocalCuisine] = useState<string | undefined>(undefined);
  const [localTags, setLocalTags] = useState<string[] | undefined>(undefined);
  const [localWebsite, setLocalWebsite] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!place || loading) return;
    const needsEnrich = !place.vibeDescription || !place.address || !place.cuisine || !place.tags?.length || !place.website;
    if (!needsEnrich) return;
    setEnriching(true);
    fetch(`${BASE_URL()}/lookup-place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: place.name }),
    })
      .then(r => r.json())
      .then(data => {
        const patch: Record<string, any> = {};
        if (!place.vibeDescription && data.vibeDescription) { patch.vibeDescription = data.vibeDescription; setLocalVibe(data.vibeDescription); }
        if (!place.address && data.address) { patch.address = data.address; setLocalAddress(data.address); }
        if (!place.cuisine && data.cuisine) { patch.cuisine = data.cuisine; setLocalCuisine(data.cuisine); }
        if ((!place.tags || !place.tags.length) && data.tags?.length) { patch.tags = data.tags; setLocalTags(data.tags); }
        if (!place.website && data.website) { patch.website = data.website; setLocalWebsite(data.website); }
        if (Object.keys(patch).length > 0) updatePlace(place.id, patch);
      })
      .catch(() => {})
      .finally(() => setEnriching(false));
  }, [place?.id, loading]);

  // ── Edit mode state ───────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftNeighborhood, setDraftNeighborhood] = useState('');
  const [draftCategory, setDraftCategory] = useState<PlaceCategory>('restaurant');
  const [draftPriceLevel, setDraftPriceLevel] = useState<BudgetLevel>(2);
  const [draftRating, setDraftRating] = useState<number | undefined>(undefined);
  const [draftNotes, setDraftNotes] = useState('');
  const [draftCuisine, setDraftCuisine] = useState('');
  const [draftTags, setDraftTags] = useState(''); // comma-separated
  const [draftWebsite, setDraftWebsite] = useState('');

  const FOOD_CATEGORIES: PlaceCategory[] = ['restaurant', 'bar', 'cafe'];

  const enterEdit = useCallback(() => {
    if (!place) return;
    setDraftName(place.name);
    setDraftNeighborhood(place.neighborhood);
    setDraftCategory(place.category);
    setDraftPriceLevel(place.priceLevel);
    setDraftRating(place.rating);
    setDraftNotes(place.notes ?? '');
    setDraftCuisine(place.cuisine ?? '');
    setDraftTags((place.tags ?? []).join(', '));
    setDraftWebsite(place.website ?? '');
    setEditing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [place]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const saveEdit = useCallback(() => {
    if (!place) return;
    const parsedTags = draftTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    const patch: Record<string, unknown> = {
      name: draftName.trim() || place.name,
      neighborhood: draftNeighborhood.trim() || place.neighborhood,
      category: draftCategory,
      priceLevel: draftPriceLevel,
      notes: draftNotes.trim() || undefined,
      cuisine: draftCuisine.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      website: draftWebsite.trim() || undefined,
    };
    if (draftRating !== undefined && draftRating > 0) {
      patch.rating = draftRating;
    } else if (draftRating === 0) {
      // User explicitly cleared the rating — remove it
      patch.rating = undefined;
    }
    updatePlace(place.id, patch as any);
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [place, draftName, draftNeighborhood, draftCategory, draftPriceLevel, draftRating, draftNotes, draftCuisine, draftTags]);

  const handleDelete = useCallback(() => {
    if (!place) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remove place',
      `Remove "${place.name}" from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => { removePlace(place.id); router.back(); } },
      ]
    );
  }, [place]);

  const vibeDescription = place?.vibeDescription ?? localVibe;
  const address = place?.address ?? localAddress;
  const cuisine = place?.cuisine ?? localCuisine;
  const tags = place?.tags ?? localTags;
  const website = place?.website ?? localWebsite;
  const iconName = place ? (CATEGORY_ICONS[place.category] ?? 'location') : 'location';
  const FOOD_CATS: PlaceCategory[] = ['restaurant', 'bar', 'cafe'];

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <HeaderBar topPad={topPad} onBack={() => router.back()} colors={colors} />
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <HeaderBar topPad={topPad} onBack={() => router.back()} colors={colors} />
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Place not found</Text>
        </View>
      </View>
    );
  }

  // ── Edit mode render ──────────────────────────────────────────────────────
  if (editing) {
    return (
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Edit header */}
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={cancelEdit} style={styles.headerBtn} activeOpacity={0.7}>
            <Text style={[styles.headerAction, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Edit Place</Text>
          <TouchableOpacity onPress={saveEdit} style={styles.headerBtn} activeOpacity={0.7}>
            <Text style={[styles.headerAction, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <EditSection label="NAME" colors={colors}>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: 'Inter_400Regular' }]}
              placeholderTextColor={colors.mutedForeground}
              placeholder="Place name"
              returnKeyType="done"
            />
          </EditSection>

          {/* Neighborhood */}
          <EditSection label="NEIGHBORHOOD" colors={colors}>
            <TextInput
              value={draftNeighborhood}
              onChangeText={setDraftNeighborhood}
              style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: 'Inter_400Regular' }]}
              placeholderTextColor={colors.mutedForeground}
              placeholder="e.g. West Village"
              returnKeyType="done"
            />
          </EditSection>

          {/* Category */}
          <EditSection label="CATEGORY" colors={colors}>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(cat => {
                const active = draftCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => { Haptics.selectionAsync(); setDraftCategory(cat); }}
                    activeOpacity={0.75}
                    style={[styles.chip, {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    }]}
                  >
                    <Ionicons
                      name={(CATEGORY_ICONS[cat] ?? 'location') as any}
                      size={13}
                      color={active ? colors.primaryForeground : colors.mutedForeground}
                    />
                    <Text style={[styles.chipText, {
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontFamily: active ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    }]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </EditSection>

          {/* Price level */}
          <EditSection label="PRICE" colors={colors}>
            <View style={styles.priceRow}>
              {PRICE_LEVELS.map(level => {
                const active = draftPriceLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => { Haptics.selectionAsync(); setDraftPriceLevel(level); }}
                    activeOpacity={0.75}
                    style={[styles.priceChip, {
                      flex: 1,
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    }]}
                  >
                    <Text style={[styles.priceChipLabel, {
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontFamily: active ? 'Inter_700Bold' : 'Inter_400Regular',
                    }]}>
                      {BUDGET_LABELS[level]}
                    </Text>
                    <Text style={[styles.priceChipSub, {
                      color: active ? colors.primaryForeground + 'CC' : colors.mutedForeground,
                      fontFamily: 'Inter_400Regular',
                    }]}>
                      {BUDGET_FULL[level]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </EditSection>

          {/* Cuisine — food/drink venues only */}
          {FOOD_CATEGORIES.includes(draftCategory) && (
            <EditSection label="CUISINE" colors={colors}>
              <TextInput
                value={draftCuisine}
                onChangeText={setDraftCuisine}
                style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: 'Inter_400Regular' }]}
                placeholderTextColor={colors.mutedForeground}
                placeholder="e.g. Italian, Ramen, Cocktail Bar"
                returnKeyType="done"
              />
            </EditSection>
          )}

          {/* Tags */}
          <EditSection label="TAGS" colors={colors}>
            <TextInput
              value={draftTags}
              onChangeText={setDraftTags}
              style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: 'Inter_400Regular' }]}
              placeholderTextColor={colors.mutedForeground}
              placeholder="e.g. rooftop, outdoor, late night, live music"
              returnKeyType="done"
            />
            <Text style={[styles.tagsHint, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Comma-separated · used in search
            </Text>
          </EditSection>

          {/* Your rating */}
          <EditSection label="YOUR RATING" colors={colors}>
            <View style={[styles.ratingBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <StarRating
                value={draftRating && draftRating > 0 ? draftRating : undefined}
                onChange={setDraftRating}
                colors={colors}
              />
              {(!draftRating || draftRating === 0) && (
                <Text style={[styles.ratingHint, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  Tap a star to rate · tap again to clear
                </Text>
              )}
            </View>
          </EditSection>

          {/* Website */}
          <EditSection label="WEBSITE" colors={colors}>
            <TextInput
              value={draftWebsite}
              onChangeText={setDraftWebsite}
              style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: 'Inter_400Regular' }]}
              placeholderTextColor={colors.mutedForeground}
              placeholder="https://..."
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
            />
          </EditSection>

          {/* Notes */}
          <EditSection label="NOTES" colors={colors}>
            <TextInput
              value={draftNotes}
              onChangeText={setDraftNotes}
              style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card, fontFamily: 'Inter_400Regular' }]}
              placeholderTextColor={colors.mutedForeground}
              placeholder="Add your thoughts, tips, or reminders about this place…"
              multiline
              textAlignVertical="top"
            />
          </EditSection>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Read mode render ──────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
          {place.name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={enterEdit} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={19} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={19} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: botPad }]} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name={iconName as any} size={36} color={colors.primary} />
          </View>
          <Text style={[styles.placeName, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            {place.name}
          </Text>

          {vibeDescription ? (
            <Text style={[styles.vibeDescription, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {vibeDescription}
            </Text>
          ) : enriching ? (
            <View style={styles.enrichingRow}>
              <ActivityIndicator size="small" color={colors.mutedForeground} style={{ transform: [{ scale: 0.7 }] }} />
              <Text style={[styles.enrichingText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Getting vibe…
              </Text>
            </View>
          ) : null}

          {/* Rating */}
          {place.rating !== undefined && place.rating > 0 && (
            <StarRating value={place.rating} readonly colors={colors} />
          )}

          {/* Vibe tags */}
          {place.vibes && place.vibes.length > 0 && (
            <View style={styles.vibeRow}>
              {place.vibes.map(v => (
                <View key={v} style={[styles.vibeTag, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' }]}>
                  <Text style={[styles.vibeTagText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>{v}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Place tags */}
          {tags && tags.length > 0 && (
            <View style={styles.vibeRow}>
              {tags.map(t => (
                <View key={t} style={[styles.vibeTag, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Ionicons name="pricetag-outline" size={10} color={colors.mutedForeground} style={{ marginRight: 2 }} />
                  <Text style={[styles.vibeTagText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Details */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row icon="location-outline" label="Neighborhood" value={place.neighborhood} colors={colors} />
          <Divider colors={colors} />
          <Row icon={iconName as any} label="Category" value={CATEGORY_LABELS[place.category]} colors={colors} />
          {FOOD_CATS.includes(place.category) && (
            <>
              <Divider colors={colors} />
              {cuisine ? (
                <Row icon="restaurant-outline" label="Cuisine" value={cuisine} colors={colors} />
              ) : enriching ? (
                <View style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
                    <Ionicons name="restaurant-outline" size={15} color={colors.primary} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Cuisine</Text>
                    <View style={styles.enrichingRow}>
                      <ActivityIndicator size="small" color={colors.mutedForeground} style={{ transform: [{ scale: 0.65 }] }} />
                      <Text style={[styles.enrichingText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Looking up…</Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </>
          )}
          <Divider colors={colors} />
          <Row
            icon="cash-outline"
            label="Price"
            value={`${BUDGET_LABELS[place.priceLevel]} · ${BUDGET_FULL[place.priceLevel]}`}
            colors={colors}
          />
          <Divider colors={colors} />
          {address ? (
            <Row icon="map-outline" label="Address" value={address} colors={colors} />
          ) : enriching ? (
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name="map-outline" size={15} color={colors.primary} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Address</Text>
                <View style={styles.enrichingRow}>
                  <ActivityIndicator size="small" color={colors.mutedForeground} style={{ transform: [{ scale: 0.65 }] }} />
                  <Text style={[styles.enrichingText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    Looking up…
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Row icon="map-outline" label="Address" value="Not available" colors={colors} muted />
          )}
          {website ? (
            <>
              <Divider colors={colors} />
              <LinkRow icon="globe-outline" label="Website" value={website} colors={colors} />
            </>
          ) : null}
          <Divider colors={colors} />
          <Row icon="bookmark-outline" label="Added from" value={SOURCE_LABELS[place.source] ?? 'Manually added'} colors={colors} />
        </View>

        {/* Notes */}
        {place.notes ? (
          <View style={styles.notesContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>NOTES</Text>
            </View>
            <View style={[styles.notesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.notesText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>{place.notes}</Text>
            </View>
          </View>
        ) : (
          /* Empty notes nudge */
          <TouchableOpacity
            onPress={enterEdit}
            activeOpacity={0.7}
            style={[styles.addNotesBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Ionicons name="create-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.addNotesText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Add notes or your own rating…
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function HeaderBar({ topPad, onBack, colors }: { topPad: number; onBack: () => void; colors: any }) {
  return (
    <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function Row({ icon, label, value, colors, muted }: { icon: string; label: string; value: string; colors: any; muted?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon as any} size={15} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: muted ? colors.mutedForeground : colors.foreground, fontFamily: 'Inter_400Regular' }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function LinkRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  const display = value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const handlePress = () => {
    const url = value.startsWith('http') ? value : `https://${value}`;
    Linking.openURL(url).catch(() => {});
    Haptics.selectionAsync();
  };
  return (
    <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon as any} size={15} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: colors.primary, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
          {display}
        </Text>
      </View>
      <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function EditSection({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.editSectionWrap}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerBtn: { minWidth: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, textAlign: 'center', marginHorizontal: 8 },
  headerAction: { fontSize: 15 },
  headerActions: { flexDirection: 'row', gap: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },

  // Hero
  hero: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
  heroIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  placeName: { fontSize: 24, textAlign: 'center' },
  vibeDescription: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 20, marginTop: -4 },
  enrichingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  enrichingText: { fontSize: 12 },
  vibeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 2 },
  vibeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  vibeTagText: { fontSize: 12 },

  // Details
  section: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 11, letterSpacing: 0.5 },
  rowValue: { fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 58 },

  // Notes
  notesContainer: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5 },
  notesBox: { borderRadius: 16, borderWidth: 1, padding: 16 },
  notesText: { fontSize: 14, lineHeight: 22 },
  addNotesBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1, borderStyle: 'dashed',
    padding: 16,
  },
  addNotesText: { fontSize: 14 },

  // Edit mode
  editSectionWrap: { gap: 8 },
  editInput: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 100, borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  priceRow: { flexDirection: 'row', gap: 8 },
  priceChip: {
    alignItems: 'center', borderRadius: 12, borderWidth: 1,
    paddingVertical: 10, paddingHorizontal: 6, gap: 2,
  },
  priceChipLabel: { fontSize: 15 },
  priceChipSub: { fontSize: 9, textAlign: 'center' },
  ratingBox: {
    borderRadius: 14, borderWidth: 1,
    padding: 16, gap: 8, alignItems: 'flex-start',
  },
  ratingHint: { fontSize: 12, marginTop: 2 },
  tagsHint: { fontSize: 11, marginTop: -4 },
  notesInput: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, lineHeight: 22, minHeight: 110,
  },
});
