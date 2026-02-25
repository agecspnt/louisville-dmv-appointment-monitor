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

class AppointmentMonitorService {
  constructor(config, logger = () => {}) {
    this.appointmentType = config.appointmentType === "road_test" ? "road_test" : "permit";
    this.headless = config.headless !== false;
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
    return page.evaluate(({ typeName }) => {
      const locationNeedle = "Louisville(Bowman) Regional Test Site";
      const typePattern = typeName === "Road Test" ? /Road Test(?:ing)?/i : /Written Test/i;

      const candidates = Array.from(document.querySelectorAll("div"))
        .map((el) => (el.textContent || "").replace(/\s+/g, " ").trim())
        .filter((txt) => txt.includes(locationNeedle))
        .map((rawText) => {
          const hasNo = /No Availability/i.test(rawText);
          const hasAvailableAction = /Check Earliest Availability|Select In Person Appointment/i.test(rawText);
          return {
            rawText,
            hasNo,
            hasAvailableAction,
            hasStatusHint: hasNo || hasAvailableAction,
            typeMatch: typePattern.test(rawText)
          };
        });

      if (candidates.length === 0) {
        return { found: false, rawText: "" };
      }

      const byType = candidates.filter((c) => c.typeMatch);
      const typedPool = byType.length > 0 ? byType : candidates;
      const withStatus = typedPool.filter((c) => c.hasStatusHint);
      const finalPool = withStatus.length > 0 ? withStatus : typedPool;
      const target = finalPool.reduce((best, cur) => {
        if (!best) {
          return cur;
        }
        return cur.rawText.length < best.rawText.length ? cur : best;
      }, null);

      const rawText = target.rawText;
      const hasNo = /No Availability/i.test(rawText);
      const hasAvailableAction = /Check Earliest Availability|Select In Person Appointment/i.test(rawText);
      const available = hasAvailableAction && !hasNo;

      return {
        found: true,
        rawText,
        available,
        hasNo,
        hasAvailableAction
      };
    }, { typeName: this.typeName });
  }

  findEarliestTime(content) {
    const pattern = /([A-Z][a-z]+\s+\d{1,2},\s+\d+\s+available\.?)/;
    const match = content.match(pattern);
    return match ? match[1] : null;
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
        const html = await page.content();
        earliestTime = this.findEarliestTime(html);
      }

      const status = parsed.available
        ? "Available appointment found"
        : parsed.hasNo
          ? "No appointment available"
          : "Unknown availability status";

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
  evaluateAvailabilityFromText
};
