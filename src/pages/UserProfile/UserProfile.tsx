import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@heroui/react";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import { PostCard, type Post } from "../../components/Post";
import { getUserPosts, getUserProfile, toggleFollow } from "../../api/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { mapApiComment } from "../../components/Post/comments";
import { isLikedByMe, isSavedByMe, mapSharedPost, sharesCountOf, likesCountOf, commentsCountOf } from "../../utils/apiShape";
import { getPostPrivacy, privacyFromPayload } from "../../utils/privacy";

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export default function UserProfile() {
  const { userId = "" } = useParams();
  const [name, setName] = useState("User");
  const [username, setUsername] = useState("user");
  const [avatar, setAvatar] = useState<string | undefined>();
  const [cover, setCover] = useState<string | undefined>();
  const [about, setAbout] = useState<string | undefined>();
  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [mutualCount, setMutualCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const { user: me, loading: authLoading } = useCurrentUser();

  useEffect(() => {
    if (!userId || authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const [profile, postsData] = await Promise.all([
          getUserProfile(userId),
          getUserPosts(userId).catch(() => null),
        ]);
        if (cancelled) return;
        const u = (profile?.data?.user ?? profile?.user ?? profile?.data ??
          {}) as Record<string, unknown>;
        const avatarUrl = str(u.photo) ?? str(u.avatar);
        setName(str(u.name) ?? "User");
        setUsername(str(u.username) ?? "user");
        setAvatar(avatarUrl);
        setCover(str(u.cover) ?? str(u.coverPhoto));
        setAbout(str(u.about) ?? str(u.bio));
        if (typeof u.isFollowing === "boolean") setFollowing(u.isFollowing);
        const arrLen = (v: unknown) => (Array.isArray(v) ? v.length : 0);
        setFollowersCount(
          typeof u.followersCount === "number"
            ? u.followersCount
            : arrLen(u.followers),
        );
        setFollowingCount(
          typeof u.followingCount === "number"
            ? u.followingCount
            : arrLen(u.following),
        );
        setMutualCount(
          typeof u.mutualFollowersCount === "number"
            ? u.mutualFollowersCount
            : typeof u.mutualCount === "number"
              ? (u.mutualCount as number)
              : 0,
        );
        if (postsData) {
          const d = postsData as { data?: { posts?: unknown[] } };
          const list = Array.isArray(d?.data?.posts) ? d.data.posts : [];
          const visitorId = me.id;
          setPosts(
            (list as Record<string, unknown>[]).map((p, i) => {
              const rawComments = Array.isArray(p.comments)
                ? (p.comments as Record<string, unknown>[])
                : [];
              const pid = str(p._id) ?? str(p.id) ?? String(i);
              return {
                id: pid,
                author: {
                  id: userId,
                  name: str((p.user as Record<string, unknown> | undefined)?.name) ?? str(u.name) ?? "User",
                  username: str((p.user as Record<string, unknown> | undefined)?.username) ?? str(u.username) ?? "user",
                  avatarUrl: avatarUrl,
                },
                content: str(p.body) ?? str(p.content) ?? "",
                imageUrl: str(p.image) ?? str(p.photo),
                createdAt: str(p.createdAt) ?? "",
                likes: likesCountOf(p),
                commentsCount: commentsCountOf(p),
                likedByMe: isLikedByMe(p, visitorId),
                savedByMe: isSavedByMe(p, visitorId),
                privacy:
                  privacyFromPayload(p) ?? getPostPrivacy(pid) ?? "public",
                sharesCount: sharesCountOf(p),
                sharedPost: mapSharedPost(p),
                topComment: rawComments[0]
                  ? mapApiComment(rawComments[0], 0, visitorId)
                  : null,
              };
            }),
          );
        }
      } catch {
        if (!cancelled) toast.error("Unable to load user profile.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading]);

  async function handleFollow() {
    try {
      await toggleFollow(userId);
      setFollowing((f) => !f);
    } catch {
      toast.error("Unable to follow user.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="overflow-hidden rounded-2xl border border-default-200 bg-background">
        <div className="h-40 bg-linear-to-r from-primary/40 via-primary/20 to-primary/40 sm:h-52">
          {cover && (
            <img src={cover} alt="Cover" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-3 flex items-end justify-between gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="size-20 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full border-4 border-background bg-default-200 text-2xl font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <Button
              variant={following ? "secondary" : "primary"}
              onPress={handleFollow}
            >
              {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
              {following ? "Following" : "Follow"}
            </Button>
          </div>
          <h1 className="text-xl font-bold">{name}</h1>
          <p className="text-sm text-default-500">@{username}</p>
          {about && <p className="mt-2 text-sm text-default-600">{about}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs font-semibold text-default-500">
              {followersCount} follower{followersCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-default-100 px-2.5 py-1 text-xs font-semibold text-default-500">
              {followingCount} following
            </span>
            {mutualCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {mutualCount} mutual
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            currentUserId={me.id}
            currentUserName={me.name}
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
        {posts.length === 0 && (
          <p className="rounded-2xl border border-default-200 bg-background p-6 text-center text-sm text-default-500">
            No posts yet.
          </p>
        )}
      </div>
    </div>
  );
}
