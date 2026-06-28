// The modal shell: the #scrim backdrop + .card container the dialogs render
// into. Ported from the prototype's openModal/closeModal (lines 347-350).
//
//   - Renders children inside `.card`; tool Dialogs render ONLY the card body
//     (<h2>, .field rows, .card-actions) per the dialog contract, so the .card
//     wrapper belongs here, not in the dialog.
//   - Closes on backdrop (scrim) click, exactly like the prototype
//     (scrim click where e.target === scrim).
//   - Sets the shared uiStore.modalOpen flag while mounted so the canvas can
//     suppress its keyboard shortcuts (Delete / Ctrl+Z) — mirrors the
//     prototype's `modalOpen` boolean.

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useUiStore } from "@/ui/uiStore";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps): JSX.Element | null {
  const setModalOpen = useUiStore((s) => s.setModalOpen);

  useEffect(() => {
    setModalOpen(open);
    return () => setModalOpen(false);
  }, [open, setModalOpen]);

  if (!open) return null;

  return (
    <div
      id="scrim"
      className="open"
      onClick={(e) => {
        // Only a click on the backdrop itself closes — not clicks inside .card.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card" id="card">
        {children}
      </div>
    </div>
  );
}
