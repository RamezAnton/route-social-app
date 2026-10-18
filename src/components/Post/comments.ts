import type { PostComment } from "./types";
import { isLikedByMe } from "../../utils/apiShape";

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === "object" && v !== null
    ? (v as Record<string, unknown>)
    : null;
}


function ownerOf(c: Record<string, unknown>): Record<string, unknown> {
  for (const key of [
    "commentCreator",
    "user",
    "owner",
    "author",
    "createdBy",
  ]) {
    const o = asRecord(c[key]);
    if (o && (o.name ?? o.username ?? o._id ?? o.id)) return o;
  }
  return asRecord(c.user) ?? {};
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

export function mapApiComment(
  c: Record<string, unknown>,
  i: number,
  meId?: string,
): PostComment {
  const u = ownerOf(c);
  const username = firstStr([u, c], ["username", "userName", "handle"]);
  const name =
    firstStr([u, c], ["name", "fullName", "displayName", "authorName"]) ??
    (username ? `@${username}` : undefined) ??
    "User";
  const likes = c.likes;
  return {
    id: str(c._id) ?? str(c.id) ?? `c${i}`,
    authorName: name,
    username,
    authorId: firstStr([u, c], ["_id", "id", "userId", "authorId"]),
    content:
      firstStr([c], ["content", "text", "body", "message"]) ?? "",
    imageUrl: firstStr([c], ["image", "photo", "imageUrl", "attachment"]),
    avatarUrl: firstStr(
      [u, c],
      ["photo", "avatar", "avatarUrl", "profileImage", "profilePicture", "image"],
    ),
    createdAt: firstStr([c, u], ["createdAt", "created_at", "createdOn", "date"]),
    likesCount:
      typeof c.likesCount === "number"
        ? c.likesCount
        : Array.isArray(likes)
          ? likes.length
          : 0,
    likedByMe: isLikedByMe(c, meId ?? ""),
  };
}

export function extractComments(data: unknown): Record<string, unknown>[] {
  const d = asRecord(data);
  const nested = d ? asRecord(d.data) : null;
  const list =
    (nested ? nested.comments : undefined) ??
    (d ? d.comments : undefined) ??
    (nested ? nested.replies : undefined) ??
    (d ? d.replies : undefined) ??
    [];
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}
