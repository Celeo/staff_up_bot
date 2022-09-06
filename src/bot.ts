import {
  BotWrapper,
  createBot,
  getV3Data,
  getVatsimInstance,
  log,
  parseArgs,
  V3ResponseData,
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
export async function main(): Promise<void> {
  const config = await startup();
  const bot = new BotWrapper(createBot({
    token: config.token,
    intents: 0,
    events: {
      ready() {
        log.info("Bot connected to Discord gateway");
      },
    },
  }));

  log.debug("Starting bot");
  bot.startBot();

  log.debug("Waiting 10 seconds to start run loop");
  await wait(10 * 1000); // 10 seconds
  log.debug("Starting run loop");
  await runLoop(bot, config);
}

/**
 * Startup functionality, including CLI arg parsing
 * and loading & validating of the configuration.
 */
async function startup(): Promise<Config> {
  const args = parseArgs(Deno.args);
  if (args.h == true || args.help === true) {
    console.log(`staff_up_bot

USAGE:
  staff_up_bot [FLAGS]

FLAGS:
  -h, --help      Show this help
  -d, --debug     Enable debug logging`);
    Deno.exit(0);
  }
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
  return config;
}

/**
 * A single iteration of the run loop, checking for needed
 * airport alerts to be sent to Discord, following the
 * specified alert configurations and the current VATSIM pilots.
 */
async function checkForStaffingAlerts(
  bot: BotWrapper,
  vatsimData: V3ResponseData,
  config: Config,
  alertCooldown: Record<string, number>,
): Promise<void> {
  log.debug("Checking pilots");
  for (const alert of config.alerts) {
    // alert cooldown check
    if (Object.keys(alertCooldown).includes(alert.airport)) {
      if (new Date().getTime() < alertCooldown[alert.airport]) {
        log.debug(`Airport ${alert.airport} is in alert cooldown`);
        continue;
      }
      delete alertCooldown[alert.airport];
    }

    // get the pilot count and compare against threshold
    const count = getPilotCountAround(
      vatsimData.pilots,
      alert.airport,
      MAX_DISTANCE,
    );
    if (count < alert.trafficThreshold) {
      log.debug(
        `${count} pilot(s) within ${MAX_DISTANCE} of ${alert.airport} - below alert threshold`,
      );
      continue;
    }
    log.debug(`${count} pilot(s) within ${MAX_DISTANCE} of ${alert.airport}`);

    // check if the airport is being covered
    let isCovered = false;
    for (const covering of alert.coveringPositions) {
      const matching = vatsimData.controllers.find((controller) =>
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
    await bot.sendMessage(BigInt(config.channel), {
      content:
        `Airport ${alert.airport} has ${count} pilot(s) nearby, above the threshold of ${alert.trafficThreshold}.`,
    });
    alertCooldown[alert.airport] = new Date().getTime() + ALERT_COOLDOWN;
  }
}

/**
 * Bot runtime loop.
 *
 * Watches the VATSIM API for airports in the configuration
 * file that are over the appointed traffic but unstaffed.
 */
async function runLoop(bot: BotWrapper, config: Config): Promise<void> {
  const alertCooldown: Record<string, number> = {};
  const vatsim = await getVatsimInstance();

  while (true) {
    const v3Data = await getV3Data(vatsim);
    await checkForStaffingAlerts(bot, v3Data, config, alertCooldown);
    await wait(RUN_LOOP_INTERVAL);
  }
}
