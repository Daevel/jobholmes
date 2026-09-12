import test from "node:test";
import assert from "node:assert/strict";
import { en } from "@/lib/i18n/locales/en";
import { defaultLocale, getDictionary, t } from "@/lib/i18n/translate";
import type { TranslationKey } from "@/lib/i18n/types";

test("t() resolves a known key from the en catalog", () => {
  assert.equal(t("applications.form.company.label"), "Company");
  assert.equal(t("common.actions.cancel"), "Cancel");
});

test("t() falls back to a visible marker instead of undefined for a missing key", () => {
  const missingKey = "applications.form.company.doesNotExist" as TranslationKey;

  assert.equal(t(missingKey), `[[missing:${missingKey}]]`);
});

test("getDictionary() with no argument returns the default (en) catalog", () => {
  assert.equal(getDictionary(), en);
});

test("getDictionary() with an unrecognized locale returns the default catalog", () => {
  assert.equal(getDictionary("fr"), en);
  assert.equal(defaultLocale, "en");
});
