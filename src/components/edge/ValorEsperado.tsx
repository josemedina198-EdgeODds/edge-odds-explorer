import { OUTCOMES, fmtOdds, fmtPct, type MatchAnalysis, type Outcome } from "@/lib/model";
import { SectionHeading } from "./SectionHeading";
import { EvTag } from "./Matches";
import { Check } from "lucide-react";
import { Ayuda } from "./Ayuda";
import { MejorCuota } from "./MejorCuota";

interface Props {
  analysis: MatchAnalysis;
  selectedOutcome: Outcome;
  onSelectOutcome: (o: Outcome) => void;
}

export function ValorEsperado({ analysis, selectedOutcome, onSelectOutcome }: Props) {
  const rows = [...OUTCOMES].sort((a, b) => analysis.outcomes[b].ev - analysis.outcomes[a].ev);
  const bestHasValue = analysis.outcomes[analysis.best].ev > 0;

  return (
    <section id="valor-esperado" className="container-edge py-20 md:py-24">
      <SectionHeading
        eyebrow="Valor esperado"
        title="Cuánto vale cada cuota."
        text="Ganancia o pérdida media estimada como porcentaje de lo apostado, usando cuotas de consenso. Un valor positivo depende de que la probabilidad asumida sea correcta; no garantiza beneficio."
      />

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>Valor esperado<Ayuda topic="ev" /></span><span>Cuota decimal<Ayuda topic="cuota" /></span><span>Probabilidad del mercado<Ayuda topic="mercado" /></span></div>
      <div className="card-edge mt-6 overflow-hidden">
        <div className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-border px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-subtle-foreground md:grid">
          <span>Resultado</span>
          <span className="text-right">Tu probabilidad</span>
          <span className="text-right">Mercado</span>
          <span className="text-right">Cuota</span>
          <span className="text-right">Valor esperado</span>
          <span className="w-20" />
        </div>
        {rows.map((o) => {
          const oa = analysis.outcomes[o];
          const isBest = analysis.best === o && bestHasValue;
          const isSel = selectedOutcome === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onSelectOutcome(o)}
              className={`grid w-full grid-cols-2 gap-x-4 gap-y-3 border-b border-border px-6 py-5 text-left transition-colors last:border-b-0 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] md:items-center md:gap-4 ${
                isSel ? "bg-surface" : "hover:bg-surface/60"
              } ${isBest ? "border-l-2 border-l-primary" : ""}`}
            >
              <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                <span className="grid size-8 place-items-center rounded-md border border-border bg-surface text-xs font-bold text-muted-foreground">
                  {oa.code}
                </span>
                <div>
                  <p className="text-sm font-semibold">{oa.label}</p>
                  {isBest && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-positive">
                      <Check className="size-3" /> Mejor opción con valor
                    </p>
                  )}
                </div>
              </div>
              <Cell label="Tu probabilidad" value={fmtPct(oa.modelProb)} strong />
              <Cell label="Mercado" value={fmtPct(oa.marketProb)} />
              <Cell label="Cuota" value={fmtOdds(oa.odds)} />
              <div className="flex items-center justify-between md:justify-end">
                <span className="text-[11px] text-subtle-foreground md:hidden">Valor esperado</span>
                <EvTag ev={oa.ev} size="md" />
              </div>
              <span
                className={`col-span-2 text-center text-xs font-medium md:col-span-1 md:w-20 md:text-right ${
                  isSel ? "text-foreground" : "text-subtle-foreground"
                }`}
              >
                {isSel ? "Seleccionado" : "Seleccionar"}
              </span>
            </button>
          );
        })}
      </div>
      {!bestHasValue && (
        <p className="mt-4 text-sm text-muted-foreground">
          El consenso no ofrece valor positivo bajo este modelo. La calculadora también permite comparar la mejor cuota disponible: puede producir un resultado distinto. No apostar sigue siendo una opción.
        </p>
      )}

      <div className="mt-6">
        <MejorCuota analysis={analysis} />
      </div>
    </section>
  );
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between md:block md:text-right">
      <span className="text-[11px] text-subtle-foreground md:hidden">{label}</span>
      <span className={`tabular text-sm ${strong ? "font-semibold" : "text-muted-foreground"}`}>{value}</span>
    </div>
  );
}
