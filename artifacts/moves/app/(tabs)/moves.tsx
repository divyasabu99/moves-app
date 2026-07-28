import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { MoveCard } from '@/components/MoveCard';
import { ShareToGroupSheet } from '@/components/ShareToGroupSheet';
import { useMoves } from '@/context/MovesContext';
import { Move } from '@/types';

export default function MovesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { moves, removeMove, loading } = useMoves();
  const [groupShareTarget, setGroupShareTarget] = useState<Move | null>(null);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 16);
  const botPad = insets.bottom + (Platform.OS === 'web' ? 34 : 100);

  const handlePress = (move: Move) => {
    router.push({ pathname: '/move-detail', params: { id: move.id } });
  };

  const handleLongPress = (move: Move) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      move.title,
      undefined,
      [
        { text: 'Share to Group', onPress: () => setGroupShareTarget(move) },
        { text: 'Remove', style: 'destructive', onPress: () => removeMove(move.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>
            My Moves
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            {moves.length} {moves.length === 1 ? 'move' : 'moves'} planned
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/add-move')}
          activeOpacity={0.7}
          style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="add" size={20} color={colors.foreground} />
          <Text style={[styles.addBtnText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : moves.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="map-outline" size={44} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
            No moves yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
            Generate a move from the Plan tab, or add one manually.
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity
              onPress={() => router.push('/')}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={16} color={colors.primaryForeground} />
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }]}>
                Plan a Move
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/add-move')}
              style={[styles.emptyBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color={colors.foreground} />
              <Text style={[styles.emptyBtnText, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>
                Add Manually
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={moves}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MoveCard
              move={item}
              onPress={() => handlePress(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: botPad }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ShareToGroupSheet
        move={groupShareTarget}
        visible={groupShareTarget !== null}
        onClose={() => setGroupShareTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, gap: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontSize: 26 },
  subtitle: { fontSize: 13 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1,
  },
  addBtnText: { fontSize: 14 },
  list: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 20, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyActions: { flexDirection: 'row', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  emptyBtnText: { fontSize: 14 },
});
