import { loadEnv } from "./config/env.js";
import { createWSServer } from "./ws/server.js";
import mongoose from "mongoose";

const env = loadEnv();

// MongoDB 연결
mongoose
  .connect(env.MONGO_URI, {
    dbName: "yjs", // 필요시 DB명 명시
  })
  .then(() => {
    console.log("[DB] Connected to MongoDB");
  })
  .catch((err) => {
    console.error("[DB] Connection error:", err);
  });

createWSServer({
  host: env.HOST,
  port: env.PORT,
});

console.log("[BOOT] all started");