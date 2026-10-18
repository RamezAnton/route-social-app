import { Outlet, Link } from "react-router-dom";
import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import TechText from "@/components/TechText";
import ShapeWaves from "@/components/ShapeWaves";
import { useTheme } from "../../context/ThemeContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";

export default function AuthLayout() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  // WebGPU canvas destroys mobile GPUs — desktop only; phones keep the tint.
  const showFx = useMediaQuery("(min-width: 768px)");
  // TechText draws on canvas with fixed colors — mirror the app theme
  // explicitly so it stays visible in both modes.
  const ink = isDark ? "#ffffff" : "#171717";
  // ShapeWaves paints its own opaque backdrop — match it to the theme.
  const wavesBackground = isDark ? "#120f17" : "#e9e9ee";
  const wavesHover = isDark ? "#ffffff" : "#171717";

  return (
    <div className="relative flex min-h-screen justify-center overflow-hidden bg-default-50">
      <div className="absolute inset-0" aria-hidden="true">
        {showFx ? (
          <ShapeWaves
            text="Route"
            fontFamily='Geist, "Geist Sans", system-ui, sans-serif'
            fontWeight={500}
            textSize={0.6}
            shapes="mixed"
            cellSize={10}
            dotSize={0.75}
            color="#929292"
            hoverColor={wavesHover}
            backgroundColor={wavesBackground}
            speed={1}
            scale={1}
            contrast={1}
            brightness={0.4}
            flow={0}
            direction={0}
            fade={0.25}
            interactive
            splashRadius={40}
            splashStrength={0.4}
            glow={0.35}
            intro
            introDuration={1.6}
            paused={false}
          />
        ) : (
          <div className="h-full w-full bg-linear-to-b from-primary/10 via-transparent to-transparent" />
        )}
      </div>

      <div className="relative z-10 flex w-full justify-center px-4 py-10">
        <div className="absolute right-4 top-4">
          <Button
            isIconOnly
            variant="secondary"
            aria-label={
              isDark ? "Switch to light mode" : "Switch to dark mode"
            }
            onPress={toggle}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
        <div className="w-full max-w-md space-y-6">
          <Link to="/" className="flex items-center justify-center gap-2">
            <div style={{ width: '100%', height: '180px', position: 'relative' }}>
              <TechText
                text="Route"
                fontWeight={600}
                fontSize={150}
                reveal="letter"
                dashLength={4}
                dashGap={2}
                specks={15}
                fontFamily=""
                color={ink}
                accentColor={ink}
                letterSpacing={-0.05}
                reach={200}
                softness={0.7}
                strokeWidth={1.5}
                speed={1}
                lineStyle="dashed"
                selection
                labels
                draggable
                sweep
              />
            </div>
          </Link>
          <div className="rounded-2xl border border-default-200 bg-background p-6 shadow-sm sm:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
