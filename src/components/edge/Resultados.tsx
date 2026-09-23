import { OUTCOME_CODE, type Outcome } from "@/lib/model";
import type { FinishedMatch } from "@/lib/oddsApi";
import type { PredictionMap } from "@/lib/predictions";
import { SectionHeading } from "./SectionHeading";

interface Props {
  finished: FinishedMatch[];
  predictions: PredictionMap;
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function Resultados({ finished, predictions }: Props) {
  return (
    <section id="resultados" className="border-y border-border bg-card/40">
      <div className="container-edge py-20 md:py-24">
        <SectionHeading
          eyebrow="Resultados"
          title="Cómo le fue a tu modelo."
          text="Partidos ya terminados con su marcador final y el resultado real. Si el modelo había marcado una favorita, se compara contra lo que pasó."
        />

        {finished.length === 0 ? (
          <p className="mt-8 rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted-foreground">
            Sin partidos finalizados aún.
          </p>
        ) : (
          <ul className="card-edge mt-10 divide-y divide-border overflow-hidden">
            {finished.map((f) => {
              const pred = predictions[f.id] as Outcome | undefined;
              const hit = pred ? pred === f.result : null;
              return (
                <li key={f.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center md:px-6">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {f.home} <span className="text-subtle-foreground">vs</span> {f.away}
                    </p>
                    <p className="mt-0.5 text-[11px] text-subtle-foreground">
                      {f.league} · {fmtDate(f.kickoff)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular text-lg font-semibold tracking-tight">
                      {f.homeGoals} – {f.awayGoals}
                    </span>
                    <span className="grid size-7 place-items-center rounded-md border border-border bg-surface text-[11px] font-bold text-muted-foreground">
                      {OUTCOME_CODE[f.result]}
                    </span>
                  </div>
                  <div className="md:w-24 md:text-right">
                    {hit === null ? (
                      <span className="text-[11px] text-subtle-foreground">Sin pronóstico</span>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                          hit
                            ? "border-positive/30 bg-positive/10 text-positive"
                            : "border-negative/30 bg-negative/10 text-negative"
                        }`}
                      >
                        {hit ? "Acierto" : "Falló"}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
