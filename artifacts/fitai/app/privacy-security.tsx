import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function PrivacySecurityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [dataCollection, setDataCollection] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [profilePublic, setProfilePublic] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy & Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Privacy Settings</Text>
        
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Public Profile</Text>
            <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Allow others to view your profile</Text>
          </View>
          <Switch value={profilePublic} onValueChange={setProfilePublic} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Data & Analytics</Text>
        
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Data Collection</Text>
            <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Help improve the app with your data</Text>
          </View>
          <Switch value={dataCollection} onValueChange={setDataCollection} />
        </View>

        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Analytics</Text>
            <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Share usage analytics</Text>
          </View>
          <Switch value={analytics} onValueChange={setAnalytics} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Security</Text>
        
        <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Change Password</Text>
            <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Update your account password</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingLeft}>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>Two-Factor Auth</Text>
            <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Add extra security to your account</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.deleteBtn, { borderColor: colors.destructive }]}>
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>Delete Account</Text>
        </TouchableOpacity>
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
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  settingLeft: { flex: 1 },
  settingLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  settingDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  deleteBtn: { marginTop: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 2, alignItems: "center" },
  deleteBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
