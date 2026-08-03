import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { Receipt, ReceiptItem } from '@/types';

// Max long edge for receipt images sent to the API.
// Keeps base64 payload well under the server's 15 MB JSON limit.
const MAX_IMAGE_DIMENSION = 1200;

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

// ── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  '#E94057', '#5B9CF6', '#4CAF82', '#FF8C42', '#9B59B6',
  '#F39C12', '#1ABC9C', '#E74C3C',
];

function nameColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ── Item row ─────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: ReceiptItem;
  myUserId: string;
  onToggleClaim: (itemIndex: number) => void;
  pendingClaims: Set<number>; // locally pending before save
}

function ItemRow({ item, myUserId, onToggleClaim, pendingClaims }: ItemRowProps) {
  const colors = useColors();
  // pendingClaims reflects the desired state (initialized from server, toggled locally)
  const claimedByMe = pendingClaims.has(item.index);
  const otherClaimants = item.claimedBy.filter(c => c.userId !== myUserId).length;
  const splitCount = otherClaimants + (claimedByMe ? 1 : 0);
  const perPerson = splitCount > 0 ? item.price / splitCount : item.price;

  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); onToggleClaim(item.index); }}
      activeOpacity={0.75}
      style={[
        styles.itemRow,
        {
          backgroundColor: claimedByMe ? colors.primary + '18' : colors.card,
          borderColor: claimedByMe ? colors.primary + '55' : colors.border,
        },
      ]}
    >
      <View style={styles.itemLeft}>
        {/* Checkmark */}
        <View style={[
          styles.itemCheck,
          { backgroundColor: claimedByMe ? colors.primary : 'transparent', borderColor: claimedByMe ? colors.primary : colors.border },
        ]}>
          {claimedByMe && <Ionicons name="checkmark" size={12} color={colors.primaryForeground} />}
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]} numberOfLines={2}>
            {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
          </Text>
          {item.claimedBy.length > 0 && (
            <Text style={[styles.itemClaimants, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {item.claimedBy.map(c => c.displayName.split(' ')[0]).join(', ')}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemPrice, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
          ${item.price.toFixed(2)}
        </Text>
        {splitCount > 1 && (
          <Text style={[styles.itemSplit, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            ${perPerson.toFixed(2)}/ea
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ReceiptScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { shareId, groupId } = useLocalSearchParams<{ shareId: string; groupId: string }>();
  const { userId, user } = useUser();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  // pendingClaims stores the DESIRED set of item indexes the user wants to claim
  const [pendingClaims, setPendingClaims] = useState<Set<number>>(new Set());
  const [claimsDirty, setClaimsDirty] = useState(false);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 12);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 32);

  const fetchReceipt = useCallback(async () => {
    if (!shareId || !user?.token) return;
    try {
      const res = await fetch(`${BASE_URL()}/receipts?shareId=${encodeURIComponent(shareId)}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) {
        const data: Receipt = await res.json();
        setReceipt(data);
        // Init pending claims from server state
        const myClaims = new Set(
          data.items.filter(it => it.claimedBy.some(c => c.userId === userId)).map(it => it.index)
        );
        setPendingClaims(myClaims);
        setClaimsDirty(false);
      }
    } catch { /* offline */ } finally {
      setLoading(false);
    }
  }, [shareId, user?.token]);

  useEffect(() => { fetchReceipt(); }, [fetchReceipt]);

  /**
   * Resize an image so its longest edge is at most MAX_IMAGE_DIMENSION,
   * preserving aspect ratio and never upscaling. Returns base64 JPEG.
   */
  const resizeAndEncode = async (
    uri: string,
    srcWidth: number,
    srcHeight: number,
  ): Promise<string> => {
    const longEdge = Math.max(srcWidth, srcHeight);
    const actions: ImageManipulator.Action[] =
      longEdge > MAX_IMAGE_DIMENSION
        ? srcWidth >= srcHeight
          ? [{ resize: { width: MAX_IMAGE_DIMENSION } }]   // landscape/square
          : [{ resize: { height: MAX_IMAGE_DIMENSION } }]  // portrait
        : []; // already small enough — compress only, no resize

    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return manipulated.base64 ?? '';
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (camStatus !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to upload a receipt.');
        return;
      }
    }

    Alert.alert('Add Receipt', 'Choose a photo of the receipt', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 1,
          });
          if (!result.canceled && result.assets[0]) {
            const { uri, width, height } = result.assets[0];
            const base64 = await resizeAndEncode(uri, width, height);
            if (base64) await uploadReceipt(base64);
          }
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
          });
          if (!result.canceled && result.assets[0]) {
            const { uri, width, height } = result.assets[0];
            const base64 = await resizeAndEncode(uri, width, height);
            if (base64) await uploadReceipt(base64);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadReceipt = async (base64: string) => {
    if (!groupId || !shareId || !user?.token) return;
    setUploading(true);
    try {
      const res = await fetch(`${BASE_URL()}/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ groupId, shareId, imageBase64: base64 }),
      });
      if (res.status === 409) {
        // Already exists — just fetch it
        await fetchReceipt();
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error ?? 'Upload failed');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchReceipt();
    } catch (err: any) {
      Alert.alert('Could not read receipt', err?.message ?? 'Try a clearer photo.');
    } finally {
      setUploading(false);
    }
  };

  const toggleClaim = (itemIndex: number) => {
    setPendingClaims(prev => {
      const next = new Set(prev);
      if (next.has(itemIndex)) next.delete(itemIndex);
      else next.add(itemIndex);
      return next;
    });
    setClaimsDirty(true);
  };

  const saveClaims = async () => {
    if (!receipt || !user?.token) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL()}/receipts/${receipt.id}/claims`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ itemIndexes: Array.from(pendingClaims) }),
      });
      if (!res.ok) throw new Error('Save failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setClaimsDirty(false);
      await fetchReceipt();
    } catch {
      Alert.alert('Error', 'Could not save your selections. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="receipt-outline" size={16} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            Split the Bill
          </Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : uploading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.uploadingText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Reading your receipt…
          </Text>
        </View>
      ) : !receipt ? (
        /* ── No receipt yet ── */
        <View style={[styles.center, { paddingHorizontal: 32 }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}>
            <Ionicons name="receipt-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            No receipt yet
          </Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Upload a photo of the bill and we'll itemize it so everyone can claim what they ordered.
          </Text>
          <TouchableOpacity
            onPress={handlePickImage}
            activeOpacity={0.85}
            style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="camera-outline" size={20} color={colors.primaryForeground} />
            <Text style={[styles.uploadBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
              Add Receipt Photo
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Receipt view ── */
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: botPad + (claimsDirty ? 80 : 0) }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Uploader banner */}
          <View style={[styles.uploaderBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.uploaderAvatar, { backgroundColor: nameColor(receipt.uploadedBy.displayName) + '33' }]}>
              <Text style={[styles.uploaderAvatarText, { color: nameColor(receipt.uploadedBy.displayName), fontFamily: 'Inter_700Bold' }]}>
                {initials(receipt.uploadedBy.displayName)}
              </Text>
            </View>
            <View style={styles.uploaderInfo}>
              <Text style={[styles.uploaderLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Receipt uploaded by
              </Text>
              <Text style={[styles.uploaderName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                {receipt.uploadedBy.id === userId ? 'You' : receipt.uploadedBy.displayName}
              </Text>
            </View>
            <Text style={[styles.receiptTotal, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
              ${receipt.total.toFixed(2)}
            </Text>
          </View>

          {/* Instructions */}
          <Text style={[styles.instruction, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Tap items you ordered to claim them. Items split between multiple people are divided equally.
          </Text>

          {/* Items */}
          <SectionLabel label="ITEMS" colors={colors} />
          {receipt.items.map(item => (
            <ItemRow
              key={item.index}
              item={item}
              myUserId={userId ?? ''}
              onToggleClaim={toggleClaim}
              pendingClaims={pendingClaims}
            />
          ))}

          {/* Totals breakdown */}
          {(receipt.tax > 0 || receipt.tip > 0) && (
            <View style={[styles.totalsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {receipt.subtotal > 0 && (
                <TotalRow label="Subtotal" value={receipt.subtotal} colors={colors} />
              )}
              {receipt.tax > 0 && (
                <TotalRow label="Tax" value={receipt.tax} colors={colors} />
              )}
              {receipt.tip > 0 && (
                <TotalRow label="Tip" value={receipt.tip} colors={colors} />
              )}
              <View style={[styles.totalDivider, { backgroundColor: colors.border }]} />
              <TotalRow label="Total" value={receipt.total} colors={colors} bold />
            </View>
          )}

          {/* Summary */}
          <SectionLabel label="WHO OWES WHAT" colors={colors} />
          {receipt.summary.map(entry => {
            const isMe = entry.userId === userId;
            const isUploader = entry.isUploader;
            const amt = entry.subtotal;

            // Recompute from pending claims for the current user
            let displayAmt = amt;
            if (isMe && claimsDirty) {
              // Recalculate based on pending claims
              let myTotal = 0;
              for (const item of receipt.items) {
                if (!pendingClaims.has(item.index)) continue;
                // Count claimants: existing claimants adjusted for my toggle
                const otherCount = item.claimedBy.filter(c => c.userId !== userId).length;
                const totalClaimants = otherCount + 1; // me
                myTotal += item.price / totalClaimants;
              }
              // Add proportional extras
              const claimedSubtotal = receipt.items
                .filter(it => pendingClaims.has(it.index))
                .reduce((s, it) => {
                  const others = it.claimedBy.filter(c => c.userId !== userId).length;
                  return s + it.price / (others + 1);
                }, 0);
              const extras = receipt.tax + receipt.tip;
              if (extras > 0 && receipt.subtotal > 0) {
                displayAmt = myTotal + extras * (claimedSubtotal / receipt.subtotal);
              } else {
                displayAmt = myTotal;
              }
              displayAmt = Math.round(displayAmt * 100) / 100;
            }

            return (
              <View
                key={entry.userId}
                style={[
                  styles.summaryRow,
                  {
                    backgroundColor: isMe ? colors.primary + '12' : colors.card,
                    borderColor: isMe ? colors.primary + '44' : colors.border,
                  },
                ]}
              >
                <View style={[styles.summaryAvatar, { backgroundColor: nameColor(entry.displayName) + '33' }]}>
                  <Text style={[styles.summaryAvatarText, { color: nameColor(entry.displayName), fontFamily: 'Inter_700Bold' }]}>
                    {initials(entry.displayName)}
                  </Text>
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryName, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                    {isMe ? `${entry.displayName} (you)` : entry.displayName}
                  </Text>
                  <Text style={[styles.summaryAction, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                    {isUploader
                      ? 'Paid the bill'
                      : displayAmt > 0
                        ? `Owes ${receipt.uploadedBy.id === userId ? 'you' : receipt.uploadedBy.displayName.split(' ')[0]}`
                        : 'Nothing claimed yet'}
                  </Text>
                </View>
                <Text style={[
                  styles.summaryAmt,
                  {
                    color: isUploader ? colors.mutedForeground : displayAmt > 0 ? colors.foreground : colors.mutedForeground,
                    fontFamily: 'Inter_700Bold',
                  },
                ]}>
                  {isUploader ? `$${receipt.total.toFixed(2)}` : displayAmt > 0 ? `$${displayAmt.toFixed(2)}` : '—'}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Save claims button */}
      {claimsDirty && receipt && (
        <View style={[styles.saveBar, { backgroundColor: colors.background, borderTopColor: colors.border, bottom: botPad }]}>
          <TouchableOpacity
            onPress={saveClaims}
            disabled={saving}
            activeOpacity={0.85}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          >
            {saving
              ? <ActivityIndicator color={colors.primaryForeground} size="small" />
              : <Text style={[styles.saveBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  Save My Items
                </Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
      {label}
    </Text>
  );
}

function TotalRow({ label, value, colors, bold }: { label: string; value: number; colors: any; bold?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, { color: bold ? colors.foreground : colors.mutedForeground, fontFamily: bold ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
        {label}
      </Text>
      <Text style={[styles.totalValue, { color: bold ? colors.foreground : colors.mutedForeground, fontFamily: bold ? 'Inter_700Bold' : 'Inter_400Regular' }]}>
        ${value.toFixed(2)}
      </Text>
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
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  uploadingText: { fontSize: 15, marginTop: 12 },

  // Empty state
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  emptyTitle: { fontSize: 22, textAlign: 'center' },
  emptyBody: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8,
  },
  uploadBtnText: { fontSize: 16 },

  // Scroll
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.5, marginTop: 6, marginBottom: 2 },
  instruction: { fontSize: 13, lineHeight: 19, marginBottom: 4 },

  // Uploader banner
  uploaderBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  uploaderAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  uploaderAvatarText: { fontSize: 15 },
  uploaderInfo: { flex: 1 },
  uploaderLabel: { fontSize: 11 },
  uploaderName: { fontSize: 15, marginTop: 1 },
  receiptTotal: { fontSize: 22 },

  // Item row
  itemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, borderWidth: 1, padding: 12, gap: 10,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, lineHeight: 19 },
  itemClaimants: { fontSize: 11, marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 2 },
  itemPrice: { fontSize: 15 },
  itemSplit: { fontSize: 11 },

  // Totals card
  totalsCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8, marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 14 },
  totalDivider: { height: 1, marginVertical: 2 },

  // Summary
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  summaryAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  summaryAvatarText: { fontSize: 15 },
  summaryInfo: { flex: 1 },
  summaryName: { fontSize: 15 },
  summaryAction: { fontSize: 12, marginTop: 2 },
  summaryAmt: { fontSize: 20 },

  // Save bar
  saveBar: {
    position: 'absolute', left: 0, right: 0,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16 },
});
