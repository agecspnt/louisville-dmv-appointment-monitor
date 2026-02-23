const els = {
  appointmentType: document.getElementById("appointmentType"),
  intervalSec: document.getElementById("intervalSec"),
  headless: document.getElementById("headless"),
  barkKey: document.getElementById("barkKey"),
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  checkBtn: document.getElementById("checkBtn"),
  openPageBtn: document.getElementById("openPageBtn"),
  testBarkBtn: document.getElementById("testBarkBtn"),
  statusText: document.getElementById("statusText"),
  lastCheck: document.getElementById("lastCheck"),
  availability: document.getElementById("availability"),
  logView: document.getElementById("logView")
};

function cfg() {
  return {
    appointmentType: els.appointmentType.value,
    intervalSec: Number(els.intervalSec.value || 60),
    headless: Boolean(els.headless.checked),
    barkKey: (els.barkKey.value || "").trim()
  };
}

function logLine(payload) {
  const line = `[${payload.timestamp}] [${payload.level.toUpperCase()}] ${payload.message}`;
  els.logView.textContent += `${line}\n`;
  els.logView.scrollTop = els.logView.scrollHeight;
}

function setAvailability(availability) {
  els.availability.classList.remove("ok", "no", "unknown");
  if (availability === true) {
    els.availability.textContent = "Availability: YES";
    els.availability.classList.add("ok");
    return;
  }
  if (availability === false) {
    els.availability.textContent = "Availability: NO";
    els.availability.classList.add("no");
    return;
  }
  els.availability.textContent = "Availability: Unknown";
  els.availability.classList.add("unknown");
}

function setRunningState(isRunning) {
  els.startBtn.disabled = isRunning;
  els.stopBtn.disabled = !isRunning;
}

els.startBtn.addEventListener("click", async () => {
  const interval = Number(els.intervalSec.value || 60);
  if (!Number.isFinite(interval) || interval < 1) {
    alert("Interval must be >= 1");
    return;
  }

  const res = await window.monitorApi.startMonitoring(cfg());
  if (!res.ok) {
    alert(res.error || "Failed to start");
  }
});

els.stopBtn.addEventListener("click", async () => {
  await window.monitorApi.stopMonitoring();
});

els.checkBtn.addEventListener("click", async () => {
  els.checkBtn.disabled = true;
  try {
    const res = await window.monitorApi.checkOnce(cfg());
    if (!res.ok) {
      alert(res.error || "Check once failed");
    }
  } finally {
    els.checkBtn.disabled = false;
  }
});

els.openPageBtn.addEventListener("click", async () => {
  els.openPageBtn.disabled = true;
  try {
    const res = await window.monitorApi.openAppointmentPage();
    if (!res.ok) {
      alert(res.error || "Failed to open DMV page");
    }
  } finally {
    els.openPageBtn.disabled = false;
  }
});

els.testBarkBtn.addEventListener("click", async () => {
  const barkKey = (els.barkKey.value || "").trim();
  if (!barkKey) {
    alert("Please enter Bark key");
    return;
  }

  els.testBarkBtn.disabled = true;
  try {
    const res = await window.monitorApi.testBark(barkKey);
    alert(res.ok ? "Bark test succeeded" : `Bark test failed: ${res.error || res.status}`);
  } finally {
    els.testBarkBtn.disabled = false;
  }
});

window.monitorApi.onLog(logLine);

window.monitorApi.onStatus((payload) => {
  els.statusText.textContent = `Status: ${payload.status}`;
  els.lastCheck.textContent = `Last check: ${payload.lastCheck || "N/A"}`;
  setAvailability(payload.availability);
});

window.monitorApi.onMonitoringState((payload) => {
  setRunningState(Boolean(payload.running));
});

setRunningState(false);
setAvailability(null);
