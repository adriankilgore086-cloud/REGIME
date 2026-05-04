import React, { useState } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ScrollView, Platform, KeyboardAvoidingView, Image, Alert,
  ActivityIndicator, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { useSocial, PostType, Audience } from "@/contexts/SocialContext";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS } from "@/constants/workouts";

const SHEET_HEIGHT = Dimensions.get("window").height * 0.62;

interface Props {
  visible: boolean;
  onClose: () => void;
}

const POST_TYPES: { type: PostType; icon: string; label: string; color: string }[] = [
  { type: "text", icon: "chatbubble-outline", label: "Thought", color: "#8FB8FF" },
  { type: "workout", icon: "barbell-outline", label: "Workout", color: "#7BE0B8" },
  { type: "milestone", icon: "trophy-outline", label: "Milestone", color: "#F3D27A" },
  { type: "pr", icon: "flash-outline", label: "New PR", color: "#FF2D78" },
  { type: "media", icon: "image-outline", label: "Photo", color: "#A78BFA" },
];

const MILESTONE_PRESETS = [
  "First 5K completed", "30-day streak", "50 workouts logged",
  "Bodyweight bench achieved", "Lost 5kg", "First pull-up",
  "100 workouts milestone", "Ran a half marathon",
];

export default function CreatePostModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { addPost } = useSocial();
  const { userProfile, rank, scheduledWorkouts } = useFitness();

  const [postType, setPostType] = useState<PostType>("text");
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<Audience>("global");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaWidth, setMediaWidth] = useState<number | null>(null);
  const [mediaHeight, setMediaHeight] = useState<number | null>(null);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [workoutCalories, setWorkoutCalories] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [prValue, setPrValue] = useState("");
  const [showMilestonePresets, setShowMilestonePresets] = useState(false);
  const [posting, setPosting] = useState(false);

  const recentCompleted = scheduledWorkouts
    .filter((sw) => sw.completed)
    .slice(0, 5)
    .map((sw) => SAMPLE_WORKOUTS.find((w) => w.id === sw.workoutId))
    .filter(Boolean);

  const canPost =
    text.trim().length > 0 ||
    (postType === "media" && mediaUri) ||
    (postType === "workout" && workoutName.trim().length > 0) ||
    (postType === "milestone" && milestoneTitle.trim().length > 0) ||
    (postType === "pr" && prValue.trim().length > 0);

  const pickImage = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Media upload is available on iOS and Android");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow access to your photos to share workout pics.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaWidth(result.assets[0].width ?? null);
      setMediaHeight(result.assets[0].height ?? null);
      setPostType("media");
    }
  };

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    await new Promise((r) => setTimeout(r, 400));

    const value =
      postType === "pr" ? prValue :
        postType === "milestone" ? milestoneTitle :
          postType === "workout" ? (workoutDuration ? `${workoutDuration} · ${workoutCalories || "?"}kcal` : "") :
            undefined;

    addPost({
      userId: "me",
      userName: userProfile.name,
      userAvatar: userProfile.name.charAt(0).toUpperCase(),
      userProfileImage: userProfile.profileImage ?? undefined,
      userBadge: rank,
      type: postType,
      text: text.trim(),
      audience,
      mediaUri: mediaUri ?? undefined,
      mediaWidth: mediaWidth ?? undefined,
      mediaHeight: mediaHeight ?? undefined,
      workoutName: postType === "workout" ? workoutName : undefined,
      workoutDuration: postType === "workout" ? workoutDuration : undefined,
      workoutCalories: postType === "workout" && workoutCalories ? Number(workoutCalories) : undefined,
      milestoneTitle: postType === "milestone" ? milestoneTitle : undefined,
      value,
    });

    reset();
    onClose();
  };

  const reset = () => {
    setText("");
    setMediaUri(null);
    setMediaWidth(null);
    setMediaHeight(null);
    setWorkoutName("");
    setWorkoutDuration("");
    setWorkoutCalories("");
    setMilestoneTitle("");
    setPrValue("");
    setPostType("text");
    setPosting(false);
    setShowMilestonePresets(false);
  };

  const selectedType = POST_TYPES.find((t) => t.type === postType)!;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { reset(); onClose(); }}>
      <TouchableOpacity style={styles.overlayDismiss} onPress={() => { reset(); onClose(); }} activeOpacity={1} />
      <KeyboardAvoidingView style={styles.kavWrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} style={styles.headerBtn}>
              <Text style={[styles.headerCancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Share to Feed</Text>
            <TouchableOpacity
              onPress={handlePost}
              disabled={!canPost || posting}
              style={[styles.postBtn, { backgroundColor: canPost ? colors.primary : colors.muted }]}
            >
              {posting
                ? <ActivityIndicator size="small" color="#0D0D0D" />
                : <Text style={[styles.postBtnText, { color: canPost ? "#0D0D0D" : colors.mutedForeground }]}>Post</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <View style={styles.authorRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + "25", borderColor: colors.primary + "50" }]}>
                {userProfile.profileImage ? (
                  <Image source={{ uri: userProfile.profileImage }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{userProfile.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.authorMeta}>
                <Text style={[styles.authorName, { color: colors.foreground }]}>{userProfile.name}</Text>
                <TouchableOpacity
                  onPress={() => setAudience(audience === "global" ? "friends" : "global")}
                  style={[styles.audienceBtn, { backgroundColor: audience === "global" ? "#8FB8FF20" : "#A78BFA20", borderColor: audience === "global" ? "#8FB8FF40" : "#A78BFA40" }]}
                >
                  <Ionicons name={audience === "global" ? "globe-outline" : "people-outline"} size={11} color={audience === "global" ? "#8FB8FF" : "#A78BFA"} />
                  <Text style={[styles.audienceText, { color: audience === "global" ? "#8FB8FF" : "#A78BFA" }]}>{audience === "global" ? "Everyone" : "Friends"}</Text>
                  <Ionicons name="chevron-down" size={10} color={audience === "global" ? "#8FB8FF" : "#A78BFA"} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll} contentContainerStyle={styles.typeContent}>
              {POST_TYPES.map((pt) => (
                <TouchableOpacity
                  key={pt.type}
                  onPress={() => setPostType(pt.type)}
                  style={[styles.typeChip,
                    postType === pt.type
                      ? { backgroundColor: pt.color + "25", borderColor: pt.color + "60" }
                      : { backgroundColor: colors.muted, borderColor: colors.border }
                  ]}
                >
                  <Ionicons name={pt.icon as any} size={14} color={postType === pt.type ? pt.color : colors.mutedForeground} />
                  <Text style={[styles.typeChipText, { color: postType === pt.type ? pt.color : colors.mutedForeground }]}>{pt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {postType === "workout" && (
              <View style={[styles.extraCard, { backgroundColor: colors.card, borderColor: "#7BE0B840" }]}>
                <LinearGradient colors={["#7BE0B812", "transparent"]} style={StyleSheet.absoluteFill} />
                <View style={[styles.extraCardHeader, { borderBottomColor: colors.border }]}>
                  <Ionicons name="barbell" size={14} color="#7BE0B8" />
                  <Text style={[styles.extraCardTitle, { color: "#7BE0B8" }]}>Workout Details</Text>
                </View>
                <TextInput
                  style={[styles.extraInput, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="Workout name (e.g. Upper Body Push)"
                  placeholderTextColor={colors.mutedForeground}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                />
                {recentCompleted.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll} contentContainerStyle={{ gap: 8 }}>
                    {recentCompleted.map((w) => w && (
                      <TouchableOpacity
                        key={w.id}
                        onPress={() => { setWorkoutName(w.name); setWorkoutCalories(w.calories.toString()); setWorkoutDuration(w.durationMinutes + " min"); }}
                        style={[styles.recentChip, { backgroundColor: "#7BE0B815", borderColor: "#7BE0B830" }]}
                      >
                        <Text style={{ color: "#7BE0B8", fontSize: 11, fontFamily: "Inter_500Medium" }}>{w.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                <View style={styles.extraRow}>
                  <TextInput
                    style={[styles.extraInputHalf, { color: colors.foreground, borderColor: colors.border }]}
                    placeholder="Duration (e.g. 45 min)"
                    placeholderTextColor={colors.mutedForeground}
                    value={workoutDuration}
                    onChangeText={setWorkoutDuration}
                  />
                  <TextInput
                    style={[styles.extraInputHalf, { color: colors.foreground, borderColor: colors.border }]}
                    placeholder="Calories (e.g. 320)"
                    placeholderTextColor={colors.mutedForeground}
                    value={workoutCalories}
                    onChangeText={setWorkoutCalories}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            {postType === "milestone" && (
              <View style={[styles.extraCard, { backgroundColor: colors.card, borderColor: "#F3D27A40" }]}>
                <LinearGradient colors={["#F3D27A10", "transparent"]} style={StyleSheet.absoluteFill} />
                <View style={[styles.extraCardHeader, { borderBottomColor: colors.border }]}>
                  <Ionicons name="trophy" size={14} color="#F3D27A" />
                  <Text style={[styles.extraCardTitle, { color: "#F3D27A" }]}>Milestone</Text>
                </View>
                <TextInput
                  style={[styles.extraInput, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="What did you achieve?"
                  placeholderTextColor={colors.mutedForeground}
                  value={milestoneTitle}
                  onChangeText={setMilestoneTitle}
                />
                <TouchableOpacity onPress={() => setShowMilestonePresets(!showMilestonePresets)} style={styles.presetToggle}>
                  <Text style={[styles.presetToggleText, { color: "#F3D27A" }]}>Quick picks</Text>
                  <Ionicons name={showMilestonePresets ? "chevron-up" : "chevron-down"} size={12} color="#F3D27A" />
                </TouchableOpacity>
                {showMilestonePresets && (
                  <View style={styles.presetGrid}>
                    {MILESTONE_PRESETS.map((mp) => (
                      <TouchableOpacity
                        key={mp}
                        onPress={() => { setMilestoneTitle(mp); setShowMilestonePresets(false); }}
                        style={[styles.presetChip, { backgroundColor: "#F3D27A15", borderColor: "#F3D27A30" }]}
                      >
                        <Text style={{ color: "#F3D27A", fontSize: 11, fontFamily: "Inter_500Medium" }}>{mp}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {postType === "pr" && (
              <View style={[styles.extraCard, { backgroundColor: colors.card, borderColor: "#FF2D7840" }]}>
                <LinearGradient colors={["#FF2D7810", "transparent"]} style={StyleSheet.absoluteFill} />
                <View style={[styles.extraCardHeader, { borderBottomColor: colors.border }]}>
                  <Ionicons name="flash" size={14} color="#FF2D78" />
                  <Text style={[styles.extraCardTitle, { color: "#FF2D78" }]}>Personal Record</Text>
                </View>
                <TextInput
                  style={[styles.extraInput, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="e.g. 100kg Squat, 22:00 5K, 15 pull-ups"
                  placeholderTextColor={colors.mutedForeground}
                  value={prValue}
                  onChangeText={setPrValue}
                />
              </View>
            )}

            {postType === "media" && (
              <TouchableOpacity onPress={pickImage} style={[styles.mediaZone, { borderColor: "#A78BFA50", backgroundColor: "#A78BFA08" }]}>
                {mediaUri ? (
                  <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Ionicons name="image-outline" size={32} color="#A78BFA" />
                    <Text style={{ color: "#A78BFA", fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 8 }}>Tap to add photo</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 }}>From your camera roll</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {mediaUri && postType !== "media" && (
              <View style={styles.mediaAttached}>
                <Image source={{ uri: mediaUri }} style={styles.mediaThumb} resizeMode="cover" />
                <TouchableOpacity onPress={() => { setMediaUri(null); setMediaWidth(null); setMediaHeight(null); }} style={styles.mediaRemove}>
                  <Ionicons name="close-circle" size={20} color="#FF2D78" />
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              style={[styles.textInput, { color: colors.foreground }]}
              placeholder={
                postType === "text" ? "What's on your mind?" :
                  postType === "workout" ? "Tell them how it went..." :
                    postType === "milestone" ? "Share your journey..." :
                      postType === "pr" ? "How did you feel hitting that number?" :
                        "Caption your photo..."
              }
              placeholderTextColor={colors.mutedForeground}
              multiline
              value={text}
              onChangeText={setText}
              maxLength={500}
              textAlignVertical="top"
            />

            <View style={styles.bottomBar}>
              <TouchableOpacity onPress={pickImage} style={[styles.mediaBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="image-outline" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.charCount, { color: text.length > 450 ? "#FF2D78" : colors.mutedForeground }]}>{text.length}/500</Text>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayDismiss: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#00000065" },
  kavWrap: { position: "absolute", bottom: 0, left: 0, right: 0 },
  root: { borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: "hidden", maxHeight: SHEET_HEIGHT },
  dragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 2 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  headerBtn: { minWidth: 60 },
  headerCancel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  postBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, minWidth: 60, alignItems: "center" },
  postBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, overflow: "hidden" },
  avatarImg: { width: 42, height: 42, borderRadius: 14 },
  avatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  authorMeta: { gap: 5 },
  authorName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  audienceBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  audienceText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  typeScroll: { marginBottom: 16 },
  typeContent: { gap: 8, paddingRight: 4 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  typeChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  extraCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14, overflow: "hidden", gap: 10 },
  extraCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingBottom: 10, borderBottomWidth: 1 },
  extraCardTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  extraInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontFamily: "Inter_400Regular" },
  extraInputHalf: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontFamily: "Inter_400Regular" },
  extraRow: { flexDirection: "row", gap: 10 },
  recentScroll: { marginTop: -4 },
  recentChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  presetToggle: { flexDirection: "row", alignItems: "center", gap: 4 },
  presetToggleText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  presetChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  mediaZone: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 16, height: 160, marginBottom: 14, overflow: "hidden" },
  mediaPreview: { width: "100%", height: "100%" },
  mediaPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  mediaAttached: { marginBottom: 14, borderRadius: 12, overflow: "hidden", position: "relative" },
  mediaThumb: { width: "100%", height: 120, borderRadius: 12 },
  mediaRemove: { position: "absolute", top: 8, right: 8 },
  textInput: { fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 80, lineHeight: 22 },
  bottomBar: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  mediaBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  charCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginLeft: "auto" },
});
