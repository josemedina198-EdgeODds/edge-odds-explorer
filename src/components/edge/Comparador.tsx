import { OUTCOMES, fmtPct, type MatchAnalysis, type Outcome } from "@/lib/model";
import { SectionHeading } from "./SectionHeading";
import { Crest } from "./Matches";
import { RefreshCw } from "lucide-react";

interface Props {
  analysis: MatchAnalysis;
  selectedOutcome: Outcome;
  onSelectOutcome: (o: Outcome) => void;
  onAnalyze: () => void;
  runKey: number;
}

export function Comparador({ analysis, selectedOutcome, onSelectOutcome, onAnalyze, runKey }: Props) {
  const home = analysis.match.home;
  const away = analysis.match.away;

  return (
    <section id="comparador" className="border-y border-border bg-card/40">
      <div className="container-edge py-20 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Comparador"
              title="Tu modelo frente al mercado."
              text="Las barras muestran la probabilidad que asigna tu modelo a cada resultado junto a la probabilidad justa del mercado, ya sin el margen de la casa."
            />
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
              <Crest short={home.short} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {home.name} <span className="text-subtle-foreground">vs</span> {away.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Resultado más probable{" "}
                  <span className="tabular font-medium text-foreground">
                    {analysis.model.mostLikelyScore.home}–{analysis.model.mostLikelyScore.away}
                  </span>{" "}
                  · {fmtPct(analysis.model.mostLikelyScore.p)}
                </p>
              </div>
              <Crest short={away.short} />
            </div>

            <div className="mt-6 flex items-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-chart-model" /> Tu modelo
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-sm bg-chart-market" /> Mercado
              </span>
            </div>

            <button
              type="button"
              onClick={onAnalyze}
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-4" /> Analizar partido
            </button>
          </div>

          <div className="card-edge p-6 md:p-8">
            <GroupedBars analysis={analysis} selected={selectedOutcome} onSelect={onSelectOutcome} runKey={runKey} />
          </div>
        </div>
      </div>
    </section>
  );
}

function GroupedBars({
  analysis,
  selected,
  onSelect,
  runKey,
}: {
  analysis: MatchAnalysis;
  selected: Outcome;
  onSelect: (o: Outcome) => void;
  runKey: number;
}) {
  const W = 600;
  const H = 320;
  const pad = { top: 24, right: 8, bottom: 56, left: 44 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const maxP = Math.max(
    0.5,
    ...OUTCOMES.flatMap((o) => [analysis.outcomes[o].modelProb, analysis.outcomes[o].marketProb]),
  );
  const yMax = Math.ceil((maxP + 0.05) * 10) / 10;
  const groupW = innerW / 3;
  const barW = Math.min(64, groupW * 0.3);
  const gap = 8;
  const y = (p: number) => pad.top + innerH - (p / yMax) * innerH;
  const ticks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Comparación de probabilidades">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeDasharray={t === 0 ? undefined : "2 4"} />
          <text x={pad.left - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-subtle-foreground)" className="tabular">
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      {OUTCOMES.map((o, i) => {
        const oa = analysis.outcomes[o];
        const cx = pad.left + groupW * i + groupW / 2;
        const xModel = cx - barW - gap / 2;
        const xMarket = cx + gap / 2;
        const isSel = selected === o;
        const hasEdge = oa.edge > 0;
        return (
          <g key={o} onClick={() => onSelect(o)} className="cursor-pointer">
            {isSel && (
              <rect x={pad.left + groupW * i + 6} y={pad.top - 8} width={groupW - 12} height={innerH + 8 + 40} rx={10} fill="var(--color-surface)" />
            )}
            <g key={`${runKey}-${o}`} className="animate-bar" style={{ transformBox: "fill-box", animationDelay: `${i * 80}ms` }}>
              <rect x={xModel} y={y(oa.modelProb)} width={barW} height={innerH - (y(oa.modelProb) - pad.top)} rx={4} fill="var(--color-chart-model)" opacity={hasEdge ? 1 : 0.55} />
            </g>
            <g key={`${runKey}-${o}-m`} className="animate-bar" style={{ transformBox: "fill-box", animationDelay: `${i * 80 + 60}ms` }}>
              <rect x={xMarket} y={y(oa.marketProb)} width={barW} height={innerH - (y(oa.marketProb) - pad.top)} rx={4} fill="var(--color-chart-market)" />
            </g>
            <text x={xModel + barW / 2} y={y(oa.modelProb) - 8} textAnchor="middle" fontSize="12" fontWeight={600} fill="var(--color-foreground)" className="tabular">
              {fmtPct(oa.modelProb)}
            </text>
            <text x={xMarket + barW / 2} y={y(oa.marketProb) - 8} textAnchor="middle" fontSize="12" fill="var(--color-muted-foreground)" className="tabular">
              {fmtPct(oa.marketProb)}
            </text>
            <text x={cx} y={H - 30} textAnchor="middle" fontSize="13" fontWeight={600} fill={isSel ? "var(--color-foreground)" : "var(--color-muted-foreground)"}>
              {oa.code} · {oa.label.length > 16 ? oa.label.slice(0, 15) + "…" : oa.label}
            </text>
            <text x={cx} y={H - 12} textAnchor="middle" fontSize="11" fontWeight={600} fill={hasEdge ? "var(--color-positive)" : "var(--color-subtle-foreground)"} className="tabular">
              {hasEdge ? `Ventaja +${(oa.edge * 100).toFixed(1)} pts` : `Sin ventaja ${(oa.edge * 100).toFixed(1)} pts`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
