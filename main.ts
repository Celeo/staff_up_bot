import { Bot, createBot, log, parseArgs, startBot } from "./deps.ts";
import { Config, loadConfig } from "./util.ts";

/**
 * CLI flags.
 */
interface CliFlags {
  debug: boolean;
}

/**
 * Main function.
 *
 * Called from CLI entrypoint.
 */
async function main(config: Config): Promise<void> {
  const bot = createBot({
    token: config.token,
    intents: 0,
    events: {
      ready() {
        log.info("Bot connected to Discord gateway");
      },
    },
  });

  log.debug("Starting bot");
  startBot(bot);

  log.debug("Starting run loop");
  await runLoop(bot);
}

/**
 * Bot runtime loop.
 *
 * Watches the VATSIM API for airports in the configuration
 * file that are over the appointed traffic but unstaffed.
 */
async function runLoop(bot: Bot): Promise<void> {
  // TODO
}

/**
 * CLI entrypoint.
 */
if (import.meta.main) {
  const args = parseArgs(Deno.args);
  if (args.h == true || args.help === true) {
    console.log(`staff_up_bot
USAGE:
  server [FLAGS]
FLAGS:
    -h, --help      Show this help
    -d, --debug     Enable debug logging`);
  } else {
    const flags: CliFlags = { debug: args.d || args.debug || false };
    await log.setup({
      handlers: {
        console: new log.handlers.ConsoleHandler(
          flags.debug ? "DEBUG" : "INFO",
          { formatter: "[{levelName}] {msg}" },
        ),
      },
      loggers: {
        default: {
          level: flags.debug ? "DEBUG" : "INFO",
          handlers: ["console"],
        },
      },
    });
    const config = await loadConfig();
    log.debug("Loaded configuration file");
    await main(config);
  }
}
