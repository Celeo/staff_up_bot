import { getAirportsMap, haversineDistance, Pilot } from "./deps.ts";

/**
 * Config file name on disk.
 */
const CONFIG_FILE_NAME = "config.json";

/**
 * Config file alert entry.
 *
 * A config file will have `N` of these, which
 * constitute the main functionality of the bot.
 */
export interface ConfigAlert {
  airport: string;
  trafficThreshold: number;
  coveringPositions: Array<string>;
}

/**
 * Configuration file data.
 */
export interface Config {
  token: string;
  channel: string;
  alerts: Array<ConfigAlert>;
}

/**
 * Load the configuration file from disk.
 */
export async function loadConfig(): Promise<Config> {
  let info;
  try {
    info = await Deno.stat(CONFIG_FILE_NAME);
  } catch {
    throw new Error(`Missing "${CONFIG_FILE_NAME}" file`);
  }
  if (!info.isFile) {
    throw new Error(`${CONFIG_FILE_NAME} is not a file`);
  }
  const raw = await Deno.readFile(CONFIG_FILE_NAME);
  const text = new TextDecoder().decode(raw);
  return JSON.parse(text) as Config;
}

/**
 * Await some time.
 */
export function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
}

/**
 * Count the number of pilots within the distance of the airport.
 */
export function getPilotCountAround(
  pilots: Array<Pilot>,
  airport: string,
  distance: number,
): number {
  const location = getAirportsMap()[airport];
  if (location === undefined) {
    throw new Error(`Unknown airport ${airport}`);
  }
  return pilots.filter(
    (pilot) =>
      haversineDistance(
        pilot.latitude,
        pilot.longitude,
        location[0],
        location[1],
      ) <= distance,
  ).length;
}
