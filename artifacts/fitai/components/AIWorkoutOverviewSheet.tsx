import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  body: string;
  onClose: () => void;
};

export function AIWorkoutOverviewSheet({ visible, title, subtitle, body, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const maxSheet = Math.round(height * 0.52);

  const handleClose = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityRole="button" />
        <View style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom, 16), maxHeight: maxSheet }]}>
          {Platform.OS === "web" ? (
            <View style={[styles.sheetBlurFallback, { backgroundColor: colors.card + "F2", borderColor: colors.border }]}>
              <SheetInner colors={colors} title={title} subtitle={subtitle} body={body} onClose={handleClose} />
            </View>
          ) : (
            <BlurView intensity={42} tint="dark" style={[styles.sheetBlur, { borderColor: colors.border }]}>
              <LinearGradient
                colors={[colors.card + "DD", colors.background + "EE"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <SheetInner colors={colors} title={title} subtitle={subtitle} body={body} onClose={handleClose} />
            </BlurView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function SheetInner({
  colors,
  title,
  subtitle,
  body,
  onClose,
}: {
  colors: ReturnType<typeof useColors>;
  title: string;
  subtitle?: string;
  body: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.inner}>
      <View style={styles.dragIndicatorWrap}>
        <View style={[styles.dragIndicator, { backgroundColor: colors.mutedForeground + "50" }]} />
      </View>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={[styles.aiBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "35" }]}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={[styles.aiBadgeText, { color: colors.primary }]}>AI Overview</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
          accessibilityLabel="Close overview"
        >
          <Ionicons name="close" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.body, { color: colors.foreground }]}>{body}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheetWrap: { width: "100%" },
  sheetBlur: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  sheetBlurFallback: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
  },
  inner: { paddingHorizontal: 20, paddingTop: 10 },
  dragIndicatorWrap: { alignItems: "center", marginBottom: 10 },
  dragIndicator: { width: 40, height: 4, borderRadius: 2 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  titleBlock: { flex: 1, gap: 6 },
  aiBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  aiBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.6 },
  title: { fontSize: 20, fontFamily: "Poppins_700Bold", letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  closeBtn: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  scroll: { maxHeight: 360 },
  scrollContent: { paddingBottom: 8 },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
});
