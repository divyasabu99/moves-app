import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Platform, ActivityIndicator, Modal, ScrollView, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { unzipSync, strFromU8 } from 'fflate';
import { useColors } from '@/hooks/useColors';
import { PlaceCard } from '@/components/PlaceCard';
import { usePlaces } from '@/context/PlacesContext';
import { Place, PlaceCategory } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/itinerary';
import { parseGoogleMapsJson, ImportResult } from '@/lib/importGoogleMaps';

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

// ── Import preview modal ──────────────────────────────────────────────────────
function ImportModal({
  result,
  visible,
  onConfirm,
  onClose,
  importing,
}: {
  result: ImportResult | null;
  visible: boolean;
  onConfirm: () => void;
  onClose: () => void;
  importing: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  if (!result) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
        {/* Handle + header */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.sheetTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                Import from Google Maps
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {(result as any).listName ? `"${(result as any).listName}" · ` : ''}
                {result.imported.length} NYC places found
                {result.skippedOutsideNYC > 0 ? ` · ${result.skippedOutsideNYC} outside NYC skipped` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {result.imported.length === 0 ? (
          <View style={styles.sheetEmpty}>
            <Ionicons name="location-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.sheetEmptyTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              No NYC places found
            </Text>
            <Text style={[styles.sheetEmptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Your file had {result.total} place{result.total !== 1 ? 's' : ''} but none matched a NYC address. Make sure you exported "Saved Places" from Google Takeout.
            </Text>
          </View>
        ) : (
          <>
            {/* Preview list */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.previewList} showsVerticalScrollIndicator={false}>
              {result.imported.map((place, i) => (
                <View key={place.id} style={[styles.previewRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.previewIcon, { backgroundColor: colors.muted }]}>
                    <Ionicons
                      name={(CATEGORY_ICONS[place.category] ?? 'location') as any}
                      size={15}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.previewInfo}>
                    <Text style={[styles.previewName, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <Text style={[styles.previewMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                      {place.neighborhood} · {CATEGORY_LABELS[place.category]}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Action */}
            <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirm}
                disabled={importing}
                activeOpacity={0.8}
                style={[styles.importBtn, { backgroundColor: colors.primary, flex: 1 }]}
              >
                {importing ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={16} color={colors.primaryForeground} />
                    <Text style={[styles.importBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                      Import {result.imported.length} Place{result.imported.length !== 1 ? 's' : ''}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

// ── Link import modal ─────────────────────────────────────────────────────────
const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

function LinkImportModal({
  visible,
  onClose,
  onResult,
}: {
  visible: boolean;
  onClose: () => void;
  onResult: (result: ImportResult & { listName?: string }) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL()}/import/google-maps-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      onResult({
        imported: data.places ?? [],
        skippedOutsideNYC: data.skippedOutsideNYC ?? 0,
        total: data.total ?? 0,
        noNames: false,
        listName: data.listName,
      });
      setUrl('');
    } catch (e: any) {
      Alert.alert(
        'Could not import list',
        e?.message ?? 'Make sure the link is a public Google Maps list and try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [url, onResult]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[linkStyles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 32 }]}>
          <View style={[linkStyles.header, { borderBottomColor: colors.border }]}>
            <View style={linkStyles.handleWrap}>
              <View style={[linkStyles.handle, { backgroundColor: colors.border }]} />
            </View>
            <View style={linkStyles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[linkStyles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                  Import from link
                </Text>
                <Text style={[linkStyles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  Paste a shared Google Maps list URL
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={linkStyles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={linkStyles.body}>
            <Text style={[linkStyles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              HOW TO GET THE LINK
            </Text>
            {[
              'Open Google Maps → Saved → Lists',
              'Tap the list you want to import',
              'Tap the share icon (⋯) → Share list',
              'Copy the link and paste it below',
            ].map((step, i) => (
              <View key={i} style={linkStyles.step}>
                <View style={[linkStyles.stepNum, { backgroundColor: colors.muted }]}>
                  <Text style={[linkStyles.stepNumText, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[linkStyles.stepText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
                  {step}
                </Text>
              </View>
            ))}

            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://maps.app.goo.gl/..."
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[
                linkStyles.input,
                { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, fontFamily: 'Inter_400Regular' },
              ]}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!url.trim() || loading}
              activeOpacity={0.8}
              style={[
                linkStyles.btn,
                { backgroundColor: url.trim() && !loading ? colors.primary : colors.muted },
              ]}
            >
              {loading
                ? <ActivityIndicator color={colors.primaryForeground} size="small" />
                : <>
                    <Ionicons name="download-outline" size={17} color={colors.primaryForeground} />
                    <Text style={[linkStyles.btnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                      Fetch list
                    </Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PlacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { places, addPlaces, removePlace, loading } = usePlaces();
  const [filter, setFilter] = useState<FilterKey>('all');

  // File import state
  const [parsing, setParsing] = useState(false);
  const [importResult, setImportResult] = useState<(ImportResult & { listName?: string }) | null>(null);
  const [importing, setImporting] = useState(false);

  // Link import state
  const [linkModalVisible, setLinkModalVisible] = useState(false);

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

  const handleImportPress = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        // Accept both the raw JSON and the full Takeout zip
        type: ['application/json', 'application/zip',
               'application/x-zip-compressed', 'application/octet-stream'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;

      setParsing(true);
      const asset = res.assets[0];
      const isZip = asset.name?.endsWith('.zip') ||
                    asset.mimeType?.includes('zip') ||
                    asset.mimeType === 'application/octet-stream';

      // Read raw bytes
      let bytes: Uint8Array;
      if (Platform.OS === 'web') {
        const r = await fetch(asset.uri);
        bytes = new Uint8Array(await r.arrayBuffer());
      } else {
        const b64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const binary = atob(b64);
        bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      }

      let text: string;
      if (isZip) {
        // Unzip and merge ALL list JSON files from the Maps folder
        const unzipped = unzipSync(bytes);
        const keys = Object.keys(unzipped);

        // Collect every .json in the Maps (your places) folder
        const mapsKeys = keys.filter(k =>
          k.endsWith('.json') &&
          (k.toLowerCase().includes('maps') || k.toLowerCase().includes('saved'))
        );
        // Fall back to any .json if folder name doesn't match
        const targets = mapsKeys.length > 0
          ? mapsKeys
          : keys.filter(k => k.endsWith('.json'));

        if (targets.length === 0) throw new Error('No JSON files found inside the zip.');

        // Merge all feature arrays into one synthetic FeatureCollection
        const allFeatures: any[] = [];
        for (const key of targets) {
          try {
            const parsed = JSON.parse(strFromU8(unzipped[key]));
            if (Array.isArray(parsed.features)) allFeatures.push(...parsed.features);
          } catch { /* skip malformed */ }
        }
        text = JSON.stringify({ type: 'FeatureCollection', features: allFeatures });
      } else {
        // Plain JSON
        const decoder = new TextDecoder();
        text = decoder.decode(bytes);
      }

      const parsed = parseGoogleMapsJson(JSON.parse(text));
      setImportResult(parsed);
    } catch (e: any) {
      Alert.alert(
        'Import failed',
        e?.message ?? 'Could not read the file. Upload the Saved Places JSON or the full Takeout zip.',
      );
    } finally {
      setParsing(false);
    }
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!importResult) return;
    setImporting(true);
    await new Promise(r => setTimeout(r, 300)); // let UI update
    addPlaces(importResult.imported);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setImporting(false);
    setImportResult(null);
  }, [importResult, addPlaces]);

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
            {/* Link import */}
            <TouchableOpacity
              onPress={() => setLinkModalVisible(true)}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Ionicons name="link-outline" size={20} color={colors.foreground} />
            </TouchableOpacity>
            {/* File / zip import */}
            <TouchableOpacity
              onPress={handleImportPress}
              disabled={parsing}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              {parsing
                ? <ActivityIndicator color={colors.primary} size="small" />
                : <Ionicons name="cloud-download-outline" size={20} color={colors.foreground} />
              }
            </TouchableOpacity>
            {/* Add manually */}
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
              ? 'Add spots manually or import your saved Google Maps list.'
              : 'Try another category or add a new place.'}
          </Text>
          {filter === 'all' && (
            <View style={styles.emptyBtns}>
              <TouchableOpacity
                onPress={handleImportPress}
                disabled={parsing}
                style={[styles.emptySecBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                activeOpacity={0.8}
              >
                <Ionicons name="cloud-download-outline" size={15} color={colors.foreground} />
                <Text style={[styles.emptySecBtnText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                  Import Google Maps
                </Text>
              </TouchableOpacity>
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
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PlaceCard place={item} onLongPress={() => handleLongPress(item)} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Import preview / confirm modal */}
      <ImportModal
        result={importResult}
        visible={!!importResult}
        onConfirm={handleConfirmImport}
        onClose={() => setImportResult(null)}
        importing={importing}
      />

      {/* Link import modal */}
      <LinkImportModal
        visible={linkModalVisible}
        onClose={() => setLinkModalVisible(false)}
        onResult={(result) => {
          setLinkModalVisible(false);
          setImportResult(result);
        }}
      />
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
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
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
  emptyBtns: { gap: 10, width: '100%', marginTop: 8 },
  emptySecBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  emptySecBtnText: { fontSize: 14 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  emptyBtnText: { fontSize: 14 },
  // Import modal
  sheet: { flex: 1 },
  sheetHeader: { borderBottomWidth: 1 },
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  sheetTitleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, gap: 12,
  },
  sheetTitle: { fontSize: 20 },
  sheetSubtitle: { fontSize: 13, marginTop: 3 },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  previewList: { padding: 16, gap: 0 },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  previewIcon: {
    width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 14 },
  previewMeta: { fontSize: 12, marginTop: 2 },
  sheetFooter: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1,
  },
  cancelBtn: {
    paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14 },
  importBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, borderRadius: 12,
  },
  importBtnText: { fontSize: 14 },
  sheetEmpty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14,
  },
  sheetEmptyTitle: { fontSize: 18, textAlign: 'center' },
  sheetEmptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});

const linkStyles = StyleSheet.create({
  sheet: { flex: 1 },
  header: { borderBottomWidth: 1 },
  handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  titleRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, gap: 12,
  },
  title: { fontSize: 20 },
  subtitle: { fontSize: 13, marginTop: 3 },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  body: { flex: 1, padding: 24, gap: 14 },
  label: { fontSize: 11, letterSpacing: 0.8, marginBottom: 2 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  stepNumText: { fontSize: 12 },
  stepText: { fontSize: 14, lineHeight: 22, flex: 1 },
  input: {
    marginTop: 8,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 14,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 4,
  },
  btnText: { fontSize: 15 },
});
