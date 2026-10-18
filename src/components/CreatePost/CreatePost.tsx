import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, TextArea } from "@heroui/react";
import { ImagePlus, X } from "lucide-react";
import { UserRound } from "lucide-react";
import { EmojiPickerButton } from "../EmojiPickerButton";
import { insertEmojiAtCursor } from "../../utils/emoji";
import { PrivacyBadge } from "../Post";
import type { PostPrivacy } from "../../utils/privacy";

export type NewPost = {
  content: string;
  image: File | null;
  privacy?: PostPrivacy;
};

type CreatePostProps = {
  onPublish: (post: NewPost) => void | Promise<void>;
  user?: {
    name: string;
    username?: string;
    avatarUrl?: string;
  };
};

export function CreatePost({
  onPublish,
  user = { name: "You" },
}: CreatePostProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<PostPrivacy>("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFilePick(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    if (!file && fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!content.trim() && !image) {
      setError("Write something or attach an image.");
      return;
    }

    try {
      setLoading(true);
      await onPublish({ content: content.trim(), image, privacy });
      setContent("");
      handleFilePick(null);
    } catch {
      setError("Unable to publish your post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-default-200 bg-background p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-center gap-3">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="size-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-11 items-center justify-center rounded-full bg-default-200">
            <UserRound size={20} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{user.name}</p>
          <div className="mt-1">
            <PrivacyBadge value={privacy} onChange={setPrivacy} />
          </div>
        </div>
      </div>

      <TextArea
        ref={textRef}
        aria-label="Post content"
        placeholder={`What's on your mind, ${user.name.split(" ")[0]}?`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        fullWidth
      />

      {previewUrl && image && (
        <div className="relative overflow-hidden rounded-xl border border-default-200">
          <img
            src={previewUrl}
            alt="Upload preview"
            className="max-h-96 w-full object-cover"
          />
          <div className="flex items-center justify-between gap-2 bg-default-100 px-3 py-2 text-sm">
            <span className="truncate text-default-600">{image.name}</span>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              type="button"
              aria-label="Remove image"
              onPress={() => handleFilePick(null)}
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFilePick(e.target.files?.[0] ?? null)}
      />

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-default-200 pt-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            onPress={() => fileRef.current?.click()}
          >
            <ImagePlus size={18} />
            Add photo
          </Button>
          <EmojiPickerButton
            label="Add emoji to post"
            onPick={(emoji) =>
              insertEmojiAtCursor(textRef.current, content, setContent, emoji)
            }
          />
        </div>

        <Button
          type="submit"
          isDisabled={loading || (!content.trim() && !image)}
        >
          {loading ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </form>
  );
}
