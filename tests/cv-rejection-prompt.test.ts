import test from "node:test";
import assert from "node:assert/strict";
import { determineCvRejectionPromptOptions } from "@/lib/applications/cv-rejection-prompt";

test("all options are available when no other application uses the CV", () => {
  const options = determineCvRejectionPromptOptions({ otherApplicationsUsingCv: 0 });

  assert.equal(options.keep.available, true);
  assert.equal(options.unlink.available, true);
  assert.equal(options.deletePermanently.available, true);
  assert.equal(options.deletePermanently.disabledReason, undefined);
});

test("delete permanently is disabled with a reason when other applications use the CV", () => {
  const options = determineCvRejectionPromptOptions({ otherApplicationsUsingCv: 2 });

  assert.equal(options.keep.available, true);
  assert.equal(options.unlink.available, true);
  assert.equal(options.deletePermanently.available, false);
  assert.equal(options.deletePermanently.disabledReason, "Also used by 2 other applications.");
});

test("delete permanently reason uses singular wording for exactly one other application", () => {
  const options = determineCvRejectionPromptOptions({ otherApplicationsUsingCv: 1 });

  assert.equal(options.deletePermanently.available, false);
  assert.equal(options.deletePermanently.disabledReason, "Also used by 1 other application.");
});
