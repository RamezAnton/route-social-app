import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@heroui/react";
import {
  AtSign,
  Bell,
  Bookmark,
  Check,
  CheckCheck,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../api/api";
import { useUnreadActions } from "../../context/AuthContext";
import { NotificationRowSkeleton } from "../../components/Skeletons";
import { formatExactDate, timeAgo } from "../../utils/timeAgo";

type Actor = {
  id?: string;
  name: string;
  username?: string;
  avatarUrl?: string;
};

type RichNotification = {
  id: string;
  actor: Actor;
  action: string;
  actionLabel: string;
  entityType?: string;
  entityId?: string;
  entityPreview?: string;
  isRead: boolean;
  createdAt?: string;
};

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null
    ? (v as Record<string, unknown>)
    : null;
}

function firstStr(
  objs: (Record<string, unknown> | null)[],
  keys: string[],
): string | undefined {
  for (const o of objs) {
    if (!o) continue;
    for (const key of keys) {
      const v = str(o[key]);
      if (v) return v;
    }
  }
  return undefined;
}

function actionLabelFor(action: string): string {
  switch (action.toLowerCase()) {
    case "like":
      return "liked your post";
    case "comment":
      return "commented on your post";
    case "reply":
      return "replied to your comment";
    case "follow":
      return "followed you";
    case "share":
      return "shared your post";
    case "mention":
      return "mentioned you";
    case "bookmark":
      return "saved your post";
    default:
      return action ? action.replaceAll("_", " ") : "sent you a notification";
  }
}

function ActionIcon({ action }: { action: string }) {
  const cls = "size-5";
  switch (action.toLowerCase()) {
    case "like":
      return <Heart size={15} className={cls + " text-danger"} />;
    case "comment":
    case "reply":
      return <MessageCircle size={15} className={cls + " text-primary"} />;
    case "follow":
      return <UserPlus size={15} className={cls + " text-success"} />;
    case "share":
      return <Share2 size={15} className={cls + " text-primary"} />;
    case "mention":
      return <AtSign size={15} className={cls + " text-warning"} />;
    case "bookmark":
      return <Bookmark size={15} className={cls + " text-primary"} />;
    default:
      return <Bell size={15} className={cls + " text-default-500"} />;
  }
}

function mapNotification(n: Record<string, unknown>, i: number): RichNotification {
  const actorRaw =
    asRecord(n.actor) ?? asRecord(n.sender) ?? asRecord(n.fromUser) ?? {};
  const actor: Actor = {
    id: firstStr([actorRaw], ["_id", "id", "userId"]),
    name:
      firstStr([actorRaw], ["name", "fullName", "displayName"]) ??
      (firstStr([actorRaw], ["username"])
        ? `@${firstStr([actorRaw], ["username"])}`
        : undefined) ??
      "Someone",
    username: firstStr([actorRaw], ["username", "handle"]),
    avatarUrl: firstStr([actorRaw], [
      "photo",
      "avatar",
      "avatarUrl",
      "profileImage",
      "image",
    ]),
  };

  const action = str(n.action) ?? str(n.type) ?? "";
  const entity = asRecord(n.entity) ?? {};
  const entityType = str(n.entityType);
  const entityPost = entity.post;
  const entityPostId =
    typeof entityPost === "string"
      ? entityPost
      : firstStr([asRecord(entityPost)], ["_id", "id"]);

  let entityId: string | undefined;
  if (entityType === "post") {
    entityId = firstStr([entity], ["_id", "id"]);
  } else if (entityType === "comment") {
    entityId = entityPostId;
  } else {
    entityId = firstStr([entity], ["_id", "id"]) ?? entityPostId;
  }

  const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
  return {
    id: str(n._id) ?? str(n.id) ?? String(i),
    actor,
    action,
    actionLabel: actionLabelFor(action),
    entityType,
    entityId,
    entityPreview: firstStr([entity], ["body", "content", "text", "name"]),
    isRead: bool(n.isRead) ?? bool(n.read) ?? !(n.unread === true),
    createdAt: str(n.createdAt) ?? str(n.created_at),
  };
}

function extractList(data: unknown): Record<string, unknown>[] {
  const d = asRecord(data);
  const nested = d ? asRecord(d.data) : null;
  const list =
    (nested ? nested.notifications : undefined) ??
    (d ? d.notifications : undefined) ??
    [];
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}

type Filter = "all" | "unread";

const PAGE_SIZE = 15;

const NotificationRow = memo(function NotificationRow({
  n,
  onOpen,
  onActor,
  onMark,
}: {
  n: RichNotification;
  onOpen: (n: RichNotification) => void;
  onActor: (e: ReactMouseEvent, actor: Actor) => void;
  onMark: (id: string) => void;
}) {
  return (
    <li className="cv-auto">
      <article
        onClick={() => onOpen(n)}
        className={`flex items-start gap-3 rounded-2xl border bg-background p-4 shadow-sm transition-colors ${
          n.entityId ? "cursor-pointer hover:shadow-md" : ""
        } ${
          n.isRead
            ? "border-default-200"
            : "border-primary/40 ring-1 ring-primary/20"
        }`}
      >
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => onActor(e, n.actor)}
            aria-label={`Open ${n.actor.name} profile`}
            className="block"
          >
            {n.actor.avatarUrl ? (
              <img
                src={n.actor.avatarUrl}
                alt={n.actor.name}
                loading="lazy"
                decoding="async"
                className="size-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-11 items-center justify-center rounded-full bg-default-200 font-semibold">
                {n.actor.name.charAt(0).toUpperCase()}
              </div>
            )}
          </button>
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-background shadow ring-1 ring-default-200">
            <ActionIcon action={n.action} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm leading-6">
              <button
                type="button"
                onClick={(e) => onActor(e, n.actor)}
                className="font-bold hover:text-primary hover:underline"
              >
                {n.actor.name}
              </button>{" "}
              <span className="text-default-600">{n.actionLabel}</span>
            </p>
            {!n.isRead && (
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                aria-label="Unread"
              />
            )}
          </div>

          {n.entityPreview && (
            <p className="mt-0.5 line-clamp-2 text-sm text-default-500">
              “{n.entityPreview}”
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {n.createdAt && (
              <time
                dateTime={n.createdAt}
                title={formatExactDate(n.createdAt)}
                className="text-xs text-default-400"
              >
                {timeAgo(n.createdAt)}
              </time>
            )}
            {n.isRead ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                <Check size={13} />
                Read
              </span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMark(n.id);
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/10"
              >
                <Check size={13} />
                Mark as read
              </button>
            )}
          </div>
        </div>
      </article>
    </li>
  );
});

export default function Notifications() {
  const navigate = useNavigate();
  const { decrementUnread, refreshUnread } = useUnreadActions();
  const [items, setItems] = useState<RichNotification[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // One-time cleanup of the retired "recently read" persistence key.
  useEffect(() => {
    try {
      localStorage.removeItem("route_recently_read");
    } catch {
      // Storage unavailable — nothing to clean.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getNotifications(1, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        const list = extractList(data).map(mapNotification);
        setItems(list);
        setPage(1);
        setHasMore(list.length >= PAGE_SIZE);
      })
      .catch(() => {
        if (!cancelled) toast.error("Unable to load notifications.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  // Read items always stay visible under "All" (with a Read chip);
  // the "Unread" tab shows strictly unread items.
  const visible = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n.isRead) : items),
    [items, filter],
  );
  const unreadCount = useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items],
  );

  async function handleMarkAll() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read.");
      void refreshUnread();
    } catch {
      toast.error("Unable to mark all as read.");
    }
  }

  const handleMarkOne = useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      try {
        await markNotificationRead(id);
        decrementUnread(1);
        void refreshUnread();
      } catch {
        // Optimistic update already applied.
      }
    },
    [decrementUnread, refreshUnread],
  );

  const openTarget = useCallback(
    (n: RichNotification) => {
      if (!n.isRead) void handleMarkOne(n.id);
      if (n.entityId) navigate(`/posts/${n.entityId}`);
    },
    [handleMarkOne, navigate],
  );

  const openActor = useCallback(
    (e: ReactMouseEvent, actor: Actor) => {
      e.stopPropagation();
      if (actor.id) navigate(`/users/${actor.id}`);
    },
    [navigate],
  );

  async function handleLoadMore() {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const data = await getNotifications(next, PAGE_SIZE);
      const list = extractList(data).map(mapNotification);
      if (list.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => {
          const seen = new Set(prev.map((n) => n.id));
          return [...prev, ...list.filter((n) => !seen.has(n.id))];
        });
        setPage(next);
        setHasMore(list.length >= PAGE_SIZE);
      }
    } catch {
      toast.error("Unable to load more notifications.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Bell size={22} />
          Notifications
          {unreadCount > 0 && (
            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
              {unreadCount} unread
            </span>
          )}
        </h1>
        <Button
          variant="secondary"
          size="sm"
          onPress={handleMarkAll}
          isDisabled={unreadCount === 0}
        >
          <CheckCheck size={16} />
          Mark all as read
        </Button>
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as Filter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "primary" : "secondary"}
            onPress={() => {
              setLoading(true);
              setPage(1);
              setHasMore(true);
              setFilter(f);
            }}
          >
            {f === "all" ? "All" : "Unread"}
          </Button>
        ))}
      </div>

      {loading && <NotificationRowSkeleton count={5} />}

      {!loading && visible.length === 0 && !hasMore && (
        <p className="rounded-2xl border border-default-200 bg-background p-6 text-center text-sm text-default-500">
          {filter === "unread"
            ? "You're all caught up."
            : "No notifications yet."}
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((n) => (
          <NotificationRow
            key={n.id}
            n={n}
            onOpen={openTarget}
            onActor={openActor}
            onMark={(id) => void handleMarkOne(id)}
          />
        ))}
      </ul>

      {!loading && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onPress={() => void handleLoadMore()}
            isDisabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
