import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform } from "react-native";

export const ROOT_STACK_BG = "#0D0D0D";

export const rootStackScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: ROOT_STACK_BG },
  animation: Platform.OS === "web" ? "none" : "fade",
};

export const workoutModalScreenOptions: NativeStackNavigationOptions = {
  presentation: "modal",
  contentStyle: { backgroundColor: ROOT_STACK_BG },
};
