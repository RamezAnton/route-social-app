import { memo, useCallback, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Navbar } from "../../components/Layout/Navbar/Navbar";
import { Sidebar } from "../../components/Layout/Sidebar/Sidebar";
import { RightSidebar } from "../../components/Layout/RightSidebar/RightSidebar";
import ShapeGrid from "@/components/ShapeGrid";
import { useAuth, useUnreadCount } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";

const MainShell = memo(function MainShell({
  sidebarOpen,
  onCloseSidebar,
}: {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-[1600px] gap-4">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={onCloseSidebar}
        onCreatePost={onCloseSidebar}
      />

      <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 md:pb-6">
        <Outlet />
      </main>

      <RightSidebar />
    </div>
  );
});

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const unreadCount = useUnreadCount();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const showFx = useMediaQuery("(min-width: 768px)");
  const lineColor = isDark ? "#2a2734" : "#b9b9c4";
  const hoverColor = isDark ? "#ffffff" : "#171717";

  const toggleSidebar = useCallback(
    () => setSidebarOpen((open) => !open),
    [],
  );
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  function handleLogout() {
    logout();
    toast.info("Signed out.");
    navigate("/auth/login", { replace: true });
  }

  return (
    <div className="relative min-h-screen bg-default-50">
      <div className="absolute inset-0" aria-hidden="true">
        {showFx ? (
          <ShapeGrid
            shape="square"
            direction="diagonal"
            lineColor={lineColor}
            hoverColor={hoverColor}
            hoverFillColor={hoverColor}
            fillOpacity={0.15}
            cellSize={40}
            speed={0.5}
            tiltX={0}
            tiltY={0}
            rainbow={false}
            lineWidth={1}
            radius={1.5}
            trail={0.6}
            glow={0.35}
            twinkle={0}
            fade={1}
            clickCascade
            intro
          />
        ) : (
          <div className="h-full w-full bg-linear-to-b from-primary/10 via-transparent to-transparent" />
        )}
      </div>

      <div className="relative z-10">
        <Navbar
          onMenuToggle={toggleSidebar}
          onLogout={handleLogout}
          user={user}
          notificationCount={unreadCount}
        />

        <MainShell
          sidebarOpen={sidebarOpen}
          onCloseSidebar={closeSidebar}
        />
      </div>
    </div>
  );
}
