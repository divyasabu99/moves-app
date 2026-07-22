import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { usePlaces } from '@/context/PlacesContext';
import { CATEGORY_LABELS, CATEGORY_ICONS, SOURCE_LABELS } from '@/lib/itinerary';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
const BUDGET_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
const BUDGET_FULL: Record<number, string> = {
  1: 'Budget-friendly', 2: 'Moderately priced', 3: 'Upscale', 4: 'Fine dining',
};

export default function PlaceDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { places, removePlace, updatePlace, loading } = usePlaces();

  const place = places.find(p => p.id === id);
  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  // Local enrichment state — fills in while the AI lookup runs
  const [enriching, setEnriching] = useState(false);
  const [localVibe, setLocalVibe] = useState<string | undefined>(undefined);
  const [localAddress, setLocalAddress] = useState<string | undefined>(undefined);

  // Auto-fetch vibe description / address for places that don't have them yet
  useEffect(() => {
    if (!place || loading) return;
    const needsEnrich = !place.vibeDescription || !place.address;
    if (!needsEnrich) return;

    setEnriching(true);
    fetch(`${BASE_URL()}/lookup-place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: place.name }),
    })
      .then(r => r.json())
      .then(data => {
        const patch: Partial<typeof place> = {};
        if (!place.vibeDescription && data.vibeDescription) {
          patch.vibeDescription = data.vibeDescription;
          setLocalVibe(data.vibeDescription);
        }
        if (!place.address && data.address) {
          patch.address = data.address;
          setLocalAddress(data.address);
        }
        if (Object.keys(patch).length > 0) updatePlace(place.id, patch);
      })
      .catch(() => {})
      .finally(() => setEnriching(false));
  }, [place?.id, loading]);

  const vibeDescription = place?.vibeDescription ?? localVibe;
  const address = place?.address ?? localAddress;
  const iconName = place ? (CATEGORY_ICONS[place.category] ?? 'location') : 'location';

  const handleDelete = () => {
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
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Place not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
          {place.name}
        </Text>
        <TouchableOpacity onPress={handleDelete} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
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

          {/* Vibe description — show spinner while fetching */}
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
        </View>

        {/* Details */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Row icon="location-outline" label="Neighborhood" value={place.neighborhood} colors={colors} />
          <Divider colors={colors} />
          <Row icon={iconName as any} label="Category" value={CATEGORY_LABELS[place.category]} colors={colors} />
          <Divider colors={colors} />
          <Row
            icon="cash-outline"
            label="Price"
            value={`${BUDGET_LABELS[place.priceLevel]} · ${BUDGET_FULL[place.priceLevel]}`}
            colors={colors}
          />

          {/* Address — show spinner while fetching if missing */}
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

          <Divider colors={colors} />
          <Row icon="bookmark-outline" label="Added from" value={SOURCE_LABELS[place.source] ?? 'Manually added'} colors={colors} />
        </View>

        {/* Notes */}
        {place.notes ? (
          <View style={styles.notesContainer}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>NOTES</Text>
            <View style={[styles.notesBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.notesText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>{place.notes}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerBtn: { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, textAlign: 'center', marginHorizontal: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  hero: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
  heroIcon: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  placeName: { fontSize: 24, textAlign: 'center' },
  vibeDescription: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 20, marginTop: -4 },
  enrichingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  enrichingText: { fontSize: 12 },
  vibeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 2 },
  vibeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  vibeTagText: { fontSize: 12 },
  section: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 11, letterSpacing: 0.5 },
  rowValue: { fontSize: 14 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
  notesContainer: { gap: 8 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5, paddingHorizontal: 4 },
  notesBox: { borderRadius: 16, borderWidth: 1, padding: 16 },
  notesText: { fontSize: 14, lineHeight: 22 },
});
