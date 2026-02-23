# DMV Appointment Monitor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Desktop app built with Electron + Playwright to monitor Kentucky DMV appointment availability for selected appointment types.

## Features

- One-click manual check (`Check Once`).
- Continuous monitoring mode with randomized intervals to reduce fixed polling patterns.
- Appointment types:
  - `permit` (wizard ID `56`)
  - `road_test` (wizard ID `55`)
- Desktop notifications and optional Bark push notifications.
- Fast shortcut to open the DMV page and auto-fill location search.

## Tech Stack

- Electron (desktop app shell)
- Playwright (browser automation and page parsing)
- GitHub Actions (CI and cross-platform build automation)

## Project Structure

- `electron/main.js`: app lifecycle, scheduling, IPC handlers, notifications
- `electron/preload.js`: secure bridge API exposed to renderer
- `src/renderer/*`: desktop UI
- `src/services/monitor.js`: monitoring and parsing logic
- `scripts/build-all.mjs`: cross-platform build helper
- `.github/workflows/*.yml`: CI and release build pipelines

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
npx playwright install chromium
```

### Run Locally

```bash
npm run start
```

### Test

```bash
npm run test
```

## Build

Windows:

```bash
npm run build:win
```

macOS:

```bash
npm run build:mac
```

Build with platform-aware helper:

```bash
npm run build:all
```

Notes:

- On Windows, `build:all` builds Windows artifacts and reminds that macOS artifacts must be built on macOS.
- True parallel multi-OS packaging is handled by GitHub Actions matrix builds.

## CI/CD

- `ci.yml`: runs tests on push and pull requests.
- `build-desktop.yml`: builds Windows and macOS artifacts in parallel, uploads build outputs.

## Security and Responsible Use

- This project is for informational monitoring and convenience.
- Users are responsible for complying with DMV website terms and local regulations.
- Do not abuse remote services with aggressive request rates.

Please report vulnerabilities through [SECURITY.md](./SECURITY.md), not via public issues.

## Contributing

Contributions are welcome. Start with [CONTRIBUTING.md](./CONTRIBUTING.md).

## Code of Conduct

Community participation is governed by [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

MIT License. See [LICENSE](./LICENSE).
