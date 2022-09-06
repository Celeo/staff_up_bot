export { parse as parseArgs } from "https://deno.land/std@0.153.0/flags/mod.ts";
export * as log from "https://deno.land/std@0.153.0/log/mod.ts";
export {
  getAirportsMap,
  getInstance as getVatsimInstance,
  getV3Data,
  haversineDistance,
} from "https://deno.land/x/vatsim_wrapper@v0.2.0/mod.ts";
export type {
  Pilot,
  V3ResponseData,
} from "https://deno.land/x/vatsim_wrapper@v0.2.0/mod.ts";
export { createBot } from "https://deno.land/x/discordeno@13.0.0/mod.ts";

import {
  sendMessage,
  startBot,
} from "https://deno.land/x/discordeno@13.0.0/mod.ts";
import type {
  Bot,
  CreateMessage,
} from "https://deno.land/x/discordeno@13.0.0/mod.ts";

/**
 * Wrapper for Discordeno's `Bot` object.
 *
 * In a class rather than separately-imported functions
 * to facilitate testing and organization.
 */
export class BotWrapper {
  readonly bot: Bot;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  async startBot() {
    return await startBot(this.bot);
  }

  async sendMessage(channelId: bigint, content: CreateMessage) {
    return await sendMessage(this.bot, channelId, content);
  }
}
