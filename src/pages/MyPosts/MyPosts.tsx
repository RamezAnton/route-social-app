import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PostCard, type Post } from "../../components/Post";
import { getFeed, getProfile, getUserPosts } from "../../api/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { mapApiComment } from "../../components/Post/comments";
import { isLikedByMe, isSavedByMe, mapSharedPost, sharesCountOf, likesCountOf, commentsCountOf } from "../../utils/apiShape";
import { getPostPrivacy, privacyFromPayload } from "../../utils/privacy";
import { PostCardSkeleton } from "../../components/Skeletons";

function toPost(p: Record<string, unknown>, i: number, meId: string): Post {
  const u = (p.user ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const commentsList = Array.isArray(p.comments) ? p.comments : [];
  const first = (commentsList[0] ?? null) as Record<string, unknown> | null;
  const id = str(p._id) ?? str(p.id) ?? String(i);
  return {
    id,
    author: {
      id: str(u._id) ?? str(u.id),
      name: str(u.name) ?? "Unknown",
      username: str(u.username) ?? "user",
      avatarUrl: str(u.photo) ?? str(u.avatar),
    },
    content: str(p.body) ?? str(p.content) ?? "",
    imageUrl: str(p.image) ?? str(p.photo),
    createdAt: str(p.createdAt) ?? "",
    likes: likesCountOf(p),
    commentsCount: commentsCountOf(p),
    likedByMe: isLikedByMe(p, meId),
    savedByMe: isSavedByMe(p, meId),
    privacy: privacyFromPayload(p) ?? getPostPrivacy(id) ?? "public",
    sharesCount: sharesCountOf(p),
    sharedPost: mapSharedPost(p),
    topComment: first ? mapApiComment(first, 0, meId) : null,
  };
}

function extractPosts(data: unknown): Record<string, unknown>[] {
  const d = data as {
    data?: { posts?: unknown[] };
    posts?: unknown[];
  };
  const list = d?.data?.posts ?? d?.posts ?? d?.data ?? [];
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}

export default function MyPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useCurrentUser();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        const me = profile?.data?.user ?? profile?.user ?? profile?.data;
        const myId =
          (me as Record<string, unknown>)?._id ??
          (me as Record<string, unknown>)?.id;
        let data: unknown = null;
        if (typeof myId === "string") {
          try {
            data = await getUserPosts(myId);
          } catch {
            data = await getFeed(1, 20, "me");
          }
        } else {
          data = await getFeed(1, 20, "me");
        }
        if (!cancelled)
          setPosts(
            extractPosts(data).map((p, i) =>
              toPost(p, i, typeof myId === "string" ? myId : user.id),
            ),
          );
      } catch {
        if (!cancelled) toast.error("Unable to load your posts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold">My Posts</h1>
      {loading && <PostCardSkeleton count={3} />}
      {!loading && posts.length === 0 && (
        <p className="rounded-2xl border border-default-200 bg-background p-6 text-center text-sm text-default-500">
          You haven't posted anything yet.
        </p>
      )}
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          currentUserId={user.id}
          currentUserName={user.name}
          onDeleted={(id) =>
            setPosts((prev) => prev.filter((x) => x.id !== id))
          }
          onUpdated={(updated) =>
            setPosts((prev) =>
              prev.map((x) => (x.id === updated.id ? updated : x)),
            )
          }
        />
      ))}
    </div>
  );
}
