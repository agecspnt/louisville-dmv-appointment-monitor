import { spawnSync } from "node:child_process";
import process from "node:process";

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function resolveTool(command, args) {
  if (process.platform !== "win32") {
    return { cmd: command, args };
  }

  const joined = [command, ...args].join(" ");
  return {
    cmd: "cmd.exe",
    args: ["/d", "/s", "/c", joined]
  };
}

const target = process.env.BUILD_TARGET || "all";
const npmInstallBrowsers = resolveTool("npm", ["run", "install:browsers"]);
const npmTest = resolveTool("npm", ["test"]);
const electronBuilder = resolveTool("npx", ["electron-builder", "--publish", "never", "--win", "nsis", "portable"]);

run(npmInstallBrowsers.cmd, npmInstallBrowsers.args);
run(npmTest.cmd, npmTest.args);

if (target === "win" || target === "all") {
  run(electronBuilder.cmd, electronBuilder.args);
} else {
  console.log(`Unsupported BUILD_TARGET: ${target}. Allowed: win | all`);
  process.exit(1);
}
