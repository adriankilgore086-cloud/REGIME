import {
  useCreateSocialComment,
  useCreateSocialPost,
  useCreateSocialReply,
  useDeleteSocialPost,
  useGetSocialFeed,
  useReactToSocialPost,
} from "@workspace/api-client-react";

export function useSocialServerApi(enabled: boolean) {
  const feed = useGetSocialFeed(undefined, { query: { enabled, retry: 1, staleTime: 15_000 } as any });

  return {
    feed,
    createPost: useCreateSocialPost(),
    deletePost: useDeleteSocialPost(),
    reactToPost: useReactToSocialPost(),
    createComment: useCreateSocialComment(),
    createReply: useCreateSocialReply(),
  };
}
