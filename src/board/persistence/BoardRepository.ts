// Persistence seam. All board storage hides behind this interface so the
// document layer never talks to localStorage / a backend directly. A future
// backend (multi-board storage, sharing, collaboration) is just another
// implementation of BoardRepository -- nothing else in the app changes.

import type {
  BoardDocument,
  BoardSummary,
  DraftEnvelope,
} from "@/board/types";

export interface BoardRepository {
  /** Summaries of all stored (named/library) boards, for a gallery / picker. */
  list(): Promise<BoardSummary[]>;
  /** Full document by id, or null if it does not exist. */
  load(id: string): Promise<BoardDocument | null>;
  /** Persist (create or overwrite) a full document in the library. */
  save(doc: BoardDocument): Promise<void>;
  /** Create, persist, and return a fresh empty library board. */
  create(name?: string): Promise<BoardDocument>;
  /** Rename a library board in place. No-op if it does not exist. */
  rename(id: string, name: string): Promise<void>;
  /** Delete a library board by id. */
  remove(id: string): Promise<void>;

  // --- the working draft (single, continuously-autosaved current board) ---
  /** The persisted working draft, or null if none has been saved yet. */
  loadDraft(): Promise<DraftEnvelope | null>;
  /** Persist (overwrite) the working draft. */
  saveDraft(draft: DraftEnvelope): Promise<void>;
  /** Discard the working draft. */
  clearDraft(): Promise<void>;
}
