import React, { createContext, useCallback, useContext, useEffect } from "react";
import { useAuth } from "@clerk/expo";
import { useFitness } from "@store/FitnessContext";
import { useSocialActions } from "@features/social/hooks/useSocialActions";
import { useSocialFeed } from "@features/social/hooks/useSocialFeed";
import { useSocialServerApi } from "@features/social/hooks/useSocialServerApi";
import { USE_SERVER_PERSISTENCE } from "@shared/api/serverPersistence";

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
  const useServerPersistence = USE_SERVER_PERSISTENCE && Boolean(userId);
  const { posts, setPosts, savePosts } = useSocialFeed(userId);
  const serverApi = useSocialServerApi(useServerPersistence);
  const localActions = useSocialActions({
    setPosts,
    savePosts,
    addNotification,
  });

  useEffect(() => {
    if (!useServerPersistence || !serverApi.feed.data?.posts) return;
    setPosts(serverApi.feed.data.posts);
    savePosts(serverApi.feed.data.posts);
  }, [savePosts, serverApi.feed.data?.posts, setPosts, useServerPersistence]);

  const addPost = useCallback<SocialContextType["addPost"]>((post) => {
    if (useServerPersistence) {
      const { userId: _userId, userName: _userName, userAvatar: _userAvatar, userBadge: _userBadge, userProfileImage: _userProfileImage, ...data } = post;
      serverApi.createPost.mutateAsync({ data }).catch(() => {});
    }
    localActions.addPost(post);
  }, [localActions, serverApi.createPost, useServerPersistence]);

  const addComment = useCallback<SocialContextType["addComment"]>((postId, comment) => {
    if (useServerPersistence) {
      serverApi.createComment.mutateAsync({ id: postId, data: { text: comment.text } }).catch(() => {});
    }
    localActions.addComment(postId, comment);
  }, [localActions, serverApi.createComment, useServerPersistence]);

  const addReply = useCallback<SocialContextType["addReply"]>((postId, parentId, reply) => {
    if (useServerPersistence) {
      serverApi.createReply.mutateAsync({ id: postId, commentId: parentId, data: { text: reply.text } }).catch(() => {});
    }
    localActions.addReply(postId, parentId, reply);
  }, [localActions, serverApi.createReply, useServerPersistence]);

  const toggleReaction = useCallback<SocialContextType["toggleReaction"]>((postId, reaction, reactingUserId) => {
    if (useServerPersistence) {
      serverApi.reactToPost.mutateAsync({ id: postId, data: { reaction } }).catch(() => {});
    }
    localActions.toggleReaction(postId, reaction, reactingUserId);
  }, [localActions, serverApi.reactToPost, useServerPersistence]);

  const deletePost = useCallback<SocialContextType["deletePost"]>((postId, deletingUserId) => {
    if (useServerPersistence) {
      serverApi.deletePost.mutateAsync({ id: postId }).catch(() => {});
    }
    localActions.deletePost(postId, deletingUserId);
  }, [localActions, serverApi.deletePost, useServerPersistence]);

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
