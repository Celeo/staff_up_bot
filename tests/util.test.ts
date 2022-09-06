import { assertEquals } from "./test_deps.ts";
import { getPilotCountAround, loadConfig, wait } from "../src/util.ts";
import type { Pilot } from "../src/deps.ts";

const TEST_CONFIG_FILE_NAME = "config.test.json";
const SAMPLE_CONFIG = {
  token: "abc123",
  channel: "1234567890",
  alerts: [
    {
      airport: "KSAN",
      trafficThreshold: 10,
      coveringPositions: [
        "SAN_.*TWR",
        "SAN_.*APP",
        "SCT_.*APP",
        "LAX_.*CTR",
      ],
    },
  ],
};

Deno.test("loadConfig - loads from disk", async () => {
  try {
    await Deno.writeFile(
      TEST_CONFIG_FILE_NAME,
      new TextEncoder().encode(JSON.stringify(SAMPLE_CONFIG)),
    );
    const config = await loadConfig(TEST_CONFIG_FILE_NAME);
    assertEquals(config.token, "abc123");
    assertEquals(config.channel, "1234567890");
    assertEquals(config.alerts.length, 1);
  } finally {
    try {
      await Deno.stat(TEST_CONFIG_FILE_NAME);
      await Deno.remove(TEST_CONFIG_FILE_NAME);
    } catch {
      // no-op
    }
  }
});

Deno.test("wait - does not throw an error", async () => {
  await wait(0);
});

Deno.test("getPilotCountAround - successfully filters", () => {
  const pilots = [
    {
      latitude: 33.93876,
      longitude: -118.40832,
    },
    {
      latitude: 33.93965,
      longitude: -118.39157,
    },
    {
      latitude: 34.15588,
      longitude: -118.47695,
    },
  ] as Array<Pilot>;
  assertEquals(getPilotCountAround(pilots, "KLAX", 5.0), 2);
});
