import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@heroui/react";
import { Check, ChevronDown } from "lucide-react";
import type { PostPrivacy } from "../../utils/privacy";
import { PRIVACY_META } from "./privacyMeta";

export function PrivacyBadge({
  value,
  onChange,
}: {
  value?: PostPrivacy;
  onChange?: (value: PostPrivacy) => void;
}) {
  const current = value ?? "public";
  const meta = PRIVACY_META[current];
  const Icon = meta.icon;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !onChange) return;
    function handlePointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onChange]);

  if (!onChange) {
    return (
      <Tooltip delay={200} closeDelay={100}>
        <Tooltip.Trigger>
          <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-default-100 px-2 py-0.5 text-[11px] font-semibold text-default-500">
            <Icon size={12} />
            {meta.label}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content showArrow>{meta.hint}</Tooltip.Content>
      </Tooltip>
    );
  }

  const order: PostPrivacy[] = ["public", "following", "only_me"];
  return (
    <div className="relative inline-block" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Change post privacy"
        title="Change post privacy"
        className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-default-100 px-2 py-0.5 text-[11px] font-semibold text-default-500 transition-colors hover:bg-default-200 hover:text-primary"
      >
        <Icon size={12} />
        {meta.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-default-200 bg-background shadow-xl">
          {order.map((v) => {
            const m = PRIVACY_META[v];
            const ItemIcon = m.icon;
            const active = v === current;
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (v !== current) onChange(v);
                }}
                aria-pressed={active}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-default-100 ${
                  active ? "font-bold text-primary" : "font-medium"
                }`}
              >
                <ItemIcon size={14} />
                <span className="flex-1">{m.label}</span>
                {active && <Check size={14} />}
              </button>
            );
          })}
          <p className="border-t border-default-200 px-3 py-1.5 text-[11px] text-default-400">
            {meta.hint}
          </p>
        </div>
      )}
    </div>
  );
}
