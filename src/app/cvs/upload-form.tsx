"use client";

import { useActionState } from "react";
import { Upload } from "lucide-react";
import { uploadCvAction, type CvUploadState } from "./actions";

const initialState: CvUploadState = {};

export function CvUploadForm() {
  const [state, formAction, pending] = useActionState(uploadCvAction, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">Upload CV</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">Upload a text-based PDF so JobHolmes can compare it against job descriptions.</p>
      {state.error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p> : null}
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-sm font-medium text-slate-700">
          CV name
          <input className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-3 focus:ring-indigo-100" maxLength={255} name="name" placeholder="Frontend EN - 2026 v2" required />
        </label>
        <label className="text-sm font-medium text-slate-700">
          PDF file
          <input accept="application/pdf,.pdf" className="mt-2 block h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700" name="file" required type="file" />
        </label>
        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto" disabled={pending} type="submit">
          <Upload aria-hidden="true" className="h-4 w-4" />
          {pending ? "Uploading..." : "Upload CV"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">PDF only. Maximum 5 MB. Scanned PDFs without extractable text are not supported.</p>
    </form>
  );
}
