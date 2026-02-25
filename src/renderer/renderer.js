const els = {
  appointmentType: document.getElementById("appointmentType"),
  locationName: document.getElementById("locationName"),
  refreshLocationsBtn: document.getElementById("refreshLocationsBtn"),
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
  earliestTime: document.getElementById("earliestTime"),
  availability: document.getElementById("availability"),
  logView: document.getElementById("logView")
};

function cfg() {
  return {
    appointmentType: els.appointmentType.value,
    locationName: (els.locationName.value || "").trim(),
    intervalSec: Number(els.intervalSec.value || 60),
    headless: Boolean(els.headless.checked),
    barkKey: (els.barkKey.value || "").trim()
  };
}

function logLine(payload) {
  const line = `[${payload.timestamp}] [${payload.level.toUpperCase()}] ${payload.message}`;
  const level = String(payload.level || "info").toLowerCase();
  const entry = document.createElement("div");
  entry.className = `log-line log-${level}`;
  entry.textContent = line;
  els.logView.appendChild(entry);
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
  els.appointmentType.disabled = isRunning;
  els.locationName.disabled = isRunning || els.locationName.options.length === 0;
  els.refreshLocationsBtn.disabled = isRunning;
}

function setLocationOptions(locations) {
  els.locationName.innerHTML = "";

  if (!Array.isArray(locations) || locations.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No locations found";
    els.locationName.appendChild(opt);
    return;
  }

  locations.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    els.locationName.appendChild(opt);
  });
}

function setLocationLoading() {
  els.locationName.innerHTML = "";
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = "Loading locations...";
  els.locationName.appendChild(opt);
}

async function loadLocations() {
  els.refreshLocationsBtn.disabled = true;
  els.locationName.disabled = true;
  setLocationLoading();

  try {
    const res = await window.monitorApi.fetchLocations({
      appointmentType: els.appointmentType.value,
      headless: true
    });

    if (!res.ok) {
      setLocationOptions([]);
      alert(res.error || "Failed to fetch locations");
      return;
    }

    setLocationOptions(res.locations || []);
  } finally {
    const isRunning = els.stopBtn.disabled === false;
    els.refreshLocationsBtn.disabled = isRunning;
    els.locationName.disabled = isRunning || els.locationName.options.length === 0;
  }
}

els.startBtn.addEventListener("click", async () => {
  const interval = Number(els.intervalSec.value || 60);
  if (!Number.isFinite(interval) || interval < 1) {
    alert("Interval must be >= 1");
    return;
  }
  if (!els.locationName.value) {
    alert("Please select an appointment location");
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
  if (!els.locationName.value) {
    alert("Please select an appointment location");
    return;
  }

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
  els.testBarkBtn.disabled = true;
  try {
    const res = await window.monitorApi.testBark("");
    alert(res.ok ? "Bark test succeeded" : `Bark test failed: ${res.error || res.status}`);
  } finally {
    els.testBarkBtn.disabled = false;
  }
});

els.appointmentType.addEventListener("change", async () => {
  await loadLocations();
});

els.refreshLocationsBtn.addEventListener("click", async () => {
  await loadLocations();
});

window.monitorApi.onLog(logLine);

window.monitorApi.onStatus((payload) => {
  els.statusText.textContent = `Status: ${payload.status}`;
  els.lastCheck.textContent = `Last check: ${payload.lastCheck || "N/A"}`;
  els.earliestTime.textContent = `Earliest: ${payload.earliestTime || "N/A"}`;
  setAvailability(payload.availability);
});

window.monitorApi.onMonitoringState((payload) => {
  setRunningState(Boolean(payload.running));
});

setRunningState(false);
setAvailability(null);
loadLocations().catch((err) => {
  setLocationOptions([]);
  alert(`Failed to load locations: ${String(err)}`);
});
