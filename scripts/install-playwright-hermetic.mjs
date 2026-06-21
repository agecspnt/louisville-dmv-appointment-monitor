import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  PLAYWRIGHT_BROWSERS_PATH: "0"
};

const command =
  process.platform === "win32"
    ? { cmd: "cmd.exe", args: ["/d", "/s", "/c", "npx playwright install chromium"] }
    : { cmd: "npx", args: ["playwright", "install", "chromium"] };

const result = spawnSync(command.cmd, command.args, {
  stdio: "inherit",
  shell: false,
  env
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}
