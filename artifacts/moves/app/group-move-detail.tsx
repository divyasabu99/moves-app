/**
 * Full detail view for a move shared into a group.
 * Shows the complete itinerary, who shared it inside the group, and every
 * phone number it has been sent to externally. Any group member can share
 * it to more people from here.
 *
 * Route params:
 *   shareId — ID of the shared move (fetched from API to avoid large-param iOS crash)
 *   groupId — the group this move belongs to
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { ShareMoveSheet } from '@/components/ShareMoveSheet';
import type { SharedMove, Stop, TransitMode } from '@/types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/itinerary';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

// ── Constants (mirrors move-detail.tsx) ───────────────────────────────────────

const BUDGET_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

const TRANSIT_LABELS: Record<TransitMode, string> = {
  walk: 'Walk',
  subway: 'Subway',
  rideshare: 'Rideshare',
};

const TRANSIT_ICONS: Record<TransitMode, string> = {
  walk: 'walk-outline',
  subway: 'subway-outline',
  rideshare: 'car-outline',
};

const TRANSIT_COLORS: Record<TransitMode, string> = {
  walk: '#4ade80',
  subway: '#60a5fa',
  rideshare: '#fb923c',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeToMins(t: string): number | null {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3]?.toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function minsToStr(totalMins: number): string {
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function dateLabel(dateStr: string) {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Recipient {
  phone: string;
  shared_at: string;
  viewed_at: string | null;
  sent_by: string | null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Text style={[sl.label, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
      {text}
    </Text>
  );
}
const sl = StyleSheet.create({
  label: { fontSize: 10, letterSpacing: 1.4, marginBottom: 10 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function GroupMoveDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const params = useLocalSearchParams<{ shareId: string; groupId: string }>();
  const groupId = params.groupId;
  const shareId = params.shareId;

  // Fetch shared move from API (avoids large JSON in nav params which breaks on iOS)
  const [shared, setShared] = useState<SharedMove | null>(null);
  const [loadingShared, setLoadingShared] = useState(true);

  useEffect(() => {
    if (!shareId || !groupId) return;
    const token = user?.token ?? '';
    fetch(`${BASE_URL()}/groups/${groupId}/moves/${shareId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setShared(data as SharedMove); })
      .catch(() => {})
      .finally(() => setLoadingShared(false));
  }, [shareId, groupId, user?.token]);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(true);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // ── Voting ─────────────────────────────────────────────────────────────────
  const [upCount, setUpCount] = useState(0);
  const [downCount, setDownCount] = useState(0);
  const [myVote, setMyVote] = useState<'up' | 'down' | null>(null);
  const [voting, setVoting] = useState(false);

  // Sync vote counts when shared data loads
  useEffect(() => {
    if (shared?.votes) {
      setUpCount(shared.votes.upCount ?? 0);
      setDownCount(shared.votes.downCount ?? 0);
      setMyVote(shared.votes.myVote ?? null);
    }
  }, [shared]);

  const isCreator = !!user?.userId && !!shared && user.userId === shared.sharedBy.id;

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 48);

  // ── Stop timeline ──────────────────────────────────────────────────────────

  const stopTimes = useMemo(() => {
    if (!shared) return [];
    const startMins = timeToMins(shared.move.startTime);
    if (startMins === null) return [];
    let cursor = startMins;
    return shared.move.stops.map(stop => {
      const arrival = cursor;
      const departure = arrival + stop.estimatedDurationMinutes;
      cursor = departure + (stop.transitToNext?.estimatedMinutes ?? 0);
      return { arrivalMins: arrival, departureMins: departure };
    });
  }, [shared]);

  // ── Recipients ─────────────────────────────────────────────────────────────

  const fetchRecipients = useCallback(async () => {
    if (!shared || !user?.token) return;
    setRecipientsLoading(true);
    try {
      const res = await fetch(`${BASE_URL()}/share/recipients/${shared.move.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients ?? []);
      }
    } catch { /* offline — show empty */ }
    finally { setRecipientsLoading(false); }
  }, [shared?.move.id, user?.token]);

  useEffect(() => { fetchRecipients(); }, [fetchRecipients]);

  const handleShared = useCallback((_token: string, _url: string, count: number) => {
    // Re-fetch so new phone numbers appear immediately
    fetchRecipients();
  }, [fetchRecipients]);

  const handleVote = useCallback(async (vote: 'up' | 'down') => {
    if (!user?.userId || !shared || !groupId) return;
    if (isCreator) return; // creator cannot vote — UI hides buttons, but guard anyway
    if (voting) return;
    setVoting(true);

    // Optimistic update
    const prevVote = myVote;
    const wasUp = prevVote === 'up';
    const wasDown = prevVote === 'down';
    const nextVote = prevVote === vote ? null : vote;
    if (vote === 'up') {
      setUpCount(c => prevVote === 'up' ? c - 1 : c + 1);
      if (wasDown) setDownCount(c => c - 1);
    } else {
      setDownCount(c => prevVote === 'down' ? c - 1 : c + 1);
      if (wasUp) setUpCount(c => c - 1);
    }
    setMyVote(nextVote);

    try {
      const res = await fetch(`${BASE_URL()}/groups/${groupId}/moves/${shared.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ vote }),
      });
      if (res.ok) {
        const data = await res.json();
        setUpCount(data.upCount);
        setDownCount(data.downCount);
        setMyVote(data.myVote);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (res.status === 403) {
        const j = await res.json();
        Alert.alert('Cannot vote', j.error ?? 'Not allowed');
        // revert
        setMyVote(prevVote);
        if (vote === 'up') { setUpCount(c => c - 1); if (wasDown) setDownCount(c => c + 1); }
        else { setDownCount(c => c - 1); if (wasUp) setUpCount(c => c + 1); }
      }
    } catch {
      // revert on network error
      setMyVote(prevVote);
      if (vote === 'up') { setUpCount(c => c - 1); if (wasDown) setDownCount(c => c + 1); }
      else { setDownCount(c => c - 1); if (wasUp) setUpCount(c => c + 1); }
    } finally {
      setVoting(false);
    }
  }, [user, shared, groupId, isCreator, voting, myVote]);

  if (loadingShared || !shared) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          {loadingShared
            ? <ActivityIndicator color={colors.primary} size="large" />
            : <Text style={{ color: colors.mutedForeground }}>Move not found.</Text>}
        </View>
      </View>
    );
  }

  const move = shared.move;
  const totalCost = Math.round(move.totalEstimatedCostPerPerson ?? 0);
  const budgetStr = (() => {
    const s = [...move.budgetLevel].sort();
    if (s.length === 1) return BUDGET_LABELS[s[0]];
    return `${BUDGET_LABELS[s[0]]}–${BUDGET_LABELS[s[s.length - 1]]}`;
  })();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
          {move.title}
        </Text>
        {/* Share to outside */}
        <TouchableOpacity onPress={() => setShowShareSheet(true)} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: botPad }} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {/* Vibe pill */}
          <View style={[styles.vibePill, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
            <Text style={[styles.vibeText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              {move.vibe.toUpperCase()}
            </Text>
          </View>

          <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            {move.title}
          </Text>

          <Text style={[styles.sharedByLine, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Shared by{' '}
            <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>
              {shared.sharedBy.displayName}
            </Text>
            {' · '}{timeAgo(shared.sharedAt)}
          </Text>

          {/* Stats row */}
          <View style={[styles.statsRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                {dateLabel(move.date)}
              </Text>
              <Text style={[styles.statLab, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>date</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                {move.startTime}{move.endTime ? `–${move.endTime}` : ''}
              </Text>
              <Text style={[styles.statLab, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>time</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                {move.partySize}
              </Text>
              <Text style={[styles.statLab, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>people</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statCell}>
              <Text style={[styles.statVal, { color: colors.accent ?? colors.primary, fontFamily: 'Inter_700Bold' }]}>
                ~${totalCost}
              </Text>
              <Text style={[styles.statLab, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>total/pp</Text>
            </View>
          </View>
        </View>

        {/* ── Vote bar (visible to all; creator sees read-only counts) ── */}
        <View style={[styles.voteBar, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 20, marginTop: 12 }]}>
          <TouchableOpacity
            onPress={() => !isCreator && handleVote('up')}
            activeOpacity={isCreator ? 1 : 0.75}
            disabled={voting}
            style={[styles.voteBtn, myVote === 'up' && { backgroundColor: '#4ade8022' }]}
          >
            <Ionicons
              name={myVote === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
              size={20}
              color={myVote === 'up' ? '#4ade80' : colors.mutedForeground}
            />
            <Text style={[styles.voteCount, { color: myVote === 'up' ? '#4ade80' : colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
              {upCount}
            </Text>
          </TouchableOpacity>

          <View style={[styles.voteDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            onPress={() => !isCreator && handleVote('down')}
            activeOpacity={isCreator ? 1 : 0.75}
            disabled={voting}
            style={[styles.voteBtn, myVote === 'down' && { backgroundColor: '#f8717122' }]}
          >
            <Ionicons
              name={myVote === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
              size={20}
              color={myVote === 'down' ? '#f87171' : colors.mutedForeground}
            />
            <Text style={[styles.voteCount, { color: myVote === 'down' ? '#f87171' : colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
              {downCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Itinerary ── */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <SectionLabel text="ITINERARY" />
          {move.stops.map((stop: Stop, i: number) => {
            const times = stopTimes[i];
            const isLast = i === move.stops.length - 1;
            const transit = !isLast ? stop.transitToNext : undefined;
            const iconName = CATEGORY_ICONS[stop.place.category] ?? 'location';
            const isSuggested = stop.place.source === 'ai_suggested';
            const hrs = Math.floor(stop.estimatedDurationMinutes / 60);
            const mns = stop.estimatedDurationMinutes % 60;
            const dur = hrs > 0 ? `${hrs}h${mns > 0 ? ` ${mns}m` : ''}` : `${mns}m`;

            return (
              <View key={stop.placeId + i} style={styles.timelineRow}>
                {/* Time col */}
                <View style={styles.timeCol}>
                  <Text style={[styles.timeText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
                    {times ? minsToStr(times.arrivalMins) : ''}
                  </Text>
                </View>

                {/* Rail + card */}
                <View style={styles.railCol}>
                  <View style={[styles.railDot, { backgroundColor: colors.primary, borderColor: colors.background }]} />
                  {!isLast && <View style={[styles.railLine, { backgroundColor: colors.border }]} />}

                  <View style={[
                    styles.stopCard,
                    {
                      backgroundColor: isSuggested ? colors.primary + '12' : colors.card,
                      borderColor: isSuggested ? colors.primary + '44' : colors.border,
                    },
                  ]}>
                    <View style={styles.stopCardHeader}>
                      <View style={[styles.stopIconWrap, { backgroundColor: isSuggested ? colors.primary + '22' : colors.secondary }]}>
                        <Ionicons name={iconName as any} size={16} color={colors.primary} />
                      </View>
                      <View style={styles.stopCardInfo}>
                        <Text style={[styles.stopName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                          {stop.place.name}
                        </Text>
                        <Text style={[styles.stopSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                          {stop.place.neighborhood} · {CATEGORY_LABELS[stop.place.category]}
                        </Text>
                      </View>
                      <Text style={[styles.stopBudget, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
                        {BUDGET_LABELS[stop.place.priceLevel]}
                      </Text>
                    </View>

                    <View style={[styles.stopCardFooter, { borderTopColor: colors.border }]}>
                      <View style={styles.stopStat}>
                        <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.stopStatText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>{dur}</Text>
                      </View>
                      <View style={styles.stopStat}>
                        <Ionicons name="card-outline" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.stopStatText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                          ~${stop.estimatedCostPerPerson}/pp
                        </Text>
                      </View>
                      {times && (
                        <View style={styles.stopStat}>
                          <Ionicons name="log-out-outline" size={12} color={colors.mutedForeground} />
                          <Text style={[styles.stopStatText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                            Leave {minsToStr(times.departureMins)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Transit connector */}
                  {transit && (
                    <View style={styles.transitBlock}>
                      <View style={[styles.transitLine, { backgroundColor: colors.border }]} />
                      <View style={[styles.transitPill, {
                        backgroundColor: colors.background,
                        borderColor: TRANSIT_COLORS[transit.mode] + '55',
                      }]}>
                        <Ionicons name={TRANSIT_ICONS[transit.mode] as any} size={11} color={TRANSIT_COLORS[transit.mode]} />
                        <Text style={[styles.transitText, { color: TRANSIT_COLORS[transit.mode], fontFamily: 'Inter_500Medium' }]}>
                          {TRANSIT_LABELS[transit.mode]} · {transit.estimatedMinutes} min
                        </Text>
                      </View>
                      <View style={[styles.transitLine, { backgroundColor: colors.border }]} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Sent outside the group ── */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <SectionLabel text="SENT OUTSIDE THE GROUP" />

          {recipientsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
          ) : recipients.length === 0 ? (
            <View style={[styles.emptyRecipients, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="paper-plane-outline" size={22} color={colors.mutedForeground} />
              <Text style={[styles.emptyRecipientsText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                No one has shared this move outside the group yet.
              </Text>
            </View>
          ) : (
            <View style={styles.recipientList}>
              {recipients.map((r, i) => (
                <View key={i} style={[styles.recipientRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.recipientIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="phone-portrait-outline" size={15} color={colors.primary} />
                  </View>
                  <View style={styles.recipientInfo}>
                    <Text style={[styles.recipientPhone, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                      {formatPhone(r.phone)}
                    </Text>
                    <Text style={[styles.recipientMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {r.sent_by ? `Sent by ${r.sent_by}` : 'Sent'} · {timeAgo(r.shared_at)}
                    </Text>
                  </View>
                  {r.viewed_at ? (
                    <View style={[styles.viewedBadge, { backgroundColor: '#4ade8022', borderColor: '#4ade8044' }]}>
                      <Ionicons name="checkmark-circle-outline" size={12} color="#4ade80" />
                      <Text style={[styles.viewedText, { color: '#4ade80', fontFamily: 'Inter_500Medium' }]}>Viewed</Text>
                    </View>
                  ) : (
                    <View style={[styles.viewedBadge, { backgroundColor: colors.muted + '33', borderColor: colors.border }]}>
                      <Text style={[styles.viewedText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Sent</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

        </View>

      </ScrollView>

      <ShareMoveSheet
        move={move}
        visible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        onShared={handleShared}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17 },

  // Hero
  hero: {
    padding: 20, gap: 8, borderBottomWidth: 1,
  },
  vibePill: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  vibeText: { fontSize: 10, letterSpacing: 1.4 },
  heroTitle: { fontSize: 24, lineHeight: 30 },
  sharedByLine: { fontSize: 13 },
  statsRow: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1,
    overflow: 'hidden', marginTop: 4,
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  statVal: { fontSize: 13, textAlign: 'center' },
  statLab: { fontSize: 10, letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, marginVertical: 10 },

  // Section
  section: { padding: 20, borderBottomWidth: 1, gap: 0 },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: 12 },
  timeCol: { width: 58, paddingTop: 4, alignItems: 'flex-end' },
  timeText: { fontSize: 12 },
  railCol: { flex: 1, alignItems: 'flex-start' },
  railDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, marginTop: 6, zIndex: 1 },
  railLine: { width: 2, flex: 1, minHeight: 20, marginLeft: 4 },

  stopCard: {
    width: '100%', borderRadius: 14, borderWidth: 1,
    marginTop: 8, marginBottom: 4, overflow: 'hidden',
  },
  stopCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  stopIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stopCardInfo: { flex: 1 },
  stopName: { fontSize: 14 },
  stopSub: { fontSize: 12, marginTop: 1 },
  stopBudget: { fontSize: 13 },
  stopCardFooter: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
  },
  stopStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stopStatText: { fontSize: 12 },

  transitBlock: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4, paddingLeft: 4 },
  transitLine: { flex: 1, height: 1 },
  transitPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  transitText: { fontSize: 11 },

  // Recipients
  emptyRecipients: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  emptyRecipientsText: { flex: 1, fontSize: 13, lineHeight: 18 },
  recipientList: { gap: 8 },
  recipientRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  recipientIcon: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  recipientInfo: { flex: 1 },
  recipientPhone: { fontSize: 14 },
  recipientMeta: { fontSize: 12, marginTop: 2 },
  viewedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  viewedText: { fontSize: 11 },

  shareOutsideBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 14,
  },
  shareOutsideBtnText: { fontSize: 15 },

  // Vote bar
  voteBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1,
    paddingVertical: 4, paddingHorizontal: 4,
  },
  voteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 10,
  },
  voteCount: { fontSize: 14 },
  voteDivider: { width: 1, height: 28, marginHorizontal: 4 },
});
