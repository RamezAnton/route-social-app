import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@heroui/react";
import { toast } from "react-toastify";
import {
  CommentItem,
  PostCard,
  type Post,
  type PostComment,
} from "../../components/Post";
import {
  extractComments,
  mapApiComment,
} from "../../components/Post/comments";
import {
  createComment,
  getPostComments,
  getServerMessage,
  getSinglePost,
} from "../../api/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { isLikedByMe, isSavedByMe, mapSharedPost, sharesCountOf, likesCountOf, commentsCountOf } from "../../utils/apiShape";
import { getPostPrivacy, privacyFromPayload } from "../../utils/privacy";
import { PostCardSkeleton } from "../../components/Skeletons";
import { EmojiPickerButton } from "../../components/EmojiPickerButton";
import { insertEmojiAtCursor } from "../../utils/emoji";
import { ImagePlus, X } from "lucide-react";
import { useImageAttach } from "../../hooks/useImageAttach";

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function toPost(raw: unknown, fallbackId: string, meId: string): Post | null {
  const p = (
    typeof raw === "object" && raw !== null ? raw : null
  ) as Record<string, unknown> | null;
  if (!p) return null;
  const u = (p.user ?? {}) as Record<string, unknown>;
  const id = str(p._id) ?? str(p.id) ?? fallbackId;
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
    topComment: null,
  };
}

export default function PostDetails() {
  const { postId = "" } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useCurrentUser();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { attach, pick } = useImageAttach();

  useEffect(() => {
    if (!postId || authLoading) return;
    let cancelled = false;
    const meId = user.id;
    (async () => {
      try {
        const [single, commentsData] = await Promise.all([
          getSinglePost(postId),
          getPostComments(postId, 1, 50).catch(() => null),
        ]);
        if (cancelled) return;
        const raw = single?.data?.post ?? single?.post ?? single?.data ?? single;
        const mapped = toPost(raw, postId, meId);
        if (mapped) {
          setPost(mapped);
        }
        if (commentsData) {
          setComments(
            extractComments(commentsData).map((c, i) =>
              mapApiComment(c, i, user.id),
            ),
          );
        }
      } catch {
        if (!cancelled) toast.error("Unable to load post.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, authLoading]);

  function handleJumpToComments() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    const file = attach?.file ?? null;
    if ((!text && !file) || sending) return;
    setSending(true);
    try {
      await createComment(postId, text, file);
      setDraft("");
      pick(null);
      if (fileRef.current) fileRef.current.value = "";
      const data = await getPostComments(postId, 1, 50);
      const list = extractComments(data).map((c, i) =>
        mapApiComment(c, i, user.id),
      );
      setComments(list);
      setPost((prev) =>
        prev ? { ...prev, commentsCount: list.length } : prev,
      );
    } catch (err) {
      toast.error(getServerMessage(err, "Unable to add comment."));
    } finally {
      setSending(false);
    }
  }

  if (loading)
    return (
      <div className="mx-auto max-w-2xl">
        <PostCardSkeleton count={1} />
      </div>
    );
  if (!post)
    return (
      <div className="space-y-3">
        <p className="text-sm text-default-500">Post not found.</p>
        <Link to="/feed" className="text-sm text-primary hover:underline">
          Back to feed
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link to="/feed" className="text-sm text-primary hover:underline">
        ← Back to feed
      </Link>
      <PostCard
        post={post}
        currentUserId={user.id}
        currentUserName={user.name}
        hideInlineComments
        onJumpToComments={handleJumpToComments}
        onDeleted={() => navigate("/feed", { replace: true })}
        onUpdated={(updated) => setPost(updated)}
      />

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="scroll-mt-24 space-y-2 rounded-2xl border border-default-200 bg-background p-3"
      >
        {attach && (
          <div className="relative w-fit">
            <img
              src={attach.url}
              alt="Comment attachment preview"
              className="max-h-40 rounded-xl border border-default-200 object-cover"
            />
            <button
              type="button"
              onClick={() => {
                pick(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              aria-label="Remove image"
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach image"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-default-500 transition-colors hover:bg-default-100 hover:text-primary"
          >
            <ImagePlus size={20} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment..."
            aria-label="Write a comment"
            className="min-w-0 flex-1 rounded-lg border border-default-200 bg-field-background px-3 py-2 text-sm outline-none"
          />
          <EmojiPickerButton
            label="Add emoji to comment"
            onPick={(emoji) =>
              insertEmojiAtCursor(inputRef.current, draft, setDraft, emoji)
            }
          />
          <Button
            type="submit"
            isDisabled={(!draft.trim() && !attach) || sending}
          >
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>

      <div className="space-y-3 rounded-2xl border border-default-200 bg-background p-4 shadow-sm sm:p-5">
        <h2 className="font-semibold">Comments ({comments.length})</h2>
        {comments.length === 0 && (
          <p className="text-sm text-default-500">No comments yet.</p>
        )}
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            postId={postId}
            currentUserId={user.id}
            currentUserName={user.name}
            onEdited={(id, content) =>
              setComments((prev) =>
                prev.map((x) => (x.id === id ? { ...x, content } : x)),
              )
            }
            onRemoved={(id) => {
              setComments((prev) => prev.filter((x) => x.id !== id));
              setPost((prev) =>
                prev
                  ? {
                      ...prev,
                      commentsCount: Math.max(0, prev.commentsCount - 1),
                    }
                  : prev,
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}
