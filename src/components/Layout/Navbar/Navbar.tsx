import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import {
  Bell,
  House,
  Menu,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";

type NavbarProps = {
  onMenuToggle: () => void;
  onLogout?: () => void;
  user?: {
    name: string;
    username: string;
    avatarUrl?: string;
  };
  notificationCount?: number;
};

const centerLinks = [
  { label: "Feed", to: "/feed", icon: House },
  { label: "Profile", to: "/profile", icon: UserRound },
  { label: "Notifications", to: "/notifications", icon: Bell },
];

function shortName(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).join(" ");
}

export function Navbar({
  onMenuToggle,
  onLogout,
  user = { name: "You", username: "me" },
  notificationCount = 0,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [profileOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-default-200 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <Button
            isIconOnly
            variant="secondary"
            className="shrink-0 lg:hidden"
            aria-label="Toggle sidebar"
            onPress={onMenuToggle}
          >
            <Menu size={22} />
          </Button>

          <Link to="/feed" className="flex shrink-0 items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <House size={21} />
            </div>
            <span className="hidden text-xl font-bold tracking-tight sm:block">
              Route
            </span>
          </Link>

          <nav className="mx-auto hidden items-center gap-1 md:flex">
            {centerLinks.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:-translate-y-px ${isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-default-600 hover:bg-default-100 hover:text-primary"
                  }`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
            <Button
              isIconOnly
              variant="secondary"
              aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
              onPress={toggle}
            >
              {theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}
            </Button>

            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative flex size-10 items-center justify-center rounded-xl text-default-600 transition-all hover:bg-default-100 hover:text-primary active:scale-95"
            >
              <Bell size={21} />
              {notificationCount > 0 && (
                <span className="pointer-events-none absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Link>

            <div className="relative ml-1" ref={menuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
                className="flex cursor-pointer items-center gap-2 rounded-xl p-1 transition-colors hover:bg-default-100 active:scale-95"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-default-200 font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden max-w-28 truncate text-sm font-semibold md:block">
                  {shortName(user.name)}
                </span>
                <ChevronDown
                  size={16}
                  className="hidden text-default-500 sm:block"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-default-200 bg-background p-2 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-default-200 px-3 py-2">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-default-200 font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {shortName(user.name)}
                      </p>
                      <p className="truncate text-xs text-default-500">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-default-100 hover:text-primary"
                  >
                    <UserRound size={17} />
                    My profile
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-default-100 hover:text-primary"
                  >
                    <Settings size={17} />
                    Settings
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout?.();
                    }}
                    className="flex cursor-pointer w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-danger transition-colors hover:bg-danger/10"
                  >
                    <LogOut size={17} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-1 border-t border-default-200 bg-background px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden"
      >
        {centerLinks.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-2 py-3.5 text-xs font-medium transition-colors ${isActive
                ? "bg-default-200 text-foreground"
                : "text-default-600 hover:bg-default-100 hover:text-primary"
              }`
            }
          >
            <span className="relative shrink-0">
              <Icon size={20} />
              {to === "/notifications" && notificationCount > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </span>
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
