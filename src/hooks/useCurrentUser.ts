import { useAuth } from "../context/AuthContext";


export function useCurrentUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}

export type { AppUser } from "../context/AuthContext";
export { normalizeUser } from "../context/AuthContext";
