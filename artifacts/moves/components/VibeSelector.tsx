import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { VIBES } from '@/lib/itinerary';

interface VibeSelectorProps {
  selected: string;
  onSelect: (vibe: string) => void;
}

export function VibeSelector({ selected, onSelect }: VibeSelectorProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {VIBES.map(vibe => {
        const isSelected = selected === vibe;
        return (
          <TouchableOpacity
            key={vibe}
            onPress={() => onSelect(vibe)}
            activeOpacity={0.75}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? colors.primaryForeground : colors.foreground,
                  fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                },
              ]}
            >
              {vibe}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 100,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
});
