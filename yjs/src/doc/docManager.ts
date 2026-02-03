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

  // 이미 등록된 문서이고 ydoc 인스턴스도 같다면 그대로 반환
  if (entry && entry.ydoc === ydoc) {
    console.log(`[DOC] Doc ${noteId} is already registered with same instance.`);
    return entry;
  }

  // 인스턴스가 다르다면 (y-websocket에서 다시 생성된 경우) 교체
  if (entry && entry.ydoc !== ydoc) {
    console.log(`[DOC] ydoc instance mismatch for ${noteId}. Re-registering listener on new instance.`);
  }

  entry = {
    ydoc,
    dirty: false,
    pendingUpdates: [],
    updatedAt: Date.now(),
  };

  console.log(`[DOC] Registering update listener for ${noteId}`);

  // DB에서 데이터 불러와서 Yjs 문서 초기화
  BridgeService.initDocFromDB(noteId, ydoc).then(() => {
    console.log(`[DOC] Bridge initialization completed for ${noteId}`);
  });

  ydoc.on("update", (update: Uint8Array) => {
    console.log(`[DOC] update fired for ${noteId}, size: ${update.length}`);

    // blocks 배열이 있는지 확인
    const yArray = ydoc.getArray("blocks");
    console.log(`[DOC] Current blocks in Yjs: ${yArray.length}`);

    // 실시간 블록 동기화
    BridgeService.handleUpdate(noteId, ydoc);

    entry!.pendingUpdates.push(update);
    entry!.dirty = true;
    entry!.updatedAt = Date.now();
  });

  docs.set(noteId, entry);
  console.log(`[DOC] Doc ${noteId} registered successfully`);
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