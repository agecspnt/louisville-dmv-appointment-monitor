const test = require("node:test");
const assert = require("node:assert/strict");

const { AppointmentMonitorService } = require("../src/services/monitor");

test("live DMV page should return locations and allow availability check", async (t) => {
  const service = new AppointmentMonitorService({
    appointmentType: "road_test",
    headless: true
  });

  try {
    const locationRes = await service.fetchLocations();
    assert.ok(Array.isArray(locationRes.locations), "locations should be array");
    assert.ok(locationRes.locations.length > 0, "expected at least one live location");

    const preferred = "Catlettsburg Regional Testing Site - Road Testing";
    const selected = locationRes.locations.includes(preferred) ? preferred : locationRes.locations[0];

    service.locationName = selected;
    const check = await service.checkAvailability();

    assert.equal(check.found, true, `location should be found: ${selected}`);
    assert.ok(
      check.available === true || check.available === false || check.available === null,
      "available should be tri-state"
    );

    if (check.available === true) {
      assert.ok(
        check.earliestTime && check.earliestTime.length > 0,
        "earliestTime should be present when availability is true"
      );
    }
  } finally {
    await service.cleanup();
  }
}, 120000);
