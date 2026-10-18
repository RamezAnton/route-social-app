import type { ReactNode } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useTheme } from "../context/ThemeContext";

function Themed({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <SkeletonTheme
      baseColor={theme === "dark" ? "#27272a" : "#e4e4e7"}
      highlightColor={theme === "dark" ? "#3f3f46" : "#f4f4f5"}
    >
      {children}
    </SkeletonTheme>
  );
}

export function PostCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Themed>
      <div className="space-y-5" aria-label="Loading posts">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-default-200 bg-background p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <Skeleton circle width={44} height={44} />
              <div className="flex-1">
                <Skeleton width="35%" />
                <Skeleton width="25%" />
              </div>
            </div>
            <Skeleton count={2} />
            <Skeleton height={160} borderRadius={12} />
          </div>
        ))}
      </div>
    </Themed>
  );
}

export function UserRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Themed>
      <ul className="space-y-3" aria-label="Loading users">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="flex items-center gap-3">
            <Skeleton circle width={40} height={40} />
            <div className="flex-1">
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </div>
            <Skeleton width={70} height={32} borderRadius={10} />
          </li>
        ))}
      </ul>
    </Themed>
  );
}

export function UserGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Themed>
      <div className="grid gap-4 sm:grid-cols-2" aria-label="Loading users">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-default-200 bg-background p-4"
          >
            <Skeleton circle width={48} height={48} />
            <div className="flex-1">
              <Skeleton width="70%" />
              <Skeleton width="50%" />
            </div>
            <Skeleton width={70} height={32} borderRadius={10} />
          </div>
        ))}
      </div>
    </Themed>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <Themed>
      <div
        className="overflow-hidden rounded-2xl border border-default-200 bg-background"
        aria-label="Loading profile"
      >
        <Skeleton height={160} borderRadius={0} />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-3">
            <Skeleton circle width={80} height={80} />
          </div>
          <Skeleton width="30%" height={24} />
          <Skeleton width="20%" />
          <div className="mt-4 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={64} borderRadius={12} />
            ))}
          </div>
        </div>
      </div>
    </Themed>
  );
}

export function NotificationRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Themed>
      <ul className="space-y-3" aria-label="Loading notifications">
        {Array.from({ length: count }).map((_, i) => (
          <li
            key={i}
            className="rounded-2xl border border-default-200 bg-background p-4"
          >
            <Skeleton width="40%" />
            <Skeleton count={2} />
          </li>
        ))}
      </ul>
    </Themed>
  );
}
