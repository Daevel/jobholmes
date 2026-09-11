"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AI_MATCH_UNANALYZED } from "@/lib/applications/ai-match";
import { matchLabels, stageLabels } from "@/lib/applications/display";

const SEARCH_DEBOUNCE_MS = 350;

export function ApplicationsFilters({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const rawStage = searchParams.get("stage") ?? "";
  const selectedStage = rawStage in stageLabels ? rawStage : "";
  const rawMatch = searchParams.get("match") ?? "";
  const selectedMatch = rawMatch === AI_MATCH_UNANALYZED || rawMatch in matchLabels ? rawMatch : "";

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function updateSearchParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const queryString = next.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateSearchParams({ q: value.trim() || null }), SEARCH_DEBOUNCE_MS);
  }

  return (
    <>
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:grid-cols-[1fr_180px_180px]">
        <label className="text-sm font-medium text-slate-700">
          Search company or role
          <input
            aria-label="Search company or role"
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
            onChange={handleSearchChange}
            placeholder="Company or role"
            type="search"
            value={searchValue}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Stage
          <select
            aria-label="Filter by stage"
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
            onChange={(event) => updateSearchParams({ stage: event.target.value || null })}
            value={selectedStage}
          >
            <option value="">Any stage</option>
            {Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          AI Match
          <select
            aria-label="Filter by AI match"
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100"
            onChange={(event) => updateSearchParams({ match: event.target.value || null })}
            value={selectedMatch}
          >
            <option value="">Any AI match</option>
            {Object.entries(matchLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            <option value={AI_MATCH_UNANALYZED}>Not analyzed</option>
          </select>
        </label>
      </div>
      <div aria-busy={isPending} className={`transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}>
        {children}
      </div>
    </>
  );
}
