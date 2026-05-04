import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@clerk/expo";
import { useFitness } from "@/contexts/FitnessContext";

const STORAGE_KEY = "@regime_social_v1";
const USER_PREFIX = "@regime_user_";

export type PostType = "text" | "workout" | "milestone" | "pr" | "media";
export type Audience = "global" | "friends";

export interface SocialComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userProfileImage?: string;
  userBadge: string;
  text: string;
  parentId?: string | null;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userProfileImage?: string;
  userBadge: string;
  type: PostType;
  text: string;
  mediaUri?: string;
  mediaWidth?: number;
  mediaHeight?: number;
  workoutName?: string;
  workoutDuration?: string;
  workoutCalories?: number;
  milestoneTitle?: string;
  value?: string;
  audience: Audience;
  reactions: { fire: string[]; flex: string[]; clap: string[] };
  comments: SocialComment[];
  createdAt: string;
}

interface SocialContextType {
  posts: SocialPost[];
  addPost: (post: Omit<SocialPost, "id" | "createdAt" | "reactions" | "comments">) => void;
  addComment: (postId: string, comment: Omit<SocialComment, "id" | "createdAt">) => void;
  addReply: (postId: string, parentId: string, reply: Omit<SocialComment, "id" | "createdAt" | "parentId">) => void;
  toggleReaction: (postId: string, reaction: "fire" | "flex" | "clap", userId: string) => void;
  deletePost: (postId: string, userId: string) => void;
}

const SocialContext = createContext<SocialContextType | null>(null);

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const { addNotification } = useFitness();
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

  const save = useCallback((newPosts: SocialPost[]) => {
    if (!userId) return;
    AsyncStorage.setItem(`${USER_PREFIX}${userId}:${STORAGE_KEY}`, JSON.stringify(newPosts));
  }, [userId]);

  const addPost = useCallback((post: Omit<SocialPost, "id" | "createdAt" | "reactions" | "comments">) => {
    const newPost: SocialPost = {
      ...post,
      id: "up_" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
      reactions: { fire: [], flex: [], clap: [] },
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => {
      const next = [newPost, ...prev];
      save(next);
      return next;
    });
    const typeLabel = post.type === "workout" ? "workout" : post.type === "milestone" ? "milestone" : post.type === "pr" ? "PR" : "post";
    addNotification({
      title: "Posted to Community 🎉",
      message: `Your ${typeLabel} is live on the feed`,
      type: "social",
      route: "/(tabs)/profile",
    });
  }, [save, addNotification]);

  const addComment = useCallback((postId: string, comment: Omit<SocialComment, "id" | "createdAt">) => {
    setPosts((prev) => {
      const next = prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [...p.comments, { ...comment, parentId: comment.parentId ?? null, id: "c_" + Date.now().toString(), createdAt: new Date().toISOString() }] }
          : p
      );
      save(next);
      return next;
    });
  }, [save]);

  const addReply = useCallback((postId: string, parentId: string, reply: Omit<SocialComment, "id" | "createdAt" | "parentId">) => {
    setPosts((prev) => {
      const next = prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [...p.comments, { ...reply, parentId, id: "r_" + Date.now().toString(), createdAt: new Date().toISOString() }] }
          : p
      );
      save(next);
      return next;
    });
  }, [save]);

  const toggleReaction = useCallback((postId: string, reaction: "fire" | "flex" | "clap", userId: string) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== postId) return p;
        const current = p.reactions[reaction];
        const updated = current.includes(userId)
          ? current.filter((id) => id !== userId)
          : [...current, userId];
        return { ...p, reactions: { ...p.reactions, [reaction]: updated } };
      });
      save(next);
      return next;
    });
  }, [save]);

  const deletePost = useCallback((postId: string, userId: string) => {
    setPosts((prev) => {
      const next = prev.filter((p) => !(p.id === postId && p.userId === userId));
      save(next);
      return next;
    });
  }, [save]);

  return (
    <SocialContext.Provider value={{ posts, addPost, addComment, addReply, toggleReaction, deletePost }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocial must be used within SocialProvider");
  return ctx;
}
