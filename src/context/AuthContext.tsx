/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearToken,
  getProfile,
  getToken,
  getUnreadCount,
  signin,
} from "../api/api";
import type { LoginInterface } from "../interface/auth.interface";

export type AppUser = {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  coverUrl?: string;
  about?: string;
  followersCount?: number;
  followingCount?: number;
};

const defaultUser: AppUser = { id: "me", name: "You", username: "me" };

export function normalizeUser(raw: unknown, fallbackName = "You"): AppUser {
  if (typeof raw !== "object" || raw === null) {
    return { ...defaultUser, name: fallbackName };
  }
  const u = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  const arrLen = (v: unknown) => (Array.isArray(v) ? v.length : undefined);
  return {
    id: str(u._id) ?? str(u.id) ?? "me",
    name: str(u.name) ?? fallbackName,
    username: str(u.username) ?? "me",
    email: str(u.email),
    avatarUrl: str(u.photo) ?? str(u.avatar) ?? str(u.avatarUrl) ?? str(u.image),
    coverUrl: str(u.cover) ?? str(u.coverUrl) ?? str(u.coverPhoto),
    about: str(u.about) ?? str(u.bio),
    followersCount:
      num(u.followersCount) ?? arrLen(u.followers) ?? num(u.followers),
    followingCount:
      num(u.followingCount) ?? arrLen(u.following) ?? num(u.following),
  };
}

type AuthContextValue = {
  user: AppUser;
  loading: boolean;
  login: (payload: LoginInterface) => Promise<unknown>;
  logout: () => void;
  refresh: () => Promise<void>;
};

type UnreadStateContextValue = {
  unreadCount: number;
};

type UnreadActionsContextValue = {
  refreshUnread: () => Promise<void>;
  decrementUnread: (by?: number) => void;
};

function extractUnread(data: unknown): number | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const d = data as {
    data?: { unreadCount?: unknown; count?: unknown };
    unreadCount?: unknown;
    count?: unknown;
  };
  const v =
    d?.data?.unreadCount ?? d?.data?.count ?? d?.unreadCount ?? d?.count;
  return typeof v === "number" ? v : undefined;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const UnreadStateContext = createContext<UnreadStateContextValue | null>(null);
const UnreadActionsContext =
  createContext<UnreadActionsContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(defaultUser);
  const [loading, setLoading] = useState(() => !!getToken());
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(defaultUser);
      setLoading(false);
      return;
    }
    try {
      const data = await getProfile();
      const raw = data?.data?.user ?? data?.user ?? data?.data;
      setUser(normalizeUser(raw));
    } catch {
      // Keep the last known user on failure.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (cancelled) return;
        const raw = data?.data?.user ?? data?.user ?? data?.data;
        setUser(normalizeUser(raw));
      })
      .catch(() => {
        // Keep the default user on failure.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUnread = useCallback(async () => {
    if (!getToken()) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await getUnreadCount();
      const count = extractUnread(data);
      if (count !== undefined) setUnreadCount(count);
    } catch {
      // Badge keeps its last known value on failure.
    }
  }, []);

  const decrementUnread = useCallback((by = 1) => {
    setUnreadCount((c) => Math.max(0, c - by));
  }, []);

  const login = useCallback(
    async (payload: LoginInterface) => {
      const data = await signin(payload);
      await refresh();
      await refreshUnread();
      return data;
    },
    [refresh, refreshUnread],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(defaultUser);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    function poll() {
      getUnreadCount()
        .then((data) => {
          if (cancelled) return;
          const count = extractUnread(data);
          if (count !== undefined) setUnreadCount(count);
        })
        .catch(() => {});
    }
    poll();
    const timer = setInterval(poll, 20000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [user.id]);

  const unreadStateValue = useMemo(
    () => ({ unreadCount }),
    [unreadCount],
  );
  const unreadActionsValue = useMemo(
    () => ({ refreshUnread, decrementUnread }),
    [refreshUnread, decrementUnread],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refresh,
    }),
    [user, loading, login, logout, refresh],
  );

  return (
    <AuthContext.Provider value={value}>
      <UnreadStateContext.Provider value={unreadStateValue}>
        <UnreadActionsContext.Provider value={unreadActionsValue}>
          {children}
        </UnreadActionsContext.Provider>
      </UnreadStateContext.Provider>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useUnreadCount(): number {
  const ctx = useContext(UnreadStateContext);
  if (!ctx) throw new Error("useUnreadCount must be used within AuthProvider");
  return ctx.unreadCount;
}

export function useUnreadActions(): UnreadActionsContextValue {
  const ctx = useContext(UnreadActionsContext);
  if (!ctx)
    throw new Error("useUnreadActions must be used within AuthProvider");
  return ctx;
}
