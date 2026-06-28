// localStorage-backed BoardRepository. Each board is stored under
// "mathsboard:<id>". This is the only place that knows the storage format;
// swap it for a backend client later without touching the store.

import type { BoardRepository } from "@/board/persistence/BoardRepository";
import type {
  BoardDocument,
  BoardSummary,
  DraftEnvelope,
} from "@/board/types";
import { newBoardDocument } from "@/board/types";

const PREFIX = "mathsboard:";
const keyFor = (boardId: string): string => PREFIX + boardId;

// The working draft lives at a single reserved key. It is NOT a library entry,
// so list() must skip it (its id never collides because library ids are UUIDs).
const DRAFT_KEY = "mathsboard:draft";

export class LocalBoardRepository implements BoardRepository {
  async list(): Promise<BoardSummary[]> {
    const out: BoardSummary[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(PREFIX) || k === DRAFT_KEY) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const doc = JSON.parse(raw) as BoardDocument;
        out.push({ id: doc.id, name: doc.name, updatedAt: doc.updatedAt });
      } catch {
        // Ignore corrupt entries.
      }
    }
    out.sort((a, b) => b.updatedAt - a.updatedAt);
    return out;
  }

  async load(boardId: string): Promise<BoardDocument | null> {
    const raw = localStorage.getItem(keyFor(boardId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as BoardDocument;
    } catch {
      return null;
    }
  }

  async save(doc: BoardDocument): Promise<void> {
    localStorage.setItem(keyFor(doc.id), JSON.stringify(doc));
  }

  async create(name?: string): Promise<BoardDocument> {
    const doc = newBoardDocument(name);
    await this.save(doc);
    return doc;
  }

  async rename(boardId: string, name: string): Promise<void> {
    const doc = await this.load(boardId);
    if (!doc) return;
    await this.save({ ...doc, name, updatedAt: Date.now() });
  }

  async remove(boardId: string): Promise<void> {
    localStorage.removeItem(keyFor(boardId));
  }

  // --- working draft ---
  async loadDraft(): Promise<DraftEnvelope | null> {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DraftEnvelope;
    } catch {
      return null;
    }
  }

  async saveDraft(draft: DraftEnvelope): Promise<void> {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  async clearDraft(): Promise<void> {
    localStorage.removeItem(DRAFT_KEY);
  }
}

/** Shared singleton used by the store. */
export const localRepository: BoardRepository = new LocalBoardRepository();
