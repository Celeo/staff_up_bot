import {
  Bot,
  createBot,
  getV3Data,
  getVatsimInstance,
  log,
  parseArgs,
  sendMessage,
  startBot,
} from "./deps.ts";
import { Config, getPilotCountAround, loadConfig, wait } from "./util.ts";

/**
 * Max distance from an airport centerpoint to count.
 */
const MAX_DISTANCE = 5.0;

/**
 * Cooldown for sending alerts for a specific airport.
 *
 * 30 minutes.
 */
const ALERT_COOLDOWN = 2 * 60 * 1000;

/**
 * Time awaited between checks of airport populations.
 *
 * 15 minutes.
 */
const RUN_LOOP_INTERVAL = 1 * 60 * 1000;

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

  log.debug("Waiting 10 seconds to start run loop");
  await wait(10 * 1000); // 10 seconds
  log.debug("Starting run loop");
  await runLoop(bot, config);
}

/**
 * Bot runtime loop.
 *
 * Watches the VATSIM API for airports in the configuration
 * file that are over the appointed traffic but unstaffed.
 */
async function runLoop(bot: Bot, config: Config): Promise<void> {
  const alertCooldown: Record<string, number> = {};
  const vatsim = await getVatsimInstance();

  while (true) {
    log.debug("Checking pilots");
    const data = await getV3Data(vatsim);

    for (const alert of config.alerts) {
      // alert cooldown check
      if (Object.keys(alertCooldown).includes(alert.airport)) {
        if (
          new Date().getTime() < (alertCooldown[alert.airport] + ALERT_COOLDOWN)
        ) {
          log.debug(`Airport ${alert.airport} is in alert cooldown`);
          continue;
        }
        delete alertCooldown[alert.airport];
      }

      // get the pilot count and compare against threshold
      const count = getPilotCountAround(
        data.pilots,
        alert.airport,
        MAX_DISTANCE,
      );
      if (count < alert.trafficMinimum) {
        log.debug(
          `${count} pilot(s) within ${MAX_DISTANCE} of ${alert.airport} - below alert level`,
        );
        continue;
      }
      log.debug(`${count} pilot(s) within ${MAX_DISTANCE} of ${alert.airport}`);

      // check if the airport is being covered
      let isCovered = false;
      for (const covering of alert.coveringPositions) {
        const matching = data.controllers.find((controller) =>
          controller.callsign.match(new RegExp(covering))
        );
        if (matching === undefined) {
          continue;
        }
        isCovered = true;
        log.debug(`${alert.airport} is covered by ${matching.callsign}`);
        break;
      }
      if (isCovered) {
        continue;
      }

      // send the alert and update the cooldown data
      log.debug(`Sending alert for ${alert.airport}`);
      sendMessage(bot, BigInt(config.channel), {
        content:
          `Airport ${alert.airport} has ${count} pilot(s) nearby, above the threshold of ${alert.trafficMinimum}.`,
      });
      alertCooldown[alert.airport] = new Date().getTime();
    }

    // wait before triggering the next loop
    await wait(RUN_LOOP_INTERVAL);
  }
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
    if (
      !config.token || !config.channel || !config.alerts ||
      config.alerts.length === 0
    ) {
      log.error("Invalid configuration file");
      Deno.exit(1);
    }
    await main(config);
  }
}
