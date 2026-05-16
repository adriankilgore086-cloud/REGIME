import React from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { useColors } from "@shared/hooks/useColors";

const QUICK_PROMPTS = [
  "What should I train today?",
  "Create a 30-min leg workout",
  "How do I improve my bench?",
  "Tips to break a plateau",
];

type Props = {
  value: string;
  isLoading: boolean;
  bottomInset: number;
  colors: ReturnType<typeof useColors>;
  onChange: (value: string) => void;
  onSend: (value?: string) => void;
};

export function ChatInputBar({ value, isLoading, bottomInset, colors, onChange, onSend }: Props) {
  return (
    <>
      <View style={styles.quickRow}>
        {QUICK_PROMPTS.map((prompt) => (
          <TouchableOpacity
            key={prompt}
            onPress={() => onSend(prompt)}
            style={[styles.quickChip, { backgroundColor: colors.muted, borderColor: colors.border }]}
          >
            <Text style={[styles.quickText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {prompt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomInset + 8 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
          placeholder="Ask your coach..."
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          value={value}
          onChangeText={onChange}
          multiline
          maxLength={300}
          onSubmitEditing={() => onSend()}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={() => onSend()}
          disabled={!value.trim() || isLoading}
          style={[styles.sendBtn, { backgroundColor: value.trim() ? colors.primary : colors.muted }]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Ionicons name="send" size={16} color={value.trim() ? "#0D0D0D" : colors.mutedForeground} />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  quickChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, maxWidth: 160 },
  quickText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 10, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 14, fontFamily: "Inter_400Regular", maxHeight: 90, backgroundColor: "transparent" },
  sendBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 2 },
});
