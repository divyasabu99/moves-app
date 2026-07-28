import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, KeyboardAvoidingView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { useColors } from '@/hooks/useColors';
import { usePlaces } from '@/context/PlacesContext';
import { PlaceCategory, BudgetLevel } from '@/types';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface Suggestion {
  name: string;
  category: PlaceCategory;
  neighborhood: string;
  priceLevel: BudgetLevel;
  address: string;
  vibes: string[];
  vibeDescription?: string;
  lat?: number;
  lng?: number;
}

// Neighborhood centroids — fallback when the API doesn't return exact coords
const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  'Lower East Side':[40.7150,-73.9830],'East Village':[40.7265,-73.9815],
  'West Village':[40.7341,-74.0060],'Greenwich Village':[40.7338,-74.0020],
  'SoHo':[40.7230,-74.0030],'NoLita':[40.7231,-73.9941],'Nolita':[40.7231,-73.9941],
  'Tribeca':[40.7163,-74.0086],'Financial District':[40.7075,-74.0090],
  'Chinatown':[40.7158,-73.9970],'Little Italy':[40.7191,-73.9973],
  'Midtown':[40.7549,-73.9840],'Midtown East':[40.7527,-73.9718],
  'Midtown West':[40.7580,-73.9855],"Hell's Kitchen":[40.7638,-73.9920],
  'Chelsea':[40.7465,-74.0014],'Flatiron':[40.7414,-73.9897],
  'NoMad':[40.7448,-73.9878],'Gramercy':[40.7382,-73.9844],
  'Murray Hill':[40.7488,-73.9773],'Upper East Side':[40.7736,-73.9566],
  'Upper West Side':[40.7870,-73.9754],'Harlem':[40.8116,-73.9465],
  'Williamsburg':[40.7081,-73.9571],'Bushwick':[40.6944,-73.9213],
  'Park Slope':[40.6681,-73.9800],'Bed-Stuy':[40.6872,-73.9418],
  'Bedford-Stuyvesant':[40.6872,-73.9418],'Fort Greene':[40.6885,-73.9754],
  'DUMBO':[40.7033,-73.9890],'Brooklyn Heights':[40.6962,-73.9937],
  'Greenpoint':[40.7290,-73.9511],'Long Island City':[40.7447,-73.9484],
  'Astoria':[40.7721,-73.9301],'Flushing':[40.7678,-73.8330],
};

function resolveCoords(s: Suggestion): [number, number] | null {
  if (s.lat != null && s.lng != null) return [s.lat, s.lng];
  return NEIGHBORHOOD_COORDS[s.neighborhood] ?? null;
}

function buildMapHtml(lat: number, lng: number, name: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css"/>
  <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%;background:#0F0F0F}
    .leaflet-control-zoom a{background:#1C1C1E!important;color:#FAFAFA!important;border-color:#3A3A3C!important}
    .leaflet-control-zoom a:hover{background:#2C2C2E!important}
    .leaflet-control-attribution{background:rgba(15,15,15,0.7)!important;color:#555!important}
    .leaflet-control-attribution a{color:#777!important}
    .leaflet-popup-content-wrapper{
      background:#1C1C1E;color:#FAFAFA;
      border-radius:12px;border:1px solid rgba(255,255,255,0.1);
      box-shadow:0 4px 24px rgba(0,0,0,0.6)
    }
    .leaflet-popup-tip-container{display:none}
    .leaflet-popup-content{margin:10px 14px!important;font-family:sans-serif;font-size:13px;font-weight:700;color:#FAFAFA}
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map',{center:[${lat},${lng}],zoom:15,zoomControl:true,attributionControl:true});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains:'abcd',maxZoom:19
  }).addTo(map);
  var icon = L.divIcon({
    html:'<div style="width:18px;height:18px;background:#FF3B5C;border-radius:50%;border:3px solid rgba(255,255,255,0.95);box-shadow:0 0 0 4px rgba(255,59,92,0.3),0 2px 10px rgba(0,0,0,0.6);"></div>',
    iconSize:[18,18],iconAnchor:[9,9],className:''
  });
  L.marker([${lat},${lng}],{icon:icon}).addTo(map).bindPopup(${JSON.stringify(name)}).openPopup();
</script>
</body>
</html>`;
}

const DEFAULT_MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css"/>
  <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%;background:#0F0F0F}
    .leaflet-control-zoom a{background:#1C1C1E!important;color:#FAFAFA!important;border-color:#3A3A3C!important}
    .leaflet-control-attribution{background:rgba(15,15,15,0.7)!important;color:#555!important}
    .leaflet-control-attribution a{color:#777!important}
  </style>
</head>
<body>
<div id="map"></div>
<script>
  L.map('map',{center:[40.7306,-73.9352],zoom:12,zoomControl:true,attributionControl:true});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains:'abcd',maxZoom:19
  }).addTo(_);
</script>
</body>
</html>`;

// Minimal default map that just shows NYC with no markers
const EMPTY_MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css"/>
  <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%;background:#0F0F0F}
    .leaflet-control-zoom a{background:#1C1C1E!important;color:#FAFAFA!important;border-color:#3A3A3C!important}
    .leaflet-control-attribution{background:rgba(15,15,15,0.7)!important;color:#555!important}
    .leaflet-control-attribution a{color:#777!important}
  </style>
</head>
<body><div id="map"></div>
<script>
  var m=L.map('map',{center:[40.7306,-73.9352],zoom:12,zoomControl:true,attributionControl:true});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains:'abcd',maxZoom:19
  }).addTo(m);
</script>
</body></html>`;

export default function AddPlaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addPlace, places } = usePlaces();

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuery = useRef('');
  const isAutoFilled = useRef(false);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);

  // Pin target: selected place, or first suggestion while dropdown is open
  const pinTarget = selected ?? (suggestions.length > 0 ? suggestions[0] : null);
  const pinCoords = pinTarget ? resolveCoords(pinTarget) : null;

  const mapHtml = pinCoords
    ? buildMapHtml(pinCoords[0], pinCoords[1], pinTarget!.name)
    : EMPTY_MAP_HTML;

  const mapKey = pinCoords ? `${pinCoords[0].toFixed(4)}-${pinCoords[1].toFixed(4)}` : 'empty';

  // ── User location for proximity-sorted autocomplete ───────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch { /* optional */ }
    })();
  }, []);

  // ── Autocomplete ──────────────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (query: string) => {
    if (lastQuery.current === query) return;
    lastQuery.current = query;
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${BASE_URL()}/places/autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lat: coords?.lat, lng: coords?.lng }),
      });
      const data = await res.json();
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [coords]);

  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { setSuggestions([]); lastQuery.current = ''; return; }
    if (isAutoFilled.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(trimmed), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [name, fetchSuggestions]);

  // ── Pick a suggestion ─────────────────────────────────────────────────────
  const pickSuggestion = (s: Suggestion) => {
    Haptics.selectionAsync();
    isAutoFilled.current = true;
    setName(s.name);
    setSelected(s);
    setSuggestions([]);
    lastQuery.current = s.name;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const trimmed = name.trim();
    const duplicate = places.find(p => p.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Already in your list',
        `"${duplicate.name}" is already saved. You can find it in your Places tab.`,
        [{ text: 'Got it', style: 'default' }],
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPlace({
      name: name.trim(),
      category: selected?.category ?? 'restaurant',
      neighborhood: selected?.neighborhood ?? '',
      priceLevel: selected?.priceLevel ?? 2,
      source: 'manual',
      vibes: selected?.vibes ?? [],
      vibeDescription: selected?.vibeDescription,
      address: selected?.address,
      ...(selected?.lat != null && selected?.lng != null
        ? { lat: selected.lat, lng: selected.lng }
        : {}),
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
          Add a Place
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={!canSave} style={styles.headerBtn} activeOpacity={0.7}>
          <Text style={[styles.addText, {
            color: canSave ? colors.primary : colors.mutedForeground,
            fontFamily: 'Inter_600SemiBold',
          }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Map fills the rest of the screen */}
      <View style={styles.mapContainer}>
        <WebView
          key={mapKey}
          source={{ html: mapHtml }}
          style={styles.map}
          scrollEnabled={false}
          bounces={false}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
        />

        {/* Search bar overlaid on map */}
        <View style={[styles.searchOverlay, { paddingHorizontal: 16, paddingTop: 12 }]}
              pointerEvents="box-none">
          <View style={[styles.searchBar, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: '#000',
          }]}>
            <Ionicons name="search" size={17} color={colors.mutedForeground} />
            <TextInput
              value={name}
              onChangeText={t => {
                isAutoFilled.current = false;
                setName(t);
                if (!t.trim()) setSelected(null);
              }}
              placeholder="Search for a place…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              autoFocus
              returnKeyType="search"
            />
            {loadingSuggestions && (
              <ActivityIndicator size="small" color={colors.primary} style={{ transform: [{ scale: 0.8 }] }} />
            )}
            {name.length > 0 && !loadingSuggestions && (
              <TouchableOpacity
                onPress={() => { setName(''); setSelected(null); setSuggestions([]); isAutoFilled.current = false; lastQuery.current = ''; }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {/* Autocomplete dropdown */}
          {suggestions.length > 0 && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={`${s.name}-${i}`}
                  onPress={() => pickSuggestion(s)}
                  activeOpacity={0.7}
                  style={[
                    styles.dropdownRow,
                    { borderBottomColor: colors.border },
                    i === suggestions.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.dropdownIcon, { backgroundColor: colors.muted }]}>
                    <Ionicons name="location-outline" size={14} color={colors.primary} />
                  </View>
                  <View style={styles.dropdownInfo}>
                    <Text style={[styles.dropdownName, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    {(s.neighborhood || s.address) && (
                      <Text style={[styles.dropdownMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                        {[s.neighborhood, s.address].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerBtn: { width: 50, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17 },
  addText: { fontSize: 16 },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  dropdown: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownIcon: {
    width: 28, height: 28, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  dropdownInfo: { flex: 1 },
  dropdownName: { fontSize: 14 },
  dropdownMeta: { fontSize: 12, marginTop: 1 },
});
