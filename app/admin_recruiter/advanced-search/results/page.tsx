import { Suspense } from "react";
import ResultsClient from "./ResultsClient";

export default function AdvancedSearchResultsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading…</div>}>
      <ResultsClient />
    </Suspense>
  );
}
