import { loadEnv } from "./config/env.js";
import { createWSServer } from "./ws/server.js";
import mongoose from "mongoose";

const env = loadEnv();

// MongoDB 연결
mongoose
  .connect(env.MONGO_URI)
  .then(() => {
    const maskedUri = env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    console.log('[DB] Connected to MongoDB');
    console.log('[DB] Connection URI:', maskedUri);
    console.log('[DB] Database name:', mongoose.connection.db?.databaseName || 'unknown');
  })
  .catch((err) => {
    console.error('[DB] Connection error:', err);
    process.exit(1);
  });

createWSServer({
  host: env.HOST,
  port: env.PORT,
});

console.log("[BOOT] all started");