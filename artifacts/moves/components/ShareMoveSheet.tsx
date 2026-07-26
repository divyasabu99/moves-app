import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { Move } from '@/types';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface Props {
  move: Move | null;
  visible: boolean;
  onClose: () => void;
  onShared?: (token: string, url: string, recipientCount: number) => void;
}

export function ShareMoveSheet({ move, visible, onClose, onShared }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, userId } = useUser();
  const authToken = user?.token;

  const [phone, setPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [phones, setPhones] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [recipientCount, setRecipientCount] = useState(0);

  const reset = useCallback(() => {
    setPhone('');
    setCustomMessage('');
    setPhones([]);
    setSending(false);
    setCopied(false);
    setSharedUrl(null);
    setShareToken(null);
    setRecipientCount(0);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  // Format phone display: (555) 555-5555
  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  const handleAddPhone = () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      Alert.alert('Invalid number', 'Please enter a 10-digit US phone number.');
      return;
    }
    if (phones.includes(digits)) {
      setPhone('');
      return;
    }
    setPhones(prev => [...prev, digits]);
    setPhone('');
  };

  const handleRemovePhone = (p: string) => setPhones(prev => prev.filter(x => x !== p));

  const handleShare = useCallback(async () => {
    if (!move || !authToken) return;
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL()}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          move,
          phones,
          message: customMessage.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('Share failed');
      const data = await res.json() as { token: string; url: string; smsSent: boolean; smsError?: string; recipientCount: number };

      setSharedUrl(data.url);
      setShareToken(data.token);
      setRecipientCount(data.recipientCount);
      onShared?.(data.token, data.url, data.recipientCount);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (phones.length > 0 && !data.smsSent && data.smsError) {
        // SMS wasn't sent (Twilio not configured) — auto-copy link
        await Clipboard.setStringAsync(data.url);
        setCopied(true);
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Could not create share link. Try again.');
    } finally {
      setSending(false);
    }
  }, [move, authToken, phones, customMessage, onShared]);

  const handleCopy = useCallback(async () => {
    if (!sharedUrl) return;
    await Clipboard.setStringAsync(sharedUrl);
    setCopied(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setCopied(false), 2000);
  }, [sharedUrl]);

  if (!move) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 }]}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                Share Move
              </Text>
              <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.moveName, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
              {move.title}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {!sharedUrl ? (
              <>
                {/* Phone input */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                    SEND VIA TEXT
                  </Text>
                  <View style={[styles.phoneRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <Ionicons name="call-outline" size={18} color={colors.mutedForeground} style={{ marginLeft: 12 }} />
                    <TextInput
                      value={phone}
                      onChangeText={t => setPhone(formatPhone(t))}
                      placeholder="(555) 555-5555"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="phone-pad"
                      returnKeyType="done"
                      onSubmitEditing={handleAddPhone}
                      style={[styles.phoneInput, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                    />
                    <TouchableOpacity
                      onPress={handleAddPhone}
                      activeOpacity={0.7}
                      style={[styles.addBtn, { backgroundColor: colors.primary + '22' }]}
                    >
                      <Ionicons name="add" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Added phones */}
                  {phones.length > 0 && (
                    <View style={styles.chipRow}>
                      {phones.map(p => (
                        <TouchableOpacity
                          key={p}
                          onPress={() => handleRemovePhone(p)}
                          activeOpacity={0.7}
                          style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                          <Text style={[styles.chipText, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}>
                            {formatPhone(p)}
                          </Text>
                          <Ionicons name="close-circle" size={14} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Custom message */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                    MESSAGE (OPTIONAL)
                  </Text>
                  <TextInput
                    value={customMessage}
                    onChangeText={setCustomMessage}
                    placeholder="Add a note..."
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    numberOfLines={3}
                    style={[styles.messageInput, {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      fontFamily: 'Inter_400Regular',
                    }]}
                  />
                </View>

                {/* Share / copy link buttons */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={handleShare}
                    activeOpacity={0.85}
                    disabled={sending}
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                  >
                    {sending ? (
                      <ActivityIndicator color={colors.primaryForeground} size="small" />
                    ) : (
                      <>
                        <Ionicons name="paper-plane-outline" size={18} color={colors.primaryForeground} />
                        <Text style={[styles.primaryBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                          {phones.length > 0 ? `Send to ${phones.length} ${phones.length === 1 ? 'person' : 'people'}` : 'Generate link'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={[styles.hint, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                  Anyone with the link can view this move. If they have MOVES, they can vote, suggest changes, or save their own version.
                </Text>
              </>
            ) : (
              /* ── Success state ── */
              <View style={styles.success}>
                <View style={[styles.successIcon, { backgroundColor: '#4CAF8220' }]}>
                  <Ionicons name="checkmark-circle" size={40} color="#4CAF82" />
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
                  Move shared!
                </Text>
                {recipientCount > 0 && (
                  <Text style={[styles.successSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    Text sent to {recipientCount} {recipientCount === 1 ? 'person' : 'people'}
                  </Text>
                )}

                {/* Link copy row */}
                <TouchableOpacity
                  onPress={handleCopy}
                  activeOpacity={0.8}
                  style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text
                    style={[styles.linkText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}
                    numberOfLines={1}
                  >
                    {sharedUrl}
                  </Text>
                  <View style={[styles.copyBadge, { backgroundColor: copied ? '#4CAF8222' : colors.primary + '22' }]}>
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={16}
                      color={copied ? '#4CAF82' : colors.primary}
                    />
                    <Text style={[styles.copyText, {
                      color: copied ? '#4CAF82' : colors.primary,
                      fontFamily: 'Inter_600SemiBold',
                    }]}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleClose}
                  activeOpacity={0.8}
                  style={[styles.doneBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
                  <Text style={[styles.doneBtnText, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { borderBottomWidth: 1, paddingBottom: 14 },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  title: { fontSize: 18 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  moveName: { fontSize: 13, paddingHorizontal: 20, marginTop: 2 },

  body: { paddingHorizontal: 20, paddingTop: 24, gap: 24 },

  section: { gap: 10 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.4 },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12,
    overflow: 'hidden',
  },
  phoneInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 12 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 13 },

  messageInput: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontSize: 14, minHeight: 80, textAlignVertical: 'top',
  },

  actions: { gap: 12 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  primaryBtnText: { fontSize: 15 },

  hint: { fontSize: 13, lineHeight: 19, textAlign: 'center' },

  // Success
  success: { alignItems: 'center', gap: 16, paddingTop: 20 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 22 },
  successSub: { fontSize: 14 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12,
    padding: 12, gap: 10, alignSelf: 'stretch',
  },
  linkText: { flex: 1, fontSize: 13 },
  copyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  copyText: { fontSize: 13 },
  doneBtn: {
    alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, marginTop: 8,
  },
  doneBtnText: { fontSize: 15 },
});
