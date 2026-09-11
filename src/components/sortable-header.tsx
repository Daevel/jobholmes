import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { SortDirection, SortField } from "@/lib/applications/sort-order";

type PreservedParams = {
  q?: string;
  stage?: string;
  match?: string;
  outcome?: string;
};

export function SortableHeader({
  label,
  field,
  currentField,
  currentDirection,
  preservedParams,
  className = "",
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  currentDirection: SortDirection;
  preservedParams: PreservedParams;
  className?: string;
}) {
  const isActive = field === currentField;
  const nextDirection: SortDirection = isActive && currentDirection === "asc" ? "desc" : "asc";
  const href = buildSortHref(preservedParams, field, nextDirection);

  return (
    <th aria-sort={isActive ? (currentDirection === "asc" ? "ascending" : "descending") : "none"} className={className} scope="col">
      <Link className="inline-flex items-center gap-1 rounded outline-none transition hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500" href={href}>
        {label}
        {isActive ? (
          currentDirection === "asc" ? <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" /> : <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5 text-slate-300" />
        )}
      </Link>
    </th>
  );
}

function buildSortHref(preservedParams: PreservedParams, field: SortField, direction: SortDirection) {
  const searchParams = new URLSearchParams();
  if (preservedParams.q) searchParams.set("q", preservedParams.q);
  if (preservedParams.stage) searchParams.set("stage", preservedParams.stage);
  if (preservedParams.match) searchParams.set("match", preservedParams.match);
  if (preservedParams.outcome) searchParams.set("outcome", preservedParams.outcome);
  searchParams.set("sort", field);
  searchParams.set("dir", direction);
  return `/applications?${searchParams.toString()}`;
}
