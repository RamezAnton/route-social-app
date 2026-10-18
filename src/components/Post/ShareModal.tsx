import { useEffect, useState, type FormEvent } from "react";
import { Button, TextArea } from "@heroui/react";
import { Share2, X } from "lucide-react";
import { toast } from "react-toastify";
import { getServerMessage, sharePost } from "../../api/api";
import type { Post } from "./types";

export function ShareModal({
  post,
  open,
  onClose,
  onShared,
  currentUserName = "You",
}: {
  post: Post;
  open: boolean;
  onClose: () => void;
  onShared?: (postId: string) => void;
  currentUserName?: string;
}) {
  const [body, setBody] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function handleShare(e: FormEvent) {
    e.preventDefault();
    if (sharing) return;
    setSharing(true);
    try {
      await sharePost(post.id, body.trim());
      toast.success("Post shared to your feed.");
      onShared?.(post.id);
      onClose();
    } catch (err) {
      toast.error(getServerMessage(err, "Unable to share post."));
    } finally {
      setSharing(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share post"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-4 overflow-hidden rounded-2xl border border-default-200 bg-background p-4 shadow-2xl sm:p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <Share2 size={18} />
            Share post
          </h2>
          <Button isIconOnly variant="ghost" size="sm" onPress={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={(e) => void handleShare(e)} className="space-y-4">
          <TextArea
            aria-label="Say something about this post"
            placeholder={`Say something about this, ${currentUserName.split(" ")[0]}? (optional)`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            fullWidth
          />

          <div className="space-y-2 rounded-xl border border-default-200 bg-default-50 p-3">
            <div className="flex items-center gap-2">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.name}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-default-200 text-xs font-semibold">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {post.author.name}
                </p>
                <p className="text-xs text-default-500">
                  @{post.author.username} · {post.createdAt}
                </p>
              </div>
            </div>
            {post.content && (
              <p className="line-clamp-3 whitespace-pre-wrap text-sm text-default-600">
                {post.content}
              </p>
            )}
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Shared post attachment"
                loading="lazy"
                className="max-h-60 w-full rounded-lg object-cover"
              />
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onPress={onClose} isDisabled={sharing}>
              Cancel
            </Button>
            <Button type="submit" isDisabled={sharing}>
              <Share2 size={16} />
              {sharing ? "Sharing..." : "Share to my feed"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
