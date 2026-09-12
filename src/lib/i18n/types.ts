import type { en } from "@/lib/i18n/locales/en";

/**
 * Recursively expands every leaf of a locale catalog into its dot-path string, e.g.
 * "applications.form.company.label". Passing an unknown/mistyped path to t() is a compile-time
 * error instead of a silent runtime miss.
 */
type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : T[K] extends Record<string, unknown> ? `${K}.${DotPaths<T[K]>}` : never;
}[keyof T & string];

export type TranslationKey = DotPaths<typeof en>;
