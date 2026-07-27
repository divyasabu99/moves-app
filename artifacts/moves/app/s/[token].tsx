/**
 * Public move-preview page — shown to anyone who opens a share link,
 * including people who don't have the MOVES app or an account.
 *
 * Route: /s/:token
 * Auth:  none required — the API endpoint uses optionalAuth
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface MoveStop {
  place?: { name?: string; neighborhood?: string; address?: string };
  time?: string;
  duration?: number; // minutes
  notes?: string;
}

interface SharedMove {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  neighborhood?: string[];
  stops?: MoveStop[];
}

interface PreviewData {
  move: SharedMove;
  sharedBy: string;
  sharedAt: string;
  stats: { recipientCount: number; upCount: number; downCount: number };
}

// ── Palette (fixed dark — no theme context needed for public page) ─────────────

const C = {
  bg:       '#0c0c0e',
  card:     '#18181b',
  border:   '#27272a',
  text:     '#fafafa',
  muted:    '#71717a',
  subdued:  '#3f3f46',
  accent:   '#e94057',
  accentBg: 'rgba(233,64,87,0.12)',
  blue:     '#5b9cf6',
  blueBg:   'rgba(91,156,246,0.12)',
  lock:     '#a1a1aa',
  lockBg:   'rgba(255,255,255,0.05)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(dateStr: string) {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
  } catch { return dateStr; }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PublicSharePreview() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE_URL()}/shared/${token}`)
      .then(r => r.ok ? r.json() : r.json().then((e: any) => Promise.reject(e.error ?? 'Not found')))
      .then(setData)
      .catch(e => setError(typeof e === 'string' ? e : 'This move link isn\u2019t valid or has been removed.'))
      .finally(() => setLoading(false));
  }, [token]);

  const goSignUp = () => router.push('/auth');

  const openDeepLink = () => {
    const url = `moves://shared/${token}`;
    Linking.canOpenURL(url).then(can => {
      if (can) Linking.openURL(url);
      else goSignUp();
    });
  };

  const topPad = insets.top + 16;
  const botPad = insets.bottom + 32;

  // ── Loading / Error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={[s.logo, { marginBottom: 32 }]}>MOVES</Text>
        <Ionicons name="alert-circle-outline" size={48} color={C.muted} />
        <Text style={[s.errorTitle]}>Link not found</Text>
        <Text style={[s.errorBody]}>{error || 'This move link may have expired or been removed.'}</Text>
        <TouchableOpacity style={s.ctaBtn} onPress={goSignUp} activeOpacity={0.85}>
          <Text style={s.ctaBtnText}>Open MOVES</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { move, sharedBy, stats } = data;
  const stops = move.stops ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad, gap: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Text style={s.logo}>MOVES</Text>

        {/* Card */}
        <View style={s.card}>

          {/* Shared-with badge */}
          <View style={s.badge}>
            <Ionicons name="paper-plane-outline" size={12} color={C.blue} />
            <Text style={s.badgeText}>Shared with you</Text>
          </View>

          {/* Title */}
          <Text style={s.title}>{move.title ?? 'A Move'}</Text>

          {/* From */}
          <Text style={s.from}>
            from <Text style={s.fromName}>{sharedBy}</Text>
          </Text>

          {/* Meta row */}
          <View style={s.metaRow}>
            {move.date && (
              <View style={s.metaChip}>
                <Ionicons name="calendar-outline" size={13} color={C.muted} />
                <Text style={s.metaText}>{fmt(move.date)}</Text>
              </View>
            )}
            {(move.startTime || move.endTime) && (
              <View style={s.metaChip}>
                <Ionicons name="time-outline" size={13} color={C.muted} />
                <Text style={s.metaText}>
                  {move.startTime ?? ''}
                  {move.startTime && move.endTime ? ' – ' : ''}
                  {move.endTime ?? ''}
                </Text>
              </View>
            )}
            {Array.isArray(move.neighborhood) && move.neighborhood.length > 0 && (
              <View style={s.metaChip}>
                <Ionicons name="location-outline" size={13} color={C.muted} />
                <Text style={s.metaText}>{move.neighborhood.join(' · ')}</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={s.divider} />

          {/* Itinerary */}
          {stops.length > 0 && (
            <>
              <Text style={s.sectionLabel}>ITINERARY</Text>
              <View style={s.stopList}>
                {stops.map((stop, i) => (
                  <View key={i} style={s.stopRow}>
                    {/* Number + connector line */}
                    <View style={s.stopLeft}>
                      <View style={s.stopNumWrap}>
                        <Text style={s.stopNum}>{i + 1}</Text>
                      </View>
                      {i < stops.length - 1 && <View style={s.connector} />}
                    </View>

                    {/* Info */}
                    <View style={s.stopBody}>
                      <Text style={s.stopName}>{stop.place?.name ?? 'Stop'}</Text>
                      {stop.place?.neighborhood && (
                        <Text style={s.stopSub}>{stop.place.neighborhood}</Text>
                      )}
                      {stop.place?.address && !stop.place?.neighborhood && (
                        <Text style={s.stopSub}>{stop.place.address}</Text>
                      )}
                      <View style={s.stopMeta}>
                        {stop.time && (
                          <View style={s.stopChip}>
                            <Ionicons name="time-outline" size={11} color={C.muted} />
                            <Text style={s.stopChipText}>{stop.time}</Text>
                          </View>
                        )}
                        {stop.duration != null && (
                          <View style={s.stopChip}>
                            <Ionicons name="hourglass-outline" size={11} color={C.muted} />
                            <Text style={s.stopChipText}>{stop.duration} min</Text>
                          </View>
                        )}
                      </View>
                      {stop.notes ? <Text style={s.stopNotes}>{stop.notes}</Text> : null}
                      {/* spacer between stops */}
                      {i < stops.length - 1 && <View style={{ height: 16 }} />}
                    </View>
                  </View>
                ))}
              </View>

              <View style={s.divider} />
            </>
          )}

          {/* Locked: Who's going */}
          <View style={s.lockedSection}>
            <View style={s.lockedHeader}>
              <Ionicons name="people-outline" size={16} color={C.lock} />
              <Text style={s.lockedTitle}>Who's going</Text>
              {stats.recipientCount > 0 && (
                <View style={s.countBubble}>
                  <Text style={s.countBubbleText}>{stats.recipientCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={s.lockedCta} onPress={goSignUp} activeOpacity={0.8}>
              <Ionicons name="lock-closed-outline" size={13} color={C.lock} />
              <Text style={s.lockedCtaText}>Create a free account to see who's going →</Text>
            </TouchableOpacity>
          </View>

          <View style={s.divider} />

          {/* Locked: Suggest a change */}
          <View style={s.lockedSection}>
            <View style={s.lockedHeader}>
              <Ionicons name="create-outline" size={16} color={C.lock} />
              <Text style={s.lockedTitle}>Suggest a change</Text>
            </View>
            <TouchableOpacity style={s.lockedCta} onPress={goSignUp} activeOpacity={0.8}>
              <Ionicons name="lock-closed-outline" size={13} color={C.lock} />
              <Text style={s.lockedCtaText}>Sign up to suggest a stop, time, or place →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA */}
        <View style={s.ctaWrap}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity style={[s.ctaBtn, s.ctaBtnSecondary]} onPress={openDeepLink} activeOpacity={0.85}>
              <Ionicons name="phone-portrait-outline" size={17} color={C.text} />
              <Text style={[s.ctaBtnText, { color: C.text }]}>Open in MOVES app</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.ctaBtn} onPress={goSignUp} activeOpacity={0.85}>
            <Text style={s.ctaBtnText}>Join MOVES — it's free</Text>
          </TouchableOpacity>
          <Text style={s.legalNote}>
            Vote, suggest changes, and save your own moves.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },

  logo:          { fontSize: 26, fontWeight: '900', letterSpacing: 6, color: C.accent,
                   textAlign: 'center', marginBottom: 20 },

  // card
  card:          { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 20,
                   borderWidth: 1, borderColor: C.border, padding: 24, gap: 14 },

  badge:         { flexDirection: 'row', alignItems: 'center', gap: 6,
                   alignSelf: 'flex-start', backgroundColor: C.blueBg,
                   borderWidth: 1, borderColor: 'rgba(91,156,246,0.3)',
                   paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:     { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, color: C.blue },

  title:         { fontSize: 24, fontWeight: '700', color: C.text, lineHeight: 30 },
  from:          { fontSize: 14, color: C.muted },
  fromName:      { color: '#d4d4d8', fontWeight: '600' },

  metaRow:       { gap: 8 },
  metaChip:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText:      { fontSize: 13, color: C.muted },

  divider:       { height: 1, backgroundColor: C.border },

  sectionLabel:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: C.subdued },

  // stops
  stopList:      { gap: 0 },
  stopRow:       { flexDirection: 'row', gap: 12 },
  stopLeft:      { alignItems: 'center', width: 28 },
  stopNumWrap:   { width: 28, height: 28, borderRadius: 14, backgroundColor: C.accentBg,
                   alignItems: 'center', justifyContent: 'center' },
  stopNum:       { fontSize: 12, fontWeight: '700', color: C.accent },
  connector:     { width: 2, flex: 1, backgroundColor: C.border, marginTop: 4, minHeight: 16 },
  stopBody:      { flex: 1, paddingTop: 4 },
  stopName:      { fontSize: 15, fontWeight: '600', color: C.text },
  stopSub:       { fontSize: 12, color: C.muted, marginTop: 2 },
  stopMeta:      { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  stopChip:      { flexDirection: 'row', alignItems: 'center', gap: 4,
                   backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8,
                   paddingHorizontal: 8, paddingVertical: 3 },
  stopChipText:  { fontSize: 11, color: C.muted },
  stopNotes:     { fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 6, lineHeight: 17 },

  // locked sections
  lockedSection: { gap: 10 },
  lockedHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lockedTitle:   { fontSize: 14, fontWeight: '600', color: C.lock, flex: 1 },
  countBubble:   { backgroundColor: C.subdued, borderRadius: 10,
                   paddingHorizontal: 8, paddingVertical: 2 },
  countBubbleText: { fontSize: 11, color: C.muted, fontWeight: '600' },
  lockedCta:     { flexDirection: 'row', alignItems: 'center', gap: 6,
                   backgroundColor: C.lockBg, borderRadius: 10,
                   paddingHorizontal: 12, paddingVertical: 10 },
  lockedCtaText: { fontSize: 13, color: C.lock, flex: 1 },

  // bottom CTA
  ctaWrap:       { marginHorizontal: 16, marginTop: 20, gap: 12 },
  ctaBtn:        { backgroundColor: C.accent, borderRadius: 14,
                   paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
                   flexDirection: 'row', gap: 8 },
  ctaBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border },
  ctaBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  legalNote:     { textAlign: 'center', fontSize: 12, color: C.muted },

  // error state
  errorTitle:    { fontSize: 20, fontWeight: '700', color: C.text, marginTop: 16, textAlign: 'center' },
  errorBody:     { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20,
                   marginTop: 8, marginBottom: 24 },
});
