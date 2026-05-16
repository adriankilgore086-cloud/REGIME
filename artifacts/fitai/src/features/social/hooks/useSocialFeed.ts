import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SocialPost } from "@store/SocialContext";

const STORAGE_KEY = "@regime_social_v1";
const USER_PREFIX = "@regime_user_";

export function useSocialFeed(userId: string | null | undefined) {
  const [posts, setPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    if (!userId) {
      setPosts([]);
      return;
    }

    AsyncStorage.getItem(`${USER_PREFIX}${userId}:${STORAGE_KEY}`).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as SocialPost[];
          if (Array.isArray(saved)) setPosts(saved);
        } catch {}
      }
    });
  }, [userId]);

  const savePosts = useCallback(
    (newPosts: SocialPost[]) => {
      if (!userId) return;
      AsyncStorage.setItem(`${USER_PREFIX}${userId}:${STORAGE_KEY}`, JSON.stringify(newPosts));
    },
    [userId],
  );

  return { posts, setPosts, savePosts };
}
