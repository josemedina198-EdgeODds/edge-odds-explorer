import { TEAMS } from "@/data/matches";
import { OUTCOMES, fmtEv, fmtOdds, type MatchAnalysis, type Outcome } from "@/lib/model";
import { SectionHeading } from "./SectionHeading";

interface Props {
  analyses: MatchAnalysis[];
  selectedMatch: string;
  selectedOutcome: Outcome;
  onSelect: (matchId: string, outcome: Outcome) => void;
}

export function Crest({ short }: { short: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border-strong bg-surface text-[11px] font-bold tracking-wide text-muted-foreground">
      {short}
    </span>
  );
}

export function EvTag({ ev, size = "sm" }: { ev: number; size?: "sm" | "md" }) {
  const pos = ev >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-md border tabular font-semibold ${
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs"
      } ${
        pos
          ? "border-positive/30 bg-positive/10 text-positive"
          : "border-negative/30 bg-negative/10 text-negative"
      }`}
    >
      {fmtEv(ev)}
    </span>
  );
}

function formatKickoff(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d);
}

export function Matches({ analyses, selectedMatch, selectedOutcome, onSelect }: Props) {
  return (
    <section id="partidos" className="container-edge py-20 md:py-24">
      <SectionHeading
        eyebrow="Partidos"
        title="Elige una cuota para analizarla."
        text="Cada resultado muestra su cuota de mercado y el valor esperado según tu modelo. Toca uno para llevarlo al comparador y a la calculadora."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {analyses.map((a) => {
          const isSel = a.match.id === selectedMatch;
          const home = TEAMS[a.match.home]!;
          const away = TEAMS[a.match.away]!;
          return (
            <article
              key={a.match.id}
              className={`card-edge flex flex-col p-5 transition-shadow ${isSel ? "shadow-glow border-primary/40" : ""}`}
            >
              <div className="flex items-center justify-between text-[11px] text-subtle-foreground">
                <span className="font-medium uppercase tracking-wider">{a.match.league}</span>
                <span className="tabular">{formatKickoff(a.match.kickoff)}</span>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Crest short={home.short} />
                  <span className="truncate text-sm font-semibold">{home.name}</span>
                </div>
                <span className="text-[11px] font-medium text-subtle-foreground">vs</span>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-3 text-right">
                  <span className="truncate text-sm font-semibold">{away.name}</span>
                  <Crest short={away.short} />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-[11px] text-subtle-foreground">
                <span>
                  Goles esperados{" "}
                  <span className="tabular font-medium text-muted-foreground">
                    {a.model.lambdaHome.toFixed(2)} – {a.model.lambdaAway.toFixed(2)}
                  </span>
                </span>
                <span>
                  Margen casa{" "}
                  <span className="tabular font-medium text-muted-foreground">
                    {((a.market.overround - 1) * 100).toFixed(1)}%
                  </span>
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {OUTCOMES.map((o) => {
                  const oa = a.outcomes[o];
                  const active = isSel && selectedOutcome === o;
                  const best = a.best === o && oa.ev > 0;
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => onSelect(a.match.id, o)}
                      aria-pressed={active}
                      className={`group relative flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 transition-colors ${
                        active
                          ? "border-foreground/60 bg-surface-raised"
                          : "border-border bg-surface hover:border-border-strong hover:bg-surface-raised"
                      }`}
                    >
                      {best && (
                        <span className="absolute -top-2 rounded-full bg-primary px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                          Mejor
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-subtle-foreground">{oa.code}</span>
                      <span className="tabular text-lg font-semibold tracking-tight">{fmtOdds(oa.odds)}</span>
                      <EvTag ev={oa.ev} />
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
