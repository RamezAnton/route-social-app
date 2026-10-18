import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@heroui/react";
import { Search, UserPlus, UserCheck, X } from "lucide-react";
import {
  getFollowSuggestions,
  getToken,
  searchUsers,
  toggleFollow,
} from "../../../api/api";
import { toast } from "react-toastify";
import { UserRowSkeleton } from "../../Skeletons";
import {
  extractUsers,
  mapSuggestedUser,
  type SuggestedUser,
} from "../../../utils/suggestedUsers";

const FETCH_LIMIT = 20;
const VISIBLE_COUNT = 5;
const SEARCH_LIMIT = 10;

export function RightSidebar() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SuggestedUser[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(() => !!getToken());

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    getFollowSuggestions(1, FETCH_LIMIT)
      .then((data) => {
        if (cancelled) return;
        setUsers(extractUsers(data).map(mapSuggestedUser));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Server-side search (debounced) — searches all users, not just the 20 loaded.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchUsers(q, 1, SEARCH_LIMIT)
        .then((data) => {
          if (cancelled) return;
          setResults(extractUsers(data).map(mapSuggestedUser));
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          toast.error("Search failed.");
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults(null);
      setSearching(false);
    } else {
      setSearching(true);
    }
  }

  async function handleFollow(id: string) {
    try {
      await toggleFollow(id);
      const flip = (prev: SuggestedUser[]) =>
        prev.map((u) =>
          u.id === id ? { ...u, isFollowing: !u.isFollowing } : u,
        );
      setUsers(flip);
      setResults((prev) => (prev ? flip(prev) : prev));
    } catch {
      toast.error("Unable to follow user.");
    }
  }

  const source = results ?? users;
  const visible = source.slice(0, VISIBLE_COUNT);
  const busy = loading || searching;

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-96 shrink-0 overflow-y-auto p-4 xl:block">
      <div className="rounded-2xl border border-default-200 bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">
            Suggested Friends{" "}
            <span className="ml-1 rounded-full bg-default-100 px-2 py-0.5 text-xs font-semibold text-default-500">
              {visible.length}
            </span>
          </h2>
          <Link
            to="/suggestions"
            state={{ q: query }}
            className="text-sm font-medium text-primary hover:underline"
          >
            View More
          </Link>
        </div>

        <div className="relative mb-3">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
          />
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by name..."
            aria-label="Search suggested friends"
            className="w-full rounded-lg border border-default-200 bg-field-background py-2 pl-9 pr-8 text-sm outline-none focus:border-primary"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-default-400 hover:bg-default-100"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {busy && <UserRowSkeleton count={5} />}
        {!busy && visible.length === 0 && (
          <p className="text-sm text-default-500">
            {query.trim()
              ? `No users match "${query.trim()}".`
              : "No suggestions right now."}
          </p>
        )}

        {!busy && (
          <ul className="space-y-3">
            {visible.map((u) => (
              <li key={u.id} className="flex items-center gap-3">
                <Link to={`/users/${u.id}`} className="shrink-0">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-default-200 font-semibold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/users/${u.id}`}
                    className="block truncate text-sm font-semibold hover:underline"
                  >
                    {u.name}
                  </Link>
                  <p className="truncate text-xs text-default-500">
                    @{u.username}
                    {u.followersCount > 0 &&
                      ` · ${u.followersCount} follower${u.followersCount === 1 ? "" : "s"}`}
                  </p>
                  {u.mutualCount > 0 && (
                    <p className="truncate text-[11px] font-medium text-primary">
                      {u.mutualCount} mutual
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={u.isFollowing ? "secondary" : "primary"}
                  onPress={() => handleFollow(u.id)}
                  aria-label={u.isFollowing ? "Unfollow" : "Follow"}
                >
                  {u.isFollowing ? (
                    <UserCheck size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {u.isFollowing ? "Following" : "Follow"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
