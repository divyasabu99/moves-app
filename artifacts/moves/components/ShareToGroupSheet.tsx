import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { Move, Group } from '@/types';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface Props {
  move: Move | null;
  visible: boolean;
  onClose: () => void;
  onShared?: (groupId: string) => void;
}

export function ShareToGroupSheet({ move, visible, onClose, onShared }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId, user } = useUser();

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

  // Fetch groups whenever sheet opens; reset shared state
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token ?? ''}`,
        },
        body: JSON.stringify({ move }),
      });
      if (!res.ok) throw new Error();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSharedTo(prev => new Set(prev).add(group.id));
      onShared?.(group.id);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSharingId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 24 }]}>
        {/* Header */}
        <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.sheetTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                Share to a Group
              </Text>
              {move && (
                <Text
                  style={[styles.sheetMoveName, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}
                  numberOfLines={1}
                >
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
            <TouchableOpacity
              onPress={fetchGroups}
              activeOpacity={0.7}
              style={[styles.retryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.retryText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
                Retry
              </Text>
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
                    borderColor: colors.border,
                  }]}
                >
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
                  <View style={styles.groupRowInfo}>
                    <Text
                      style={[styles.groupRowName, {
                        color: isShared ? colors.mutedForeground : colors.foreground,
                        fontFamily: 'Inter_600SemiBold',
                      }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.groupRowMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                      {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
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

const styles = StyleSheet.create({
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
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
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
