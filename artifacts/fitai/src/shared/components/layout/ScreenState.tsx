import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@shared/hooks/useColors";

type ScreenStateProps = {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
};

export function LoadingState({ title = "Loading" }: Partial<ScreenStateProps>) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

export function EmptyState({ title, message, icon = "sparkles-outline", actionLabel, onAction }: ScreenStateProps) {
  return <BaseState title={title} message={message} icon={icon} actionLabel={actionLabel} onAction={onAction} />;
}

export function ErrorState({ title, message, actionLabel = "Try again", onAction }: ScreenStateProps) {
  return <BaseState title={title} message={message} icon="alert-circle-outline" actionLabel={actionLabel} onAction={onAction} />;
}

function BaseState({ title, message, icon, actionLabel, onAction }: ScreenStateProps) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      {icon ? <Ionicons name={icon} size={28} color={colors.primary} /> : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={[styles.action, { backgroundColor: colors.primary }]} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  title: { fontFamily: "Inter_700Bold", fontSize: 16, textAlign: "center" },
  message: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", lineHeight: 19 },
  action: { marginTop: 8, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  actionText: { color: "#0D0D0D", fontFamily: "Inter_700Bold", fontSize: 13 },
});
