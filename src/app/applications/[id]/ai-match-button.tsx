"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export function AiMatchButton({ applicationId, disabled, label = "Analyze match" }: { applicationId: string; disabled?: boolean; label?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (pending || disabled) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/applications/${applicationId}/ai-match`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "JobHolmes could not analyze this match. Please try again.");
      window.location.reload();
    } catch (matchError) {
      setError(matchError instanceof Error ? matchError.message : "JobHolmes could not analyze this match. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={disabled || pending} onClick={analyze} type="button">
        <Sparkles aria-hidden="true" className="h-4 w-4" />
        {pending ? "Analyzing..." : label}
      </button>
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
