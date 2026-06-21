const els = {
  appointmentType: document.getElementById("appointmentType"),
  locationName: document.getElementById("locationName"),
  refreshLocationsBtn: document.getElementById("refreshLocationsBtn"),
  intervalSec: document.getElementById("intervalSec"),
  headless: document.getElementById("headless"),
  autoBook: document.getElementById("autoBook"),
  autoSubmit: document.getElementById("autoSubmit"),
  firstName: document.getElementById("firstName"),
  lastName: document.getElementById("lastName"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  receiveTexts: document.getElementById("receiveTexts"),
  barkKey: document.getElementById("barkKey"),
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  checkBtn: document.getElementById("checkBtn"),
  bookNowBtn: document.getElementById("bookNowBtn"),
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
    barkKey: (els.barkKey.value || "").trim(),
    autoBook: Boolean(els.autoBook.checked),
    autoSubmit: Boolean(els.autoSubmit.checked),
    applicant: {
      firstName: (els.firstName.value || "").trim(),
      lastName: (els.lastName.value || "").trim(),
      email: (els.email.value || "").trim(),
      phone: (els.phone.value || "").trim(),
      receiveTexts: Boolean(els.receiveTexts.checked)
    }
  };
}

function validateApplicantConfig(config, requireApplicant) {
  if (!requireApplicant) {
    return null;
  }

  const missing = [];
  if (!config.applicant.firstName) missing.push("First Name");
  if (!config.applicant.lastName) missing.push("Last Name");
  if (!config.applicant.email) missing.push("Email");
  if (!config.applicant.phone) missing.push("Phone");
  return missing.length > 0 ? `Please fill: ${missing.join(", ")}` : null;
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
  els.bookNowBtn.disabled = isRunning;
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
  const config = cfg();
  const interval = Number(config.intervalSec || 60);
  if (!Number.isFinite(interval) || interval < 1) {
    alert("Interval must be >= 1");
    return;
  }
  if (!els.locationName.value) {
    alert("Please select an appointment location");
    return;
  }

  const applicantError = validateApplicantConfig(config, config.autoBook);
  if (applicantError) {
    alert(applicantError);
    return;
  }

  const res = await window.monitorApi.startMonitoring(config);
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

els.bookNowBtn.addEventListener("click", async () => {
  const config = cfg();
  if (!config.locationName) {
    alert("Please select an appointment location");
    return;
  }

  const applicantError = validateApplicantConfig(config, true);
  if (applicantError) {
    alert(applicantError);
    return;
  }

  if (!window.confirm("Book the earliest available appointment now?")) {
    return;
  }

  els.bookNowBtn.disabled = true;
  try {
    const res = await window.monitorApi.bookNow(config);
    if (!res.ok) {
      alert(res.error || "Immediate booking failed");
      return;
    }

    const confirmation = res.result?.confirmationNumber ? `\nConfirmation: ${res.result.confirmationNumber}` : "";
    const slot = res.result?.slot?.slotLabel ? `\nSlot: ${res.result.slot.slotLabel}` : "";
    alert(`Booking flow completed.${slot}${confirmation}`);
  } finally {
    els.bookNowBtn.disabled = false;
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
    const res = await window.monitorApi.testBark(els.barkKey.value || "");
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
