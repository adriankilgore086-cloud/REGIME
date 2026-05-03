import { Tabs } from "expo-router";
import React, { useMemo, useRef } from "react";
import { PanResponder, View, Dimensions } from "react-native";
import { CustomTabBar } from "@/components/CustomTabBar";

export default function TabLayout() {
  const tabNames = useMemo(() => ["calendar", "library", "goals", "index", "health", "profile"], []);
  const tabRef = useRef<any>(null);
  const activeIndexRef = useRef(2);
  const { width } = Dimensions.get("window");

  const goToIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(tabNames.length - 1, nextIndex));
    activeIndexRef.current = clamped;
    const route = tabNames[clamped];
    tabRef.current?.navigate(route);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const horizontal = Math.abs(gestureState.dx) > 24;
          const vertical = Math.abs(gestureState.dy) < 18;
          return horizontal && vertical;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) < width * 0.18) return;
          if (gestureState.dx < 0) goToIndex(activeIndexRef.current + 1);
          if (gestureState.dx > 0) goToIndex(activeIndexRef.current - 1);
        },
      }),
    [width]
  );

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Tabs
        ref={tabRef}
        tabBar={(props) => {
          activeIndexRef.current = props.state.index;
          return <CustomTabBar {...props} />;
        }}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="calendar" options={{ title: "Schedule" }} />
        <Tabs.Screen name="library" options={{ title: "Library" }} />
        <Tabs.Screen name="goals" options={{ title: "Goals" }} />
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="health" options={{ title: "Health" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
}
