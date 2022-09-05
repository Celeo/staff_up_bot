# staff_up_bot

Discord bot to alert when VATSIM airports have traffic but no controllers

[![CI](https://github.com/Celeo/staff_up_bot/workflows/CI/badge.svg?branch=master)](https://github.com/Celeo/staff_up_bot/actions?query=workflow%3ACI)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Runtime](https://img.shields.io/badge/runtime-Deno-orange)](https://deno.land/)

A Discord bot.

## Installing

1. Install [Deno](https://deno.land)
1. Install [just](https://github.com/casey/just)
1. Clone the repo

## Using

1. Copy the `config.example.json` file to `config.json` and populate
1. Run with `just run`

## Configuration

### Fields

- The "token" field is your [Discord bot token](https://discord.com/developers/applications)
- The "channel" field is the Discord channel to which you want alerts to be sent
- The "alerts" field is an array of alerts that you want the bot to look for. Fields:
  - "airport" - the ICAO identifier, i.e. "KSAN"
  - "trafficMinimum" - the minimum number of pilots nearby to trigger an alert for
  - "coveringPositions" - a list of regex strings to check that may be staffing the airport

### Example config

```json
{
  "token": "abc123",
  "channel": "456789",
  "alerts": [
    {
      "airport": "KSAN",
      "trafficMinimum": 10,
      "coveringPositions": ["SAN_.*TWR", "SAN_.*APP", "SCT_.*APP", "LAX_.*CTR"]
    },
    {
      "airport": "KLAX",
      "trafficMinimum": 10,
      "coveringPositions": [
        "LAX_.*TWR",
        "LAX_.*APP",
        "LAX_.*DEP",
        "SCT_.*APP",
        "LAX_.*CTR"
      ]
    },
    {
      "airport": "KLAS",
      "trafficMinimum": 10,
      "coveringPositions": ["LAS_.*TWR", "LAS_.*APP", "LAX_.*CTR"]
    }
  ]
}

```

## License

- Bot under MIT ([LICENSE](LICENSE)).
- Libraries in use under their respective licenses.

## Contributing

Please feel free to contribute. Please open an issue first (or comment on an existing one) so that I know that you want to add/change something.

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you shall be licensed as above, without any additional terms or conditions.
