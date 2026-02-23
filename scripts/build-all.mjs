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

if (target === "win") {
  run("npx", ["electron-builder", "--win", "nsis", "portable"]);
} else if (target === "mac") {
  run("npx", ["electron-builder", "--mac", "dmg", "zip"]);
} else {
  if (process.platform === "darwin") {
    run("npx", ["electron-builder", "--mac", "dmg", "zip"]);
    run("npx", ["electron-builder", "--win", "nsis", "portable"]);
  } else if (process.platform === "win32") {
    run("npx", ["electron-builder", "--win", "nsis", "portable"]);
    console.log("Windows local build complete. macOS artifact must be built on macOS runner.");
  } else {
    console.log("Unsupported local platform for desktop packaging. Use CI workflow.");
    process.exit(1);
  }
}
