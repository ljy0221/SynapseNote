import http, { IncomingMessage, Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import * as Y from "yjs";
// @ts-ignore
import { setupWSConnection, setPersistence } from "y-websocket/bin/utils";
import { registerDoc } from "../doc/docManager";

import { loadEnv } from "../config/env";

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

// Spring Boot Authentication Logic
async function authenticate(req: IncomingMessage): Promise<boolean> {
  const env = loadEnv();
  const url = req.url || "";

  // 1. Extract Token from query param (Standard for WebSockets in browsers)
  let token: string | null = null;
  if (url.includes("?")) {
    const params = new URLSearchParams(url.split("?")[1]);
    token = params.get("token");
  }

  if (!token) {
    console.log("[AUTH] No token provided in query params");
    return false;
  }

  // Ensure Bearer prefix for logic consistency
  const bearerToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

  // 2. Extract Document ID (noteId) from URL path
  const noteId = url.split("?")[0].replace(/^\//, ""); // Remove leading slash

  if (!noteId) {
    console.log("[AUTH] No noteId found in URL");
    return false;
  }

  try {
    // 3. Call Spring API to validate (Issue Ticket = Verify Access)
    const response = await fetch(`${env.SPRING_BASE_URL}/api/v1/ws/auth`, {
      method: "POST",
      headers: {
        "Authorization": bearerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ noteId }),
    });

    if (response.ok) {
      const json = (await response.json()) as { data: { ticket: string } };

      if (json.data && json.data.ticket) {
        return true;
      } else {
        console.error(`[AUTH] Invalid response structure from Spring:`, json);
        return false;
      }
    } else {
      console.log(`[AUTH] Failed: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (err) {
    console.error(`[AUTH] Error connecting to Spring:`, err);
    return false;
  }
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

  wss.on("connection", async (conn: WebSocket, req: IncomingMessage) => {
    const url = req.url || "unknown";
    console.log("[WS] Connection request:", url);

    const isAuthenticated = await authenticate(req);

    if (!isAuthenticated) {
      conn.close(1008, "Authentication Failed");
      return;
    }

    const noteId = url.split("?")[0].replace(/^\//, "");
    setupWSConnection(conn, req, { docName: noteId, gc: true });
  });

  server.listen(port, host, () => {
    console.log(`[WS] listening on ws://${host}:${port}`);
  });

  return { server, wss };
}