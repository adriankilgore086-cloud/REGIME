import React, { createContext, useContext } from "react";
import { useAuth } from "@clerk/expo";
import { useFitness } from "@store/FitnessContext";
import { useSocialActions } from "@features/social/hooks/useSocialActions";
import { useSocialFeed } from "@features/social/hooks/useSocialFeed";

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
  const { posts, setPosts, savePosts } = useSocialFeed(userId);
  const { addPost, addComment, addReply, toggleReaction, deletePost } = useSocialActions({
    setPosts,
    savePosts,
    addNotification,
  });

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
