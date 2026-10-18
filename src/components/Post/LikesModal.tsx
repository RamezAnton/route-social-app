import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@heroui/react";
import { Heart, UserCheck, UserPlus, X } from "lucide-react";
import { toast } from "react-toastify";
import { getPostLikes, toggleFollow } from "../../api/api";

type Liker = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  isFollowing: boolean;
};

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null
    ? (v as Record<string, unknown>)
    : null;
}

function mapLiker(raw: unknown): Liker {
  const r = asRecord(raw) ?? {};
  const u = asRecord(r.user) ?? r;
  return {
    id: str(u._id) ?? str(u.id) ?? Math.random().toString(36).slice(2),
    name: str(u.name) ?? "User",
    username: str(u.username) ?? "user",
    avatarUrl: str(u.photo) ?? str(u.avatar) ?? str(u.avatarUrl),
    isFollowing: u.isFollowing === true,
  };
}

function extractLikers(data: unknown): Record<string, unknown>[] {
  const d = asRecord(data);
  const nested = d ? asRecord(d.data) : null;
  const list =
    (nested ? nested.users : undefined) ??
    (nested ? nested.likes : undefined) ??
    (d ? d.users : undefined) ??
    (d ? d.likes : undefined) ??
    [];
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}

const PAGE_SIZE = 20;

export function LikesModal({
  postId,
  open,
  onClose,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [likers, setLikers] = useState<Liker[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getPostLikes(postId, 1, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        const list = extractLikers(data).map(mapLiker);
        setLikers(list);
        setHasMore(list.length >= PAGE_SIZE);
      })
      .catch(() => {
        if (!cancelled) toast.error("Unable to load reactions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function handleLoadMore() {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const data = await getPostLikes(postId, next, PAGE_SIZE);
      const list = extractLikers(data).map(mapLiker);
      if (list.length === 0) {
        setHasMore(false);
      } else {
        setLikers((prev) => {
          const seen = new Set(prev.map((u) => u.id));
          return [...prev, ...list.filter((u) => !seen.has(u.id))];
        });
        setPage(next);
        setHasMore(list.length >= PAGE_SIZE);
      }
    } catch {
      toast.error("Unable to load more.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleFollow(id: string) {
    try {
      await toggleFollow(id);
      setLikers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, isFollowing: !u.isFollowing } : u,
        ),
      );
    } catch {
      toast.error("Unable to follow user.");
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="People who reacted"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-default-200 bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-default-200 px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Heart size={18} className="text-danger" fill="currentColor" />
            People who reacted
          </h2>
          <Button isIconOnly variant="ghost" size="sm" onPress={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <p className="py-6 text-center text-sm text-default-500">Loading...</p>
          )}
          {!loading && likers.length === 0 && (
            <p className="py-6 text-center text-sm text-default-500">
              No reactions yet.
            </p>
          )}
          <ul className="space-y-3">
            {likers.map((u) => (
              <li key={u.id} className="flex items-center gap-3">
                <Link
                  to={`/users/${u.id}`}
                  onClick={onClose}
                  className="shrink-0"
                >
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-default-200 font-semibold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/users/${u.id}`}
                    onClick={onClose}
                    className="block truncate text-sm font-semibold hover:underline"
                  >
                    {u.name}
                  </Link>
                  <p className="truncate text-xs text-default-500">
                    @{u.username}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={u.isFollowing ? "secondary" : "primary"}
                  onPress={() => void handleFollow(u.id)}
                >
                  {u.isFollowing ? (
                    <UserCheck size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {u.isFollowing ? "Following" : "Follow"}
                </Button>
              </li>
            ))}
          </ul>
          {hasMore && likers.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                onPress={() => void handleLoadMore()}
                isDisabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
