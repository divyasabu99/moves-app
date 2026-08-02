import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const CARD_GAP = 10;
const CARD_H = 118;

const VIBE_DATA = [
  {
    label: 'Dinner & Drinks',
    sub: 'Restaurant → cocktail bar',
    icon: '🕯️',
    gradColors: ['#2A1A0F', '#4A2C15'] as [string, string],
    glow: '#C4703C',
  },
  {
    label: 'Date Night',
    sub: 'Intimate, romantic',
    icon: '✦',
    gradColors: ['#1A0F20', '#3D1F4A'] as [string, string],
    glow: '#8B6BAE',
  },
  {
    label: 'Night Out',
    sub: 'Bar crawl, dancing',
    icon: '◈',
    gradColors: ['#0A0D1F', '#1A2040'] as [string, string],
    glow: '#4F7FFF',
  },
  {
    label: 'Brunch Run',
    sub: 'Morning through afternoon',
    icon: '☀',
    gradColors: ['#1F1A0A', '#3D3410'] as [string, string],
    glow: '#D4A853',
  },
  {
    label: 'Foodie Crawl',
    sub: 'Neighborhood spot-hopping',
    icon: '◉',
    gradColors: ['#0F1A0A', '#1E3515'] as [string, string],
    glow: '#5BA058',
  },
  {
    label: 'Low-Key Vibes',
    sub: 'Easy evening, no rush',
    icon: '∿',
    gradColors: ['#141414', '#252525'] as [string, string],
    glow: '#8A8A8A',
  },
  {
    label: 'Sports Day',
    sub: 'Watch party or live game',
    icon: '⚡',
    gradColors: ['#0F1A0A', '#1A3010'] as [string, string],
    glow: '#4CAF50',
  },
  {
    label: 'Self Care Day',
    sub: 'Spa, wellness, reset',
    icon: '◌',
    gradColors: ['#1A0F18', '#2E1A30'] as [string, string],
    glow: '#E091C0',
  },
  {
    label: 'Park Day',
    sub: 'Outdoors, picnic, fresh air',
    icon: '✿',
    gradColors: ['#0A160A', '#152A12'] as [string, string],
    glow: '#7BC67A',
  },
  {
    label: 'Dog Day',
    sub: 'Dog-friendly spots & parks',
    icon: '◎',
    gradColors: ['#1A1408', '#332A10'] as [string, string],
    glow: '#D4A853',
  },
] as const;

type VibeItem = typeof VIBE_DATA[number];

// Pre-split into rows of 2 for a stable 2-col grid inside a ScrollView
const ROWS: VibeItem[][] = [];
for (let i = 0; i < VIBE_DATA.length; i += 2) {
  ROWS.push(VIBE_DATA.slice(i, i + 2) as VibeItem[]);
}

interface VibeGridProps {
  onSelect: (vibe: string) => void;
}

export function VibeGrid({ onSelect }: VibeGridProps) {
  return (
    <View style={styles.grid}>
      {ROWS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map(v => (
            <TouchableOpacity
              key={v.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(v.label);
              }}
              activeOpacity={0.82}
              style={styles.cardTouch}
            >
              <LinearGradient
                colors={v.gradColors}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={[styles.card, { borderColor: v.glow + '40' }]}
              >
                {/* Ambient glow orb */}
                <View
                  style={[
                    styles.cardGlow,
                    { backgroundColor: v.glow + '30' },
                  ]}
                />
                {/* Icon */}
                <Text
                  style={[
                    styles.icon,
                    { textShadowColor: v.glow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
                  ]}
                >
                  {v.icon}
                </Text>
                {/* Labels */}
                <View style={styles.labelArea}>
                  <Text style={styles.cardLabel} numberOfLines={1}>
                    {v.label}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {v.sub}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

export function VibeCard({ vibe, onClear }: { vibe: string; onClear: () => void }) {
  const data: VibeItem =
    (VIBE_DATA as readonly VibeItem[]).find(v => v.label === vibe) ?? VIBE_DATA[0];

  return (
    <LinearGradient
      colors={data.gradColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.summaryCard, { borderColor: data.glow + '55' }]}
    >
      {/* Glow orb */}
      <View style={[styles.summaryGlow, { backgroundColor: data.glow + '25' }]} />
      {/* Icon */}
      <Text
        style={[
          styles.summaryIcon,
          { textShadowColor: data.glow, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
        ]}
      >
        {data.icon}
      </Text>
      {/* Text */}
      <View style={styles.summaryText}>
        <Text style={[styles.summaryLabel, { color: data.glow }]}>{data.label}</Text>
        <Text style={styles.summarySub}>{data.sub}</Text>
      </View>
      {/* Change */}
      <TouchableOpacity
        onPress={() => { Haptics.selectionAsync(); onClear(); }}
        activeOpacity={0.7}
        style={styles.changeBtn}
      >
        <Text style={styles.changeBtnText}>Change</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  grid: { gap: CARD_GAP },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  cardTouch: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    height: CARD_H,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: '15%',
    left: '45%',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  icon: {
    fontSize: 22,
  },
  labelArea: { gap: 2 },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F2E8D4',
    fontFamily: 'Inter_700Bold',
  },
  cardSub: {
    fontSize: 10,
    color: '#8C7D69',
    fontFamily: 'Inter_400Regular',
  },
  // ── Summary card ──────────────────────────────────────────────────────────
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    overflow: 'hidden',
  },
  summaryGlow: {
    position: 'absolute',
    right: 12,
    top: -12,
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  summaryIcon: {
    fontSize: 26,
    flexShrink: 0,
  },
  summaryText: {
    flex: 1,
    gap: 3,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  summarySub: {
    fontSize: 11,
    color: '#8C7D69',
    fontFamily: 'Inter_400Regular',
  },
  changeBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C7D69',
    fontFamily: 'Inter_500Medium',
  },
});
