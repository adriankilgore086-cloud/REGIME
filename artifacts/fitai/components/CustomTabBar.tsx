import React, { memo } from 'react';
import {
  View, TouchableOpacity, StyleSheet, Platform, Text,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

const TAB_ICONS = [
  { name: 'calendar', label: 'Schedule' },
  { name: 'goals', label: 'Goals' },
  { name: 'index', label: 'Home' },
  { name: 'health', label: 'Health' },
  { name: 'profile', label: 'Profile' },
];

function TabIcon({ routeName, isFocused, color }: { routeName: string; isFocused: boolean; color: string }) {
  const size = 21;
  switch (routeName) {
    case 'calendar':
      return <Feather name="calendar" size={size} color={color} />;
    case 'goals':
      return <Ionicons name={isFocused ? 'trophy' : 'trophy-outline'} size={size} color={color} />;
    case 'health':
      return <Ionicons name={isFocused ? 'heart' : 'heart-outline'} size={size} color={color} />;
    case 'profile':
      return <Feather name="user" size={size} color={color} />;
    default:
      return null;
  }
}

const AnimatedTab = memo(function AnimatedTab({
  route, isFocused, onPress, isCenter,
}: {
  route: { name: string; key: string };
  index: number;
  isFocused: boolean;
  onPress: () => void;
  isCenter: boolean;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.84, {}, () => {
      scale.value = withSpring(1, { damping: 12 });
    });
    onPress();
  };

  if (isCenter) {
    return (
      <View style={styles.centerWrapper}>
        <Animated.View style={animStyle}>
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.85}
            style={styles.centerBtn}
          >
            <View style={[styles.centerBtnInner, { backgroundColor: colors.primary }]}>
              <Feather name="home" size={22} color="#0D0D0D" />
            </View>
          </TouchableOpacity>
        </Animated.View>
        <Text style={[styles.centerLabel, { color: isFocused ? colors.primary : colors.mutedForeground }]}>
          Home
        </Text>
      </View>
    );
  }

  const color = isFocused ? colors.primary : colors.mutedForeground;
  const label = TAB_ICONS.find((t) => t.name === route.name)?.label ?? route.name;

  return (
    <Animated.View style={[styles.tab, animStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.tabInner}>
        {isFocused && (
          <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
        )}
        <TabIcon routeName={route.name} isFocused={isFocused} color={color} />
        <Text style={[styles.label, { color }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const bottomPad = isWeb ? 34 : insets.bottom;
  const colors = useColors();

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
        <LinearGradient colors={['rgba(13,13,13,0)', 'rgba(13,13,13,0.92)', '#0D0D0D']} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={[styles.pill, { borderColor: colors.border, backgroundColor: 'rgba(22,22,22,0.96)' }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isCenter = index === 2;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <AnimatedTab
              key={route.key}
              route={route}
              index={index}
              isFocused={isFocused}
              onPress={onPress}
              isCenter={isCenter}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
  },
  pill: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 14,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    position: 'relative',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
  activeDot: {
    position: 'absolute',
    top: -8,
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -14,
  },
  centerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  centerLabel: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
});
