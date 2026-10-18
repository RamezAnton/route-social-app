import { Button } from "@heroui/react";
import { House, UserRound, Users, Bookmark, X } from "lucide-react";
import { NavLink } from "react-router-dom";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: () => void;
};

const navigation = [
  { label: "Feed", to: "/feed", icon: House },
  { label: "My Posts", to: "/my-posts", icon: UserRound },
  { label: "Community", to: "/community", icon: Users },
  { label: "Saved", to: "/saved", icon: Bookmark },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed bottom-0 left-0 top-16 z-50 flex w-72
          flex-col border-r border-default-200 bg-background
          transition-transform duration-200
          lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)]
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between border-b border-default-200 p-4 lg:hidden">
          <span className="font-semibold">Navigation</span>
          <Button
            isIconOnly
            variant="secondary"
            aria-label="Close sidebar"
            onPress={onClose}
          >
            <X size={20} />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:translate-x-1 ${isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-default-600 hover:bg-default-100 hover:text-primary"
                }`
              }
            >
              <Icon size={21} className="transition-transform group-hover:scale-110" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-default-200 p-4">
          <p className="text-xs text-default-400 text-center">Connect · Your Route community</p>
        </div>
      </aside>
    </>
  );
}
