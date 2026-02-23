const test = require("node:test");
const assert = require("node:assert/strict");

const { getJitterSpan, getNextInterval } = require("../src/services/monitor");

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
