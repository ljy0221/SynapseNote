import "dotenv/config";

export interface EnvConfig {
  HOST: string;
  PORT: number;

  SPRING_BASE_URL: string;
  MONGO_URI: string;
  MONGO_SYNC_DEBOUNCE_MS: number;
}

export function loadEnv(): EnvConfig {
  return {
    HOST: process.env.WS_HOST ?? "0.0.0.0",
    PORT: Number(process.env.WS_PORT ?? 1234),

    SPRING_BASE_URL: process.env.SPRING_BASE_URL ?? "http://localhost:8080",
    MONGO_URI: process.env.MONGO_URI ?? "",
    MONGO_SYNC_DEBOUNCE_MS: Number(process.env.MONGO_SYNC_DEBOUNCE_MS ?? 100000),
  };
}