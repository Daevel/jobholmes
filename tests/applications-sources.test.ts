import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SOURCES, matchesKnownSource, mergeSources, normalizeSourceName } from "@/lib/applications/sources";

test("normalizeSourceName collapses casing and whitespace variants to the same value", () => {
  const variants = ["LinkedIn", "linkedin", "LINKEDIN", "  LinkedIn  ", "Linked In", "Linked  In", "  linked   in  "];
  const normalizedLinkedIn = normalizeSourceName("LinkedIn");
  const normalizedLinkedInSpaced = normalizeSourceName("Linked In");

  assert.equal(normalizeSourceName(variants[0]), normalizedLinkedIn);
  assert.equal(normalizeSourceName(variants[1]), normalizedLinkedIn);
  assert.equal(normalizeSourceName(variants[2]), normalizedLinkedIn);
  assert.equal(normalizeSourceName(variants[3]), normalizedLinkedIn);
  assert.equal(normalizeSourceName(variants[4]), normalizedLinkedInSpaced);
  assert.equal(normalizeSourceName(variants[5]), normalizedLinkedInSpaced);
  assert.equal(normalizeSourceName(variants[6]), normalizedLinkedInSpaced);
});

test("mergeSources deduplicates a saved source that normalizes to a predefined one, keeping the predefined casing", () => {
  const merged = mergeSources([...DEFAULT_SOURCES], [{ name: "linkedin" }, { name: "  LINKEDIN  " }]);

  assert.deepEqual(merged, [...DEFAULT_SOURCES]);
});

test("mergeSources keeps genuinely new saved sources alongside the predefined ones", () => {
  const merged = mergeSources([...DEFAULT_SOURCES], [{ name: "Indeed" }, { name: "Referral" }]);

  assert.deepEqual(merged, ["LinkedIn", "CareerHound", "Indeed", "Referral"]);
});

test("mergeSources orders saved extras alphabetically after the predefined sources", () => {
  const merged = mergeSources([...DEFAULT_SOURCES], [{ name: "Referral" }, { name: "Company website" }, { name: "Indeed" }]);

  assert.deepEqual(merged, ["LinkedIn", "CareerHound", "Company website", "Indeed", "Referral"]);
});

test("matchesKnownSource returns true for casing/whitespace variants of a known source", () => {
  const known = ["LinkedIn", "CareerHound"];

  assert.equal(matchesKnownSource("linkedin", known), true);
  assert.equal(matchesKnownSource("  LinkedIn  ", known), true);
  assert.equal(matchesKnownSource("CAREERHOUND", known), true);
});

test("matchesKnownSource returns false for a genuinely new value", () => {
  const known = ["LinkedIn", "CareerHound"];

  assert.equal(matchesKnownSource("Indeed", known), false);
  assert.equal(matchesKnownSource("", known), false);
});
