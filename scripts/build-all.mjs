import { spawnSync } from "node:child_process";
import process from "node:process";

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const target = process.env.BUILD_TARGET || "all";

run("npm", ["test"]);

if (target === "win" || target === "all") {
  run("npx", ["electron-builder", "--publish", "never", "--win", "nsis", "portable"]);
} else {
  console.log(`Unsupported BUILD_TARGET: ${target}. Allowed: win | all`);
  process.exit(1);
}
