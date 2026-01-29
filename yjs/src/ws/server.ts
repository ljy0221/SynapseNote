import http, { IncomingMessage, Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import * as Y from "yjs";
// @ts-ignore
import { setupWSConnection, setPersistence } from "y-websocket/bin/utils";
import { registerDoc } from "../doc/docManager.js";


function configurePersistence() {
  setPersistence({
    bindState: async (docName: string, ydoc: Y.Doc) => {
      try {
        console.log(`[PERSIST] bindState called for ${docName}`);
        registerDoc(docName, ydoc);
      } catch (err) {
        console.error(`[PERSIST] Failed to register doc ${docName}:`, err);
      }
    },
    writeState: async (_docName: string, _ydoc: Y.Doc) => {
      return Promise.resolve();
    },
  });
}

export function createWSServer({
  host,
  port,
}: {
  host: string;
  port: number;
}): {
  server: HttpServer;
  wss: WebSocketServer;
} {
  // Initialize persistence hooks
  configurePersistence();

  const server = http.createServer();
  const wss = new WebSocketServer({ server });

  wss.on("connection", (conn: WebSocket, req: IncomingMessage) => {
    const url = req.url || "unknown";
    console.log("[WS] connected:", url);

    setupWSConnection(conn, req, { gc: true });
  });

  server.listen(port, host, () => {
    console.log(`[WS] listening on ws://${host}:${port}`);
  });

  return { server, wss };
}