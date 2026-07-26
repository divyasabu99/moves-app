import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { useMoves } from '@/context/MovesContext';
import { Move, Stop, TransitMode, BudgetLevel } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/itinerary';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface SharedMoveData {
  token: string;
  move: Move;
  sharedBy: string;
  sharedAt: string;
  stats: { recipientCount: number; upCount: number; downCount: number };
  myReaction: 'up' | 'down' | null;
  mySuggestion: any;
}

// ── Helpers (copied from move-detail) ─────────────────────────────────────────

const BUDGET_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
const TRANSIT_META: Record<TransitMode, { icon: string; label: string }> = {
  walk:      { icon: 'walk-outline',  label: 'Walk' },
  subway:    { icon: 'train-outline', label: 'Subway' },
  rideshare: { icon: 'car-outline',   label: 'Rideshare' },
};
const TRANSIT_COLORS: Record<TransitMode, string> = {
  walk: '#4CAF82', subway: '#5B9CF6', rideshare: '#FF8C42',
};

function budgetDisplay(levels: BudgetLevel[]): string {
  if (!levels.length) return '$$';
  if (levels.length === 1) return BUDGET_LABELS[levels[0]];
  const s = [...levels].sort();
  return `${BUDGET_LABELS[s[0]]}–${BUDGET_LABELS[s[s.length - 1]]}`;
}

function parseTime(t: string): number {
  const m = t.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function minsToStr(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

function durationLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
}

interface StopTime { arrivalMins: number; departureMins: number }

function computeStopTimes(startTime: string, stops: Stop[]): StopTime[] {
  let cursor = parseTime(startTime);
  return stops.map(s => {
    const arrivalMins = cursor;
    const departureMins = cursor + s.estimatedDurationMinutes;
    cursor = departureMins + (s.transitToNext?.estimatedMinutes ?? 0);
    return { arrivalMins, departureMins };
  });
}

// ── Suggest modal (inline) ────────────────────────────────────────────────────

import { Modal, TextInput, KeyboardAvoidingView } from 'react-native';

function SuggestModal({
  visible, onClose, onSubmit,
}: { visible: boolean; onClose: () => void; onSubmit: (text: string) => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[sm.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>
          <View style={[sm.header, { borderBottomColor: colors.border }]}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
              <View style={[sm.handle, { backgroundColor: colors.border }]} />
            </View>
            <View style={sm.row}>
              <Text style={[sm.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>Suggest a change</Text>
              <TouchableOpacity onPress={onClose} style={sm.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={sm.body}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="What would you change? (different spot, time, vibe...)"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              autoFocus
              style={[sm.input, {
                color: colors.foreground, borderColor: colors.border,
                backgroundColor: colors.card, fontFamily: 'Inter_400Regular',
              }]}
            />
            <TouchableOpacity
              onPress={() => { if (text.trim()) { onSubmit(text.trim()); setText(''); } }}
              activeOpacity={0.85}
              disabled={!text.trim()}
              style={[sm.submit, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
            >
              <Text style={[sm.submitText, {
                color: text.trim() ? colors.primaryForeground : colors.mutedForeground,
                fontFamily: 'Inter_600SemiBold',
              }]}>
                Send suggestion
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sm = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingBottom: 14 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  title: { fontSize: 18 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, gap: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 120, textAlignVertical: 'top' },
  submit: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  submitText: { fontSize: 15 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SharedMoveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, isAuthenticated } = useUser();
  const authToken = user?.token;
  const { addManualMove } = useMoves();

  const [data, setData] = useState<SharedMoveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [forking, setForking] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [myReaction, setMyReaction] = useState<'up' | 'down' | null>(null);
  const [upCount, setUpCount] = useState(0);
  const [downCount, setDownCount] = useState(0);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + 32;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL()}/shared/${token}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!res.ok) throw new Error('Not found');
      const d = await res.json() as SharedMoveData;
      setData(d);
      setMyReaction(d.myReaction);
      setUpCount(d.stats.upCount);
      setDownCount(d.stats.downCount);
    } catch {
      setError("This move link isn\u2019t valid or has been removed.");
    } finally {
      setLoading(false);
    }
  }, [token, authToken]);

  useEffect(() => { load(); }, [load]);

  const stopTimes = useMemo(
    () => data ? computeStopTimes(data.move.startTime, data.move.stops) : [],
    [data],
  );

  const totalMins = useMemo(
    () => data?.move.stops.reduce((s, stop) => s + stop.estimatedDurationMinutes + (stop.transitToNext?.estimatedMinutes ?? 0), 0) ?? 0,
    [data],
  );

  const handleVote = useCallback(async (reaction: 'up' | 'down') => {
    if (!isAuthenticated) {
      Alert.alert('Sign in to vote', 'Download the MOVES app and create an account to vote on moves.');
      return;
    }
    if (voting) return;
    setVoting(true);

    // Optimistic update
    const prev = myReaction;
    const wasUp = prev === 'up';
    const wasDown = prev === 'down';
    if (reaction === 'up') {
      setUpCount(c => wasUp ? c - 1 : c + 1);
      if (wasDown) setDownCount(c => c - 1);
    } else {
      setDownCount(c => wasDown ? c - 1 : c + 1);
      if (wasUp) setUpCount(c => c - 1);
    }
    setMyReaction(prev === reaction ? null : reaction);

    try {
      await fetch(`${BASE_URL()}/shared/${token}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reaction }),
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Revert
      setMyReaction(prev);
      if (reaction === 'up') { setUpCount(c => c - 1); if (wasDown) setDownCount(c => c + 1); }
      else { setDownCount(c => c - 1); if (wasUp) setUpCount(c => c + 1); }
    } finally {
      setVoting(false);
    }
  }, [isAuthenticated, voting, myReaction, token, authToken]);

  const handleSuggest = useCallback(async (suggestion: string) => {
    if (!isAuthenticated) return;
    setShowSuggest(false);
    try {
      await fetch(`${BASE_URL()}/shared/${token}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reaction: myReaction ?? 'up', suggestion: { text: suggestion } }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Suggestion sent! 🎉', 'The move creator can see your feedback.');
    } catch {
      Alert.alert('Error', 'Could not send suggestion. Try again.');
    }
  }, [isAuthenticated, token, authToken, myReaction]);

  const handleFork = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign in to save', 'Create a free account to save this move and make it yours.');
      return;
    }
    if (!data) return;
    setForking(true);
    try {
      // Destructure server-assigned fields so addManualMove can assign fresh ones
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, status: _status, createdAt: _createdAt, ...rest } = data.move;
      const forked = addManualMove(rest);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved to your moves! ✨', 'Find it in your Moves tab.', [
        { text: 'View it', onPress: () => router.replace(`/move-detail?id=${forked.id}`) },
        { text: 'Stay here', style: 'cancel' },
      ]);
    } catch {
      Alert.alert('Error', 'Could not save this move. Try again.');
    } finally {
      setForking(false);
    }
  }, [isAuthenticated, data, addManualMove]);

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="link-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {error ?? 'Move not found'}
          </Text>
          <TouchableOpacity onPress={load} activeOpacity={0.7}
            style={[styles.retryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[{ color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { move, sharedBy, stats } = data;
  const hoods = Array.isArray(move.neighborhood) ? move.neighborhood : [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.vibePill, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
            <Text style={[styles.vibeText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              {move.vibe.toUpperCase()}
            </Text>
          </View>
          {/* Shared-with badge */}
          <View style={[styles.sharedBadge, { backgroundColor: '#5B9CF620', borderColor: '#5B9CF640' }]}>
            <Ionicons name="paper-plane-outline" size={11} color="#5B9CF6" />
            <Text style={[styles.sharedBadgeText, { color: '#5B9CF6', fontFamily: 'Inter_600SemiBold' }]}>
              Shared with you
            </Text>
          </View>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            {move.title}
          </Text>
          <Text style={[styles.sharedByText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Shared by <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>{sharedBy}</Text>
          </Text>
          <View style={styles.heroMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {new Date(move.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {move.startTime}{move.endTime ? ` – ${move.endTime}` : ''} · {durationLabel(totalMins)} total
              </Text>
            </View>
            {hoods.length > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {hoods.join(' · ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Vote / react bar */}
        <View style={[styles.reactBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.reactSection}>
            <TouchableOpacity
              onPress={() => handleVote('up')}
              activeOpacity={0.75}
              style={[styles.reactBtn, myReaction === 'up' && { backgroundColor: '#4CAF8222' }]}
            >
              <Ionicons name={myReaction === 'up' ? 'thumbs-up' : 'thumbs-up-outline'} size={20} color={myReaction === 'up' ? '#4CAF82' : colors.mutedForeground} />
              {upCount > 0 && (
                <Text style={[styles.reactCount, { color: myReaction === 'up' ? '#4CAF82' : colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  {upCount}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleVote('down')}
              activeOpacity={0.75}
              style={[styles.reactBtn, myReaction === 'down' && { backgroundColor: '#E9405722' }]}
            >
              <Ionicons name={myReaction === 'down' ? 'thumbs-down' : 'thumbs-down-outline'} size={20} color={myReaction === 'down' ? '#E94057' : colors.mutedForeground} />
              {downCount > 0 && (
                <Text style={[styles.reactCount, { color: myReaction === 'down' ? '#E94057' : colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  {downCount}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.reactDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity
            onPress={() => {
              if (!isAuthenticated) { Alert.alert('Sign in to suggest', 'Get the MOVES app to send suggestions.'); return; }
              setShowSuggest(true);
            }}
            activeOpacity={0.75}
            style={styles.reactBtn}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.reactLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Suggest</Text>
          </TouchableOpacity>
        </View>

        {/* Shared with count pill */}
        {stats.recipientCount > 0 && (
          <View style={[styles.recipientPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="people-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.recipientText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Shared with {stats.recipientCount} {stats.recipientCount === 1 ? 'person' : 'people'}
            </Text>
          </View>
        )}

        {/* Stops timeline */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
            THE MOVE
          </Text>
          {move.stops.map((stop, i) => {
            const times = stopTimes[i];
            const icon = CATEGORY_ICONS[stop.place.category] ?? 'location-outline';
            const label = CATEGORY_LABELS[stop.place.category] ?? stop.place.category;
            return (
              <View key={stop.placeId ?? i}>
                <View style={styles.timelineRow}>
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeText, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                      {times ? minsToStr(times.arrivalMins) : ''}
                    </Text>
                  </View>
                  <View style={styles.railCol}>
                    <View style={[styles.railDot, { borderColor: colors.primary, backgroundColor: colors.background }]} />
                    <View style={[styles.railLine, { backgroundColor: colors.border }]} />
                    <View style={[styles.stopCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.stopHeader}>
                        <View style={[styles.stopIcon, { backgroundColor: colors.primary + '22' }]}>
                          <Ionicons name={icon as any} size={16} color={colors.primary} />
                        </View>
                        <View style={styles.stopInfo}>
                          <Text style={[styles.stopName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                            {stop.place.name}
                          </Text>
                          <Text style={[styles.stopSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                            {label} · {stop.place.neighborhood}
                          </Text>
                        </View>
                        <Text style={[styles.stopBudget, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                          {BUDGET_LABELS[stop.place.priceLevel]}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                {stop.transitToNext && (
                  <View style={styles.transitRow}>
                    <View style={styles.timeCol} />
                    <View style={styles.railCol}>
                      <View style={[styles.transitPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name={TRANSIT_META[stop.transitToNext.mode].icon as any} size={12} color={TRANSIT_COLORS[stop.transitToNext.mode]} />
                        <Text style={[styles.transitText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                          {TRANSIT_META[stop.transitToNext.mode].label} · {stop.transitToNext.estimatedMinutes}m
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Fork CTA */}
        <View style={styles.forkSection}>
          <TouchableOpacity
            onPress={handleFork}
            activeOpacity={0.85}
            disabled={forking}
            style={[styles.forkBtn, { backgroundColor: colors.primary }]}
          >
            {forking ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <>
                <Ionicons name="copy-outline" size={18} color={colors.primaryForeground} />
                <Text style={[styles.forkBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  Make my own version
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.forkHint, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Saves a copy of this move to your Moves tab
          </Text>
        </View>
      </ScrollView>

      <SuggestModal
        visible={showSuggest}
        onClose={() => setShowSuggest(false)}
        onSubmit={handleSuggest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vibePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  vibeText: { fontSize: 11, letterSpacing: 1.4 },
  sharedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  sharedBadgeText: { fontSize: 11 },

  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  errorText: { fontSize: 15, textAlign: 'center', maxWidth: 280 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },

  hero: { gap: 8 },
  heroTitle: { fontSize: 26, lineHeight: 32 },
  sharedByText: { fontSize: 14 },
  heroMeta: { gap: 6, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14 },

  // React bar
  reactBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1,
    paddingVertical: 4, paddingHorizontal: 4,
  },
  reactSection: { flexDirection: 'row', flex: 1, gap: 4 },
  reactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flex: 1, justifyContent: 'center',
  },
  reactCount: { fontSize: 14 },
  reactLabel: { fontSize: 14 },
  reactDivider: { width: 1, height: 28, marginHorizontal: 4 },

  // Recipient pill
  recipientPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  recipientText: { fontSize: 13 },

  // Timeline
  section: { gap: 4 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5, marginBottom: 10 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timeCol: { width: 72, alignItems: 'flex-end', paddingTop: 6 },
  timeText: { fontSize: 12 },
  railCol: { flex: 1, alignItems: 'flex-start' },
  railDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 2, marginLeft: 2 },
  railLine: { width: 2, flex: 1, minHeight: 12, marginLeft: 7, marginTop: 2 },
  stopCard: { flex: 1, borderRadius: 12, borderWidth: 1, marginLeft: 8, marginBottom: 4, alignSelf: 'stretch' },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  stopIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stopInfo: { flex: 1, gap: 2 },
  stopName: { fontSize: 14 },
  stopSub: { fontSize: 11 },
  stopBudget: { fontSize: 13 },

  transitRow: { flexDirection: 'row', gap: 12, marginLeft: 0, marginTop: 2, marginBottom: 2 },
  transitPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginLeft: 8,
  },
  transitText: { fontSize: 12 },

  // Fork CTA
  forkSection: { gap: 10 },
  forkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  forkBtnText: { fontSize: 15 },
  forkHint: { fontSize: 12, textAlign: 'center' },
});
