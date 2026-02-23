const path = require("path");
const { app, BrowserWindow, ipcMain, Notification } = require("electron");
const { AppointmentMonitorService, getJitterSpan, getNextInterval } = require("../src/services/monitor");

let mainWindow = null;
let running = false;
let monitorTimer = null;
let monitorService = null;
let monitorConfig = null;
let consecutiveAvailable = 0;
let consecutiveErrors = 0;
const maxConsecutiveErrors = 3;
const quickPageUrl = "https://telegov.egov.com/ksp/AppointmentWizard/55";

function now() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function emit(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function log(message, level = "info") {
  emit("log", { timestamp: now(), message, level });
}

function updateStatus(status, availability = null, meta = {}) {
  emit("status", {
    status,
    availability,
    lastCheck: now(),
    ...meta
  });
}

async function sendBarkNotification(barkKey, title, body, level = "timeSensitive") {
  if (!barkKey) {
    return { ok: false, error: "Bark key is empty" };
  }

  try {
    const url = new URL(`https://api.day.app/${barkKey}/${encodeURIComponent(title)}`);
    url.searchParams.set("level", level);
    url.searchParams.set("body", body);
    const res = await fetch(url.toString());
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function stopMonitoringInternal(reason = "manual") {
  running = false;
  consecutiveAvailable = 0;
  consecutiveErrors = 0;

  if (monitorTimer) {
    clearTimeout(monitorTimer);
    monitorTimer = null;
  }

  if (monitorService) {
    await monitorService.cleanup();
    monitorService = null;
  }

  emit("monitoring-state", { running: false, reason });
}

async function checkAndSchedule() {
  if (!running || !monitorService || !monitorConfig) {
    return;
  }

  try {
    const result = await monitorService.checkAvailability();
    consecutiveErrors = 0;

    if (result.found && result.available === true) {
      consecutiveAvailable += 1;
      updateStatus("Monitoring", true, { earliestTime: result.earliestTime || null });
      log(`Status: ${result.status}`, "success");

      if (consecutiveAvailable === 1) {
        const bodyParts = [
          "Detected available appointment.",
          `Check time: ${result.timestamp || now()}`
        ];
        if (result.earliestTime) {
          bodyParts.push(`Earliest: ${result.earliestTime}`);
        }

        if (monitorConfig.barkKey) {
          const barkRes = await sendBarkNotification(
            monitorConfig.barkKey,
            "Appointment Available",
            bodyParts.join("\n")
          );
          if (barkRes.ok) {
            log("Bark notification sent", "success");
          } else {
            log(`Bark notification failed: ${barkRes.error || barkRes.status}`, "warning");
          }
        }

        if (Notification.isSupported()) {
          new Notification({
            title: "Appointment Available",
            body: bodyParts.join(" | ")
          }).show();
        }
      }
    } else if (result.found && result.available === false) {
      consecutiveAvailable = 0;
      updateStatus("Monitoring", false);
      log(`Status: ${result.status}`, "info");
    } else {
      consecutiveAvailable = 0;
      updateStatus("Monitoring", null);
      log(`Status: ${result.status}`, "warning");
    }
  } catch (err) {
    consecutiveErrors += 1;
    log(`Monitor error: ${String(err)}`, "error");

    if (consecutiveErrors >= maxConsecutiveErrors) {
      log(`Stopped after ${maxConsecutiveErrors} consecutive errors`, "error");
      updateStatus("Stopped: too many errors", null);
      await stopMonitoringInternal("error_limit");
      return;
    }
  }

  if (!running) {
    return;
  }

  const base = Number(monitorConfig.intervalSec) || 60;
  const nextWait = getNextInterval(base);
  log(`Waiting ${nextWait}s before next check`, "info");
  monitorTimer = setTimeout(() => {
    checkAndSchedule().catch((err) => log(`Unexpected scheduler error: ${String(err)}`, "error"));
  }, nextWait * 1000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 900,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "../src/renderer/index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function openQuickAppointmentPage() {
  const pageWindow = new BrowserWindow({
    width: 1200,
    height: 860,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  pageWindow.loadURL(quickPageUrl);

  pageWindow.webContents.on("did-finish-load", async () => {
    try {
      await pageWindow.webContents.executeJavaScript(`
        (async () => {
          const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          const findInput = () => {
            const candidates = Array.from(document.querySelectorAll("input[type='text'], input:not([type]), input[type='search']"));
            return candidates.find((el) => {
              const hint = ((el.placeholder || "") + " " + (el.name || "") + " " + (el.id || "")).toLowerCase();
              return hint.includes("location") || hint.includes("site") || hint.includes("search");
            }) || candidates[0];
          };

          for (let i = 0; i < 20; i += 1) {
            const input = findInput();
            if (input) {
              input.focus();
              input.value = "louisville";
              input.dispatchEvent(new Event("input", { bubbles: true }));
              input.dispatchEvent(new Event("change", { bubbles: true }));
              input.dispatchEvent(new KeyboardEvent("keyup", { key: "e", bubbles: true }));
              return true;
            }
            await sleep(400);
          }
          return false;
        })();
      `);
      log("Opened appointment page and auto-filled louisville", "info");
    } catch (err) {
      log(`Quick open autofill failed: ${String(err)}`, "warning");
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  await stopMonitoringInternal("window_closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("check-once", async (_event, config) => {
  const service = new AppointmentMonitorService(config, log);
  try {
    log("Initializing browser...", "info");
    const result = await service.checkAvailability();
    updateStatus("Check complete", result.available, { earliestTime: result.earliestTime || null });
    return { ok: true, result };
  } catch (err) {
    log(`Check once failed: ${String(err)}`, "error");
    updateStatus("Check failed", null);
    return { ok: false, error: String(err) };
  } finally {
    await service.cleanup();
  }
});

ipcMain.handle("start-monitoring", async (_event, config) => {
  if (running) {
    return { ok: false, error: "Monitoring already running" };
  }

  const intervalSec = Math.max(1, Number(config.intervalSec) || 60);
  monitorConfig = {
    appointmentType: config.appointmentType === "road_test" ? "road_test" : "permit",
    headless: config.headless !== false,
    barkKey: (config.barkKey || "").trim(),
    intervalSec
  };

  const jitter = getJitterSpan(intervalSec);
  log("Starting monitoring...", "info");
  log(`Base interval: ${intervalSec}s`, "info");
  log(`Random interval: ${Math.max(1, intervalSec - jitter)} - ${intervalSec + jitter}s`, "info");

  monitorService = new AppointmentMonitorService(monitorConfig, log);
  running = true;
  emit("monitoring-state", { running: true });
  updateStatus("Monitoring", null);

  checkAndSchedule().catch(async (err) => {
    log(`Start monitoring failure: ${String(err)}`, "error");
    await stopMonitoringInternal("start_failure");
  });

  return { ok: true };
});

ipcMain.handle("stop-monitoring", async () => {
  if (!running) {
    return { ok: true };
  }
  await stopMonitoringInternal("manual");
  log("Monitoring stopped", "info");
  updateStatus("Stopped", null);
  return { ok: true };
});

ipcMain.handle("test-bark", async (_event, barkKey) => {
  const key = (barkKey || "").trim();
  const result = await sendBarkNotification(
    key,
    "Test Notification",
    "This is a test notification from DMV monitor."
  );
  if (result.ok) {
    log("Bark test succeeded", "success");
  } else {
    log(`Bark test failed: ${result.error || result.status}`, "error");
  }
  return result;
});

ipcMain.handle("open-appointment-page", async () => {
  try {
    openQuickAppointmentPage();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});
