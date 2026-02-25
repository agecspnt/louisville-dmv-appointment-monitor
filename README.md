# DMV Appointment Monitor

[![CI](https://img.shields.io/github/actions/workflow/status/agecspnt/louisville-dmv-appointment-monitor/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/agecspnt/louisville-dmv-appointment-monitor/actions/workflows/ci.yml)
[![Build Desktop App](https://img.shields.io/github/actions/workflow/status/agecspnt/louisville-dmv-appointment-monitor/build-desktop.yml?branch=main&label=Build&style=flat-square)](https://github.com/agecspnt/louisville-dmv-appointment-monitor/actions/workflows/build-desktop.yml)
[![Release Installers](https://img.shields.io/github/actions/workflow/status/agecspnt/louisville-dmv-appointment-monitor/release.yml?label=Release&style=flat-square)](https://github.com/agecspnt/louisville-dmv-appointment-monitor/actions/workflows/release.yml)
[![GitHub release](https://img.shields.io/github/v/release/agecspnt/louisville-dmv-appointment-monitor?style=flat-square)](https://github.com/agecspnt/louisville-dmv-appointment-monitor/releases)
[![GitHub stars](https://img.shields.io/github/stars/agecspnt/louisville-dmv-appointment-monitor?style=flat-square)](https://github.com/agecspnt/louisville-dmv-appointment-monitor/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/agecspnt/louisville-dmv-appointment-monitor?style=flat-square)](https://github.com/agecspnt/louisville-dmv-appointment-monitor/forks)
[![GitHub issues](https://img.shields.io/github/issues/agecspnt/louisville-dmv-appointment-monitor?style=flat-square)](https://github.com/agecspnt/louisville-dmv-appointment-monitor/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/agecspnt/louisville-dmv-appointment-monitor?style=flat-square)](https://github.com/agecspnt/louisville-dmv-appointment-monitor/commits/main)
[![GitHub repo size](https://img.shields.io/github/repo-size/agecspnt/louisville-dmv-appointment-monitor?style=flat-square)](https://github.com/agecspnt/louisville-dmv-appointment-monitor)
[![Top language](https://img.shields.io/github/languages/top/agecspnt/louisville-dmv-appointment-monitor?style=flat-square)](https://github.com/agecspnt/louisville-dmv-appointment-monitor)
[![GitHub license](https://img.shields.io/github/license/agecspnt/louisville-dmv-appointment-monitor?style=flat-square)](./LICENSE)

English (default) | [简体中文](./README.zh-CN.md)

Desktop app built with Electron + Playwright to monitor Kentucky DMV appointment availability.

## App Preview

<p align="center">
  <img src="./docs/images/app-screenshot.png" alt="DMV Appointment Monitor screenshot" width="1100" />
</p>

<p align="center">
  <strong>Live Location Picker</strong> · <strong>Real Earliest Lookup</strong> · <strong>Green Success Logs</strong> · <strong>Bark Push Details</strong>
</p>

> The UI is designed for fast decision-making: select appointment type, choose a live location list, and monitor with earliest availability details visible in status/logs/notifications.

## Highlights

- Supports `Written Test (56)` and `Road Test (55)`.
- After choosing `Appointment Type`, the app fetches all live locations from DMV and lets you select one.
- Real availability check per selected location.
- Real click on `Check Earliest Availability` and extraction of earliest returned info (for example `February 26, 16 available`).
- When availability is found:
  - green success logs in UI
  - desktop notification
  - Bark push notification (with location, status, check time, earliest info)
- Build is test-gated: tests must pass before packaging.

## Requirements

- Node.js `>=20`
- npm

## Quick Start

```bash
npm install
npx playwright install chromium
npm start
```

## Scripts

- `npm test`
  Runs all tests, including live DMV web integration test.
- `npm run test:live`
  Runs only the live DMV integration test.
- `npm run build:win`
  Test-gated Windows build.
- `npm run build:all`
  Alias of Windows build flow (Windows only).

Windows helper:

- `build_auto.bat`
  Installs deps, installs Playwright Chromium, runs tests, then builds.

## Project Layout

- `electron/main.js`: scheduler, notifications, IPC handlers
- `electron/preload.js`: renderer bridge API
- `src/services/monitor.js`: scraping, parsing, location/availability logic
- `src/renderer/*`: UI
- `tests/*.test.js`: unit and live integration tests

## Notes

- This tool does not guarantee getting an appointment.
- Users are responsible for following DMV website terms and local regulations.

## Platform Support

This project is now Windows-only for build and release workflows.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=agecspnt/louisville-dmv-appointment-monitor&type=date&legend=top-left)](https://www.star-history.com/#agecspnt/louisville-dmv-appointment-monitor&type=date&legend=top-left)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

Report vulnerabilities via [SECURITY.md](./SECURITY.md).

## License

MIT. See [LICENSE](./LICENSE).
