import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  Platform, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
// expo-contacts is native-only — imported dynamically inside openContactsPicker after web guard
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
  item, isMine, groupId, onDelete, onPress,
}: { item: SharedMove; isMine: boolean; groupId: string; onDelete: () => void; onPress: () => void }) {
  const colors = useColors();
  const dateLabel = new Date(item.move.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.sharedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); onDelete(); }} activeOpacity={0.7} style={styles.deleteBtn}>
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
      {/* Split Bill button */}
      <TouchableOpacity
        onPress={(e) => { e.stopPropagation?.(); router.push({ pathname: '/receipt', params: { shareId: item.id, groupId } }); }}
        activeOpacity={0.75}
        style={[styles.splitBtn, { borderTopColor: colors.border }]}
      >
        <Ionicons name="receipt-outline" size={14} color={colors.primary} />
        <Text style={[styles.splitBtnText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
          Split the Bill
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function GroupDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId, user } = useUser();
  const { moves } = useMoves();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [sharedMoves, setSharedMoves] = useState<SharedMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'moves' | 'members'>('moves');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Contacts picker
  const [contactsVisible, setContactsVisible] = useState(false);
  const [contacts, setContacts] = useState<NativeContact[]>([]);
  const [contactsSearch, setContactsSearch] = useState('');
  const [contactsLoading, setContactsLoading] = useState(false);
  const [addingContact, setAddingContact] = useState<string | null>(null); // contactId being added

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  const fetchAll = useCallback(async () => {
    if (!id || !userId) return;
    const authHeader = { Authorization: `Bearer ${user?.token ?? ''}` };
    try {
      const [gRes, mRes] = await Promise.all([
        fetch(`${BASE_URL()}/groups/${id}?userId=${encodeURIComponent(userId)}`, { headers: authHeader }),
        fetch(`${BASE_URL()}/groups/${id}/moves?userId=${encodeURIComponent(userId)}`, { headers: authHeader }),
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token ?? ''}` },
        body: JSON.stringify({ move }),
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

  const handleRemoveMember = (memberId: string, displayName: string) => {
    Alert.alert(
      'Remove member',
      `Remove ${displayName} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${BASE_URL()}/groups/${id}/members/${memberId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token ?? ''}` },
              });
              if (!res.ok) {
                const j = await res.json();
                Alert.alert('Error', j.error ?? 'Could not remove member.');
                return;
              }
              setGroup(prev => prev
                ? { ...prev, members: prev.members.filter(m => m.id !== memberId) }
                : prev
              );
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {
              Alert.alert('Error', 'Could not remove member. Try again.');
            }
          },
        },
      ]
    );
  };

  const openContactsPicker = async () => {
    if (Platform.OS === 'web') {
      // Web: just copy invite code
      await Clipboard.setStringAsync(group?.inviteCode ?? '');
      Alert.alert('Invite code copied', `Share the code "${group?.inviteCode}" with friends so they can join.`);
      return;
    }
    const Contacts = await import('expo-contacts');
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Contacts access needed', 'Allow contacts access in Settings so you can invite friends directly.');
      return;
    }
    setContactsLoading(true);
    setContactsVisible(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.Emails],
        sort: Contacts.SortTypes.FirstName,
      });
      // Only show contacts that have at least one email
      setContacts(data.filter(c => c.emails && c.emails.length > 0));
    } catch {
      Alert.alert('Error', 'Could not load contacts.');
      setContactsVisible(false);
    } finally {
      setContactsLoading(false);
    }
  };

  const filteredContacts = useMemo(() => {
    const q = contactsSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(c =>
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.emails ?? []).some(e => e.email?.toLowerCase().includes(q))
    );
  }, [contacts, contactsSearch]);

  const alreadyMemberIds = useMemo(() => new Set(group?.members.map(m => m.id) ?? []), [group?.members]);

  const handleInviteContact = async (contact: NativeContact) => {
    const email = contact.emails?.[0]?.email;
    if (!email || !group || !userId) return;

    const contactKey = contact.id ?? email;
    setAddingContact(contactKey);
    try {
      // Look up whether this email is a MOVES user (auth-gated, scoped to this group)
      const token = user?.token ?? '';
      const lookupRes = await fetch(
        `${BASE_URL()}/users/lookup?email=${encodeURIComponent(email)}&groupId=${encodeURIComponent(id as string)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const lookup = await lookupRes.json();

      if (lookup.found) {
        if (alreadyMemberIds.has(lookup.userId)) {
          Alert.alert('Already a member', `${lookup.displayName} is already in the group.`);
          return;
        }
        // Add them directly
        const addRes = await fetch(`${BASE_URL()}/groups/${id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token ?? ''}` },
          body: JSON.stringify({ targetUserId: lookup.userId }),
        });
        if (addRes.ok) {
          await fetchAll();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Added!', `${lookup.displayName} has been added to the group.`);
        } else {
          const j = await addRes.json();
          Alert.alert('Error', j.error ?? 'Could not add member.');
        }
      } else {
        // Not on MOVES — share invite via native share sheet
        setContactsVisible(false);
        await Share.share({
          message: `Join my group on MOVES! Use invite code: ${group.inviteCode}`,
          title: `Join ${group.name} on MOVES`,
        });
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Try again.');
    } finally {
      setAddingContact(null);
    }
  };

  const handleRename = async () => {
    if (!renameText.trim() || !group) return;
    setRenaming(true);
    try {
      const res = await fetch(`${BASE_URL()}/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token ?? ''}` },
        body: JSON.stringify({ name: renameText.trim() }),
      });
      if (!res.ok) {
        const j = await res.json();
        Alert.alert('Error', j.error ?? 'Could not rename group.');
        return;
      }
      const { name } = await res.json();
      setGroup(prev => prev ? { ...prev, name } : prev);
      setRenameVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Could not rename group. Try again.');
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteShared = async (shareId: string) => {
    try {
      await fetch(`${BASE_URL()}/groups/${id}/moves/${shareId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token ?? ''}` },
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
        <View style={styles.groupNameRow}>
          <Text style={[styles.groupName, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
            {group.name}
          </Text>
          {userId === group.createdBy && (
            <TouchableOpacity
              onPress={() => { setRenameText(group.name); setRenameVisible(true); }}
              activeOpacity={0.7}
              style={styles.renameIconBtn}
            >
              <Ionicons name="pencil-outline" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
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
                  groupId={id ?? ''}
                  onPress={() => router.push({
                    pathname: '/group-move-detail',
                    params: { shareId: item.id, groupId: id },
                  })}
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
        <>
          {/* Add Members button */}
          <TouchableOpacity
            onPress={openContactsPicker}
            activeOpacity={0.85}
            style={[styles.addMembersBtn, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginTop: 12 }]}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.primary} />
            <Text style={[styles.addMembersBtnText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
              Add Members
            </Text>
          </TouchableOpacity>

          <FlatList
          data={group.members}
          keyExtractor={m => m.id}
          contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
          renderItem={({ item }) => {
            const isLeader = item.id === group.createdBy;
            const iAmLeader = userId === group.createdBy;
            const canRemove = iAmLeader && !isLeader;
            return (
              <View style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.memberAvatar, { backgroundColor: isLeader ? colors.primary : colors.muted }]}>
                  <Text style={[styles.memberAvatarText, { color: isLeader ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_700Bold' }]}>
                    {item.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                    {item.id === userId ? `${item.displayName} (you)` : item.displayName}
                  </Text>
                  <Text style={[styles.memberJoined, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {isLeader ? 'Group Leader' : `Joined ${new Date(item.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </Text>
                </View>
                {isLeader ? (
                  <View style={[styles.ownerBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
                    <Ionicons name="shield-checkmark-outline" size={11} color={colors.primary} />
                    <Text style={[styles.ownerText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Leader</Text>
                  </View>
                ) : canRemove ? (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(item.id, item.displayName)}
                    activeOpacity={0.7}
                    style={styles.removeMemberBtn}
                  >
                    <Ionicons name="person-remove-outline" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
        />
        </>
      )}

      {/* Contacts picker modal */}
      <Modal visible={contactsVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setContactsVisible(false)}>
        <View style={[styles.contactsModal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.contactsHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
            <Text style={[styles.contactsTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>Add Members</Text>
            <TouchableOpacity onPress={() => setContactsVisible(false)} activeOpacity={0.7} style={styles.contactsCloseBtn}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.contactsSearchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
            <TextInput
              value={contactsSearch}
              onChangeText={setContactsSearch}
              placeholder="Search contacts..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.contactsSearchInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              autoCorrect={false}
            />
            {contactsSearch.length > 0 && (
              <TouchableOpacity onPress={() => setContactsSearch('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>

          {contactsLoading ? (
            <View style={styles.contactsCenter}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 10, fontSize: 14 }]}>Loading contacts…</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.contactsCenter}>
              <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
              <Text style={[{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 10, fontSize: 14, textAlign: 'center' }]}>
                {contactsSearch ? 'No contacts match your search.' : 'No contacts with email addresses found.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={c => c.id ?? c.name ?? ''}
              contentContainerStyle={{ paddingVertical: 8, paddingBottom: insets.bottom + 20 }}
              renderItem={({ item }) => {
                const email = item.emails?.[0]?.email ?? '';
                const contactKey = item.id ?? email;
                const isAdding = addingContact === contactKey;
                return (
                  <TouchableOpacity
                    onPress={() => !isAdding && handleInviteContact(item)}
                    activeOpacity={0.75}
                    style={[styles.contactRow, { borderBottomColor: colors.border }]}
                  >
                    <View style={[styles.contactAvatar, { backgroundColor: colors.primary + '22' }]}>
                      <Text style={[styles.contactAvatarText, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
                        {(item.name ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={[styles.contactName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={[styles.contactEmail, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
                        {email}
                      </Text>
                    </View>
                    {isAdding ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <View style={[styles.inviteChip, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
                        <Ionicons name="person-add-outline" size={13} color={colors.primary} />
                        <Text style={[styles.inviteChipText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Invite</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>

      {/* Rename modal */}
      <Modal visible={renameVisible} animationType="fade" transparent onRequestClose={() => setRenameVisible(false)}>
        <KeyboardAvoidingView style={styles.renameOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.renameSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.renameTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
              Rename group
            </Text>
            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Group name"
              placeholderTextColor={colors.mutedForeground}
              maxLength={80}
              autoFocus
              selectTextOnFocus
              style={[styles.renameInput, {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
                fontFamily: 'Inter_400Regular',
              }]}
            />
            <View style={styles.renameActions}>
              <TouchableOpacity
                onPress={() => setRenameVisible(false)}
                activeOpacity={0.7}
                style={[styles.renameBtn, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.renameBtnText, { color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRename}
                activeOpacity={0.85}
                disabled={!renameText.trim() || renaming}
                style={[styles.renameBtn, { backgroundColor: renameText.trim() ? colors.primary : colors.muted, flex: 1.5 }]}
              >
                {renaming
                  ? <ActivityIndicator color={colors.primaryForeground} size="small" />
                  : <Text style={[styles.renameBtnText, { color: renameText.trim() ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }]}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  // Split bill button
  splitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderTopWidth: 1, paddingTop: 10, marginTop: 2,
  },
  splitBtnText: { fontSize: 13 },
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
  ownerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  ownerText: { fontSize: 11 },
  removeMemberBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Rename
  groupNameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  renameIconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  renameOverlay: {
    flex: 1, backgroundColor: '#00000066',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  renameSheet: {
    width: '100%', borderRadius: 18, borderWidth: 1, padding: 20, gap: 16,
  },
  renameTitle: { fontSize: 17 },
  renameInput: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15,
  },
  renameActions: { flexDirection: 'row', gap: 10 },
  renameBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, borderRadius: 12 },
  renameBtnText: { fontSize: 15 },
  // Add Members button
  addMembersBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginBottom: 4,
  },
  addMembersBtnText: { fontSize: 14 },

  // Contacts modal
  contactsModal: { flex: 1 },
  contactsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  contactsTitle: { fontSize: 18 },
  contactsCloseBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  contactsSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 12,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  contactsSearchInput: { flex: 1, fontSize: 15 },
  contactsCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { fontSize: 17 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15 },
  contactEmail: { fontSize: 12, marginTop: 1 },
  inviteChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },
  inviteChipText: { fontSize: 12 },

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

type NativeContact = { id?: string; name?: string; emails?: Array<{ email?: string }> };
