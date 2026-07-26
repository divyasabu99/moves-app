import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useMoves } from '@/context/MovesContext';
import { useUser } from '@/context/UserContext';
import { Stop, TransitMode, BudgetLevel } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/itinerary';
import { ShareMoveSheet } from '@/components/ShareMoveSheet';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const BUDGET_LABELS: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

const TRANSIT_META: Record<TransitMode, { icon: string; label: string }> = {
  walk:      { icon: 'walk-outline',  label: 'Walk' },
  subway:    { icon: 'train-outline', label: 'Subway' },
  rideshare: { icon: 'car-outline',   label: 'Rideshare' },
};

const TRANSIT_COLORS: Record<TransitMode, string> = {
  walk:      '#4CAF82',
  subway:    '#5B9CF6',
  rideshare: '#FF8C42',
};

function budgetDisplay(levels: BudgetLevel[]): string {
  if (!levels.length) return '$$';
  if (levels.length === 1) return BUDGET_LABELS[levels[0]];
  const s = [...levels].sort();
  return `${BUDGET_LABELS[s[0]]}–${BUDGET_LABELS[s[s.length - 1]]}`;
}

/** Parse "7:00 PM" → total minutes from midnight */
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

/** Total minutes from midnight → "7:00 PM" */
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

// ── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  '#E94057', '#5B9CF6', '#4CAF82', '#FF8C42', '#9B59B6',
  '#F39C12', '#1ABC9C', '#E74C3C',
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MoveDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { moves, updateMoveStatus, removeMove } = useMoves();
  const { user } = useUser();

  const move = moves.find(m => m.id === id);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareRecipientCount, setShareRecipientCount] = useState(0);

  // Load share stats when screen mounts (non-blocking)
  useEffect(() => {
    if (!move || !user?.token) return;
    fetch(`${BASE_URL()}/share/stats/${move.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then((d: any) => { if (d?.shared) setShareRecipientCount(d.recipientCount ?? 0); })
      .catch(() => {}); // non-critical
  }, [move?.id, user?.token]);

  const handleShared = useCallback((_token: string, _url: string, count: number) => {
    setShareRecipientCount(prev => prev + count);
  }, []);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 48);

  const stopTimes = useMemo(
    () => move ? computeStopTimes(move.startTime, move.stops) : [],
    [move],
  );

  const totalMins = useMemo(
    () => move?.stops.reduce((s, stop) => s + stop.estimatedDurationMinutes + (stop.transitToNext?.estimatedMinutes ?? 0), 0) ?? 0,
    [move],
  );

  if (!move) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={[{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 16 }]}>
            Move not found
          </Text>
        </View>
      </View>
    );
  }

  const isDone = move.status === 'done';
  const dateLabel = new Date(move.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const hoods: string[] = Array.isArray(move.neighborhood)
    ? move.neighborhood
    : move.neighborhood ? [move.neighborhood as string] : [];

  const totalCost = move.totalEstimatedCostPerPerson * move.partySize;

  const handleToggleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateMoveStatus(move.id, isDone ? 'saved' : 'done');
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeMove(move.id);
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, {
        paddingTop: topPad,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.vibePill, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
            <Text style={[styles.vibeText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              {move.vibe.toUpperCase()}
            </Text>
          </View>
          {isDone && (
            <View style={[styles.donePill, { backgroundColor: '#4CAF8222', borderColor: '#4CAF8255' }]}>
              <Ionicons name="checkmark-circle" size={12} color="#4CAF82" />
              <Text style={[styles.donePillText, { color: '#4CAF82', fontFamily: 'Inter_600SemiBold' }]}>Done</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowShareSheet(true)} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            {move.title}
          </Text>
          {shareRecipientCount > 0 && (
            <TouchableOpacity
              onPress={() => setShowShareSheet(true)}
              activeOpacity={0.7}
              style={[styles.sharedPill, { backgroundColor: '#5B9CF622', borderColor: '#5B9CF644' }]}
            >
              <Ionicons name="paper-plane-outline" size={12} color="#5B9CF6" />
              <Text style={[styles.sharedPillText, { color: '#5B9CF6', fontFamily: 'Inter_500Medium' }]}>
                Shared with {shareRecipientCount} {shareRecipientCount === 1 ? 'person' : 'people'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.heroMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                {dateLabel}
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

        {/* ── Quick stats row ── */}
        <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              {move.stops.length}
            </Text>
            <Text style={[styles.statLab, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              stops
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              ~${move.totalEstimatedCostPerPerson}
            </Text>
            <Text style={[styles.statLab, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              per person
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: colors.accent, fontFamily: 'Inter_700Bold' }]}>
              ~${totalCost}
            </Text>
            <Text style={[styles.statLab, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              total
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              {budgetDisplay(move.budgetLevel)}
            </Text>
            <Text style={[styles.statLab, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              budget
            </Text>
          </View>
        </View>

        {/* ── People ── */}
        <SectionBlock label="PEOPLE">
          <View style={[styles.peopleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.avatarRow}>
              {Array.from({ length: move.partySize }).map((_, i) => {
                const isUser = i === 0;
                const name = isUser && user?.displayName ? user.displayName : `Guest ${i}`;
                const color = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
                return (
                  <View key={i} style={[styles.avatar, { backgroundColor: color + '33', borderColor: color + '66' }]}>
                    <Text style={[styles.avatarText, { color, fontFamily: 'Inter_700Bold' }]}>
                      {isUser && user?.displayName ? initials(user.displayName) : `+${i}`}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.peopleInfo}>
              <Text style={[styles.peopleLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                {move.partySize} {move.partySize === 1 ? 'person' : 'people'}
              </Text>
              {move.groupName ? (
                <View style={styles.groupBadgeRow}>
                  <Ionicons name="people-outline" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.groupBadgeText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {move.groupName}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.peopleSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  Personal move
                </Text>
              )}
            </View>
          </View>
        </SectionBlock>

        {/* ── Schedule ── */}
        <SectionBlock label="SCHEDULE">
          {move.stops.map((stop, i) => {
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
                {/* Time column */}
                <View style={styles.timeCol}>
                  <Text style={[styles.timeText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
                    {times ? minsToStr(times.arrivalMins) : ''}
                  </Text>
                </View>

                {/* Rail + card column */}
                <View style={styles.railCol}>
                  {/* Dot */}
                  <View style={[styles.railDot, { backgroundColor: colors.primary, borderColor: colors.background }]} />
                  {/* Vertical line */}
                  {!isLast && <View style={[styles.railLine, { backgroundColor: colors.border }]} />}

                  {/* Stop card */}
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
                        <View style={styles.stopNameRow}>
                          <Text
                            style={[styles.stopName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}
                            numberOfLines={1}
                          >
                            {stop.place.name}
                          </Text>
                          {isSuggested && (
                            <View style={[styles.aiPill, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
                              <Ionicons name="sparkles" size={9} color={colors.primary} />
                              <Text style={[styles.aiPillText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>AI</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.stopSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                          {stop.place.neighborhood} · {CATEGORY_LABELS[stop.place.category]}
                        </Text>
                      </View>
                      <Text style={[styles.stopBudget, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
                        {BUDGET_LABELS[stop.place.priceLevel]}
                      </Text>
                    </View>
                    <View style={[styles.stopCardFooter, { borderTopColor: colors.border }]}>
                      <View style={styles.stopStat}>
                        <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.stopStatText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                          {dur}
                        </Text>
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
                        <Ionicons
                          name={TRANSIT_META[transit.mode].icon as any}
                          size={13}
                          color={TRANSIT_COLORS[transit.mode]}
                        />
                        <Text style={[styles.transitText, { color: TRANSIT_COLORS[transit.mode], fontFamily: 'Inter_500Medium' }]}>
                          {transit.estimatedMinutes} min {TRANSIT_META[transit.mode].label}
                        </Text>
                      </View>
                      <View style={[styles.transitLine, { backgroundColor: colors.border }]} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* End time */}
          {stopTimes.length > 0 && (
            <View style={styles.timelineRow}>
              <View style={styles.timeCol}>
                <Text style={[styles.timeText, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  {minsToStr(stopTimes[stopTimes.length - 1].departureMins +
                    (move.stops[move.stops.length - 1].transitToNext?.estimatedMinutes ?? 0))}
                </Text>
              </View>
              <View style={styles.railCol}>
                <View style={[styles.railDotSmall, { backgroundColor: colors.border }]} />
                <Text style={[styles.endLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  End of move
                </Text>
              </View>
            </View>
          )}
        </SectionBlock>

        {/* ── Action ── */}
        <TouchableOpacity
          onPress={() => setShowShareSheet(true)}
          activeOpacity={0.85}
          style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="paper-plane-outline" size={17} color={colors.foreground} />
          <Text style={[styles.shareBtnText, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            Share this move
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleToggleDone}
          activeOpacity={0.85}
          style={[styles.doneBtn, {
            backgroundColor: isDone ? colors.muted : colors.primary,
            borderColor: isDone ? colors.border : 'transparent',
          }]}
        >
          <Ionicons
            name={isDone ? 'refresh-outline' : 'checkmark-circle-outline'}
            size={18}
            color={isDone ? colors.mutedForeground : colors.primaryForeground}
          />
          <Text style={[styles.doneBtnText, {
            color: isDone ? colors.mutedForeground : colors.primaryForeground,
            fontFamily: 'Inter_600SemiBold',
          }]}>
            {isDone ? 'Mark as Upcoming' : 'Mark as Done'}
          </Text>
        </TouchableOpacity>
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

// ── Section block helper ──────────────────────────────────────────────────────

function SectionBlock({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vibePill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  vibeText: { fontSize: 11, letterSpacing: 1.4 },
  donePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  donePillText: { fontSize: 11 },

  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 28 },

  // Hero
  hero: { gap: 12 },
  heroTitle: { fontSize: 28, lineHeight: 34 },
  heroMeta: { gap: 7 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14 },

  // Stats row
  statsRow: {
    flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center',
  },
  statCell: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 17 },
  statLab: { fontSize: 10, letterSpacing: 0.3 },
  statDivider: { width: 1, height: 32, marginHorizontal: 4 },

  // Section
  section: { gap: 14 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5 },

  // People
  peopleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  avatarRow: { flexDirection: 'row', gap: -6 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: 14 },
  peopleInfo: { flex: 1, gap: 3 },
  peopleLabel: { fontSize: 15 },
  peopleSub: { fontSize: 13 },
  groupBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  groupBadgeText: { fontSize: 13 },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: 12 },
  timeCol: {
    width: 72, alignItems: 'flex-end', paddingTop: 6,
  },
  timeText: { fontSize: 12 },
  railCol: { flex: 1, alignItems: 'flex-start', gap: 0 },
  railDot: {
    width: 12, height: 12, borderRadius: 6, borderWidth: 2,
    marginTop: 2, marginLeft: 2,
  },
  railDotSmall: {
    width: 8, height: 8, borderRadius: 4,
    marginTop: 4, marginLeft: 4,
  },
  railLine: {
    width: 2, flex: 1, minHeight: 12,
    marginLeft: 7, marginTop: 2,
  },
  stopCard: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    overflow: 'hidden', marginLeft: 8, marginBottom: 0,
    alignSelf: 'stretch',
  },
  stopCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
  },
  stopIconWrap: {
    width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  stopCardInfo: { flex: 1, gap: 2 },
  stopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  stopName: { fontSize: 14, flexShrink: 1 },
  stopSub: { fontSize: 11 },
  stopBudget: { fontSize: 13 },
  aiPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1,
  },
  aiPillText: { fontSize: 10 },
  stopCardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 12, paddingBottom: 10, paddingTop: 8,
    borderTopWidth: 1,
  },
  stopStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stopStatText: { fontSize: 12 },

  // Transit
  transitBlock: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginLeft: 8, marginTop: 4, marginBottom: 4,
  },
  transitLine: { flex: 1, height: 1 },
  transitPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  transitText: { fontSize: 12 },

  endLabel: { fontSize: 13, marginLeft: 8, marginTop: 4 },

  // Shared pill
  sharedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  sharedPillText: { fontSize: 12 },

  // Share button
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  shareBtnText: { fontSize: 15 },

  // Done button
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14, borderWidth: 1,
  },
  doneBtnText: { fontSize: 15 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
