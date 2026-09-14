import test from "node:test";
import assert from "node:assert/strict";
import { createApplicationSchema, updateApplicationSchema } from "@/lib/applications/schema";

const baseCreateInput = {
  appliedAt: "2026-09-10",
  company: "Acme",
  role: "Engineer",
};

const baseUpdateInput = {
  ...baseCreateInput,
  outcome: "IN_PROGRESS",
  stage: "APPLICATION",
};

test("create: missing country with remoteOnly false fails validation on the country field", () => {
  const result = createApplicationSchema.safeParse(baseCreateInput);

  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.flatten().fieldErrors.country?.length);
  }
});

test("create: missing country with remoteOnly true succeeds", () => {
  const result = createApplicationSchema.safeParse({ ...baseCreateInput, remoteOnly: "on" });

  assert.equal(result.success, true);
});

test("create: country and city set with remoteOnly false succeeds and preserves both values", () => {
  const result = createApplicationSchema.safeParse({ ...baseCreateInput, country: "Germany", city: "Berlin" });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.country, "Germany");
    assert.equal(result.data.city, "Berlin");
  }
});

test("create: country and city set but remoteOnly true clears both in the validated output", () => {
  const result = createApplicationSchema.safeParse({ ...baseCreateInput, country: "Germany", city: "Berlin", remoteOnly: "on" });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.country, undefined);
    assert.equal(result.data.city, undefined);
  }
});

test("create: workMode set alongside remoteOnly true is cleared in the validated output", () => {
  const result = createApplicationSchema.safeParse({ ...baseCreateInput, remoteOnly: "on", workMode: "Hybrid" });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.workMode, undefined);
  }
});

test("create: workMode set with remoteOnly false is preserved", () => {
  const result = createApplicationSchema.safeParse({ ...baseCreateInput, country: "Germany", workMode: "Hybrid" });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.workMode, "Hybrid");
  }
});

test("update: shares the same country/remoteOnly rule as create", () => {
  const missingCountry = updateApplicationSchema.safeParse(baseUpdateInput);
  assert.equal(missingCountry.success, false);
  if (!missingCountry.success) {
    assert.ok(missingCountry.error.flatten().fieldErrors.country?.length);
  }

  const remoteOnlyOk = updateApplicationSchema.safeParse({ ...baseUpdateInput, remoteOnly: "on" });
  assert.equal(remoteOnlyOk.success, true);

  const remoteOnlyClearsLocation = updateApplicationSchema.safeParse({ ...baseUpdateInput, country: "France", city: "Paris", remoteOnly: "on", workMode: "Hybrid" });
  assert.equal(remoteOnlyClearsLocation.success, true);
  if (remoteOnlyClearsLocation.success) {
    assert.equal(remoteOnlyClearsLocation.data.country, undefined);
    assert.equal(remoteOnlyClearsLocation.data.city, undefined);
    assert.equal(remoteOnlyClearsLocation.data.workMode, undefined);
  }
});
