import React from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@shared/hooks/useColors";

type ScreenContainerProps = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  style,
  contentStyle,
}: ScreenContainerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background, paddingTop: insets.top },
    padded && styles.padded,
    style,
  ];

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["left", "right"]}>
        <ScrollView style={containerStyle} contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["left", "right"]}>
      <View style={containerStyle}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  padded: { paddingHorizontal: 20 },
});
