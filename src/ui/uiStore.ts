// Small UI-only store, separate from the board document/ephemeral store.
//
// Holds `modalOpen`, the flag the prototype kept (line 154) so the canvas can
// suppress keyboard shortcuts (Delete / Ctrl+Z) while a dialog is up. The board
// store deliberately owns only board + ephemeral drawing state; transient
// chrome like "is a modal open" lives here so the two concerns stay separate.
//
// The Modal component sets/clears this as it mounts/unmounts; BoardCanvas reads
// it (useUiStore(s => s.modalOpen)) to gate its global keydown handler.

import { create } from "zustand";

interface UiState {
  modalOpen: boolean;
  setModalOpen(open: boolean): void;
}

export const useUiStore = create<UiState>((set) => ({
  modalOpen: false,
  setModalOpen(open) {
    set({ modalOpen: open });
  },
}));
