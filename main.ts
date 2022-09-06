import { main } from "./src/bot.ts";

/**
 * CLI entrypoint.
 */
if (import.meta.main) {
  await main();
}
