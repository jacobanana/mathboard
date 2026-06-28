// The single Zustand store. It holds BOTH halves of the model but keeps them
// conceptually separate:
//
//   DOCUMENT state  -> board: BoardDocument   (syncable; mutated only via the
//                                               named document actions below --
//                                               those actions are the future
//                                               sync seam)
//   EPHEMERAL state -> camera, tool, color, penSize, textSize, selection
//                                               (local-only; never persisted to
//                                               the document, never synced)
//
// RULE: never mutate board.objects / board.strokes / board.background outside an
// action. UI and tools call addObject / updateObject / addStroke / etc. This is
// the seam where backend writes / CRDT ops will be emitted later.

import { create } from "zustand";
import type {
  AnyBoardObject,
  Background,
  BoardDocument,
  BoardSummary,
  Camera,
  Stroke,
  ToolName,
} from "@/board/types";
import { id as newId, newBoardDocument } from "@/board/types";
import { eraseStrokeRuns, rectsIntersect, strokeBounds } from "@/board/geometry";
import { localRepository } from "@/board/persistence/LocalBoardRepository";
import { theme } from "@/styles/theme";

const HISTORY_CAP = 60;

/** What undo/redo snapshots capture: the document's mutable fields. */
interface DocSnapshot {
  objects: AnyBoardObject[];
  strokes: Stroke[];
  background: Background;
}

/**
 * The current selection. Holds object ids AND stroke ids so freehand "arcs" can
 * be selected, moved and deleted alongside placed objects. Ephemeral: the empty
 * selection is `{ objectIds: [], strokeIds: [] }`.
 */
export interface Selection {
  objectIds: string[];
  strokeIds: string[];
}

const EMPTY_SELECTION: Selection = { objectIds: [], strokeIds: [] };

export const selectionCount = (s: Selection): number =>
  s.objectIds.length + s.strokeIds.length;

/**
 * Apply one eraser path geometrically to a list of pen strokes: trim covered
 * points, splitting each stroke into its surviving fragments and dropping any
 * stroke that is fully erased. The first fragment keeps the original id so a
 * partially-erased selected stroke stays selected.
 */
function applyEraser(
  pens: Stroke[],
  eraserPoints: { x: number; y: number }[],
  eraserSize: number,
): Stroke[] {
  const eraserRadius = eraserSize / 2;
  const eb = strokeBounds({ points: eraserPoints, size: eraserSize });
  const out: Stroke[] = [];
  for (const pen of pens) {
    if (!rectsIntersect(strokeBounds(pen), eb)) {
      out.push(pen);
      continue;
    }
    const runs = eraseStrokeRuns(pen.points, eraserPoints, eraserRadius);
    if (runs === null) {
      out.push(pen); // untouched
      continue;
    }
    runs.forEach((run, idx) =>
      out.push({ ...pen, id: idx === 0 ? pen.id : newId(), points: run }),
    );
  }
  return out;
}

/**
 * Migrate a stroke list to the geometric-eraser model: fold every stored
 * "eraser" overlay stroke into the pen strokes that precede it (the eraser only
 * carved pixels drawn before it), leaving a list of pen strokes only. Idempotent
 * once no eraser strokes remain.
 */
export function bakeErasers(strokes: Stroke[]): Stroke[] {
  if (!strokes.some((s) => s.mode === "eraser")) return strokes;
  let pens: Stroke[] = [];
  for (const s of strokes) {
    if (s.mode === "eraser") pens = applyEraser(pens, s.points, s.size);
    else pens.push(s);
  }
  return pens;
}

interface BoardState {
  // ---- DOCUMENT state (syncable) ----
  board: BoardDocument;

  // ---- DRAFT / LIBRARY linkage (local-only) ----
  /**
   * Id of the named library board this working draft was opened from / last
   * saved to. null for a board that has never been explicitly saved. Ctrl+S
   * ("save over the same") writes the draft back to this id.
   */
  sourceId: string | null;
  /** The draft has unsaved changes relative to its linked library board. */
  dirty: boolean;

  // ---- EPHEMERAL state (local-only) ----
  camera: Camera;
  tool: ToolName;
  color: string;
  penSize: number;
  textSize: number;
  /** Object + stroke ids currently selected (multi-select). */
  selection: Selection;
  /**
   * Id of the text object currently being edited via the textarea overlay.
   * The canvas hides this object from its own draw pass while editing (the
   * text tool's draw() also no-ops for it). Ephemeral: never persisted.
   */
  editingId: string | null;

  // ---- HISTORY (document-scoped) ----
  undoStack: string[];
  redoStack: string[];
  canUndo: boolean;
  canRedo: boolean;

  // ---- DOCUMENT actions (the sync seam) ----
  addObject(obj: AnyBoardObject): void;
  /** Patch an object's fields. Pushes a history entry. */
  updateObject(id: string, patch: Partial<AnyBoardObject>): void;
  /**
   * Move an object. Does NOT push history -- the drag handler pushes once at
   * drag start so the whole drag is a single undo step.
   */
  moveObject(id: string, x: number, y: number): void;
  /**
   * Translate every selected object and stroke by (dx, dy) in world coords.
   * Does NOT push history -- the drag handler pushes once at drag start so the
   * whole drag collapses to a single undo step (mirrors moveObject).
   */
  nudgeSelection(dx: number, dy: number): void;
  removeObject(id: string): void;
  /** Remove every selected object and stroke in one undoable step; clears the selection. */
  deleteSelection(): void;
  addStroke(stroke: Stroke): void;
  /**
   * Apply an eraser pass geometrically: trim the covered points out of every
   * pen stroke, splitting them into surviving fragments and deleting any stroke
   * fully erased. The eraser itself is NOT stored -- so erased gaps travel with
   * the stroke when it is moved. One undo step; no-op if nothing is touched.
   */
  eraseStrokes(eraser: { points: { x: number; y: number }[]; size: number }): void;
  setBackground(bg: Background): void;

  // ---- HISTORY actions ----
  /** Snapshot current document state onto the undo stack (clears redo). */
  pushHistory(): void;
  undo(): void;
  redo(): void;

  // ---- EPHEMERAL actions ----
  setTool(t: ToolName): void;
  setColor(c: string): void;
  setPenSize(n: number): void;
  setTextSize(n: number): void;
  setCamera(patch: Partial<Camera>): void;
  /** Select exactly one object (or clear the selection when id is null). */
  select(id: string | null): void;
  /** Replace the whole selection (objects + strokes). */
  setSelection(sel: Selection): void;
  /** Clear the selection. */
  clearSelection(): void;
  /** Select every object and every (non-eraser) stroke on the board. */
  selectAll(): void;
  setEditingId(id: string | null): void;

  // ---- LOAD / SAVE lifecycle ----
  /** Load the working draft (or seed one) via localRepository. */
  init(): Promise<void>;
  /** Summaries of every named library board (newest first). */
  listBoards(): Promise<BoardSummary[]>;
  /**
   * Save the draft over its linked library board ("save over the same"). If the
   * draft has never been saved (no source), returns { needsName: true } so the
   * caller can prompt for a name and call saveAs instead.
   */
  saveCurrent(): Promise<{ needsName: boolean }>;
  /** Save the draft as a NEW named library board and link the draft to it. */
  saveAs(name: string): Promise<void>;
  /** Rename a library board; keeps the draft's name in sync if it's the source. */
  renameBoard(id: string, name: string): Promise<void>;
  /** Replace the draft with a copy of the named library board. */
  openBoard(id: string): Promise<void>;
  /** Start a fresh, empty, unsaved draft. */
  newBoard(): Promise<void>;
  /** Delete a library board; unlinks the draft if it was the source. */
  deleteBoard(id: string): Promise<void>;
}

function snapshot(board: BoardDocument): string {
  return JSON.stringify({
    objects: board.objects,
    strokes: board.strokes,
    background: board.background,
  });
}

export const useBoardStore = create<BoardState>((set, get) => {
  // --- Debounced draft autosave ------------------------------------------
  // Every document change flushes the WORKING DRAFT (not the named library
  // board) here -- this is the single autosave seam. An explicit Save / Save-as
  // is what writes the document back into the library (saveCurrent / saveAs).
  // When a backend arrives, hook sync here too (push a patch / CRDT op).
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  function cancelDraftSave(): void {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = undefined;
    }
  }
  function scheduleDraftSave(): void {
    cancelDraftSave();
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      const { board, sourceId, dirty } = get();
      void localRepository.saveDraft({ doc: board, sourceId, dirty });
      // <-- BACKEND SYNC HOOK: emit board change to the server here.
    }, 400);
  }
  /** Write the draft immediately (used by explicit lifecycle actions). */
  async function flushDraft(
    doc: BoardDocument,
    sourceId: string | null,
    dirty: boolean,
  ): Promise<void> {
    cancelDraftSave();
    await localRepository.saveDraft({ doc, sourceId, dirty });
  }
  /** Reset transient per-document state when the document is swapped wholesale. */
  const FRESH_DOC_STATE = {
    undoStack: [] as string[],
    redoStack: [] as string[],
    canUndo: false,
    canRedo: false,
    selection: EMPTY_SELECTION,
    editingId: null as string | null,
  };

  /**
   * Apply a mutation to the document arrays, bump updatedAt, and trigger a
   * debounced save. `mutate` receives a fresh DocSnapshot (shallow-cloned
   * arrays) to mutate; it must return the next {objects, strokes}.
   */
  function commit(mutate: (doc: DocSnapshot) => DocSnapshot): void {
    set((state) => {
      const next = mutate({
        objects: state.board.objects,
        strokes: state.board.strokes,
        background: state.board.background,
      });
      const board: BoardDocument = {
        ...state.board,
        objects: next.objects,
        strokes: next.strokes,
        background: next.background,
        updatedAt: Date.now(),
      };
      return { board, dirty: true };
    });
    scheduleDraftSave();
  }

  function restore(snap: string): void {
    set((state) => {
      const parsed = JSON.parse(snap) as DocSnapshot;
      const board: BoardDocument = {
        ...state.board,
        objects: parsed.objects,
        strokes: parsed.strokes,
        background: parsed.background ?? state.board.background,
        updatedAt: Date.now(),
      };
      // Keep selection valid after undo/restore: drop ids whose object/stroke
      // no longer exists.
      const objIds = new Set(parsed.objects.map((o) => o.id));
      const strkIds = new Set(parsed.strokes.map((s) => s.id));
      const selection: Selection = {
        objectIds: state.selection.objectIds.filter((id) => objIds.has(id)),
        strokeIds: state.selection.strokeIds.filter((id) => strkIds.has(id)),
      };
      return { board, selection, dirty: true };
    });
    scheduleDraftSave();
  }

  return {
    board: {
      // Replaced by init(); a synchronous placeholder keeps types honest and
      // lets the UI render before async load resolves.
      id: "pending",
      name: "Untitled board",
      background: "squared",
      objects: [],
      strokes: [],
      createdAt: 0,
      updatedAt: 0,
    },
    sourceId: null,
    dirty: false,

    camera: { x: 0, y: 0, scale: 1 },
    tool: "pen",
    color: theme.ink,
    penSize: 6,
    textSize: 26,
    selection: EMPTY_SELECTION,
    editingId: null,

    undoStack: [],
    redoStack: [],
    canUndo: false,
    canRedo: false,

    // ---- DOCUMENT actions ----
    addObject(obj) {
      get().pushHistory();
      commit((d) => ({ ...d, objects: [...d.objects, obj] }));
    },

    updateObject(id, patch) {
      get().pushHistory();
      commit((d) => ({
        ...d,
        objects: d.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      }));
    },

    moveObject(id, x, y) {
      // No history here -- caller pushed once at drag start.
      commit((d) => ({
        ...d,
        objects: d.objects.map((o) => (o.id === id ? { ...o, x, y } : o)),
      }));
    },

    nudgeSelection(dx, dy) {
      // No history here -- caller pushed once at drag start.
      const sel = get().selection;
      if (selectionCount(sel) === 0 || (dx === 0 && dy === 0)) return;
      const oset = new Set(sel.objectIds);
      const sset = new Set(sel.strokeIds);
      commit((d) => ({
        ...d,
        objects: d.objects.map((o) =>
          oset.has(o.id) ? { ...o, x: o.x + dx, y: o.y + dy } : o,
        ),
        strokes: d.strokes.map((s) =>
          sset.has(s.id)
            ? { ...s, points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
            : s,
        ),
      }));
    },

    removeObject(id) {
      get().pushHistory();
      commit((d) => ({
        ...d,
        objects: d.objects.filter((o) => o.id !== id),
      }));
      const sel = get().selection;
      if (sel.objectIds.includes(id)) {
        set({
          selection: {
            ...sel,
            objectIds: sel.objectIds.filter((x) => x !== id),
          },
        });
      }
    },

    deleteSelection() {
      const sel = get().selection;
      if (selectionCount(sel) === 0) return;
      get().pushHistory();
      const oset = new Set(sel.objectIds);
      const sset = new Set(sel.strokeIds);
      commit((d) => ({
        ...d,
        objects: d.objects.filter((o) => !oset.has(o.id)),
        strokes: d.strokes.filter((s) => !sset.has(s.id)),
      }));
      set({ selection: EMPTY_SELECTION });
    },

    addStroke(stroke) {
      get().pushHistory();
      commit((d) => ({ ...d, strokes: [...d.strokes, stroke] }));
    },

    eraseStrokes(eraser) {
      if (eraser.points.length === 0) return;
      const current = get().board.strokes;
      const next = applyEraser(current, eraser.points, eraser.size);
      // applyEraser only rewrites strokes it actually trims, so a different
      // array length OR identity means something changed. Detect a no-op (the
      // eraser passed over blank space) to avoid an empty undo step.
      const changed =
        next.length !== current.length ||
        next.some((s, i) => s !== current[i]);
      if (!changed) return;
      get().pushHistory();
      commit((d) => ({ ...d, strokes: next }));
      // Drop any selected stroke ids that no longer exist after the split.
      const present = new Set(next.map((s) => s.id));
      const sel = get().selection;
      const strokeIds = sel.strokeIds.filter((id) => present.has(id));
      if (strokeIds.length !== sel.strokeIds.length) {
        set({ selection: { ...sel, strokeIds } });
      }
    },

    setBackground(bg) {
      // Route through the single commit() seam (and make it undoable) rather
      // than hand-rolling a second save path.
      get().pushHistory();
      commit((d) => ({ ...d, background: bg }));
    },

    // ---- HISTORY ----
    pushHistory() {
      set((state) => {
        const undoStack = [...state.undoStack, snapshot(state.board)];
        if (undoStack.length > HISTORY_CAP) undoStack.shift();
        return { undoStack, redoStack: [], canUndo: true, canRedo: false };
      });
    },

    undo() {
      const { undoStack, board } = get();
      if (!undoStack.length) return;
      const redoStack = [...get().redoStack, snapshot(board)];
      const nextUndo = undoStack.slice(0, -1);
      const snap = undoStack[undoStack.length - 1];
      set({
        undoStack: nextUndo,
        redoStack,
        canUndo: nextUndo.length > 0,
        canRedo: true,
      });
      restore(snap);
    },

    redo() {
      const { redoStack, board } = get();
      if (!redoStack.length) return;
      const undoStack = [...get().undoStack, snapshot(board)];
      const nextRedo = redoStack.slice(0, -1);
      const snap = redoStack[redoStack.length - 1];
      set({
        undoStack,
        redoStack: nextRedo,
        canUndo: true,
        canRedo: nextRedo.length > 0,
      });
      restore(snap);
    },

    // ---- EPHEMERAL actions ----
    setTool(t) {
      set({ tool: t });
    },
    setColor(c) {
      set({ color: c });
    },
    setPenSize(n) {
      set({ penSize: n });
    },
    setTextSize(n) {
      set({ textSize: n });
    },
    setCamera(patch) {
      set((state) => ({ camera: { ...state.camera, ...patch } }));
    },
    select(id) {
      set({
        selection:
          id == null ? EMPTY_SELECTION : { objectIds: [id], strokeIds: [] },
      });
    },
    setSelection(sel) {
      set({ selection: sel });
    },
    clearSelection() {
      set({ selection: EMPTY_SELECTION });
    },
    selectAll() {
      const { board } = get();
      set({
        selection: {
          objectIds: board.objects.map((o) => o.id),
          strokeIds: board.strokes
            .filter((s) => s.mode !== "eraser")
            .map((s) => s.id),
        },
      });
    },
    setEditingId(id) {
      set({ editingId: id });
    },

    // ---- LOAD / SAVE ----
    async init() {
      // Migrate any legacy "eraser" overlay strokes into geometry so erased
      // gaps move with their stroke (and fully-erased strokes vanish).
      const bake = (doc: BoardDocument): BoardDocument => {
        const strokes = bakeErasers(doc.strokes);
        return strokes === doc.strokes ? doc : { ...doc, strokes };
      };

      // Resume the working draft exactly if one exists.
      const draft = await localRepository.loadDraft();
      if (draft) {
        set({
          board: bake(draft.doc),
          sourceId: draft.sourceId,
          dirty: draft.dirty,
          ...FRESH_DOC_STATE,
        });
        return;
      }

      // No draft yet (first run / upgrade from the old single-board format):
      // seed the draft from the most-recent library board if there is one, else
      // start blank. Nothing is written to the library here -- only the draft.
      const summaries = await localRepository.list();
      let doc: BoardDocument | undefined;
      let sourceId: string | null = null;
      if (summaries.length > 0) {
        const src = await localRepository.load(summaries[0].id);
        if (src) {
          doc = bake(src);
          sourceId = src.id;
        }
      }
      if (!doc) doc = newBoardDocument();
      await flushDraft(doc, sourceId, false);
      set({ board: doc, sourceId, dirty: false, ...FRESH_DOC_STATE });
    },

    listBoards() {
      return localRepository.list();
    },

    async saveCurrent() {
      const { board, sourceId } = get();
      if (sourceId == null) return { needsName: true };
      const doc: BoardDocument = { ...board, id: sourceId, updatedAt: Date.now() };
      await localRepository.save(doc);
      await flushDraft(doc, sourceId, false);
      set({ board: doc, dirty: false });
      return { needsName: false };
    },

    async saveAs(name) {
      const { board } = get();
      const now = Date.now();
      const docId = newId();
      const doc: BoardDocument = {
        ...board,
        id: docId,
        name,
        createdAt: now,
        updatedAt: now,
      };
      await localRepository.save(doc);
      await flushDraft(doc, docId, false);
      set({ board: doc, sourceId: docId, dirty: false });
    },

    async renameBoard(boardId, name) {
      await localRepository.rename(boardId, name);
      if (get().sourceId === boardId) {
        const board: BoardDocument = { ...get().board, name };
        set({ board });
        await flushDraft(board, boardId, get().dirty);
      }
    },

    async openBoard(boardId) {
      const src = await localRepository.load(boardId);
      if (!src) return;
      const strokes = bakeErasers(src.strokes);
      const doc = strokes === src.strokes ? src : { ...src, strokes };
      await flushDraft(doc, boardId, false);
      set({
        board: doc,
        sourceId: boardId,
        dirty: false,
        camera: { x: 0, y: 0, scale: 1 },
        ...FRESH_DOC_STATE,
      });
    },

    async newBoard() {
      const doc = newBoardDocument();
      await flushDraft(doc, null, false);
      set({
        board: doc,
        sourceId: null,
        dirty: false,
        camera: { x: 0, y: 0, scale: 1 },
        ...FRESH_DOC_STATE,
      });
    },

    async deleteBoard(boardId) {
      await localRepository.remove(boardId);
      if (get().sourceId === boardId) {
        // The open board's library entry is gone; keep the work but unlink it so
        // it reads as an unsaved draft again.
        const board = get().board;
        await flushDraft(board, null, true);
        set({ sourceId: null, dirty: true });
      }
    },
  };
});
