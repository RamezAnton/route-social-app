export type SuggestedUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  isFollowing: boolean;
  followersCount: number;
  mutualCount: number;
};

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function countOf(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return v.length;
  return undefined;
}

export function mapSuggestedUser(u: Record<string, unknown>): SuggestedUser {
  return {
    id: str(u._id) ?? str(u.id) ?? Math.random().toString(36).slice(2),
    name: str(u.name) ?? "User",
    username: str(u.username) ?? "user",
    avatarUrl: str(u.photo) ?? str(u.avatar) ?? str(u.avatarUrl),
    isFollowing: u.isFollowing === true,
    followersCount: countOf(u.followersCount) ?? countOf(u.followers) ?? 0,
    mutualCount:
      countOf(u.mutualFollowersCount) ?? countOf(u.mutualCount) ?? 0,
  };
}

export function extractUsers(data: unknown): Record<string, unknown>[] {
  if (typeof data !== "object" || data === null) return [];
  const d = data as {
    data?: { users?: unknown[]; suggestions?: unknown[] };
    users?: unknown[];
    suggestions?: unknown[];
  };
  const list =
    d?.data?.users ?? d?.data?.suggestions ?? d?.users ?? d?.suggestions ?? [];
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}
