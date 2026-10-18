export type PostPrivacy = "public" | "following" | "only_me";

const KEY_PREFIX = "route_post_privacy_";

function isPrivacy(v: unknown): v is PostPrivacy {
  return v === "public" || v === "following" || v === "only_me";
}

function migrate(v: unknown): PostPrivacy | undefined {
  if (isPrivacy(v)) return v;
  if (v === "friends") return "following";
  if (v === "private") return "only_me";
  return undefined;
}

export function getPostPrivacy(postId: string): PostPrivacy | undefined {
  try {
    return migrate(localStorage.getItem(KEY_PREFIX + postId));
  } catch {
    return undefined;
  }
}

export function savePostPrivacy(postId: string, privacy: PostPrivacy) {
  try {
    localStorage.setItem(KEY_PREFIX + postId, privacy);
  } catch {
    // Storage unavailable — badge falls back to Public.
  }
}

export function clearPostPrivacy(postId: string) {
  try {
    localStorage.removeItem(KEY_PREFIX + postId);
  } catch {
    // Ignore.
  }
}

export function privacyFromPayload(p: Record<string, unknown>): PostPrivacy | undefined {
  const v = p.privacy ?? p.audience ?? p.visibility;
  return migrate(v);
}
