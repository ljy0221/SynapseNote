import "dotenv/config";

export interface EnvConfig {
  HOST: string;
  PORT: number;

  MONGO_URI: string;
  MONGO_SYNC_DEBOUNCE_MS: number;
}

export function loadEnv(): EnvConfig {
  return {
    HOST: process.env.HOST ?? "0.0.0.0",
    PORT: Number(process.env.PORT ?? 1234),

    MONGO_URI: process.env.MONGO_URI ?? "",
    MONGO_SYNC_DEBOUNCE_MS: Number(process.env.MONGO_SYNC_DEBOUNCE_MS ?? 100000),
  };
}