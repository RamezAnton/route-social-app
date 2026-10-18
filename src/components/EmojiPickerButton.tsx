import { Suspense, lazy, useEffect, useRef, useState } from "react";
import type { EmojiClickData } from "emoji-picker-react";
import { Loader2, Smile } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

export function EmojiPickerButton({
  onPick,
  label = "Add emoji",
}: {
  onPick: (emoji: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open ]);

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-lg text-default-500 transition-colors hover:bg-default-100 hover:text-primary"
      >
        <Smile size={18} />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-50 mb-2 shadow-xl">
          <Suspense
            fallback={
              <div className="flex h-40 w-80 items-center justify-center rounded-xl border border-default-200 bg-background">
                <Loader2 size={20} className="animate-spin text-default-400" />
              </div>
            }
          >
            <EmojiPicker
              colorScheme={theme === "dark" ? "dark" : "light"}
              onEmojiClick={(d: EmojiClickData) => {
                onPick(d.emoji);
                setOpen(false);
              }}
              width={320}
              height={400}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
