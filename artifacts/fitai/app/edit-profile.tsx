import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@shared/hooks/useColors";
import { useFitness } from "@store/FitnessContext";
import * as Haptics from "expo-haptics";

const FITNESS_GOALS = ["weight_loss", "muscle_gain", "strength", "endurance", "general"] as const;
const GOAL_LABELS = { weight_loss: "Weight Loss", muscle_gain: "Muscle Gain", strength: "Strength", endurance: "Endurance", general: "General Fitness" };

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile, updateProfile } = useFitness();
  const [name, setName] = useState(userProfile.name);
  const [bio, setBio] = useState(userProfile.bio ?? "");
  const [age, setAge] = useState(userProfile.age.toString());
  const [weight, setWeight] = useState(userProfile.weight.toString());
  const [height, setHeight] = useState(userProfile.height.toString());
  const [goal, setGoal] = useState(userProfile.fitnessGoal);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }
    await updateProfile({
      name: name.trim(),
      bio: bio.trim(),
      age: parseInt(age) || 0,
      weight: parseFloat(weight) || 0,
      height: parseFloat(height) || 0,
      fitnessGoal: goal,
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", "Profile updated");
    router.back();
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.previewTitle, { color: colors.foreground }]}>{name || "Your name"}</Text>
          <Text style={[styles.previewSub, { color: colors.mutedForeground }]}>{GOAL_LABELS[goal]} · {age || "0"} yrs</Text>
          <Text style={[styles.previewBio, { color: colors.mutedForeground }]} numberOfLines={2}>{bio || "Add a short bio to make your profile stand out."}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Bio</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, height: 80, textAlignVertical: "top" }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={160}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Age</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            value={age}
            onChangeText={setAge}
            placeholder="Age"
            keyboardType="number-pad"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>Weight (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              value={weight}
              onChangeText={setWeight}
              placeholder="Weight"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 12 }]}>
            <Text style={[styles.label, { color: colors.foreground }]}>Height (cm)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              value={height}
              onChangeText={setHeight}
              placeholder="Height"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Fitness Goal</Text>
          <View style={styles.goalGrid}>
            {FITNESS_GOALS.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGoal(g)}
                style={[
                  styles.goalButton,
                  { borderColor: goal === g ? colors.primary : colors.border, backgroundColor: goal === g ? colors.primary + "20" : colors.card }
                ]}
              >
                <Text style={[styles.goalText, { color: goal === g ? colors.primary : colors.foreground }]}>
                  {GOAL_LABELS[g]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.saveBtnText, { color: "#0D0D0D" }]}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 20 },
  row: { flexDirection: "row", marginBottom: 20 },
  previewCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 18 },
  previewTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  previewSub: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 3 },
  previewBio: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8, lineHeight: 18 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  goalButton: { flex: 1, minWidth: "45%", paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  goalText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 20 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
