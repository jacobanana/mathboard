// The Paper popover (#paperMenu): Squares / Lines / Blank. Ported from the
// prototype (markup line 123, wiring lines 342-345).
//
// The host (App) owns open/close state and the anchor element (the Paper
// button). This component positions itself just below the anchor, marks the
// current background active, sets it via store.setBackground on click, and
// closes on outside click. Rendered only while open.

import { useEffect, useRef } from "react";
import { useBoardStore } from "@/board/store";
import type { Background } from "@/board/types";

const OPTIONS: [Background, string][] = [
  ["squared", "Squares"],
  ["lined", "Lines"],
  ["blank", "Blank"],
];

interface PaperMenuProps {
  anchor: HTMLElement | null;
  onClose: () => void;
}

export function PaperMenu({ anchor, onClose }: PaperMenuProps): JSX.Element | null {
  const background = useBoardStore((s) => s.board.background);
  const setBackground = useBoardStore((s) => s.setBackground);
  const ref = useRef<HTMLDivElement>(null);

  // Close on any click outside the menu or its anchor (prototype line 345).
  useEffect(() => {
    function onDocClick(e: MouseEvent): void {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (anchor?.contains(target)) return;
      onClose();
    }
    // Defer so the opening click doesn't immediately close it.
    const t = setTimeout(() => document.addEventListener("click", onDocClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onDocClick);
    };
  }, [anchor, onClose]);

  if (anchor == null) return null;
  const r = anchor.getBoundingClientRect();

  return (
    <div
      id="paperMenu"
      className="open"
      ref={ref}
      style={{ left: r.left, top: r.bottom + 6 }}
    >
      {OPTIONS.map(([bg, label]) => (
        <button
          key={bg}
          className={background === bg ? "active" : ""}
          onClick={() => {
            setBackground(bg);
            onClose();
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
