import { WebSocket } from 'ws';

export interface UserContext {
  memberId: string;
  memberName: string;
  noteId: string;
  connectedAt: Date;
}

class ConnectionManager {
  private contexts = new Map<WebSocket, UserContext>();

  setContext(ws: WebSocket, context: UserContext): void {
    this.contexts.set(ws, context);
    console.log(`[ConnMgr] User ${context.memberName} (${context.memberId}) connected to note ${context.noteId}`);
  }

  getContext(ws: WebSocket): UserContext | undefined {
    return this.contexts.get(ws);
  }

  getContextByNoteId(noteId: string): UserContext | undefined {
    // 백그라운드 동기화를 위해 해당 노트의 활성 사용자 반환
    for (const [ws, ctx] of this.contexts.entries()) {
      if (ctx.noteId === noteId && ws.readyState === WebSocket.OPEN) {
        return ctx;
      }
    }
    return undefined;
  }

  removeContext(ws: WebSocket): void {
    const context = this.contexts.get(ws);
    if (context) {
      console.log(`[ConnMgr] User ${context.memberName} (${context.memberId}) disconnected from note ${context.noteId}`);
    }
    this.contexts.delete(ws);
  }

  getAllContexts(): UserContext[] {
    return Array.from(this.contexts.values());
  }

  getActiveConnectionCount(): number {
    return this.contexts.size;
  }
}

export default new ConnectionManager();
