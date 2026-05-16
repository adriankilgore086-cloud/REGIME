import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@shared/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";

const motivators = ["Lose fat", "Build strength", "Stay consistent", "Boost confidence"];
const hurdles = ["No time", "No motivation", "No clear plan", "Injury setbacks"];
const frequencies = ["1-2 days/week", "3-4 days/week", "5-6 days/week", "Daily"];
const intensities = ["Low", "Moderate", "High", "Athlete"];

type ChoiceCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function ChoiceCard({ label, selected, onPress }: ChoiceCardProps) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.choice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.choiceText, { color: colors.foreground }]}>{label}</Text>
      {selected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateOnboardingProfile } = useFitness();
  const [motivation, setMotivation] = useState(motivators[0]);
  const [hurdle, setHurdle] = useState(hurdles[0]);
  const [frequency, setFrequency] = useState(frequencies[1]);
  const [intensity, setIntensity] = useState(intensities[1]);
  const topPad = Platform.OS === "web" ? 48 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom + 16;
  const canContinue = useMemo(() => !!motivation && !!hurdle && !!frequency && !!intensity, [frequency, hurdle, intensity, motivation]);

  const handleFinish = async () => {
    if (!canContinue) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateOnboardingProfile({
      motivation,
      biggestHurdle: hurdle,
      trainingFrequency: frequency,
      preferredIntensity: intensity,
      healthPermissionsRequested: Platform.OS !== "web",
      notificationsRequested: true,
      completedAt: new Date().toISOString(),
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.glassCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient colors={[colors.primary, colors.warmGray]} style={styles.badge}>
            <Ionicons name="sparkles" size={16} color={colors.primaryForeground} />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.foreground }]}>Personalize Project Don</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            We will ask for Health access and Notifications right after this step to tailor your plan.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.question, { color: colors.foreground }]}>What brings you to Project Don?</Text>
          {motivators.map((option) => (
            <ChoiceCard key={option} label={option} selected={motivation === option} onPress={() => setMotivation(option)} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.question, { color: colors.foreground }]}>Biggest health hurdle?</Text>
          {hurdles.map((option) => (
            <ChoiceCard key={option} label={option} selected={hurdle === option} onPress={() => setHurdle(option)} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.question, { color: colors.foreground }]}>Training frequency?</Text>
          {frequencies.map((option) => (
            <ChoiceCard key={option} label={option} selected={frequency === option} onPress={() => setFrequency(option)} />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.question, { color: colors.foreground }]}>Preferred intensity?</Text>
          {intensities.map((option) => (
            <ChoiceCard key={option} label={option} selected={intensity === option} onPress={() => setIntensity(option)} />
          ))}
        </View>

        <TouchableOpacity onPress={handleFinish} disabled={!canContinue} style={[styles.submitWrap, { opacity: canContinue ? 1 : 0.5 }]}>
          <LinearGradient colors={[colors.primary, colors.warmGray]} style={styles.submit}>
            <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Finish Setup</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glassCard: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 18 },
  badge: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  section: { marginBottom: 14, gap: 8 },
  question: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  choice: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  choiceText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  submitWrap: { marginTop: 12, borderRadius: 16, overflow: "hidden" },
  submit: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  submitText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
