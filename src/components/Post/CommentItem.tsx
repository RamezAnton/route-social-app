import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@heroui/react";
import {
  Heart,
  ImagePlus,
  Pencil,
  Reply,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  createReply,
  deleteComment,
  getCommentReplies,
  getServerMessage,
  toggleCommentLike,
  updateComment,
} from "../../api/api";
import { extractResBool } from "../../utils/apiShape";
import { extractComments, mapApiComment } from "./comments";
import { DateWithTooltip } from "./DateWithTooltip";
import { Lightbox } from "../Lightbox";
import { EmojiPickerButton } from "../EmojiPickerButton";
import { insertEmojiAtCursor } from "../../utils/emoji";
import {
  fileToDataUrl,
  useImageAttach,
} from "../../hooks/useImageAttach";
import type { CommentItemProps, PostComment } from "./types";

export function CommentItem({
  comment,
  postId,
  currentUserId,
  currentUserName = "You",
  allowReply = true,
  onEdited,
  onRemoved,
}: CommentItemProps) {
  const profileTo = comment.authorId
    ? `/users/${comment.authorId}`
    : "/profile";
  const isOwner =
    !!currentUserId && !!comment.authorId && currentUserId === comment.authorId;

  const [body, setBody] = useState(comment.content);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replies, setReplies] = useState<PostComment[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [liked, setLiked] = useState(!!comment.likedByMe);
  const [likeCount, setLikeCount] = useState(comment.likesCount ?? 0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { attach: replyAttach, pick: pickReplyImage } = useImageAttach();
  const replyInputRef = useRef<HTMLInputElement>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);

  async function handleSaveEdit() {
    const text = editDraft.trim();
    if (!text || editSaving) return;
    setEditSaving(true);
    try {
      if (postId) await updateComment(postId, comment.id, text);
      setBody(text);
      onEdited?.(comment.id, text);
      setEditing(false);
      toast.success("Comment updated.");
    } catch {
      toast.error("Unable to update comment.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      if (postId) await deleteComment(postId, comment.id);
      onRemoved?.(comment.id);
      setRemoved(true);
      toast.success("Comment deleted.");
    } catch {
      toast.error("Unable to delete comment.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleLike() {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    if (!postId) return;
    try {
      const data = await toggleCommentLike(postId, comment.id);
      const authoritative = extractResBool(data, [
        "isLiked",
        "liked",
        "likedByMe",
        "isLike",
      ]);
      if (authoritative !== undefined && authoritative !== next) {
        setLiked(authoritative);
        setLikeCount((c) => c + (authoritative ? 1 : -1));
      }
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
      toast.error("Unable to like comment.");
    }
  }

  async function openReplies() {
    setRepliesOpen(true);
    if (repliesLoaded || !postId) return;
    setRepliesLoading(true);
    try {
      const data = await getCommentReplies(postId, comment.id, 1, 20);
      setReplies(
        extractComments(data).map((c, i) => mapApiComment(c, i, currentUserId)),
      );
    } catch {
      // Replies stay empty on failure.
    } finally {
      setRepliesLoading(false);
      setRepliesLoaded(true);
    }
  }

  async function handleSendReply(e: FormEvent) {
    e.preventDefault();
    const text = replyDraft.trim();
    const file = replyAttach?.file ?? null;
    if ((!text && !file) || replySending || !postId) return;
    setReplySending(true);
    try {
      await createReply(postId, comment.id, text, file);
      const preview = file
        ? await fileToDataUrl(file).catch(() => undefined)
        : undefined;
      setReplies((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          authorName: currentUserName,
          authorId: currentUserId,
          content: text,
          imageUrl: preview,
          createdAt: new Date().toISOString(),
          likesCount: 0,
        },
      ]);
      setReplyDraft("");
      pickReplyImage(null);
      if (replyFileRef.current) replyFileRef.current.value = "";
    } catch (err) {
      toast.error(getServerMessage(err, "Unable to add reply."));
    } finally {
      setReplySending(false);
    }
  }

  if (removed) return null;

  return (
    <div className="flex items-start gap-2.5">
      <Link
        to={profileTo}
        aria-label={`Open ${comment.authorName} profile`}
        className="shrink-0"
      >
        {comment.avatarUrl ? (
          <img
            src={comment.avatarUrl}
            alt={comment.authorName}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-default-200 text-xs font-semibold">
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      <div className="min-w-0 max-w-full">
        <div className="w-fit max-w-full rounded-2xl rounded-tl-md border border-default-200/70 bg-default-100 px-3 py-2 shadow-sm transition-colors hover:bg-default-200/60">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link
              to={profileTo}
              className="text-xs font-semibold hover:underline"
            >
              {comment.authorName}
            </Link>
            {comment.createdAt && (
              <span className="text-[11px] text-default-400">
                <DateWithTooltip value={comment.createdAt} />
              </span>
            )}
          </div>
          {editing ? (
            <div className="mt-1.5 space-y-2">
              <textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                rows={2}
                aria-label="Edit comment"
                className="w-full min-w-48 rounded-lg border border-default-200 bg-field-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
              />
              <div className="flex justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => {
                    setEditing(false);
                    setEditDraft(body);
                  }}
                  isDisabled={editSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onPress={() => void handleSaveEdit()}
                  isDisabled={editSaving || !editDraft.trim()}
                >
                  {editSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="wrap-break-words text-sm text-default-600">{body}</p>
              {comment.imageUrl && (
                <button
                  type="button"
                  onClick={() =>
                    comment.imageUrl && setLightbox(comment.imageUrl)
                  }
                  aria-label="View comment image full size"
                  className="mt-2 block cursor-zoom-in"
                >
                  <img
                    src={comment.imageUrl}
                    alt="Comment attachment"
                    loading="lazy"
                    className="max-h-60 w-fit max-w-full rounded-lg object-cover"
                  />
                </button>
              )}
            </>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
          <button
            type="button"
            onClick={() => void handleToggleLike()}
            aria-label={liked ? "Unlike comment" : "Like comment"}
            aria-pressed={liked}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors ${
              liked ? "text-danger" : "text-default-500 hover:text-danger"
            }`}
          >
            <Heart size={12} fill={liked ? "currentColor" : "none"} />
            {likeCount > 0 ? likeCount : "Like"}
          </button>
          {allowReply && (
            <button
              type="button"
              onClick={() =>
                repliesOpen ? setRepliesOpen(false) : void openReplies()
              }
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-default-500 transition-colors hover:text-primary"
            >
              <Reply size={12} />
              Reply
              {replies.length > 0 && ` (${replies.length})`}
            </button>
          )}
          {isOwner && !editing && (
            <button
              type="button"
              onClick={() => {
                setEditDraft(body);
                setEditing(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-default-500 transition-colors hover:text-primary"
            >
              <Pencil size={12} />
              Edit
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setConfirmDelete((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-default-500 transition-colors hover:text-danger"
            >
              <Trash2 size={12} />
              Delete
            </button>
          )}
        </div>

        {confirmDelete && (
          <div
            role="alert"
            className="mt-1.5 flex w-fit max-w-full flex-wrap items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-2.5 py-1.5 text-xs"
          >
            <span>Delete this comment?</span>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => setConfirmDelete(false)}
              isDisabled={deleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onPress={() => void handleDelete()}
              isDisabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}

        {allowReply && repliesOpen && (
          <div className="ml-1 mt-2 space-y-2 border-l-2 border-default-200 pl-3">
            {repliesLoading && (
              <p className="text-[11px] text-default-500">Loading replies...</p>
            )}
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                postId={postId}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                allowReply={false}
                onEdited={(id, content) =>
                  setReplies((prev) =>
                    prev.map((x) => (x.id === id ? { ...x, content } : x)),
                  )
                }
                onRemoved={(id) =>
                  setReplies((prev) => prev.filter((x) => x.id !== id))
                }
              />
            ))}
            <div className="space-y-1.5">
              {replyAttach && (
                <div className="relative w-fit">
                  <img
                    src={replyAttach.url}
                    alt="Reply attachment preview"
                    className="max-h-32 rounded-lg border border-default-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      pickReplyImage(null);
                      if (replyFileRef.current)
                        replyFileRef.current.value = "";
                    }}
                    aria-label="Remove image"
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => void handleSendReply(e)}
                className="flex items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={() => replyFileRef.current?.click()}
                  aria-label="Attach image"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-default-500 transition-colors hover:bg-default-100 hover:text-primary"
                >
                  <ImagePlus size={18} />
                </button>
                <input
                  ref={replyFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => pickReplyImage(e.target.files?.[0] ?? null)}
                />
                <input
                  ref={replyInputRef}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder={`Reply to ${comment.authorName}...`}
                  aria-label="Write a reply"
                  className="min-w-0 flex-1 rounded-lg border border-default-200 bg-field-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                />
                <EmojiPickerButton
                  label="Add emoji to reply"
                  onPick={(emoji) =>
                    insertEmojiAtCursor(
                      replyInputRef.current,
                      replyDraft,
                      setReplyDraft,
                      emoji,
                    )
                  }
                />
                <Button
                  type="submit"
                  size="sm"
                  isDisabled={
                    (!replyDraft.trim() && !replyAttach) || replySending
                  }
                  aria-label="Send reply"
                >
                  <Send size={14} />
                  {replySending ? "Sending..." : "Send"}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
      <Lightbox
        src={lightbox}
        alt="Comment image full size"
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
