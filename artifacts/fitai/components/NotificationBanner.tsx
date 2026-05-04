import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Animated, PanResponder, TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AppNotification } from "@/contexts/FitnessContext";

interface Props {
  notification: AppNotification;
  onDismiss: () => void;
}

const TYPE_CONFIG: Record<AppNotification["type"], { color: string; icon: string }> = {
  workout:     { color: "#7BE0B8", icon: "barbell" },
  achievement: { color: "#F3D27A", icon: "trophy" },
  streak:      { color: "#FF2D78", icon: "flame" },
  ai:          { color: "#A78BFA", icon: "sparkles" },
  social:      { color: "#8FB8FF", icon: "people" },
};

export default function NotificationBanner({ notification, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const translateY = useRef(new Animated.Value(-100)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDismissing = useRef(false);

  const dismiss = () => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.spring(translateY, {
      toValue: -100,
      useNativeDriver: true,
      speed: 22,
      bounciness: 0,
    }).start(() => onDismiss());
  };

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 14,
      bounciness: 7,
    }).start();
    dismissTimer.current = setTimeout(dismiss, 4000);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 6 && gs.dy < 0,
      onPanResponderMove: (_, gs) => {
        if (gs.dy < 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy < -24) {
          dismiss();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.workout;
  const topOffset = (insets.top || 44) + 8;

  return (
    <Animated.View
      style={[styles.pill, { top: topOffset, transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.inner}
        activeOpacity={0.88}
        onPress={() => {
          dismiss();
          if (notification.route) {
            setTimeout(() => router.push(notification.route as any), 300);
          }
        }}
      >
        <View style={[styles.iconWrap, { backgroundColor: cfg.color + "28" }]}>
          <Ionicons name={cfg.icon as any} size={15} color={cfg.color} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.message} numberOfLines={1}>{notification.message}</Text>
        </View>
        {!!notification.route && (
          <Ionicons name="chevron-forward" size={13} color="#FFFFFF45" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    left: 20,
    right: 20,
    borderRadius: 999,
    backgroundColor: "#1A1A1C",
    borderWidth: 1,
    borderColor: "#FFFFFF1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
    zIndex: 9999,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: { flex: 1, gap: 1 },
  title:   { fontSize: 13, fontFamily: "Inter_700Bold",    color: "#F5F5F5", letterSpacing: -0.2 },
  message: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#FFFFFF70" },
});
