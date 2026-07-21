import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export interface DropdownOption {
  label: string;
  value: string;
  sub?: string;
}

interface DropdownPickerProps {
  displayValue: string;
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  accentColor?: string;
}

export function DropdownPicker({
  displayValue,
  options,
  selectedValue,
  onSelect,
  isOpen,
  onToggle,
  accentColor,
}: DropdownPickerProps) {
  const colors = useColors();
  const accent = accentColor ?? colors.primary;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.75}
        style={[styles.trigger, {
          backgroundColor: colors.card,
          borderColor: isOpen ? accent : colors.border,
        }]}
      >
        <Text style={[styles.triggerText, { color: colors.foreground, fontFamily: 'Inter_500Medium' }]}>
          {displayValue}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={isOpen ? accent : colors.mutedForeground}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView
            style={{ maxHeight: 220 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === selectedValue;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { onSelect(opt.value); onToggle(); }}
                  activeOpacity={0.7}
                  style={[
                    styles.option,
                    {
                      backgroundColor: isSelected ? `${accent}18` : 'transparent',
                      borderBottomColor: colors.border,
                      borderBottomWidth: i < options.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, {
                      color: isSelected ? accent : colors.foreground,
                      fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    }]}>
                      {opt.label}
                    </Text>
                    {opt.sub ? (
                      <Text style={[styles.optionSub, { color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }]}>
                        {opt.sub}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', zIndex: 10 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  triggerText: { fontSize: 15, flex: 1 },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionContent: { flex: 1 },
  optionLabel: { fontSize: 15 },
  optionSub: { fontSize: 12, marginTop: 2 },
});
