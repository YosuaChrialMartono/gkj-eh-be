import { readFileSync } from "fs";
import { join } from "path";
import * as yaml from "js-yaml";

interface Config {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
  };
  jwt: {
    secret: string;
    accessTtl: string;
    refreshTtl: string;
  };
  server: {
    port: string;
    allowedOrigins: string[];
  };
  google?: {
    clientId?: string;
  };
}

const PLACEHOLDER_SECRET = "your-super-secret-jwt-key-change-in-production";

let config: Config;

/**
 * Configuration is layered: env vars override `config.yaml`, which overrides
 * built-in defaults. `config.yaml` is gitignored (it holds secrets locally);
 * production should supply secrets via env vars (JWT_SECRET, DB_PASSWORD, …).
 */
export function loadConfig(): Config {
  if (config) {
    return config;
  }

  let fileConfig: Partial<Config> = {};
  try {
    const configPath = join(process.cwd(), "config.yaml");
    fileConfig = (yaml.load(readFileSync(configPath, "utf8")) as Config) ?? {};
  } catch {
    // config.yaml is optional when configuration is provided entirely via env.
  }

  config = applyEnvOverrides(fileConfig);

  if (!config.jwt.secret || config.jwt.secret === PLACEHOLDER_SECRET) {
    console.warn(
      "[config] WARNING: jwt.secret is missing or the placeholder value. " +
        "Set JWT_SECRET (env) to a strong random secret before deploying.",
    );
  }

  return config;
}

function applyEnvOverrides(file: Partial<Config>): Config {
  const env = process.env;
  return {
    database: {
      host: env.DB_HOST ?? file.database?.host ?? "localhost",
      port: env.DB_PORT
        ? parseInt(env.DB_PORT, 10)
        : (file.database?.port ?? 5432),
      username: env.DB_USERNAME ?? file.database?.username ?? "postgres",
      password: env.DB_PASSWORD ?? file.database?.password ?? "",
      name: env.DB_NAME ?? file.database?.name ?? "gkj_eh",
    },
    jwt: {
      secret: env.JWT_SECRET ?? file.jwt?.secret ?? "",
      accessTtl: env.JWT_ACCESS_TTL ?? file.jwt?.accessTtl ?? "15m",
      refreshTtl: env.JWT_REFRESH_TTL ?? file.jwt?.refreshTtl ?? "720h",
    },
    server: {
      port: env.PORT ?? file.server?.port ?? "8080",
      allowedOrigins: env.ALLOWED_ORIGINS
        ? env.ALLOWED_ORIGINS.split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : (file.server?.allowedOrigins ?? ["http://localhost:3000"]),
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? file.google?.clientId ?? "",
    },
  };
}

export function getConfig(): Config {
  if (!config) {
    return loadConfig();
  }
  return config;
}
