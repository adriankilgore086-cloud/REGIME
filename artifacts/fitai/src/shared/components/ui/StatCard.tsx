import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@shared/hooks/useColors';

interface Props {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  small?: boolean;
}

export function StatCard({ icon, label, value, subValue, color, small = false }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.card, small && styles.cardSmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={small ? 16 : 20} color={color} />
      </View>
      <Text style={[styles.value, small && styles.valueSmall, { color: colors.foreground }]}>{value}</Text>
      {subValue && (
        <Text style={[styles.sub, { color: color }]}>{subValue}</Text>
      )}
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  cardSmall: {
    padding: 10,
    borderRadius: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  valueSmall: {
    fontSize: 15,
  },
  sub: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
