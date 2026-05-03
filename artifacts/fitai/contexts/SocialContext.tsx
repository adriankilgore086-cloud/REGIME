import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@fitai_social_v1";

export type PostType = "text" | "workout" | "milestone" | "pr" | "media";
export type Audience = "global" | "friends";

export interface SocialComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
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
  userBadge: string;
  type: PostType;
  text: string;
  mediaUri?: string;
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

const SEED_POSTS: SocialPost[] = [
  {
    id: "sp1", userId: "sarah_l", userName: "Sarah L.", userAvatar: "S",
    userBadge: "Iron Discipline", type: "pr", audience: "global",
    text: "New deadlift PR today — 120kg! 🔥 Consistent progressive overload finally paying off. Three months of this program and the results are undeniable.",
    value: "120kg Deadlift PR",
    reactions: { fire: ["u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9", "u10", "u11", "u12", "u13", "u14", "u15", "u16", "u17", "u18"], flex: ["u2", "u3", "u4", "u5", "u6", "u7"], clap: ["u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9", "u10", "u11"] },
    comments: [
      { id: "c1", userId: "marcus_k", userName: "Marcus K.", userAvatar: "M", userBadge: "Elite Performer", text: "Absolute beast mode! What program are you running?", createdAt: new Date(Date.now() - 1200000).toISOString() },
      { id: "c2", userId: "priya_r", userName: "Priya R.", userAvatar: "P", userBadge: "Endurance Champ", text: "Goals!! You've been so consistent. It shows 💪", createdAt: new Date(Date.now() - 900000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 1380000).toISOString(),
  },
  {
    id: "sp2", userId: "marcus_k", userName: "Marcus K.", userAvatar: "M",
    userBadge: "Elite Performer", type: "milestone", audience: "global",
    text: "Crushed a 34-day streak. Never missed a Monday this year. Consistency > intensity, every single time.",
    milestoneTitle: "34-Day Streak",
    value: "34 days straight",
    reactions: { fire: ["u1", "u3", "u4", "u5", "u6", "u7", "u8", "u9", "u10", "u11", "u12", "u13", "u14", "u15", "u16", "u17", "u18", "u19", "u20", "u21", "u22", "u23", "u24"], flex: ["u1", "u3", "u4", "u5", "u6", "u7", "u8", "u9"], clap: ["u1", "u3", "u4", "u5", "u6", "u7", "u8", "u9", "u10", "u11", "u12", "u13", "u14", "u15"] },
    comments: [
      { id: "c3", userId: "jake_t", userName: "Jake T.", userAvatar: "J", userBadge: "The Grinder", text: "Legend. I'm at 12 days and already struggling on weekends 😅", createdAt: new Date(Date.now() - 3300000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "sp3", userId: "priya_r", userName: "Priya R.", userAvatar: "P",
    userBadge: "Endurance Champ", type: "workout", audience: "global",
    text: "5K in 22:14 — shaved 45 seconds off my previous best. The AI pacing plan actually works. Interval training with progressive overload on rest times.",
    workoutName: "Morning 5K Run", workoutDuration: "22:14", workoutCalories: 280,
    value: "22:14 5K",
    reactions: { fire: ["u1", "u2", "u4", "u5", "u6", "u7", "u8", "u9", "u10", "u11", "u12", "u13", "u14", "u15", "u16", "u17", "u18", "u19", "u20", "u21", "u22", "u23", "u24", "u25", "u26", "u27", "u28", "u29", "u30", "u31"], flex: ["u1", "u2", "u4", "u5"], clap: ["u1", "u2", "u4", "u5", "u6", "u7", "u8", "u9", "u10", "u11", "u12", "u13", "u14", "u15", "u16", "u17", "u18", "u19", "u20"] },
    comments: [],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "sp4", userId: "jake_t", userName: "Jake T.", userAvatar: "J",
    userBadge: "The Grinder", type: "milestone", audience: "friends",
    text: "Week 8 of the strength program. Volume is up 30% from baseline and I finally hit my first bodyweight bench. Slow progress is still progress.",
    milestoneTitle: "Week 8 Complete",
    value: "+30% volume",
    reactions: { fire: ["u1", "u2", "u3", "u5", "u6", "u7", "u8"], flex: ["u1", "u2", "u3", "u5", "u6", "u7", "u8", "u9", "u10", "u11", "u12"], clap: ["u1", "u2", "u3", "u5", "u6"] },
    comments: [
      { id: "c4", userId: "amy_w", userName: "Amy W.", userAvatar: "A", userBadge: "Consistency King", text: "Bodyweight bench is such an underrated milestone. Congrats!", createdAt: new Date(Date.now() - 16000000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: "sp5", userId: "amy_w", userName: "Amy W.", userAvatar: "A",
    userBadge: "Consistency King", type: "milestone", audience: "global",
    text: "Unlocked the 'Week Warrior' badge after 7 straight days of training. Every session counts, no matter how short.",
    milestoneTitle: "Week Warrior Badge",
    value: "Badge Unlocked",
    reactions: { fire: ["u1", "u2", "u3", "u4", "u6", "u7", "u8", "u9", "u10", "u11", "u12", "u13", "u14"], flex: ["u1", "u2", "u3"], clap: ["u1", "u2", "u3", "u4", "u6", "u7", "u8", "u9"] },
    comments: [],
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  },
];

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<SocialPost[]>(SEED_POSTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as SocialPost[];
          if (Array.isArray(saved) && saved.length > 0) {
            setPosts((prev) => {
              const savedIds = new Set(saved.map((p) => p.id));
              const merged = [...saved, ...prev.filter((p) => !savedIds.has(p.id))];
              return merged;
            });
          }
        } catch {}
      }
    });
  }, []);

  const save = useCallback((newPosts: SocialPost[]) => {
    const userPosts = newPosts.filter((p) => !SEED_POSTS.some((s) => s.id === p.id));
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userPosts));
  }, []);

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
  }, [save]);

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
