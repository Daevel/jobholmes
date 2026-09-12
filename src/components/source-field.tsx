"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { formStyles } from "@/components/form-ui";
import { matchesKnownSource, normalizeSourceName } from "@/lib/applications/sources";
import { t } from "@/lib/i18n/translate";

const OTHER_VALUE = "__other__";

export type SourceFieldHandle = {
  /** Applies an externally suggested source value, but only into an empty field. */
  applySuggestion: (value: string) => void;
};

type Mode = "known" | "other";

/**
 * Uncontrolled by design: the <select> and <input> below own their own DOM value via
 * defaultValue, so any parent form mechanism (native FormData, a server action, or a plain
 * useState-driven fetch) picks up "source" (and "saveSource") automatically without special
 * wiring. Only the active field ever carries name="source" at a given time, so FormData never
 * sees two "source" entries at once.
 */
export const SourceField = forwardRef<SourceFieldHandle, { sources: string[]; defaultValue?: string }>(function SourceField({ sources, defaultValue }, ref) {
  const canonicalDefault = defaultValue ? sources.find((source) => normalizeSourceName(source) === normalizeSourceName(defaultValue)) : undefined;
  const initialMode: Mode = !defaultValue || canonicalDefault ? "known" : "other";

  const [mode, setMode] = useState<Mode>(initialMode);
  const selectRef = useRef<HTMLSelectElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    applySuggestion(value: string) {
      const suggested = value.trim();
      if (!suggested) return;

      const currentValue = (mode === "known" ? selectRef.current?.value : otherInputRef.current?.value) ?? "";
      if (currentValue.trim() !== "") return;

      if (matchesKnownSource(suggested, sources)) {
        const matched = sources.find((source) => normalizeSourceName(source) === normalizeSourceName(suggested)) ?? suggested;
        if (selectRef.current) selectRef.current.value = matched;
        setMode("known");
      } else {
        if (otherInputRef.current) otherInputRef.current.value = suggested;
        setMode("other");
      }
    },
  }), [mode, sources]);

  function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setMode(event.target.value === OTHER_VALUE ? "other" : "known");
  }

  return (
    <div>
      <label className={formStyles.label}>
        {t("applications.form.sourceField.label")}
        <select
          className={formStyles.input}
          defaultValue={mode === "known" ? (canonicalDefault ?? "") : OTHER_VALUE}
          name={mode === "known" ? "source" : undefined}
          onChange={handleSelectChange}
          ref={selectRef}
        >
          <option value="">{t("applications.form.sourceField.selectPlaceholder")}</option>
          {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          <option value={OTHER_VALUE}>{t("applications.form.sourceField.otherOption")}</option>
        </select>
      </label>
      <div aria-live="polite" className="mt-3 space-y-2" hidden={mode !== "other"}>
        <label className={formStyles.label}>
          {t("applications.form.sourceField.newSourceLabel")}
          <input
            className={formStyles.input}
            defaultValue={initialMode === "other" ? defaultValue ?? "" : ""}
            name={mode === "other" ? "source" : undefined}
            placeholder={t("applications.form.sourceField.newSourcePlaceholder")}
            ref={otherInputRef}
            type="text"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500" disabled={mode !== "other"} name="saveSource" type="checkbox" />
          {t("applications.form.sourceField.saveSourceLabel")}
        </label>
      </div>
    </div>
  );
});
