import { Globe, Lock, Users } from "lucide-react";
import type { PostPrivacy } from "../../utils/privacy";

export const PRIVACY_META: Record<
  PostPrivacy,
  { label: string; hint: string; icon: typeof Globe }
> = {
  public: { label: "Public", hint: "Visible to everyone", icon: Globe },
  following: { label: "Followers", hint: "Visible to followers", icon: Users },
  only_me: { label: "Only me", hint: "Only visible to you", icon: Lock },
};
