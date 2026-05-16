import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@shared/hooks/useColors";

const FAQS = [
  { q: "How do I schedule a workout?", a: "Go to the Schedule tab, click the plus button, select a date, and choose your workouts." },
  { q: "What are XP points used for?", a: "XP points help you level up, unlock achievements, and track your progress on the leaderboard." },
  { q: "Can I customize my workouts?", a: "Yes! In the Workout Library, tap any workout and use the Customize button to adjust sets, reps, and duration." },
  { q: "How does the streak system work?", a: "Complete at least one workout per day to maintain your streak. It resets if you miss a day." },
];

export default function HelpSupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const handleSubmitFeedback = () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter your feedback");
      return;
    }
    Alert.alert("Thank You", "Your feedback has been submitted. We appreciate your help!");
    setMessage("");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Frequently Asked Questions</Text>
        
        {FAQS.map((faq, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
            style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{faq.q}</Text>
              <Ionicons name={expandedFAQ === idx ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
            </View>
            {expandedFAQ === idx && (
              <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 28 }]}>Send us Feedback</Text>
        
        <TextInput
          style={[styles.feedbackInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Tell us how we can improve..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={4}
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />

        <TouchableOpacity onPress={handleSubmitFeedback} style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.submitBtnText, { color: "#0D0D0D" }]}>Submit Feedback</Text>
        </TouchableOpacity>

        <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.foreground }]}>support@regime.app</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 12 },
  faqCard: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  faqHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faqQuestion: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  faqAnswer: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 10 },
  feedbackInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 12 },
  submitBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 20 },
  submitBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  contactCard: { borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 16, gap: 12 },
  contactText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
