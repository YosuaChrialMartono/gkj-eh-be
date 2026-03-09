import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

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
}

let config: Config;

export function loadConfig(): Config {
  if (config) {
    return config;
  }

  const configPath = join(process.cwd(), 'config.yaml');
  const fileContents = readFileSync(configPath, 'utf8');
  config = yaml.load(fileContents) as Config;
  return config;
}

export function getConfig(): Config {
  if (!config) {
    return loadConfig();
  }
  return config;
}
