const { chromium } = require("playwright");

function now() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function getJitterSpan(baseInterval) {
  const base = Math.max(1, Number(baseInterval) || 1);
  return Math.max(1, Math.round(base * (20 / 60)));
}

function getNextInterval(baseInterval) {
  const base = Math.max(1, Number(baseInterval) || 1);
  const span = getJitterSpan(base);
  const low = Math.max(1, base - span);
  const high = base + span;
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function evaluateAvailabilityFromText(rawText) {
  const normalized = normalizeText(rawText);
  const hasNo = /No Availability/i.test(normalized);
  const hasAvailableAction = /Check Earliest Availability|Select In Person Appointment/i.test(normalized);
  return {
    rawText: normalized,
    hasNo,
    hasAvailableAction,
    available: hasAvailableAction && !hasNo
  };
}

function extractEarliestDateTime(rawText) {
  const normalized = normalizeText(rawText);
  if (!normalized) {
    return null;
  }
  const month =
    "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";

  const patterns = [
    new RegExp(`\\b(${month}\\s+\\d{1,2},\\s+\\d+\\s+available\\.?)\\b`, "i"),
    new RegExp(`\\b(${month}\\s+\\d{1,2},\\s+\\d{4}\\s*(?:at\\s*)?\\d{1,2}:\\d{2}\\s*(?:AM|PM))\\b`, "i"),
    /\b(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s*(?:AM|PM))\b/i,
    new RegExp(`\\b(${month}\\s+\\d{1,2},\\s+\\d{4})\\b`, "i")
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      return normalizeText(match[1]);
    }
  }
  return null;
}

function extractLocationName(rawText) {
  const normalized = normalizeText(rawText);
  if (!normalized) {
    return null;
  }

  const beforeDirections = normalized.split(/Get Directions/i)[0] || normalized;
  let candidate = beforeDirections.replace(/^.*?\bFind Location\b/i, "").trim();
  if (!candidate) {
    return null;
  }

  const explicitTypeMatch = candidate.match(
    /(.*?-\s*(?:Road Test(?:ing)?|Written Test(?:ing)?))(?:\d|\(|$)/i
  );
  if (explicitTypeMatch && explicitTypeMatch[1]) {
    return normalizeText(explicitTypeMatch[1]);
  }

  candidate = candidate.replace(/\d[\s\S]*$/, "").trim();
  if (!candidate) {
    return null;
  }
  return normalizeText(candidate);
}

function pickBestTargetBlock(rawTexts, locationNeedle, typeName) {
  const normalizedNeedle = normalizeText(locationNeedle);
  if (!normalizedNeedle) {
    return null;
  }

  const typePattern = typeName === "Road Test" ? /Road Test(?:ing)?/i : /Written Test(?:ing)?/i;
  const locationPattern = new RegExp(escapeRegex(normalizedNeedle), "i");

  const candidates = rawTexts
    .map((txt) => normalizeText(txt))
    .filter((txt) => locationPattern.test(txt))
    .map((rawText) => {
      const availability = evaluateAvailabilityFromText(rawText);
      return {
        rawText,
        ...availability,
        hasStatusHint: availability.hasNo || availability.hasAvailableAction,
        typeMatch: typePattern.test(rawText)
      };
    });

  if (candidates.length === 0) {
    return null;
  }

  const byType = candidates.filter((c) => c.typeMatch);
  const typedPool = byType.length > 0 ? byType : candidates;
  const withStatus = typedPool.filter((c) => c.hasStatusHint);
  const finalPool = withStatus.length > 0 ? withStatus : typedPool;

  const statusRank = (item) => {
    if (item.hasAvailableAction && !item.hasNo) {
      return 0;
    }
    if (!item.hasAvailableAction && item.hasNo) {
      return 1;
    }
    if (item.hasAvailableAction && item.hasNo) {
      return 2;
    }
    return 3;
  };

  return finalPool.reduce((best, cur) => {
    if (!best) {
      return cur;
    }
    const bestRank = statusRank(best);
    const curRank = statusRank(cur);
    if (curRank !== bestRank) {
      return curRank < bestRank ? cur : best;
    }
    return cur.rawText.length < best.rawText.length ? cur : best;
  }, null);
}

function extractLocationsFromRawTexts(rawTexts, typeName) {
  const typePattern = typeName === "Road Test" ? /Road Test(?:ing)?/i : /Written Test(?:ing)?/i;
  const seen = new Set();
  const locations = [];

  rawTexts.forEach((txt) => {
    const normalized = normalizeText(txt);
    if (!normalized || !/Get Directions/i.test(normalized) || !typePattern.test(normalized)) {
      return;
    }

    const name = extractLocationName(normalized);
    if (!name) {
      return;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    locations.push(name);
  });

  locations.sort((a, b) => a.localeCompare(b, "en"));
  return locations;
}

class AppointmentMonitorService {
  constructor(config, logger = () => {}) {
    this.appointmentType = config.appointmentType === "road_test" ? "road_test" : "permit";
    this.headless = config.headless !== false;
    this.locationName = normalizeText(config.locationName || "Louisville(Bowman) Regional Test Site");
    this.log = logger;
    this.browser = null;
  }

  get typeName() {
    return this.appointmentType === "road_test" ? "Road Test" : "Written Test";
  }

  get url() {
    return this.appointmentType === "road_test"
      ? "https://telegov.egov.com/ksp/AppointmentWizard/55"
      : "https://telegov.egov.com/ksp/AppointmentWizard/56";
  }

  async ensureBrowser() {
    if (this.browser) {
      return;
    }
    this.browser = await chromium.launch({
      headless: this.headless,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-blink-features=AutomationControlled"
      ]
    });
    this.log(`Browser initialized (${this.headless ? "headless" : "headed"})`, "success");
  }

  async parseTarget(page) {
    const rawTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll("div")).map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
    );
    const target = pickBestTargetBlock(rawTexts, this.locationName, this.typeName);
    if (!target) {
      return { found: false, rawText: "" };
    }
    return {
      found: true,
      rawText: target.rawText,
      available: target.available,
      hasNo: target.hasNo,
      hasAvailableAction: target.hasAvailableAction
    };
  }

  async fetchLocations() {
    await this.ensureBrowser();
    const context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();

    try {
      await page.goto(this.url, { waitUntil: "domcontentloaded", timeout: 35000 });
      await page.waitForTimeout(1200);
      const rawTexts = await page.evaluate(() =>
        Array.from(document.querySelectorAll("div")).map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
      );
      const locations = extractLocationsFromRawTexts(rawTexts, this.typeName);
      return { locations, timestamp: now() };
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }

  async clickEarliestAvailabilityForLocation(page) {
    const locationNeedle = this.locationName.toLowerCase();
    const clickMeta = await page.evaluate(({ locationNeedle }) => {
      const normalize = (txt) => (txt || "").replace(/\s+/g, " ").trim().toLowerCase();
      const blocks = Array.from(document.querySelectorAll("#locationsDiv > div, #locationListColumn #locationsDiv > div"));
      const block = blocks.find((item) => normalize(item.textContent || "").includes(locationNeedle));
      if (!block) {
        return { clicked: false };
      }
      const beforeText = (block.textContent || "").replace(/\s+/g, " ").trim();

      const checkLink = block.querySelector("a[href^='javascript:CheckAvailability(']");
      if (!checkLink) {
        return { clicked: false, beforeText };
      }

      const href = checkLink.getAttribute("href") || "";
      const idMatch = href.match(/CheckAvailability\((\d+)\)/i);
      const appointmentId = idMatch ? Number(idMatch[1]) : null;
      if (appointmentId && typeof window.CheckAvailability === "function") {
        window.CheckAvailability(appointmentId);
      } else if (typeof checkLink.click === "function") {
        checkLink.click();
      } else {
        checkLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }

      return { clicked: true, appointmentId, beforeText };
    }, { locationNeedle });

    return clickMeta;
  }

  async findEarliestTime(page) {
    const clickMeta = await this.clickEarliestAvailabilityForLocation(page);
    if (!clickMeta || !clickMeta.clicked) {
      return null;
    }

    try {
      await page.waitForFunction(
        ({ locationNeedle, beforeText }) => {
          const normalize = (txt) => (txt || "").replace(/\s+/g, " ").trim().toLowerCase();
          const blocks = Array.from(
            document.querySelectorAll("#locationsDiv > div, #locationListColumn #locationsDiv > div")
          );
          const block = blocks.find((item) => normalize(item.textContent || "").includes(locationNeedle));
          if (!block) {
            return false;
          }
          const currentText = (block.textContent || "").replace(/\s+/g, " ").trim();
          if (!currentText || currentText === (beforeText || "")) {
            return false;
          }
          const txt = currentText.toLowerCase();
          return txt.includes("available") || txt.includes("no availability");
        },
        { locationNeedle: this.locationName.toLowerCase(), beforeText: clickMeta.beforeText || "" },
        { timeout: 9000 }
      );
    } catch (_err) {
      await page.waitForTimeout(1200);
    }

    const blockText = await page.evaluate(({ locationNeedle }) => {
      const normalize = (txt) => (txt || "").replace(/\s+/g, " ").trim();
      const blocks = Array.from(
        document.querySelectorAll("#locationsDiv > div, #locationListColumn #locationsDiv > div")
      );
      const block = blocks.find((item) => normalize(item.textContent || "").toLowerCase().includes(locationNeedle));
      return block ? normalize(block.textContent || "") : "";
    }, { locationNeedle: this.locationName.toLowerCase() });

    const fromBlock = extractEarliestDateTime(blockText);
    if (fromBlock) {
      return fromBlock;
    }

    const bodyText = await page.evaluate(() => {
      const txt = document.body ? document.body.innerText : "";
      return (txt || "").replace(/\s+/g, " ").trim();
    });

    return extractEarliestDateTime(bodyText);
  }

  async checkAvailability() {
    await this.ensureBrowser();
    const context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();

    try {
      await page.goto(this.url, { waitUntil: "domcontentloaded", timeout: 35000 });
      await page.waitForTimeout(1200);

      const parsed = await this.parseTarget(page);

      if (!parsed.found) {
        return {
          found: false,
          available: null,
          status: "Location not found on page",
          timestamp: now()
        };
      }

      let earliestTime = null;
      if (parsed.available) {
        earliestTime = await this.findEarliestTime(page);
      }

      const status = parsed.available
        ? `Available appointment found (${this.locationName})`
        : parsed.hasNo
          ? `No appointment available (${this.locationName})`
          : `Unknown availability status (${this.locationName})`;

      return {
        found: true,
        available: parsed.available ? true : parsed.hasNo ? false : null,
        status,
        timestamp: now(),
        earliestTime
      };
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
      this.log("Browser closed", "info");
    }
  }
}

module.exports = {
  AppointmentMonitorService,
  getJitterSpan,
  getNextInterval,
  evaluateAvailabilityFromText,
  extractEarliestDateTime,
  extractLocationName,
  extractLocationsFromRawTexts,
  pickBestTargetBlock
};
