import test from "node:test";
import assert from "node:assert/strict";
import { findMissingMigrations } from "../scripts/lib/diff-migrations";

test("returns an empty list when every expected migration is applied", () => {
  assert.deepEqual(findMissingMigrations(["a", "b", "c"], ["a", "b", "c"]), []);
});

test("returns the expected migrations that are not in the applied list", () => {
  assert.deepEqual(findMissingMigrations(["a", "b", "c"], ["a"]), ["b", "c"]);
});

test("returns everything expected when nothing has been applied yet", () => {
  assert.deepEqual(findMissingMigrations(["a", "b", "c"], []), ["a", "b", "c"]);
});

test("returns an empty list when nothing is expected, regardless of what is applied", () => {
  assert.deepEqual(findMissingMigrations([], ["a", "b"]), []);
});

test("the order of the applied list does not affect the result", () => {
  assert.deepEqual(findMissingMigrations(["a", "b", "c"], ["c", "a"]), ["b"]);
  assert.deepEqual(findMissingMigrations(["a", "b", "c"], ["a", "c"]), ["b"]);
});

test("preserves the order of expectedIds in the result", () => {
  assert.deepEqual(findMissingMigrations(["c", "a", "b"], []), ["c", "a", "b"]);
});
