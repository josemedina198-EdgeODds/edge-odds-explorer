import { OUTCOMES, fmtOdds, type MatchAnalysis } from "@/lib/model";

export function MejorCuota({ analysis }: { analysis: MatchAnalysis }) {
  const best = analysis.match.bestOdds;
  const enough = best && (analysis.match.bookmakerCount ?? 0) > 1;

  return (
    <div className="card-edge p-5 md:p-6">
      <p className="eyebrow">Mejor cuota disponible</p>
      {!enough ? (
        <p className="mt-3 text-sm text-muted-foreground">Datos insuficientes.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {OUTCOMES.map((o) => {
            const oa = analysis.outcomes[o];
            const b = best[o];
            const better = b.odds > oa.odds;
            return (
              <li key={o} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-surface text-[11px] font-bold text-muted-foreground">
                    {oa.code}
                  </span>
                  <span className="truncate text-sm">{b.book || "—"}</span>
                </div>
                <div className="flex shrink-0 items-baseline gap-2">
                  <span className="tabular text-xs text-subtle-foreground">consenso {fmtOdds(oa.odds)}</span>
                  <span className={`tabular text-base font-semibold ${better ? "text-positive" : ""}`}>
                    {fmtOdds(b.odds)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
