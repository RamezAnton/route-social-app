import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PostCard, type Post } from "../../components/Post";
import { getBookmarks } from "../../api/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { mapApiComment } from "../../components/Post/comments";
import { isLikedByMe, mapSharedPost, sharesCountOf, likesCountOf, commentsCountOf } from "../../utils/apiShape";
import { getPostPrivacy, privacyFromPayload } from "../../utils/privacy";
import { PostCardSkeleton } from "../../components/Skeletons";

type ApiPost = {
  _id?: string;
  id?: string;
  body?: string;
  content?: string;
  image?: string;
  photo?: string;
  createdAt?: string;
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    username?: string;
    photo?: string;
    avatar?: string;
  };
};

function mapPost(p: ApiPost, i: number, meId: string): Post {
  const raw = p as unknown as Record<string, unknown>;
  const commentsList = Array.isArray(raw.comments)
    ? (raw.comments as Record<string, unknown>[])
    : [];
  const first = commentsList[0] ?? null;
  const id = String(p._id ?? p.id ?? i);
  return {
    id,
    author: {
      id: String(p.user?._id ?? p.user?.id ?? ""),
      name: p.user?.name ?? "Unknown",
      username: p.user?.username ?? "user",
      avatarUrl: p.user?.photo ?? p.user?.avatar,
    },
    content: p.body ?? p.content ?? "",
    imageUrl: p.image ?? p.photo,
    createdAt: p.createdAt ?? "",
    likes: likesCountOf(raw),
    commentsCount: commentsCountOf(raw),
    likedByMe: isLikedByMe(raw, meId),
    savedByMe: true,
    privacy:
      privacyFromPayload(raw) ?? getPostPrivacy(id) ?? "public",
    sharesCount: sharesCountOf(raw),
    sharedPost: mapSharedPost(raw),
    topComment: first ? mapApiComment(first, 0, meId) : null,
  };
}

function extractList(data: unknown): ApiPost[] {
  const d = data as {
    data?: { posts?: unknown[]; bookmarks?: unknown[] };
    posts?: unknown[];
    bookmarks?: unknown[];
  };
  const list =
    d?.data?.posts ?? d?.data?.bookmarks ?? d?.posts ?? d?.bookmarks ?? [];
  return Array.isArray(list) ? (list as ApiPost[]) : [];
}

export default function Saved() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useCurrentUser();

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    const meId = user.id;
    getBookmarks()
      .then((data) => {
        if (cancelled) return;
        setPosts(extractList(data).map((p, i) => mapPost(p, i, meId)));
      })
      .catch(() => {
        if (!cancelled) toast.error("Unable to load saved posts.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold">Saved posts</h1>
      {loading && <PostCardSkeleton count={3} />}
      {!loading && posts.length === 0 && (
        <p className="rounded-2xl border border-default-200 bg-background p-6 text-center text-sm text-default-500">
          No saved posts yet.
        </p>
      )}
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          currentUserId={user.id}
          currentUserName={user.name}
          onSave={(id, isSaved) => {
            if (!isSaved) setPosts((prev) => prev.filter((x) => x.id !== id));
          }}
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
