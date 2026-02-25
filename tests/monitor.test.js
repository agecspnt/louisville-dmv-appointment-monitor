const test = require("node:test");
const assert = require("node:assert/strict");

const { getJitterSpan, getNextInterval, evaluateAvailabilityFromText } = require("../src/services/monitor");

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
