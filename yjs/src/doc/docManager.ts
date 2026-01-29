import * as Y from "yjs";
import BridgeService from "../persist/BridgeService.js";

/**
 * Yjs 문서 엔트리 타입
 */
export interface DocEntry {
  ydoc: Y.Doc;
  dirty: boolean;
  pendingUpdates: Uint8Array[];
  updatedAt: number;
}

const docs = new Map<string, DocEntry>();

export function registerDoc(noteId: string, ydoc: Y.Doc): DocEntry {
  let entry = docs.get(noteId);
  if (entry) return entry;

  entry = {
    ydoc,
    dirty: false,
    pendingUpdates: [],
    updatedAt: Date.now(),
  };

  ydoc.on("update", (update: Uint8Array) => {
    // console.log("[DOC] update fired", noteId, update.length);

    BridgeService.handleUpdate(noteId, ydoc);

    entry!.pendingUpdates.push(update);
    entry!.dirty = true;
    entry!.updatedAt = Date.now();
  });

  docs.set(noteId, entry);
  return entry;
}

export function getOrCreateDoc(noteId: string): DocEntry {
  const existing = docs.get(noteId);
  if (existing) return existing;

  const ydoc = new Y.Doc();
  return registerDoc(noteId, ydoc);
}

export function listDirtyDocs(): Array<[string, DocEntry]> {
  const out: Array<[string, DocEntry]> = [];

  for (const [noteId, entry] of docs.entries()) {
    if (entry.dirty) {
      out.push([noteId, entry]);
    }
  }

  return out;
}

export function clearDirty(noteId: string): void {
  const entry = docs.get(noteId);
  if (!entry) return;

  entry.dirty = false;
  entry.pendingUpdates = [];
}

export function getAllDocs(): Map<string, DocEntry> {
  return docs;
}