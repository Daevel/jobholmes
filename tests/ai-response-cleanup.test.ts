import test from "node:test";
import assert from "node:assert/strict";
import { selectOpenaiResponseIdsToDelete } from "@/lib/ai/response-cleanup";

test("returns the openaiResponseId of every message that has one", () => {
  const messages = [{ openaiResponseId: "resp_1" }, { openaiResponseId: "resp_2" }];
  assert.deepEqual(selectOpenaiResponseIdsToDelete(messages), ["resp_1", "resp_2"]);
});

test("drops user messages, which never have an openaiResponseId", () => {
  const messages = [{ openaiResponseId: null }, { openaiResponseId: "resp_1" }, { openaiResponseId: null }];
  assert.deepEqual(selectOpenaiResponseIdsToDelete(messages), ["resp_1"]);
});

test("returns an empty list for an empty conversation", () => {
  assert.deepEqual(selectOpenaiResponseIdsToDelete([]), []);
});

test("returns an empty list when no message has a response id", () => {
  const messages = [{ openaiResponseId: null }, { openaiResponseId: null }];
  assert.deepEqual(selectOpenaiResponseIdsToDelete(messages), []);
});
