const CONFIG_FILE_NAME = "config.json";

/**
 * Configuration file data.
 */
export interface Config {
  token: string;
}

/**
 * Load the configuration file from disk.
 */
export async function loadConfig(): Promise<Config> {
  try {
    const info = await Deno.stat(CONFIG_FILE_NAME);
    if (!info.isFile) {
      throw new Error(`Missing "${CONFIG_FILE_NAME}" file`);
    }
  } catch {
    throw new Error(`Missing "${CONFIG_FILE_NAME}" file`);
  }
  const raw = await Deno.readFile(CONFIG_FILE_NAME);
  const text = new TextDecoder().decode(raw);
  return JSON.parse(text) as Config;
}
