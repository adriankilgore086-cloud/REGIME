import { Dispatch, SetStateAction, useCallback } from "react";
import type { AppNotification } from "@store/FitnessContext";
import type { SocialComment, SocialPost } from "@store/SocialContext";

type ReactionType = "fire" | "flex" | "clap";

type UseSocialActionsOptions = {
  setPosts: Dispatch<SetStateAction<SocialPost[]>>;
  savePosts: (posts: SocialPost[]) => void;
  addNotification: (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
};

export function useSocialActions({ setPosts, savePosts, addNotification }: UseSocialActionsOptions) {
  const addPost = useCallback(
    (post: Omit<SocialPost, "id" | "createdAt" | "reactions" | "comments">) => {
      const newPost: SocialPost = {
        ...post,
        id: "up_" + Date.now().toString() + Math.random().toString(36).substr(2, 5),
        reactions: { fire: [], flex: [], clap: [] },
        comments: [],
        createdAt: new Date().toISOString(),
      };
      setPosts((prev) => {
        const next = [newPost, ...prev];
        savePosts(next);
        return next;
      });

      const typeLabel =
        post.type === "workout" ? "workout" : post.type === "milestone" ? "milestone" : post.type === "pr" ? "PR" : "post";
      addNotification({
        title: "Posted to Community 🎉",
        message: `Your ${typeLabel} is live on the feed`,
        type: "social",
        route: "/(tabs)/profile",
      });
    },
    [addNotification, savePosts, setPosts],
  );

  const addComment = useCallback(
    (postId: string, comment: Omit<SocialComment, "id" | "createdAt">) => {
      setPosts((prev) => {
        const next = prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, { ...comment, parentId: comment.parentId ?? null, id: "c_" + Date.now().toString(), createdAt: new Date().toISOString() }] }
            : post,
        );
        savePosts(next);
        return next;
      });
    },
    [savePosts, setPosts],
  );

  const addReply = useCallback(
    (postId: string, parentId: string, reply: Omit<SocialComment, "id" | "createdAt" | "parentId">) => {
      setPosts((prev) => {
        const next = prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, { ...reply, parentId, id: "r_" + Date.now().toString(), createdAt: new Date().toISOString() }] }
            : post,
        );
        savePosts(next);
        return next;
      });
    },
    [savePosts, setPosts],
  );

  const toggleReaction = useCallback(
    (postId: string, reaction: ReactionType, userId: string) => {
      setPosts((prev) => {
        const next = prev.map((post) => {
          if (post.id !== postId) return post;
          const current = post.reactions[reaction];
          const updated = current.includes(userId)
            ? current.filter((id) => id !== userId)
            : [...current, userId];
          return { ...post, reactions: { ...post.reactions, [reaction]: updated } };
        });
        savePosts(next);
        return next;
      });
    },
    [savePosts, setPosts],
  );

  const deletePost = useCallback(
    (postId: string, userId: string) => {
      setPosts((prev) => {
        const next = prev.filter((post) => !(post.id === postId && post.userId === userId));
        savePosts(next);
        return next;
      });
    },
    [savePosts, setPosts],
  );

  return { addPost, addComment, addReply, toggleReaction, deletePost };
}
