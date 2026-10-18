import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, Dropdown, Label, TextArea } from "@heroui/react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Bookmark,
  Send,
  ImagePlus,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  createComment,
  deletePost,
  getPostComments,
  getServerMessage,
  getToken,
  toggleBookmark,
  toggleLike,
  updatePost,
} from "../../api/api";
import { extractResBool, isServerId } from "../../utils/apiShape";
import { extractComments, mapApiComment } from "./comments";
import { DateWithTooltip } from "./DateWithTooltip";
import { CommentItem } from "./CommentItem";
import { AuthorAvatar } from "./AuthorAvatar";
import { PrivacyBadge } from "./PrivacyBadge";
import { PRIVACY_META } from "./privacyMeta";
import { copyText } from "./copyText";
import { LikesModal } from "./LikesModal";
import { ShareModal } from "./ShareModal";
import { Lightbox } from "../Lightbox";
import { EmojiPickerButton } from "../EmojiPickerButton";
import { insertEmojiAtCursor } from "../../utils/emoji";
import {
  fileToDataUrl,
  useImageAttach,
} from "../../hooks/useImageAttach";
import {
  clearPostPrivacy,
  savePostPrivacy,
  type PostPrivacy,
} from "../../utils/privacy";
import type { PostCardProps, PostComment } from "./types";

const COMMENT_PAGE_SIZE = 5;
const COMMENT_INITIAL_VISIBLE = 1;

export function PostCard({
  post,
  currentUserId,
  currentUserName = "You",
  onLike,
  onSave,
  onCommentAdded,
  onAddComment,
  onDeleted,
  onUpdated,
  onShared,
  onJumpToComments,
  hideInlineComments = false,
}: PostCardProps) {
  const [liked, setLiked] = useState(!!post.likedByMe);
  const [saved, setSaved] = useState(!!post.savedByMe);
  const [content, setContent] = useState(post.content);
  const [count, setCount] = useState(post.commentsCount ?? post.comments ?? 0);
  const [shares, setShares] = useState(post.sharesCount ?? 0);
  const [likesOpen, setLikesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>(
    post.topComment ? [post.topComment] : [],
  );
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(
    () => !hideInlineComments && !!getToken() && isServerId(post.id),
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(() => isServerId(post.id));
  const [visibleCount, setVisibleCount] = useState(COMMENT_INITIAL_VISIBLE);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const { attach: commentAttach, pick: pickCommentImage } = useImageAttach();
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentFileRef = useRef<HTMLInputElement>(null);
  const [editDraft, setEditDraft] = useState(post.content);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // const inputRef = useRef<HTMLInputElement>(null);

  const isOwner =
    !!currentUserId && !!post.author.id && currentUserId === post.author.id;

  // Load the first page of comments for the feed view.
  // Local/demo posts have no server id — skip the request entirely
  // instead of 400ing against a fake id.
  useEffect(() => {
    if (hideInlineComments || !getToken() || !isServerId(post.id)) return;
    let cancelled = false;
    getPostComments(post.id, 1, COMMENT_PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        const list = extractComments(data).map((c, i) =>
          mapApiComment(c, i, currentUserId),
        );
        if (list.length > 0) {
          setComments(list);
          setCount((c) => Math.max(c, list.length));
          setHasMore(list.length >= COMMENT_PAGE_SIZE);
        } else {
          setHasMore(false);
        }
        setPage(1);
      })
      .catch(() => {
        if (!cancelled) setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, hideInlineComments]);

  async function handleToggleLike() {
    const next = !liked;
    setLiked(next);
    try {
      const data = await toggleLike(post.id);
      const authoritative = extractResBool(data, [
        "isLiked",
        "liked",
        "likedByMe",
        "isLike",
      ]);
      const finalState = authoritative ?? next;
      setLiked(finalState);
      onLike?.(post.id, finalState);
    } catch {
      setLiked(!next);
      toast.error("Unable to like post.");
    }
  }

  async function handleToggleSave() {
    const next = !saved;
    setSaved(next);
    try {
      const data = await toggleBookmark(post.id);
      const authoritative = extractResBool(data, [
        "isBookmarked",
        "bookmarked",
        "saved",
        "savedByMe",
        "isSaved",
      ]);
      const finalState = authoritative ?? next;
      setSaved(finalState);
      toast.success(
        finalState ? "Saved to bookmarks." : "Removed from bookmarks.",
      );
      onSave?.(post.id, finalState);
    } catch {
      setSaved(!next);
      toast.error("Unable to save post.");
    }
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/posts/${post.id}`;
    const ok = await copyText(url);
    if (ok) toast.success("Post link copied.");
    else toast.error("Unable to copy link.");
  }

  function handleShare() {
    setShareOpen(true);
  }

  function handleShared() {
    setShares((s) => s + 1);
    onShared?.(post.id);
  }

  function handleCommentButton() {
    if (hideInlineComments) {
      onJumpToComments?.();
      return;
    }
    setCommentsOpen((open) => !open);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  async function handleLoadMore() {
    if (visibleCount < comments.length) {
      setVisibleCount((v) => v + COMMENT_PAGE_SIZE);
      return;
    }
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setLoadingMore(true);
    try {
      const data = await getPostComments(post.id, next, COMMENT_PAGE_SIZE);
      const list = extractComments(data).map((c, i) =>
        mapApiComment(c, i, currentUserId),
      );
      if (list.length === 0) {
        setHasMore(false);
      } else {
        setComments((prev) => {
          const seen = new Set(prev.map((c) => c.id));
          return [...prev, ...list.filter((c) => !seen.has(c.id))];
        });
        setPage(next);
        setVisibleCount((v) => v + COMMENT_PAGE_SIZE);
        setHasMore(list.length >= COMMENT_PAGE_SIZE);
      }
    } catch {
      toast.error("Unable to load more comments.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    const file = commentAttach?.file ?? null;
    if ((!text && !file) || sending) return;
    setSending(true);
    try {
      if (onAddComment) {
        await onAddComment(post.id, text, file);
      } else {
        await createComment(post.id, text, file);
      }
      const preview = file
        ? await fileToDataUrl(file).catch(() => undefined)
        : undefined;
      setComments((prev) => [
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
      setCount((c) => c + 1);
      setDraft("");
      pickCommentImage(null);
      if (commentFileRef.current) commentFileRef.current.value = "";
      onCommentAdded?.(post.id);
    } catch (err) {
      toast.error(getServerMessage(err, "Unable to add comment."));
    } finally {
      setSending(false);
    }
  }

  function handleMenuAction(key: React.Key) {
    const action = String(key);
    if (action === "copy-link") {
      void handleCopyLink();
    } else if (action === "edit-post" && isOwner) {
      setEditDraft(content);
      setEditing(true);
      setConfirmDelete(false);
    } else if (action === "delete-post" && isOwner) {
      setConfirmDelete(true);
    }
  }

  async function handleSaveEdit() {
    const text = editDraft.trim();
    if (!text) {
      toast.error("Post cannot be empty.");
      return;
    }
    setEditSaving(true);
    try {
      await updatePost(post.id, { body: text });
      setContent(text);
      setEditing(false);
      toast.success("Post updated.");
      onUpdated?.({ ...post, content: text });
    } catch (err) {
      toast.error(getServerMessage(err, "Unable to update post."));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await deletePost(post.id);
      clearPostPrivacy(post.id);
      toast.success("Post deleted.");
      onDeleted?.(post.id);
    } catch {
      toast.error("Unable to delete post.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  async function handlePrivacyChange(next: PostPrivacy) {
    const prev = post.privacy ?? "public";
    if (next === prev) return;
    savePostPrivacy(post.id, next);
    onUpdated?.({ ...post, content, privacy: next });
    try {
      await updatePost(post.id, { privacy: next });
      toast.success(
        `Privacy set to ${PRIVACY_META[next].label.toLowerCase()}.`,
      );
    } catch (err) {
      savePostPrivacy(post.id, prev);
      onUpdated?.({ ...post, content, privacy: prev });
      toast.error(getServerMessage(err, "Unable to update privacy."));
    }
  }

  const profileTo = post.author.id ? `/users/${post.author.id}` : "/profile";
  const visible = comments.slice(0, visibleCount);
  const canLoadMore =
    visibleCount < comments.length || visibleCount < count || hasMore;

  return (
    <article className="cv-auto space-y-4 rounded-2xl border border-default-200 bg-background p-4 transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-center gap-3">
        <Link to={profileTo} aria-label={`Open ${post.author.name} profile`}>
          <AuthorAvatar
            name={post.author.name}
            avatarUrl={post.author.avatarUrl}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={profileTo}
            className="block truncate font-semibold hover:underline"
          >
            {post.author.name}
          </Link>
          <div className="text-xs text-default-500">
            @{post.author.username} · <DateWithTooltip value={post.createdAt} />
          </div>
          <div className="mt-1">
            <PrivacyBadge
              value={post.privacy}
              onChange={isOwner ? handlePrivacyChange : undefined}
            />
          </div>
        </div>

        <Button
          isIconOnly
          variant="ghost"
          aria-label={saved ? "Unsave post" : "Save post"}
          onPress={() => void handleToggleSave()}
          className={saved ? "text-primary" : ""}
        >
          <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
        </Button>

        <Dropdown>
          <Button isIconOnly variant="ghost" aria-label="More post options">
            <MoreHorizontal size={20} />
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu onAction={handleMenuAction}>
              <Dropdown.Item id="copy-link" textValue="Copy link">
                <Label>Copy Post Link</Label>
              </Dropdown.Item>
              {isOwner && (
                <Dropdown.Item id="edit-post" textValue="Edit post">
                  <Label>Edit Post</Label>
                </Dropdown.Item>
              )}
              {isOwner && (
                <Dropdown.Item
                  id="delete-post"
                  textValue="Delete post"
                  variant="danger"
                >
                  <Label>Delete Post</Label>
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      {confirmDelete && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm"
        >
          <span>Delete this post permanently?</span>
          <div className="flex gap-2">
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
              onPress={() => void handleConfirmDelete()}
              isDisabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      )}

      {editing ? (
        <div className="space-y-2">
          <TextArea
            aria-label="Edit post"
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            rows={4}
            fullWidth
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => setEditing(false)}
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
        content && (
          <p className="whitespace-pre-wrap wrap-break-words text-sm leading-6">
            {content}
          </p>
        )
      )}

      {post.imageUrl && (
        <button
          type="button"
          onClick={() => post.imageUrl && setLightbox(post.imageUrl)}
          aria-label="View image full size"
          className="block w-full cursor-zoom-in"
        >
          <img
            src={post.imageUrl}
            alt="Post attachment"
            loading="lazy"
            className="max-h-130 w-full rounded-xl object-cover"
          />
        </button>
      )}

      {post.sharedPost && (
        <div className="space-y-3 rounded-xl border border-default-200 bg-default-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              {post.sharedPost.avatarUrl ? (
                post.sharedPost.authorId ? (
                  <Link
                    to={`/users/${post.sharedPost.authorId}`}
                    aria-label="Open original author profile"
                    className="shrink-0"
                  >
                    <img
                      src={post.sharedPost.avatarUrl}
                      alt={post.sharedPost.authorName ?? "Author"}
                      className="size-9 rounded-full object-cover"
                    />
                  </Link>
                ) : (
                  <img
                    src={post.sharedPost.avatarUrl}
                    alt={post.sharedPost.authorName ?? "Author"}
                    className="size-9 shrink-0 rounded-full object-cover"
                  />
                )
              ) : post.sharedPost.authorId ? (
                <Link
                  to={`/users/${post.sharedPost.authorId}`}
                  aria-label="Open original author profile"
                  className="shrink-0"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-default-200 text-sm font-semibold">
                    {(post.sharedPost.authorName ?? "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </Link>
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-default-200 text-sm font-semibold">
                  {(post.sharedPost.authorName ?? "U").charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                {post.sharedPost.authorId ? (
                  <Link
                    to={`/users/${post.sharedPost.authorId}`}
                    className="block truncate text-sm font-semibold hover:underline"
                  >
                    {post.sharedPost.authorName ?? "Unknown user"}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-semibold">
                    {post.sharedPost.authorName ?? "Unknown user"}
                  </p>
                )}
                {post.sharedPost.username && (
                  <p className="truncate text-xs text-default-500">
                    @{post.sharedPost.username}
                  </p>
                )}
              </div>
            </div>
            <Link
              to={`/posts/${post.sharedPost.id}`}
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/10"
            >
              View original post
            </Link>
          </div>
          {post.sharedPost.content && (
            <p className="whitespace-pre-wrap wrap-break-words text-sm leading-6">
              {post.sharedPost.content}
            </p>
          )}
          {post.sharedPost.imageUrl && (
            <button
              type="button"
              onClick={() =>
                post.sharedPost?.imageUrl &&
                setLightbox(post.sharedPost.imageUrl)
              }
              aria-label="View original image full size"
              className="block w-full cursor-zoom-in"
            >
              <img
                src={post.sharedPost.imageUrl}
                alt="Original post attachment"
                loading="lazy"
                className="max-h-130 w-full rounded-xl object-cover"
              />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-default-500 my-2">
        <button
          type="button"
          onClick={() => setLikesOpen(true)}
          className="font-medium hover:underline"
          aria-label="See who liked this post"
        >
          {post.likes + Number(liked && !post.likedByMe)} likes
        </button>
        <div className="flex items-center gap-2">
          {!hideInlineComments ? (
            <button
              type="button"
              onClick={() => setCommentsOpen((open) => !open)}
              className="hover:underline"
            >
              {count} comments
            </button>
          ) : (
            <span>{count} comments</span>
          )}
          <span aria-hidden="true">·</span>
          <span>
            {shares} share{shares === 1 ? "" : "s"}
          </span>
          <span aria-hidden="true">·</span>
          <Link
            to={`/posts/${post.id}`}
            className="font-medium text-primary hover:underline"
          >
            View details
          </Link>
        </div>
      </div>

      {commentsOpen && !hideInlineComments && (
        <div className="space-y-3 border-t border-default-200 pt-3">
          {commentsLoading && comments.length === 0 && (
            <p className="text-xs text-default-500">Loading comments...</p>
          )}

          {visible.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postId={post.id}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onEdited={(id, content) =>
                setComments((prev) =>
                  prev.map((x) => (x.id === id ? { ...x, content } : x)),
                )
              }
              onRemoved={(id) => {
                setComments((prev) => prev.filter((x) => x.id !== id));
                setCount((n) => Math.max(0, n - 1));
              }}
            />
          ))}

          {!commentsLoading && visible.length === 0 && (
            <p className="text-xs text-default-500">
              No comments yet. Be the first to comment.
            </p>
          )}

          {canLoadMore && visible.length > 0 && (
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={loadingMore}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more comments"}
            </button>
          )}

          <div className="space-y-1.5">
            {commentAttach && (
              <div className="relative w-fit">
                <img
                  src={commentAttach.url}
                  alt="Comment attachment preview"
                  className="max-h-32 rounded-lg border border-default-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    pickCommentImage(null);
                    if (commentFileRef.current)
                      commentFileRef.current.value = "";
                  }}
                  aria-label="Remove image"
                  className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => void handleSend(e)}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={() => commentFileRef.current?.click()}
                aria-label="Attach image"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-default-500 transition-colors hover:bg-default-100 hover:text-primary"
              >
                <ImagePlus size={18} />
              </button>
              <input
                ref={commentFileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => pickCommentImage(e.target.files?.[0] ?? null)}
              />
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a comment..."
                aria-label="Write a comment"
                className="min-w-0 flex-1 rounded-lg border border-default-200 bg-field-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <EmojiPickerButton
                label="Add emoji to comment"
                onPick={(emoji) =>
                  insertEmojiAtCursor(inputRef.current, draft, setDraft, emoji)
                }
              />
              <Button
                type="submit"
                size="sm"
                isDisabled={(!draft.trim() && !commentAttach) || sending}
                aria-label="Send comment"
              >
                <Send size={16} />
                {sending ? "Sending..." : "Send"}
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="grid justify-items-center grid-cols-3 border-t border-default-200 pt-2">
        <Button
          variant="ghost"
          className={liked ? "text-danger" : ""}
          onPress={() => void handleToggleLike()}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
          Like
        </Button>

        <Button variant="ghost" onPress={handleCommentButton}>
          <MessageCircle size={18} />
          Comment
        </Button>

        <Button variant="ghost" onPress={handleShare}>
          <Share2 size={18} />
          Share
        </Button>
      </div>

      {likesOpen && (
        <LikesModal
          postId={post.id}
          open
          onClose={() => setLikesOpen(false)}
        />
      )}
      {shareOpen && (
        <ShareModal
          post={{ ...post, content }}
          open
          onClose={() => setShareOpen(false)}
          onShared={handleShared}
          currentUserName={currentUserName}
        />
      )}
      <Lightbox
        src={lightbox}
        alt="Post image full size"
        onClose={() => setLightbox(null)}
      />
    </article>
  );
}
