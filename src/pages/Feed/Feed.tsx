import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CreatePost, type NewPost } from "../../components/CreatePost/CreatePost";
import { PostCard, type Post } from "../../components/Post";
import { PostCardSkeleton } from "../../components/Skeletons";
import {
  createPostRequest,
  getBookmarks,
  getFeed,
  getToken,
} from "../../api/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { mapApiComment } from "../../components/Post/comments";
import {
  commentsCountOf,
  isLikedByMe,
  isSavedByMe,
  likesCountOf,
  mapSharedPost,
  sharesCountOf,
} from "../../utils/apiShape";
import {
  getPostPrivacy,
  privacyFromPayload,
  savePostPrivacy,
} from "../../utils/privacy";

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function mapApiPost(
  p: Record<string, unknown>,
  index: number,
  savedIds: Set<string>,
  meId: string,
): Post {
  const u = (p.user ?? {}) as Record<string, unknown>;
  const commentsList = Array.isArray(p.comments) ? p.comments : [];
  const first = (commentsList[0] ?? null) as Record<string, unknown> | null;
  const id = str(p._id) ?? str(p.id) ?? String(index);
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
    createdAt: str(p.createdAt) ?? "now",
    likes: likesCountOf(p),
    commentsCount: commentsCountOf(p),
    likedByMe: isLikedByMe(p, meId),
    savedByMe: isSavedByMe(p, meId, savedIds),
    sharesCount: sharesCountOf(p),
    sharedPost: mapSharedPost(p),
    privacy: privacyFromPayload(p) ?? getPostPrivacy(id) ?? "public",
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

function extractIds(data: unknown): Set<string> {
  const d = data as {
    data?: { posts?: unknown[]; bookmarks?: unknown[] };
    posts?: unknown[];
    bookmarks?: unknown[];
  };
  const list =
    d?.data?.posts ?? d?.data?.bookmarks ?? d?.posts ?? d?.bookmarks ?? [];
  if (!Array.isArray(list)) return new Set();
  const ids = (list as Record<string, unknown>[]).map(
    (p) => str(p._id) ?? str(p.id) ?? str(p.postId) ?? "",
  );
  return new Set(ids.filter(Boolean));
}

const fallbackPosts: Post[] = [
  {
    id: "demo-1",
    author: { name: "Ramez", username: "ramez" },
    content: "Welcome to Route social app. Sign in to load the live feed.",
    createdAt: "now",
    likes: 3,
    commentsCount: 1,
    topComment: {
      id: "c1",
      authorName: "Route Team",
      content: "This is a preview of the top comment. Open the post to see more.",
      likesCount: 0,
    },
  },
];

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>(fallbackPosts);
  const [loading, setLoading] = useState(() => !!getToken());
  const { user, loading: authLoading } = useCurrentUser();

  async function refresh(meId: string) {
    const [feedData, bookmarksData] = await Promise.all([
      getFeed(),
      getBookmarks().catch(() => null),
    ]);
    const list = extractPosts(feedData);
    if (list.length > 0) {
      setPosts(
        list.map((p, i) => mapApiPost(p, i, extractIds(bookmarksData), meId)),
      );
    }
  }

  useEffect(() => {
    if (!getToken() || authLoading) return;
    let cancelled = false;
    const meId = user.id;
    Promise.all([getFeed(), getBookmarks().catch(() => null)])
      .then(([feedData, bookmarksData]) => {
        if (cancelled) return;
        const list = extractPosts(feedData);
        if (list.length > 0) {
          setPosts(
            list.map((p, i) =>
              mapApiPost(p, i, extractIds(bookmarksData), meId),
            ),
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function handlePublish(newPost: NewPost) {
    if (!getToken()) {
      toast.info("Sign in to publish a post.");
      return;
    }
    try {
      const created = await createPostRequest(
        newPost.content,
        newPost.image,
        newPost.privacy ?? "public",
      );
      const createdRaw =
        (created as Record<string, unknown>)?.data ??
        (created as Record<string, unknown>);
      const createdPost =
        (createdRaw as Record<string, unknown>)?.post ?? createdRaw;
      const createdId =
        typeof (createdPost as Record<string, unknown>)?._id === "string"
          ? ((createdPost as Record<string, unknown>)._id as string)
          : typeof (createdPost as Record<string, unknown>)?.id === "string"
            ? ((createdPost as Record<string, unknown>).id as string)
            : undefined;
      if (createdId) savePostPrivacy(createdId, newPost.privacy ?? "public");
      toast.success("Post published.");
      await refresh(user.id);
    } catch {
      toast.error("Unable to publish your post.");
      throw new Error("publish failed");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <CreatePost onPublish={handlePublish} user={user} />
      {loading && <PostCardSkeleton count={3} />}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={user.id}
          currentUserName={user.name}
          onDeleted={(id) =>
            setPosts((prev) => prev.filter((p) => p.id !== id))
          }
          onUpdated={(updated) =>
            setPosts((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p)),
            )
          }
          onShared={() => void refresh(user.id)}
        />
      ))}
    </div>
  );
}
