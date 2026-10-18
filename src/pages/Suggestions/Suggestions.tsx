import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@heroui/react";
import { ArrowLeft, Search, UserCheck, UserPlus, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  getFollowSuggestions,
  searchUsers,
  toggleFollow,
} from "../../api/api";
import { UserGridSkeleton } from "../../components/Skeletons";
import {
  extractUsers,
  mapSuggestedUser,
  type SuggestedUser,
} from "../../utils/suggestedUsers";

const PAGE_SIZE = 10;
const SEARCH_LIMIT = 20;

export default function Suggestions() {
  const location = useLocation();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState(
    () => (location.state as { q?: string } | null)?.q ?? "",
  );
  const [results, setResults] = useState<SuggestedUser[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFollowSuggestions(1, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        const list = extractUsers(data).map(mapSuggestedUser);
        setUsers(list);
        setPage(1);
        setHasMore(list.length >= PAGE_SIZE);
      })
      .catch(() => {
        if (!cancelled) toast.error("Unable to load suggestions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const searchingActive = query.trim() !== "";
  const displayed = searchingActive ? (results ?? []) : users;
  const busy = loading || (searchingActive && searching);

  async function handleLoadMore() {
    if (searchingActive) return;
    const next = page + 1;
    setLoadingMore(true);
    try {
      const data = await getFollowSuggestions(next, PAGE_SIZE);
      const list = extractUsers(data).map(mapSuggestedUser);
      if (list.length === 0) {
        setHasMore(false);
      } else {
        setUsers((prev) => {
          const seen = new Set(prev.map((u) => u.id));
          return [...prev, ...list.filter((u) => !seen.has(u.id))];
        });
        setPage(next);
        setHasMore(list.length >= PAGE_SIZE);
      }
    } catch {
      toast.error("Unable to load more users.");
    } finally {
      setLoadingMore(false);
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

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        to="/feed"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft size={16} />
        Back to Feed
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          All Suggested Friends{" "}
          <span className="ml-1 rounded-full bg-default-100 px-2.5 py-1 text-xs font-semibold text-default-500">
            {displayed.length}
          </span>
        </h1>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400"
        />
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by name or username..."
          aria-label="Search suggested friends"
          className="w-full rounded-xl border border-default-200 bg-background py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-default-400 hover:bg-default-100"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {busy && <UserGridSkeleton count={6} />}

      {!busy && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {displayed.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-2xl border border-default-200 bg-background p-4"
            >
              <Link to={`/users/${u.id}`} className="shrink-0">
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-default-200 text-lg font-semibold">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/users/${u.id}`}
                  className="block truncate font-semibold hover:underline"
                >
                  {u.name}
                </Link>
                <p className="truncate text-sm text-default-500">
                  @{u.username}
                  {u.followersCount > 0 &&
                    ` · ${u.followersCount} follower${u.followersCount === 1 ? "" : "s"}`}
                </p>
                {u.mutualCount > 0 && (
                  <p className="truncate text-xs font-medium text-primary">
                    {u.mutualCount} mutual
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant={u.isFollowing ? "secondary" : "primary"}
                onPress={() => handleFollow(u.id)}
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

      {!busy && displayed.length === 0 && (
        <p className="text-sm text-default-500">
          {searchingActive
            ? `No users match "${query.trim()}".`
            : "No suggestions found."}
        </p>
      )}

      {!busy && !searchingActive && hasMore && users.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onPress={handleLoadMore}
            isDisabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more users"}
          </Button>
        </div>
      )}
    </div>
  );
}
