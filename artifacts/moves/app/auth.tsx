import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ScrollView, KeyboardAvoidingView, ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { router } from 'expo-router';

const BASE_URL = () => `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useUser();

  const [mode, setMode] = useState<Mode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    Haptics.selectionAsync();
  };

  const validate = (): string | null => {
    if (mode === 'register' && !displayName.trim()) return 'Please enter your name';
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid email address';
    if (!password) return 'Please enter a password';
    if (mode === 'register' && password.length < 6) return 'Password must be at least 6 characters';
    if (mode === 'register' && password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
      const body: Record<string, string> = {
        email: email.trim().toLowerCase(),
        password,
      };
      if (mode === 'register') body.displayName = displayName.trim();

      const res = await fetch(`${BASE_URL()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      await login({
        userId: data.userId,
        displayName: data.displayName,
        email: email.trim().toLowerCase(),
        token: data.token,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch {
      setError('Could not connect. Check your internet connection and try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 24 : 0);
  const botPad = insets.bottom + 24;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 32, paddingBottom: botPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / wordmark */}
        <View style={styles.logoWrap}>
          <Text style={[styles.logo, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>MOVES</Text>
          <Text style={[styles.logoSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            plan your next outing
          </Text>
        </View>

        {/* Mode tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.muted, borderRadius: 14 }]}>
          {(['login', 'register'] as Mode[]).map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => switchMode(m)}
              activeOpacity={0.8}
              style={[
                styles.tab,
                mode === m && { backgroundColor: colors.card, borderRadius: 11 },
              ]}
            >
              <Text style={[styles.tabText, {
                color: mode === m ? colors.foreground : colors.mutedForeground,
                fontFamily: mode === m ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }]}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Name — register only */}
          {mode === 'register' && (
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                YOUR NAME
              </Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="person-outline" size={16} color={colors.mutedForeground} />
                <TextInput
                  value={displayName}
                  onChangeText={t => { setDisplayName(t); setError(''); }}
                  placeholder="How should we call you?"
                  placeholderTextColor={colors.mutedForeground}
                  autoComplete="name"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
                />
              </View>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              EMAIL
            </Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={16} color={colors.mutedForeground} />
              <TextInput
                ref={emailRef}
                value={email}
                onChangeText={t => { setEmail(t); setError(''); }}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
              PASSWORD
            </Text>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} />
              <TextInput
                ref={passwordRef}
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                returnKeyType={mode === 'register' ? 'next' : 'done'}
                onSubmitEditing={() => mode === 'register' ? confirmRef.current?.focus() : handleSubmit()}
                style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular', flex: 1 }]}
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} activeOpacity={0.7} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm password — register only */}
          {mode === 'register' && (
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }]}>
                CONFIRM PASSWORD
              </Text>
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} />
                <TextInput
                  ref={confirmRef}
                  value={confirmPassword}
                  onChangeText={t => { setConfirmPassword(t); setError(''); }}
                  placeholder="Repeat your password"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  style={[styles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular', flex: 1 }]}
                />
              </View>
            </View>
          )}

          {/* Error */}
          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.primary} />
              <Text style={[styles.errorText, { color: colors.primary, fontFamily: 'Inter_400Regular' }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Ionicons
                  name={mode === 'login' ? 'log-in-outline' : 'person-add-outline'}
                  size={18}
                  color={colors.primaryForeground}
                />
                <Text style={[styles.submitText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Switch mode nudge */}
          <TouchableOpacity onPress={() => switchMode(mode === 'login' ? 'register' : 'login')} activeOpacity={0.7} style={styles.switchNudge}>
            <Text style={[styles.switchText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={{ color: colors.primary, fontFamily: 'Inter_500Medium' }}>
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 28 },
  logoWrap: { alignItems: 'center', gap: 4 },
  logo: { fontSize: 42, letterSpacing: 6 },
  logoSub: { fontSize: 14 },
  tabs: {
    flexDirection: 'row',
    padding: 4, gap: 4,
  },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: { fontSize: 14 },
  form: { gap: 16 },
  fieldWrap: { gap: 7 },
  label: { fontSize: 11, letterSpacing: 1.2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  eyeBtn: { padding: 2 },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16,
    marginTop: 4,
  },
  submitText: { fontSize: 16 },
  switchNudge: { alignItems: 'center', paddingVertical: 4 },
  switchText: { fontSize: 13 },
});
