import { en } from "@/lib/i18n/locales/en";
import type { TranslationKey } from "@/lib/i18n/types";

/**
 * Convention for this and every future JobHolmes flow: new user-facing copy is added to
 * src/lib/i18n/locales/<locale>.ts and read through t() with a semantic key — never written as a
 * literal string directly in a component, page, server action, or Zod schema. The only accepted
 * exception is non-visible technical text (e.g. an aria-label that only restates text already
 * passed through t() a few lines above) where routing it through the catalog adds indirection
 * without benefit; such exceptions should stay rare and obvious at the call site.
 *
 * Only "en" exists today, so t()/getDictionary() always resolve to it. There is no React
 * Context/Provider here on purpose: with a single statically-known locale, Server and Client
 * Components can both just import and call these as plain functions.
 *
 * Future extension point (not implemented here): once a second locale exists with per-request
 * resolution (e.g. from a cookie or Accept-Language header), a Server Component/layout should
 * resolve the locale once, call getDictionary(resolvedLocale), and pass the resulting Dictionary
 * down as a prop for Server Components and through a Context for Client Components — instead of
 * every module importing `en` implicitly the way it does today.
 */

export type Dictionary = typeof en;

export const defaultLocale = "en";

const dictionaries: Record<string, Dictionary> = { en };

export function getDictionary(locale?: string): Dictionary {
  if (locale && locale in dictionaries) return dictionaries[locale];
  return dictionaries[defaultLocale];
}

export function t(key: TranslationKey, dict: Dictionary = en): string {
  const value = resolvePath(dict, key);
  if (typeof value === "string") return value;

  if (process.env.NODE_ENV !== "production") {
    console.warn(`[i18n] Missing key "${key}" in locale "${localeNameOf(dict)}", falling back to "${defaultLocale}"`);
  }

  const fallback = resolvePath(en, key);
  if (typeof fallback === "string") return fallback;

  return `[[missing:${key}]]`;
}

function resolvePath(dict: Dictionary, key: string): unknown {
  return key.split(".").reduce<unknown>((node, segment) => {
    if (node && typeof node === "object" && segment in node) return (node as Record<string, unknown>)[segment];
    return undefined;
  }, dict);
}

function localeNameOf(dict: Dictionary): string {
  return Object.entries(dictionaries).find(([, candidate]) => candidate === dict)?.[0] ?? "unknown";
}
