import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { useLocalSearchParams } from 'expo-router';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
const CODE_LEN = 6;
const RESEND_COOLDOWN = 30; // seconds

export default function VerifyEmailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, setVerified, logout } = useUser();
  const params = useLocalSearchParams<{ devCode?: string }>();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>(params.devCode);
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-focus on mount
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => setCooldown(c => { if (c <= 1) { clearInterval(timerRef.current!); return 0; } return c - 1; }), 1000);
    return () => clearInterval(timerRef.current!);
  }, [cooldown]);

  const handleChangeCode = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, CODE_LEN);
    setCode(digits);
    setError('');
    if (digits.length === CODE_LEN) verify(digits);
  };

  const verify = useCallback(async (codeToSubmit: string) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL()}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId, code: codeToSubmit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Incorrect code. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setCode('');
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await setVerified();
        // AuthGuard will route to onboarding automatically
      }
    } catch {
      setError('Could not connect. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [user, setVerified]);

  const handleResend = async () => {
    if (!user || cooldown > 0) return;
    setResending(true);
    try {
      const res = await fetch(`${BASE_URL()}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId }),
      });
      const data = await res.json();
      if (data.devCode) setDevCode(data.devCode);
      setCooldown(RESEND_COOLDOWN);
      setError('');
      setCode('');
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch { /* ignore */ } finally {
      setResending(false);
    }
  };

  const topPad = insets.top + 20;

  // Render 6 digit boxes
  const boxes = Array.from({ length: CODE_LEN }, (_, i) => {
    const char = code[i] ?? '';
    const isActive = code.length === i && !loading && !success;
    return (
      <View key={i} style={[
        styles.digitBox,
        { backgroundColor: colors.card, borderColor: isActive ? colors.primary : colors.border },
      ]}>
        <Text style={[styles.digitText, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
          {char}
        </Text>
      </View>
    );
  });

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Back / sign out */}
      <View style={[styles.topBar, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); logout(); }} activeOpacity={0.7} style={styles.backBtn}>
          <Ionicons name="arrow-back-outline" size={20} color={colors.mutedForeground} />
          <Text style={[styles.backText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="mail-outline" size={32} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
          Check your email
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
          We sent a 6-digit code to{'\n'}
          <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>
            {user?.email ?? 'your email'}
          </Text>
        </Text>

        {/* Digit boxes — tap to focus hidden input */}
        <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1} style={styles.digitRow}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : success ? (
            <View style={[styles.successWrap, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
              <Text style={[styles.successText, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>Verified!</Text>
            </View>
          ) : boxes}
        </TouchableOpacity>

        {/* Hidden real input */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChangeCode}
          keyboardType="number-pad"
          maxLength={CODE_LEN}
          style={styles.hiddenInput}
          caretHidden
          editable={!loading && !success}
        />

        {/* Dev-mode code hint */}
        {!!devCode && !success && (
          <View style={[styles.devBox, { backgroundColor: '#1a1a00', borderColor: '#555500' }]}>
            <Ionicons name="construct-outline" size={14} color="#cccc00" />
            <Text style={[styles.devText, { fontFamily: 'Inter_400Regular' }]}>
              No email service configured.{'\n'}Your code is:{' '}
              <Text style={{ fontFamily: 'Inter_700Bold', letterSpacing: 3 }}>{devCode}</Text>
            </Text>
          </View>
        )}

        {/* Error */}
        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.primary} />
            <Text style={[styles.errorText, { color: colors.primary, fontFamily: 'Inter_400Regular' }]}>{error}</Text>
          </View>
        )}

        {/* Resend */}
        {!success && (
          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              Didn't get it?{' '}
            </Text>
            {resending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : cooldown > 0 ? (
              <Text style={[styles.resendLabel, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                Resend in {cooldown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                <Text style={[styles.resendBtn, { color: colors.primary, fontFamily: 'Inter_500Medium' }]}>Resend code</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { fontSize: 14 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  digitRow: { flexDirection: 'row', gap: 10, minHeight: 64, alignItems: 'center', justifyContent: 'center', width: '100%' },
  digitBox: { width: 44, height: 56, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  digitText: { fontSize: 24 },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  devBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, width: '100%' },
  devText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#cccc00' },
  successWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 20 },
  successText: { fontSize: 18 },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, width: '100%' },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19 },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendLabel: { fontSize: 14 },
  resendBtn: { fontSize: 14 },
});
