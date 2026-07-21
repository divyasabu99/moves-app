import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Platform, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { Group } from '@/types';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type ModalMode = 'none' | 'create' | 'join' | 'setName';

export default function GroupsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId, displayName, setDisplayName, ready } = useUser();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 16);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 100);

  const fetchGroups = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL()}/groups?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`${res.status}`);
      setGroups(await res.json());
    } catch { /* offline */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { if (ready && userId) fetchGroups(); }, [ready, userId, fetchGroups]);

  const openCreate = () => { setNameInput(''); setActionError(''); setModalMode('create'); };
  const openJoin = () => { setCodeInput(''); setActionError(''); setModalMode('join'); };
  const closeModal = () => { setModalMode('none'); setActionError(''); };

  const handleSetName = async () => {
    if (!nameInput.trim()) { setActionError('Please enter a name.'); return; }
    setActionLoading(true);
    await setDisplayName(nameInput.trim());
    setActionLoading(false);
    closeModal();
  };

  const handleCreate = async () => {
    if (!nameInput.trim()) { setActionError('Group name is required.'); return; }
    if (!displayName) { setModalMode('setName'); return; }
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`${BASE_URL()}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameInput.trim(), userId }),
      });
      if (!res.ok) throw new Error('Could not create group.');
      const group = await res.json() as Group;
      setGroups(prev => [group, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeModal();
    } catch (e: any) {
      setActionError(e.message ?? 'Something went wrong.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!codeInput.trim()) { setActionError('Enter an invite code.'); return; }
    if (!displayName) { setModalMode('setName'); return; }
    setActionLoading(true);
    setActionError('');
    try {
      const res = await fetch(`${BASE_URL()}/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: codeInput.trim().toUpperCase(), userId }),
      });
      if (res.status === 404) throw new Error('Group not found. Check the code and try again.');
      if (!res.ok) throw new Error('Could not join group.');
      const group = await res.json() as Group;
      setGroups(prev => prev.find(g => g.id === group.id) ? prev : [group, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeModal();
    } catch (e: any) {
      setActionError(e.message ?? 'Something went wrong.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/group-detail', params: { id: item.id } })}
      activeOpacity={0.75}
      style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.groupCardTop}>
        <View style={[styles.groupAvatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.groupAvatarText, { color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.groupCardInfo}>
          <Text style={[styles.groupName, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.groupMeta, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'} · {item.moveCount} {item.moveCount === 1 ? 'move' : 'moves'} shared
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      </View>
      <TouchableOpacity
        onPress={async () => {
          await Clipboard.setStringAsync(item.inviteCode);
          Haptics.selectionAsync();
          Alert.alert('Copied!', `Invite code "${item.inviteCode}" copied to clipboard.`);
        }}
        activeOpacity={0.7}
        style={[styles.inviteRow, { borderTopColor: colors.border }]}
      >
        <Ionicons name="link-outline" size={13} color={colors.mutedForeground} />
        <Text style={[styles.inviteCode, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
          {item.inviteCode}
        </Text>
        <Text style={[styles.copyHint, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          tap to copy
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // ── Name setup modal (shown before create/join if displayName not set) ──────
  if (modalMode === 'setName') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.centeredModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="person-circle-outline" size={44} color={colors.primary} />
          <Text style={[styles.modalTitle2, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            What should we call you?
          </Text>
          <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Your friends will see this name in group moves.
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              autoFocus maxLength={50}
            />
          </View>
          {actionError ? <Text style={[styles.error, { color: colors.primary, fontFamily: 'Inter_400Regular' }]}>{actionError}</Text> : null}
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={closeModal} activeOpacity={0.7}
              style={[styles.cancelBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSetName} disabled={actionLoading} activeOpacity={0.85}
              style={[styles.confirmBtn, { backgroundColor: colors.primary, flex: 1 }]}>
              {actionLoading ? <ActivityIndicator color={colors.primaryForeground} size="small" /> :
                <Text style={[styles.confirmBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>Continue</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>Groups</Text>
          {displayName ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {displayName}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={openJoin} activeOpacity={0.7}
            style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="enter-outline" size={18} color={colors.foreground} />
            <Text style={[styles.headerBtnText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openCreate} activeOpacity={0.7}
            style={[styles.headerBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={18} color={colors.primaryForeground} />
            <Text style={[styles.headerBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : groups.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={44} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>No groups yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Create a group and invite friends, or join one with an invite code.
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity onPress={openCreate} activeOpacity={0.8}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={16} color={colors.primaryForeground} />
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>Create Group</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openJoin} activeOpacity={0.8}
              style={[styles.emptyBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Ionicons name="enter-outline" size={16} color={colors.foreground} />
              <Text style={[styles.emptyBtnText, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Join a Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={g => g.id}
          renderItem={renderGroup}
          contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
          onRefresh={() => { setRefreshing(true); fetchGroups(); }}
          refreshing={refreshing}
        />
      )}

      {/* Create modal */}
      <Modal visible={modalMode === 'create'} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dialogTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>Create Group</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Group name..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.textInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                autoFocus maxLength={80}
              />
            </View>
            {actionError ? <Text style={[styles.error, { color: colors.primary, fontFamily: 'Inter_400Regular' }]}>{actionError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.7}
                style={[styles.cancelBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} disabled={actionLoading} activeOpacity={0.85}
                style={[styles.confirmBtn, { backgroundColor: colors.primary, flex: 1 }]}>
                {actionLoading ? <ActivityIndicator color={colors.primaryForeground} size="small" /> :
                  <Text style={[styles.confirmBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join modal */}
      <Modal visible={modalMode === 'join'} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dialogTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>Join a Group</Text>
            <Text style={[styles.dialogSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Ask a friend for their 6-character invite code.
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                value={codeInput}
                onChangeText={t => setCodeInput(t.toUpperCase().slice(0, 6))}
                placeholder="ABCDEF"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.codeInput, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}
                autoFocus autoCapitalize="characters" maxLength={6}
              />
            </View>
            {actionError ? <Text style={[styles.error, { color: colors.primary, fontFamily: 'Inter_400Regular' }]}>{actionError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeModal} activeOpacity={0.7}
                style={[styles.cancelBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleJoin} disabled={actionLoading} activeOpacity={0.85}
                style={[styles.confirmBtn, { backgroundColor: colors.primary, flex: 1 }]}>
                {actionLoading ? <ActivityIndicator color={colors.primaryForeground} size="small" /> :
                  <Text style={[styles.confirmBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>Join</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontSize: 26 },
  subtitle: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
  },
  headerBtnText: { fontSize: 14 },
  list: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 20, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyActions: { flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 14 },
  // Group card
  groupCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  groupCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  groupAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  groupAvatarText: { fontSize: 20 },
  groupCardInfo: { flex: 1 },
  groupName: { fontSize: 16 },
  groupMeta: { fontSize: 12, marginTop: 2 },
  inviteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1,
  },
  inviteCode: { fontSize: 13, letterSpacing: 1.5, flex: 1 },
  copyHint: { fontSize: 11 },
  // Overlay modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 24, gap: 16 },
  dialogTitle: { fontSize: 20 },
  dialogSub: { fontSize: 14, lineHeight: 20, marginTop: -8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  textInput: { flex: 1, fontSize: 14, padding: 0 },
  codeInput: { flex: 1, fontSize: 24, textAlign: 'center', letterSpacing: 4, padding: 0 },
  error: { fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  cancelBtnText: { fontSize: 14 },
  confirmBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { fontSize: 14 },
  // Name setup
  centeredModal: {
    margin: 24, borderRadius: 20, borderWidth: 1, padding: 28, gap: 14, alignItems: 'center',
    position: 'absolute', top: '30%', left: 0, right: 0,
  },
  modalTitle2: { fontSize: 20, textAlign: 'center' },
  modalSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
