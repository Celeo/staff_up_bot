import { assertEquals, sinon } from "./test_deps.ts";
import { checkForStaffingAlerts } from "../src/bot.ts";
import type { Controller } from "./test_deps.ts";
import type { BotWrapper, V3ResponseData } from "../src/deps.ts";
import type { Config } from "../src/util.ts";

const DEMO_DATA = {
  pilots: [
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
  ],
  controllers: [],
} as unknown as V3ResponseData;
const SAMPLE_CONFIG = {
  token: "abc123",
  channel: "1234567890",
  alerts: [
    {
      airport: "KLAX",
      trafficThreshold: 3,
      coveringPositions: [
        "COVERING",
      ],
    },
  ],
} as Config;

Deno.test("checkForStaffingAlerts - no alerts if insufficient pilots in range", async () => {
  const sendMessage = sinon.stub();
  const wrapper = { sendMessage };
  await checkForStaffingAlerts(
    wrapper as unknown as BotWrapper,
    DEMO_DATA,
    SAMPLE_CONFIG,
    {},
  );
  assertEquals(sendMessage.getCalls().length, 0);
});

Deno.test("checkForStaffingAlerts - no alerts if position covered", async () => {
  const sendMessage = sinon.stub();
  const wrapper = { sendMessage };
  const config = { ...SAMPLE_CONFIG };
  config.alerts[0].trafficThreshold = 1;
  const data = { ...DEMO_DATA };
  data.controllers = [
    {
      callsign: "COVERING",
    } as Controller,
  ];
  await checkForStaffingAlerts(
    wrapper as unknown as BotWrapper,
    data,
    SAMPLE_CONFIG,
    {},
  );
  assertEquals(sendMessage.getCalls().length, 0);
});

Deno.test("checkForStaffingAlerts - alerts when required", async () => {
  const sendMessage = sinon.stub();
  const wrapper = { sendMessage };
  const config = { ...SAMPLE_CONFIG };
  config.alerts[0].trafficThreshold = 1;
  await checkForStaffingAlerts(
    wrapper as unknown as BotWrapper,
    DEMO_DATA,
    config,
    {},
  );
  assertEquals(sendMessage.getCalls().length, 1);
});

Deno.test("checkForStaffingAlerts - no alerts if airport in cooldown", async () => {
  const sendMessage = sinon.stub();
  const wrapper = { sendMessage };
  const config = { ...SAMPLE_CONFIG };
  config.alerts[0].trafficThreshold = 1;
  await checkForStaffingAlerts(
    wrapper as unknown as BotWrapper,
    DEMO_DATA,
    config,
    { "KLAX": new Date().getTime() + 3_600 },
  );
  assertEquals(sendMessage.getCalls().length, 0);
});
