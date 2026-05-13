import React from "react";
import { FlatList } from "react-native";

type FlashListProps<T> = {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement | null;
  keyExtractor: (item: T, index: number) => string;
  estimatedItemSize?: number;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
};

let FlashListImpl: React.ComponentType<any> = FlatList;
try {
  const module = require("@shopify/flash-list");
  if (module?.FlashList) {
    FlashListImpl = module.FlashList;
  }
} catch {
  FlashListImpl = FlatList;
}

export function AppFlashList<T>(props: FlashListProps<T>) {
  return <FlashListImpl {...props} />;
}

