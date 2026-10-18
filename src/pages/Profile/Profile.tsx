import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { Camera } from "lucide-react";
import { toast } from "react-toastify";
import { PostCard, type Post } from "../../components/Post";
import {
  deleteCover,
  getBookmarks,
  getProfile,
  getUserPosts,
  uploadCover,
  uploadProfilePhoto,
} from "../../api/api";
import { mapApiComment } from "../../components/Post/comments";
import { isLikedByMe, isSavedByMe, mapSharedPost, sharesCountOf, likesCountOf, commentsCountOf } from "../../utils/apiShape";
import { getPostPrivacy, privacyFromPayload } from "../../utils/privacy";
import { PostCardSkeleton, ProfileHeaderSkeleton } from "../../components/Skeletons";
import { Lightbox } from "../../components/Lightbox";

type ProfileUser = {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  coverUrl?: string;
  about?: string;
  followersCount: number;
  followingCount: number;
};

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function toUser(raw: unknown): ProfileUser {
  const u = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;
  const arrLen = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  return {
    id: str(u._id) ?? str(u.id) ?? "me",
    name: str(u.name) ?? "You",
    username: str(u.username) ?? "me",
    email: str(u.email),
    avatarUrl: str(u.photo) ?? str(u.avatar),
    coverUrl: str(u.cover) ?? str(u.coverPhoto),
    about: str(u.about) ?? str(u.bio),
    followersCount:
      typeof u.followersCount === "number"
        ? u.followersCount
        : arrLen(u.followers),
    followingCount:
      typeof u.followingCount === "number"
        ? u.followingCount
        : arrLen(u.following),
  };
}

function toPost(p: Record<string, unknown>, i: number, meId: string): Post {
  const u = (p.user ?? {}) as Record<string, unknown>;
  const commentsList = Array.isArray(p.comments)
    ? (p.comments as Record<string, unknown>[])
    : [];
  const first = commentsList[0] ?? null;
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
  const d = data as { data?: { posts?: unknown[] }; posts?: unknown[] };
  const list = d?.data?.posts ?? d?.posts ?? d?.data ?? [];
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}

type Tab = "posts" | "saved" | "about";

export default function Profile() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [saved, setSaved] = useState<Post[]>([]);
  const [tab, setTab] = useState<Tab>("posts");
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  function coverKey(userId: string) {
    return `route_cover_${userId}`;
  }

  async function reloadProfile() {
    const profile = await getProfile();
    const raw = profile?.data?.user ?? profile?.user ?? profile?.data;
    const me = toUser(raw);
    try {
      const localCover = localStorage.getItem(coverKey(me.id));
      if (localCover) me.coverUrl = localCover;
    } catch {
      // localStorage unavailable — ignore.
    }
    setUser(me);
    return me;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await reloadProfile();
        if (cancelled) return;

        const [postsData, savedData] = await Promise.allSettled([
          me.id !== "me"
            ? getUserPosts(me.id)
            : Promise.resolve({ data: { posts: [] } }),
          getBookmarks(),
        ]);
        if (!cancelled) {
          if (postsData.status === "fulfilled") {
            setPosts(
              extractPosts(postsData.value).map((p, i) => toPost(p, i, me.id)),
            );
          }
          if (savedData.status === "fulfilled") {
            setSaved(
              extractPosts(savedData.value).map((p, i) => ({
                ...toPost(p, i, me.id),
                savedByMe: true,
              })),
            );
          }
        }
      } catch {
        if (!cancelled) toast.error("Unable to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAvatarPick(file: File | null) {
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      await uploadProfilePhoto(file);
      toast.success("Profile photo updated.");
      await reloadProfile();
    } catch {
      toast.error("Unable to upload profile photo.");
    } finally {
      setUploadingAvatar(false);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  }

  async function handleRemoveCover() {
    if (!user) return;
    try {
      await deleteCover();
    } catch {
      // Server removal unsupported — still clear the local override.
    }
    try {
      localStorage.removeItem(coverKey(user.id));
    } catch {
      // Storage unavailable — ignore.
    }
    setUser((prev) => (prev ? { ...prev, coverUrl: undefined } : prev));
    toast.success("Cover removed.");
  }

  function handleCoverPick(file: File | null) {
    if (!file || !user) return;
    void uploadCoverFlow(file);
  }

  async function uploadCoverFlow(file: File) {
    if (!user) return;
    setUploadingCover(true);
    try {
      await uploadCover(file);
      try {
        localStorage.removeItem(coverKey(user.id));
      } catch {
        // Storage unavailable — ignore.
      }
      toast.success("Cover updated.");
      await reloadProfile();
    } catch {
      // Server upload unsupported/failed — keep the local-only fallback.
      saveCoverLocally(file);
    } finally {
      setUploadingCover(false);
      if (coverRef.current) coverRef.current.value = "";
    }
  }

  function saveCoverLocally(file: File) {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Cover image must be smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) {
        toast.error("Unable to read cover image.");
        return;
      }
      try {
        localStorage.setItem(coverKey(user.id), dataUrl);
      } catch {
        // Storage full — still show it for this session.
      }
      setUser((prev) => (prev ? { ...prev, coverUrl: dataUrl } : prev));
      toast.success("Cover updated.");
    };
    reader.onerror = () => toast.error("Unable to read cover image.");
    reader.readAsDataURL(file);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <ProfileHeaderSkeleton />
        <PostCardSkeleton count={2} />
      </div>
    );
  }
  if (!user) {
    return <p className="text-sm text-default-500">Unable to load profile.</p>;
  }

  const stats = [
    { label: "Followers", value: user.followersCount },
    { label: "Following", value: user.followingCount },
    { label: "Posts", value: posts.length },
    { label: "Saved", value: saved.length },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-default-200 bg-background">
        <div className="relative h-40 bg-linear-to-r from-primary/40 via-primary/20 to-primary/40 sm:h-52">
          {user.coverUrl && (
            <button
              type="button"
              onClick={() => user.coverUrl && setLightbox(user.coverUrl)}
              aria-label="View cover image full size"
              className="block h-full w-full cursor-zoom-in"
            >
              <img
                src={user.coverUrl}
                alt="Cover"
                className="h-full w-full object-cover"
              />
            </button>
          )}
          <div className="absolute bottom-3 right-3 flex gap-2">
            {user.coverUrl && (
              <Button
                size="sm"
                variant="secondary"
                aria-label="Remove cover image"
                onPress={() => void handleRemoveCover()}
                className="shadow"
              >
                Remove
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              aria-label="Upload cover image"
              onPress={() => coverRef.current?.click()}
              isDisabled={uploadingCover}
              className="shadow"
            >
              <Camera size={16} />
              {uploadingCover ? "Uploading..." : "Change cover"}
            </Button>
          </div>
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            hidden
            aria-label="Upload cover image"
            onChange={(e) => handleCoverPick(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-3 flex items-end justify-between">
            <div className="relative">
              {user.avatarUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    user.avatarUrl && setLightbox(user.avatarUrl)
                  }
                  aria-label="View profile photo full size"
                  className="block cursor-zoom-in rounded-full"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="size-20 rounded-full border-4 border-background object-cover"
                  />
                </button>
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full border-4 border-background bg-default-200 text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                aria-label="Upload profile photo"
                onPress={() => avatarRef.current?.click()}
                isDisabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 rounded-full shadow"
              >
                <Camera size={15} />
              </Button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                hidden
                aria-label="Upload profile photo"
                onChange={(e) => handleAvatarPick(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          {uploadingAvatar && (
            <p className="mb-2 text-xs text-default-500">Uploading photo...</p>
          )}
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-sm text-default-500">@{user.username}</p>
          {user.email && (
            <p className="text-sm text-default-500">{user.email}</p>
          )}

          <div className="mt-4 grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-default-100 p-3 text-center"
              >
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-default-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["posts", "saved", "about"] as Tab[]).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "primary" : "secondary"}
            onPress={() => setTab(t)}
          >
            {t === "posts"
              ? "My Posts"
              : t === "saved"
                ? "Saved posts"
                : "About"}
          </Button>
        ))}
      </div>

      {tab === "about" && (
        <div className="rounded-2xl border border-default-200 bg-background p-6">
          <h2 className="mb-2 font-semibold">About</h2>
          <p className="text-sm text-default-600">
            {user.about ?? "No bio yet."}
          </p>
          {user.email && (
            <p className="mt-2 text-sm text-default-500">{user.email}</p>
          )}
        </div>
      )}

      {tab === "posts" && (
        <div className="space-y-4">
          {posts.length === 0 && (
            <p className="rounded-2xl border border-default-200 bg-background p-6 text-center text-sm text-default-500">
              No posts yet.
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
      )}

      {tab === "saved" && (
        <div className="space-y-4">
          {saved.length === 0 && (
            <p className="rounded-2xl border border-default-200 bg-background p-6 text-center text-sm text-default-500">
              No saved posts yet.
            </p>
          )}
          {saved.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              currentUserId={user.id}
              currentUserName={user.name}
              onSave={(id, isSaved) => {
                if (!isSaved)
                  setSaved((prev) => prev.filter((x) => x.id !== id));
              }}
              onDeleted={(id) => {
                setPosts((prev) => prev.filter((x) => x.id !== id));
                setSaved((prev) => prev.filter((x) => x.id !== id));
              }}
              onUpdated={(updated) => {
                setPosts((prev) =>
                  prev.map((x) => (x.id === updated.id ? updated : x)),
                );
                setSaved((prev) =>
                  prev.map((x) => (x.id === updated.id ? updated : x)),
                );
              }}
            />
          ))}
        </div>
      )}
      <Lightbox
        src={lightbox}
        alt="Profile image full size"
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
