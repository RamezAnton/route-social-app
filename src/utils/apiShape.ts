function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
}

export function isServerId(id: string | undefined): boolean {
  return !!id && /^[0-9a-fA-F]{24}$/.test(id);
}

export function extractResBool(data: unknown, keys: string[]): boolean | undefined {
  const root = asRecord(data);
  const candidates = [root, root ? asRecord(root.data) : null];
  for (const obj of candidates) {
    if (!obj) continue;
    for (const key of keys) {
      if (typeof obj[key] === "boolean") return obj[key] as boolean;
    }
  }
  return undefined;
}

function idOf(item: unknown): string | undefined {
  const o = asRecord(item);
  if (!o) return typeof item === "string" ? item : undefined;
  for (const key of ["_id", "id", "userId", "postId"]) {
    if (typeof o[key] === "string") return o[key] as string;
  }
  const nested =
    asRecord(o.user) ?? asRecord(o.owner) ?? asRecord(o.author) ?? null;
  if (nested) {
    for (const key of ["_id", "id"]) {
      if (typeof nested[key] === "string") return nested[key] as string;
    }
  }
  return undefined;
}

export function idInList(list: unknown, meId: string): boolean {
  if (!meId || meId === "me" || !Array.isArray(list)) return false;
  return list.some((item) => idOf(item) === meId);
}

function firstBool(obj: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    if (typeof obj[key] === "boolean") return obj[key] as boolean;
  }
  return undefined;
}

function firstStr(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (typeof obj[key] === "string") return obj[key] as string;
  }
  return undefined;
}

export function isLikedByMe(p: Record<string, unknown>, meId: string): boolean {
  return (
    firstBool(p, ["isLiked", "liked", "likedByMe", "isLike"]) ??
    idInList(p.likes, meId)
  );
}

export function isSavedByMe(
  p: Record<string, unknown>,
  meId: string,
  savedIds?: Set<string>,
): boolean {
  const id =
    typeof p._id === "string"
      ? (p._id as string)
      : typeof p.id === "string"
        ? (p.id as string)
        : undefined;
  return (
    firstBool(p, ["isBookmarked", "bookmarked", "saved", "savedByMe", "isSaved"]) ??
    (id && savedIds ? savedIds.has(id) : undefined) ??
    idInList(p.bookmarks, meId)
  );
}

export type SharedPostRef = {
  id: string;
  authorId?: string;
  authorName?: string;
  username?: string;
  avatarUrl?: string;
  content?: string;
  imageUrl?: string;
};

export function mapSharedPost(p: Record<string, unknown>): SharedPostRef | null {
  const raw =
    asRecord(p.sharedPost) ??
    asRecord(p.originalPost) ??
    asRecord(p.quotedPost) ??
    asRecord(p.parentPost) ??
    asRecord(p.post);
  if (raw) {
    const user = asRecord(raw.user) ?? {};
    const id = firstStr(raw, ["_id", "id"]);
    if (!id) return null;
    return {
      id,
      authorId: firstStr(user, ["_id", "id", "userId"]),
      authorName: firstStr(user, ["name"]) ?? firstStr(raw, ["authorName"]),
      username: firstStr(user, ["username", "handle"]),
      avatarUrl: firstStr(user, [
        "photo",
        "avatar",
        "avatarUrl",
        "profileImage",
        "image",
      ]),
      content:
        firstStr(raw, ["body", "content", "text"]) ?? undefined,
      imageUrl: firstStr(raw, ["image", "photo"]),
    };
  }
  const idOnly =
    firstStr(p, [
      "sharedPostId",
      "originalPostId",
      "quotedPostId",
      "parentPostId",
      "sharedFrom",
      "originalId",
    ]);
  return idOnly ? { id: idOnly } : null;
}

export function sharesCountOf(p: Record<string, unknown>): number {
  if (typeof p.sharesCount === "number") return p.sharesCount;
  if (typeof p.shares === "number") return p.shares;
  if (Array.isArray(p.shares)) return p.shares.length;
  return 0;
}

function numField(p: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    if (typeof p[key] === "number") return p[key] as number;
  }
  return undefined;
}

export function topLevelComments(p: Record<string, unknown>): Record<string, unknown>[] {
  if (!Array.isArray(p.comments)) return [];
  return (p.comments as Record<string, unknown>[]).filter(
    (c) => asRecord(c)?.parentComment == null,
  );
}

export function likesCountOf(p: Record<string, unknown>): number {
  return (
    numField(p, ["likesCount", "likes_count", "likeCount"]) ??
    (Array.isArray(p.likes) ? p.likes.length : 0)
  );
}

export function commentsCountOf(p: Record<string, unknown>): number {
  return (
    numField(p, ["commentsCount", "comments_count", "commentCount"]) ??
    topLevelComments(p).length
  );
}
