const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getJitterSpan,
  getNextInterval,
  evaluateAvailabilityFromText,
  extractEarliestDateTime,
  extractLocationName,
  extractLocationsFromRawTexts,
  pickBestTargetBlock
} = require("../src/services/monitor");

test("getJitterSpan should scale with base interval", () => {
  assert.equal(getJitterSpan(60), 20);
  assert.equal(getJitterSpan(30), 10);
  assert.equal(getJitterSpan(3), 1);
  assert.equal(getJitterSpan(1), 1);
});

test("getNextInterval should stay within expected bounds", () => {
  const base = 60;
  const span = getJitterSpan(base);
  const low = base - span;
  const high = base + span;

  for (let i = 0; i < 500; i += 1) {
    const next = getNextInterval(base);
    assert.ok(next >= low && next <= high, `out of range value: ${next}`);
  }
});

test("getNextInterval should never return less than 1", () => {
  for (let i = 0; i < 200; i += 1) {
    const next = getNextInterval(0);
    assert.ok(next >= 1, `invalid value: ${next}`);
  }
});

test("evaluateAvailabilityFromText should detect available appointment", () => {
  const rawText =
    "Catlettsburg Regional Testing Site - Road Testing 2900 Louisa St " +
    "Check Earliest Availability for Catlettsburg Regional Testing Site - Road Testing " +
    "Select In Person Appointment for Catlettsburg Regional Testing Site - Road Testing";

  const result = evaluateAvailabilityFromText(rawText);

  assert.equal(result.available, true);
  assert.equal(result.hasAvailableAction, true);
  assert.equal(result.hasNo, false);
});

test("evaluateAvailabilityFromText should detect no appointment available", () => {
  const rawText =
    "Louisville(Bowman) Regional Test Site - Road Test 3501 Roger E. Schupp Street " +
    "Get Directions No Availability";

  const result = evaluateAvailabilityFromText(rawText);

  assert.equal(result.available, false);
  assert.equal(result.hasAvailableAction, false);
  assert.equal(result.hasNo, true);
});

test("extractLocationName should parse location label before address", () => {
  const rawText =
    "Catlettsburg Regional Testing Site - Road Testing2900 Louisa St Catlettsburg, KY 41129 " +
    "(606) 385-1531 Get Directions Check Earliest Availability";
  assert.equal(extractLocationName(rawText), "Catlettsburg Regional Testing Site - Road Testing");
});

test("extractLocationsFromRawTexts should return unique sorted locations", () => {
  const rawTexts = [
    "B Site - Road Test100 Main St Get DirectionsNo Availability",
    "A Site - Road Test200 Main St Get DirectionsCheck Earliest Availability Select In Person Appointment",
    "A Site - Road Test200 Main St Get DirectionsCheck Earliest Availability Select In Person Appointment",
    "Some unrelated container text"
  ];
  const result = extractLocationsFromRawTexts(rawTexts, "Road Test");
  assert.deepEqual(result, ["A Site - Road Test", "B Site - Road Test"]);
});

test("pickBestTargetBlock should prefer exact location with status hint", () => {
  const rawTexts = [
    "Container Louisville(Bowman) Regional Test Site - Road Test Get DirectionsNo Availability " +
      "Catlettsburg Regional Testing Site - Road Testing Get DirectionsCheck Earliest Availability",
    "Catlettsburg Regional Testing Site - Road Testing2900 Louisa St Get DirectionsCheck Earliest Availability",
    "Catlettsburg Regional Testing Site - Road Testing2900 Louisa St Get DirectionsNo Availability"
  ];

  const target = pickBestTargetBlock(rawTexts, "Catlettsburg Regional Testing Site - Road Testing", "Road Test");
  assert.ok(target);
  assert.equal(target.available, true);
  assert.equal(target.hasNo, false);
});

test("extractEarliestDateTime should parse month date with time", () => {
  const txt = "Earliest availability: March 14, 2026 at 9:25 AM";
  assert.equal(extractEarliestDateTime(txt), "March 14, 2026 at 9:25 AM");
});

test("extractEarliestDateTime should parse month date with available count", () => {
  const txt = "Earliest: February 26, 16 available.";
  assert.equal(extractEarliestDateTime(txt), "February 26, 16 available");
});

test("extractEarliestDateTime should parse numeric date with time", () => {
  const txt = "Next slot 03/14/2026 9:25 AM is available";
  assert.equal(extractEarliestDateTime(txt), "03/14/2026 9:25 AM");
});
