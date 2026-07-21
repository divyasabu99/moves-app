import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { useMoves } from '@/context/MovesContext';
import { GroupDetail, SharedMove, Move } from '@/types';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function SharedMoveCard({
  item, isMine, onDelete,
}: { item: SharedMove; isMine: boolean; onDelete: () => void }) {
  const colors = useColors();
  const dateLabel = new Date(item.move.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={[styles.sharedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sharedTop}>
        <View style={styles.sharedTopLeft}>
          <Text style={[styles.sharedVibe, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
            {item.move.vibe.toUpperCase()}
          </Text>
          <Text style={[styles.sharedBy, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {isMine ? 'You' : item.sharedBy.displayName} · {timeAgo(item.sharedAt)}
          </Text>
        </View>
        {isMine && (
          <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.sharedTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
        {item.move.title}
      </Text>
      <View style={styles.sharedMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {dateLabel}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {item.move.startTime}{item.move.endTime ? `–${item.move.endTime}` : ''}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {item.move.partySize}
          </Text>
        </View>
      </View>
      <View style={[styles.stopsPreview, { borderTopColor: colors.border }]}>
        {item.move.stops.slice(0, 3).map((stop, i) => (
          <View key={stop.placeId + i} style={styles.stopLine}>
            <View style={[styles.stopDot, { backgroundColor: i === 0 ? colors.primary : colors.border }]} />
            <Text style={[styles.stopName, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
              {stop.place.name}
            </Text>
          </View>
        ))}
        {item.move.stops.length > 3 && (
          <Text style={[styles.morePlaces, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            +{item.move.stops.length - 3} more
          </Text>
        )}
      </View>
    </View>
  );
}

export default function GroupDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useUser();
  const { moves } = useMoves();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [sharedMoves, setSharedMoves] = useState<SharedMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'moves' | 'members'>('moves');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  const fetchAll = useCallback(async () => {
    if (!id || !userId) return;
    try {
      const [gRes, mRes] = await Promise.all([
        fetch(`${BASE_URL()}/groups/${id}?userId=${encodeURIComponent(userId)}`),
        fetch(`${BASE_URL()}/groups/${id}/moves?userId=${encodeURIComponent(userId)}`),
      ]);
      if (gRes.ok) setGroup(await gRes.json());
      if (mRes.ok) setSharedMoves(await mRes.json());
    } catch { /* offline */ } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleShareMove = async (move: Move) => {
    if (!userId || !id) return;
    setSharingId(move.id);
    try {
      const res = await fetch(`${BASE_URL()}/groups/${id}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, move }),
      });
      if (!res.ok) throw new Error('Could not share.');
      await fetchAll();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShareModalVisible(false);
    } catch {
      Alert.alert('Error', 'Could not share this move. Try again.');
    } finally {
      setSharingId(null);
    }
  };

  const handleDeleteShared = async (shareId: string) => {
    try {
      await fetch(`${BASE_URL()}/groups/${id}/moves/${shareId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setSharedMoves(prev => prev.filter(s => s.id !== shareId));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert('Error', 'Could not remove. Try again.');
    }
  };

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

  if (!group) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Group not found</Text>
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
        <Text style={[styles.groupName, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
          {group.name}
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await Clipboard.setStringAsync(group.inviteCode);
            Haptics.selectionAsync();
            Alert.alert('Invite Code Copied', `Share code "${group.inviteCode}" with friends.`);
          }}
          activeOpacity={0.7}
          style={[styles.inviteBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="link-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.inviteCode, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>
            {group.inviteCode}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {(['moves', 'members'] as const).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} activeOpacity={0.7}
            style={[styles.tabBtn, t === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Text style={[styles.tabLabel, {
              color: t === tab ? colors.primary : colors.mutedForeground,
              fontFamily: t === tab ? 'Inter_600SemiBold' : 'Inter_400Regular',
            }]}>
              {t === 'moves' ? `Moves (${sharedMoves.length})` : `Members (${group.members.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'moves' ? (
        <>
          {sharedMoves.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="map-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>No moves shared yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Share one of your saved moves with this group.
              </Text>
            </View>
          ) : (
            <FlatList
              data={sharedMoves}
              keyExtractor={s => s.id}
              renderItem={({ item }) => (
                <SharedMoveCard
                  item={item}
                  isMine={item.sharedBy.id === userId}
                  onDelete={() => {
                    Alert.alert('Remove Move', 'Remove this move from the group?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => handleDeleteShared(item.id) },
                    ]);
                  }}
                />
              )}
              contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
              showsVerticalScrollIndicator={false}
            />
          )}
          {/* Share FAB */}
          {moves.length > 0 && (
            <TouchableOpacity
              onPress={() => setShareModalVisible(true)}
              activeOpacity={0.85}
              style={[styles.fab, { backgroundColor: colors.primary, bottom: botPad }]}
            >
              <Ionicons name="share-outline" size={20} color={colors.primaryForeground} />
              <Text style={[styles.fabText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                Share a Move
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <FlatList
          data={group.members}
          keyExtractor={m => m.id}
          contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
          renderItem={({ item }) => (
            <View style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.memberAvatar, { backgroundColor: item.id === group.createdBy ? colors.primary : colors.muted }]}>
                <Text style={[styles.memberAvatarText, { color: item.id === group.createdBy ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_700Bold' }]}>
                  {item.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                  {item.id === userId ? `${item.displayName} (you)` : item.displayName}
                </Text>
                <Text style={[styles.memberJoined, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  Joined {new Date(item.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              {item.id === group.createdBy && (
                <View style={[styles.ownerBadge, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.ownerText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Admin</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* Share move modal */}
      <Modal visible={shareModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.shareModal, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.shareModalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.shareModalTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              Share a Move
            </Text>
            <TouchableOpacity onPress={() => setShareModalVisible(false)} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={moves}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.shareList}
            renderItem={({ item }) => {
              const alreadyShared = sharedMoves.some(s => s.move.id === item.id && s.sharedBy.id === userId);
              const isSharing = sharingId === item.id;
              return (
                <TouchableOpacity
                  onPress={() => !alreadyShared && handleShareMove(item)}
                  activeOpacity={alreadyShared ? 1 : 0.75}
                  style={[styles.shareMoveRow, { backgroundColor: colors.card, borderColor: alreadyShared ? colors.border : colors.border, opacity: alreadyShared ? 0.6 : 1 }]}
                >
                  <View style={styles.shareMoveInfo}>
                    <Text style={[styles.shareMoveVibe, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>
                      {item.vibe}
                    </Text>
                    <Text style={[styles.shareMoveTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.shareMoveMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {item.stops.length} stops
                    </Text>
                  </View>
                  {isSharing ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : alreadyShared ? (
                    <View style={[styles.sharedBadge, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.sharedBadgeText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Shared</Text>
                    </View>
                  ) : (
                    <View style={[styles.shareChip, { backgroundColor: colors.primary }]}>
                      <Ionicons name="share-outline" size={14} color={colors.primaryForeground} />
                      <Text style={[styles.shareChipText, { color: colors.primaryForeground, fontFamily: 'Inter_500Medium' }]}>Share</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  groupName: { flex: 1, fontSize: 18 },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  inviteCode: { fontSize: 12, letterSpacing: 1.5 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 14 },
  list: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 18, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  notFound: { fontSize: 16 },
  // Shared move card
  sharedCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  sharedTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sharedTopLeft: { gap: 2 },
  sharedVibe: { fontSize: 10, letterSpacing: 1 },
  sharedBy: { fontSize: 12 },
  deleteBtn: { padding: 4 },
  sharedTitle: { fontSize: 18, lineHeight: 22 },
  sharedMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },
  stopsPreview: { borderTopWidth: 1, paddingTop: 8, gap: 4 },
  stopLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  stopDot: { width: 6, height: 6, borderRadius: 3 },
  stopName: { fontSize: 13, flex: 1 },
  morePlaces: { fontSize: 12, marginLeft: 13 },
  // Member row
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontSize: 18 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15 },
  memberJoined: { fontSize: 12, marginTop: 2 },
  ownerBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ownerText: { fontSize: 11 },
  // FAB
  fab: {
    position: 'absolute', right: 20, flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  fabText: { fontSize: 15 },
  // Share modal
  shareModal: { flex: 1 },
  shareModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1,
  },
  shareModalTitle: { fontSize: 18 },
  shareList: { padding: 16, gap: 10 },
  shareMoveRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 12,
  },
  shareMoveInfo: { flex: 1 },
  shareMoveVibe: { fontSize: 10, letterSpacing: 1 },
  shareMoveTitle: { fontSize: 16, marginTop: 2 },
  shareMoveMeta: { fontSize: 12, marginTop: 2 },
  sharedBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  sharedBadgeText: { fontSize: 12 },
  shareChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  shareChipText: { fontSize: 13 },
});
