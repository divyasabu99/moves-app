import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { StopCard } from '@/components/StopCard';
import { usePlaces } from '@/context/PlacesContext';
import { useMoves } from '@/context/MovesContext';
import { useUser } from '@/context/UserContext';
import { generateItineraries, VIBE_SEQUENCES } from '@/lib/itinerary';
import { PlanInput, GeneratedItinerary, Move, Group, Place, GroupMemberPlaces } from '@/types';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

// ── Share-to-group bottom sheet ───────────────────────────────────────────────
function ShareSheet({
  move,
  visible,
  onClose,
}: {
  move: Move | null;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useUser();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharedTo, setSharedTo] = useState<Set<string>>(new Set());
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`${BASE_URL()}/groups?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error();
      setGroups(await res.json());
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch groups whenever sheet opens
  React.useEffect(() => {
    if (visible) {
      setSharedTo(new Set());
      fetchGroups();
    }
  }, [visible, fetchGroups]);

  const handleShare = async (group: Group) => {
    if (!move || !userId || sharedTo.has(group.id)) return;
    setSharingId(group.id);
    try {
      const res = await fetch(`${BASE_URL()}/groups/${group.id}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, move }),
      });
      if (!res.ok) throw new Error();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSharedTo(prev => new Set(prev).add(group.id));
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSharingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
        {/* Sheet header */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.sheetTitleRow}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                Share to a Group
              </Text>
              {move && (
                <Text style={[styles.sheetMoveName, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                  {move.title}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.sheetCenter}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : fetchError ? (
          <View style={styles.sheetCenter}>
            <Ionicons name="wifi-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.sheetEmptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Couldn't load groups.
            </Text>
            <TouchableOpacity onPress={fetchGroups} activeOpacity={0.7}
              style={[styles.retryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.retryText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.sheetCenter}>
            <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.sheetEmptyTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
              No groups yet
            </Text>
            <Text style={[styles.sheetEmptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Create or join a group in the Groups tab to share moves with friends.
            </Text>
            <TouchableOpacity
              onPress={() => { onClose(); router.push('/(tabs)/groups'); }}
              activeOpacity={0.8}
              style={[styles.goGroupsBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="people" size={15} color={colors.primaryForeground} />
              <Text style={[styles.goGroupsBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                Go to Groups
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={groups}
            keyExtractor={g => g.id}
            contentContainerStyle={styles.groupList}
            renderItem={({ item }) => {
              const isShared = sharedTo.has(item.id);
              const isSharing = sharingId === item.id;
              return (
                <TouchableOpacity
                  onPress={() => handleShare(item)}
                  disabled={isShared || isSharing}
                  activeOpacity={0.75}
                  style={[styles.groupRow, {
                    backgroundColor: isShared ? colors.muted : colors.card,
                    borderColor: isShared ? colors.border : colors.border,
                  }]}
                >
                  {/* Avatar */}
                  <View style={[styles.groupAvatar, {
                    backgroundColor: isShared ? colors.border : colors.primary,
                  }]}>
                    {isShared
                      ? <Ionicons name="checkmark" size={18} color={colors.mutedForeground} />
                      : <Text style={[styles.groupAvatarLetter, { color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }]}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                    }
                  </View>

                  {/* Info */}
                  <View style={styles.groupRowInfo}>
                    <Text style={[styles.groupRowName, {
                      color: isShared ? colors.mutedForeground : colors.foreground,
                      fontFamily: 'Inter_600SemiBold',
                    }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.groupRowMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
                    </Text>
                  </View>

                  {/* Action */}
                  {isSharing ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : isShared ? (
                    <Text style={[styles.sharedLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                      Shared
                    </Text>
                  ) : (
                    <View style={[styles.shareChip, { backgroundColor: colors.primary }]}>
                      <Ionicons name="share-outline" size={13} color={colors.primaryForeground} />
                      <Text style={[styles.shareChipText, { color: colors.primaryForeground, fontFamily: 'Inter_500Medium' }]}>
                        Share
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plan: planParam } = useLocalSearchParams<{ plan: string }>();
  const { places } = usePlaces();
  const { moves, saveMove } = useMoves();
  const { userId } = useUser();

  // Track saved Move objects per card index
  const [savedMoves, setSavedMoves] = useState<Map<number, Move>>(new Map());
  // Which card is currently open in the share sheet
  const [shareTarget, setShareTarget] = useState<Move | null>(null);

  const plan = useMemo<PlanInput | null>(() => {
    if (!planParam) return null;
    try { return JSON.parse(planParam) as PlanInput; }
    catch { return null; }
  }, [planParam]);

  const [aiSuggestions, setAiSuggestions] = useState<Place[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // Group member places for group-aware scoring
  const [groupMemberPlaces, setGroupMemberPlaces] = useState<GroupMemberPlaces[]>([]);
  const [groupSyncLoading, setGroupSyncLoading] = useState(false);

  // Build the set of place keys the user has already visited (marked done)
  const visitedPlaceKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const move of moves) {
      if (move.status !== 'done') continue;
      for (const stop of move.stops) {
        const name = stop.place.name.trim().toLowerCase();
        const hood = stop.place.neighborhood.trim().toLowerCase();
        keys.add(`${name}|${hood}`);
      }
    }
    return keys;
  }, [moves]);

  const itineraries = useMemo(() => {
    if (!plan) return [] as GeneratedItinerary[];
    return generateItineraries(
      [...places, ...aiSuggestions],
      plan,
      groupMemberPlaces.length > 0 ? groupMemberPlaces : undefined,
      visitedPlaceKeys,
    );
  }, [plan, places, aiSuggestions, groupMemberPlaces, visitedPlaceKeys]);

  // Sync own places + fetch group members' places when a group is selected
  useEffect(() => {
    if (!plan?.groupId || !userId) return;
    setGroupSyncLoading(true);
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    fetch(`https://${domain}/api/groups/${plan.groupId}/sync-places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, places }),
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.members)) {
          setGroupMemberPlaces(data.members as GroupMemberPlaces[]);
        }
      })
      .catch(() => {})
      .finally(() => setGroupSyncLoading(false));
  }, [plan?.groupId, userId]);

  // Fetch AI-suggested places when "suggest new" is on
  useEffect(() => {
    if (!plan || plan.savedOnly !== false) return;
    const categories = [...new Set((VIBE_SEQUENCES[plan.vibe] ?? VIBE_SEQUENCES['Dinner & Drinks']).flat())];
    const excludeNames = places.map(p => p.name);
    setLoadingAI(true);
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    fetch(`https://${domain}/api/suggest-places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vibe: plan.vibe,
        neighborhoods: plan.neighborhood,
        budgetLevel: plan.budgetLevel,
        categories,
        excludeNames,
      }),
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.places)) setAiSuggestions(data.places); })
      .catch(() => {})
      .finally(() => setLoadingAI(false));
  }, [plan?.vibe, plan?.savedOnly]);

  const handleSave = (itinerary: GeneratedItinerary, index: number) => {
    if (!plan || savedMoves.has(index)) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const saved = saveMove(itinerary, plan);
    setSavedMoves(prev => new Map(prev).set(index, saved));
  };

  const dateLabel = plan
    ? new Date(plan.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
      })
    : '';

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  // Neighborhood display
  const neighborhoodLabel = plan
    ? (Array.isArray(plan.neighborhood) && plan.neighborhood.length > 0
        ? plan.neighborhood.join(', ')
        : typeof plan.neighborhood === 'string' && plan.neighborhood !== 'Any'
          ? plan.neighborhood
          : null)
    : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: topPad,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            Your Moves
          </Text>
          {plan && (
            <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {plan.vibe} · {dateLabel}
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {itineraries.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={44} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            No matches found
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Add more places to your collection so we can build a move.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/add-place')}
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={colors.primaryForeground} />
            <Text style={[styles.emptyBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
              Add Places
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Plan summary */}
          {plan && (
            <View style={styles.planMeta}>
              <View style={styles.planMetaItem}>
                <Ionicons name="people-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.planMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {plan.partySize} {plan.partySize === 1 ? 'person' : 'people'}
                </Text>
              </View>
              <View style={styles.planMetaItem}>
                <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.planMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  {plan.startTime}–{plan.endTime}
                </Text>
              </View>
              {neighborhoodLabel && (
                <View style={styles.planMetaItem}>
                  <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.planMetaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {neighborhoodLabel}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Group sync banner */}
          {plan?.groupId && (
            <View style={[styles.groupBanner, {
              backgroundColor: colors.primary + '14',
              borderColor: colors.primary + '44',
            }]}>
              <Ionicons name="people" size={14} color={colors.primary} />
              {groupSyncLoading ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 2 }} />
                  <Text style={[styles.groupBannerText, { color: colors.primary, fontFamily: 'Inter_400Regular' }]}>
                    Syncing {plan.groupName ?? 'group'} places…
                  </Text>
                </>
              ) : (
                <Text style={[styles.groupBannerText, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                  {groupMemberPlaces.length > 0
                    ? `Scored with ${plan.groupName ?? 'group'} · ${groupMemberPlaces.length} member${groupMemberPlaces.length !== 1 ? 's' : ''} factored in`
                    : `Planned with ${plan.groupName ?? 'group'} · invite members to add their places`}
                </Text>
              )}
            </View>
          )}

          {itineraries.map((itinerary, idx) => {
            const saved = savedMoves.get(idx);
            const isSaved = !!saved;

            return (
              <View
                key={idx}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <View style={[styles.optionBadge, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.optionNum, { color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }]}>
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={styles.cardTitleInfo}>
                      <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                        {itinerary.title}
                      </Text>
                      <Text style={[styles.cardDesc, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                        {itinerary.description}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.totalCost, { color: colors.accent, fontFamily: 'Inter_700Bold' }]}>
                    ~${itinerary.totalEstimatedCostPerPerson}
                    <Text style={[styles.costSub, { color: colors.mutedForeground }]}>/pp</Text>
                  </Text>
                </View>

                <View style={styles.stops}>
                  {itinerary.stops.map((stop, i) => (
                    <StopCard
                      key={stop.placeId + i}
                      stop={stop}
                      index={i}
                      isLast={i === itinerary.stops.length - 1}
                    />
                  ))}
                </View>

                {/* Action row — save + optional share */}
                {isSaved ? (
                  <View style={styles.savedRow}>
                    {/* Saved indicator */}
                    <View style={[styles.savedBadge, { backgroundColor: colors.muted, flex: 1 }]}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.mutedForeground} />
                      <Text style={[styles.savedBadgeText, {
                        color: colors.mutedForeground, fontFamily: 'Inter_500Medium',
                      }]}>
                        Saved
                      </Text>
                    </View>
                    {/* Share button — only if user has an identity */}
                    {userId ? (
                      <TouchableOpacity
                        onPress={() => { Haptics.selectionAsync(); setShareTarget(saved); }}
                        activeOpacity={0.8}
                        style={[styles.shareBtn, { backgroundColor: colors.accent }]}
                      >
                        <Ionicons name="share-outline" size={16} color={colors.accentForeground} />
                        <Text style={[styles.shareBtnText, {
                          color: colors.accentForeground, fontFamily: 'Inter_600SemiBold',
                        }]}>
                          Share to Group
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleSave(itinerary, idx)}
                    activeOpacity={0.8}
                    style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="bookmark-outline" size={16} color={colors.primaryForeground} />
                    <Text style={[styles.saveBtnText, {
                      color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold',
                    }]}>
                      Save This Move
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Share sheet */}
      <ShareSheet
        move={shareTarget}
        visible={!!shareTarget}
        onClose={() => setShareTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, gap: 8,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 18 },
  headerSub: { fontSize: 12, textAlign: 'center' },
  scroll: { padding: 16, gap: 16 },
  planMeta: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginBottom: 4 },
  planMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planMetaText: { fontSize: 13 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14 },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 8,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  optionBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  optionNum: { fontSize: 14 },
  cardTitleInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 18, lineHeight: 22 },
  cardDesc: { fontSize: 12 },
  totalCost: { fontSize: 16 },
  costSub: { fontSize: 13 },
  stops: { gap: 0 },
  // Save button (pre-save)
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
  },
  saveBtnText: { fontSize: 14 },
  // Post-save row
  savedRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, borderRadius: 12,
  },
  savedBadgeText: { fontSize: 14 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12,
  },
  shareBtnText: { fontSize: 14 },
  // Group banner
  groupBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 4,
  },
  groupBannerText: { fontSize: 12, flex: 1, lineHeight: 16 },
  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 20, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  emptyBtnText: { fontSize: 14 },
  // Share sheet
  sheet: { flex: 1 },
  sheetHeader: { borderBottomWidth: 1 },
  sheetHandleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2 },
  sheetTitleRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  sheetTitle: { fontSize: 20 },
  sheetMoveName: { fontSize: 13, marginTop: 3 },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  sheetCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14 },
  sheetEmptyTitle: { fontSize: 18, textAlign: 'center' },
  sheetEmptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  goGroupsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4,
  },
  goGroupsBtnText: { fontSize: 14 },
  retryBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  retryText: { fontSize: 14 },
  groupList: { padding: 16, gap: 10 },
  groupRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  groupAvatar: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
  },
  groupAvatarLetter: { fontSize: 18 },
  groupRowInfo: { flex: 1 },
  groupRowName: { fontSize: 15 },
  groupRowMeta: { fontSize: 12, marginTop: 2 },
  shareChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
  },
  shareChipText: { fontSize: 13 },
  sharedLabel: { fontSize: 13 },
});
