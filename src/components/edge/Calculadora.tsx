import { useMemo } from "react";
import { TEAMS } from "@/data/matches";
import { KELLY_CAP, fmtMoney, fmtOdds, fmtPct, simulateKelly, type MatchAnalysis, type Outcome } from "@/lib/model";
import { SectionHeading } from "./SectionHeading";
import { EvTag } from "./Matches";

interface Props {
  analysis: MatchAnalysis;
  selectedOutcome: Outcome;
  bankroll: number;
  onBankroll: (v: number) => void;
}

export function Calculadora({ analysis, selectedOutcome, bankroll, onBankroll }: Props) {
  const oa = analysis.outcomes[selectedOutcome];
  const stake = bankroll * oa.kelly;
  const home = TEAMS[analysis.match.home]!;
  const away = TEAMS[analysis.match.away]!;

  const sim = useMemo(
    () => simulateKelly({ bankroll: Math.max(bankroll, 0), p: oa.modelProb, odds: oa.odds, fraction: oa.kelly }),
    [bankroll, oa.modelProb, oa.odds, oa.kelly],
  );

  const pct = Math.min(100, Math.max(0, (bankroll / 1000) * 100));

  return (
    <section id="calculadora" className="border-t border-border bg-card/40">
      <div className="container-edge py-20 md:py-24">
        <SectionHeading
          eyebrow="Calculadora"
          title="Cuánto apostar y qué esperar."
          text="Ajusta tu banca. La apuesta sugerida y la simulación se recalculan al instante para la cuota seleccionada."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="card-edge flex flex-col p-6 md:p-8">
            <p className="eyebrow">Selección</p>
            <p className="mt-2 text-sm font-semibold">
              {home.name} <span className="text-subtle-foreground">vs</span> {away.name}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-bold text-foreground">
                {oa.code}
              </span>
              <span>{oa.label}</span>
              <span className="text-subtle-foreground">·</span>
              <span className="tabular">cuota {fmtOdds(oa.odds)}</span>
              <EvTag ev={oa.ev} />
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <label htmlFor="bankroll" className="text-sm font-medium">
                  Banca
                </label>
                <div className="flex items-center rounded-md border border-border-strong bg-surface">
                  <input
                    id="bankroll"
                    type="number"
                    min={0}
                    max={1000}
                    value={bankroll}
                    onChange={(e) => onBankroll(clamp(Number(e.target.value)))}
                    className="tabular w-24 bg-transparent px-3 py-1.5 text-right text-sm font-semibold outline-none"
                  />
                  <span className="pr-3 text-xs text-subtle-foreground">u</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={1000}
                step={5}
                value={bankroll}
                onChange={(e) => onBankroll(Number(e.target.value))}
                aria-label="Banca"
                className="range-edge mt-4"
                style={{ ["--range-progress" as string]: `${pct}%` }}
              />
              <div className="mt-2 flex justify-between text-[11px] tabular text-subtle-foreground">
                <span>0</span>
                <span>500</span>
                <span>1000</span>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-border bg-surface p-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">Apuesta sugerida</p>
              <p className={`mt-2 tabular text-5xl font-semibold tracking-tight ${stake > 0 ? "text-positive" : "text-muted-foreground"}`}>
                {fmtMoney(stake)}
                <span className="ml-1 text-lg font-medium text-subtle-foreground">u</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {stake > 0 ? (
                  <>
                    {fmtPct(oa.kelly)} de tu banca
                    {oa.kelly >= KELLY_CAP && <> · límite de seguridad {fmtPct(KELLY_CAP, 0)}</>}
                  </>
                ) : (
                  "Sin valor en esta cuota: no se recomienda apostar."
                )}
              </p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <Kv label="Ganancia si acierta" value={`+${fmtMoney(stake * (oa.odds - 1))} u`} />
              <Kv label="Pérdida si falla" value={`−${fmtMoney(stake)} u`} />
            </dl>
          </div>

          <div className="card-edge p-6 md:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="eyebrow">Simulación</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {sim.sims.toLocaleString("es-ES")} series de {sim.bets} apuestas con esta cuota y esta apuesta.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-px w-5 bg-primary" /> Mediana
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-px w-5 bg-chart-market" /> Series
                </span>
              </div>
            </div>

            <div className="mt-6">
              <PathsChart sim={sim} start={bankroll} />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
              <StatBox label="Banca final mediana" value={`${fmtMoney(sim.medianFinal)} u`} tone={sim.medianFinal > bankroll ? "pos" : sim.medianFinal < bankroll ? "neg" : undefined} />
              <StatBox label="Prob. de beneficio" value={fmtPct(sim.probProfit, 0)} tone={sim.probProfit > 0.5 ? "pos" : undefined} />
              <StatBox label="Caída máx. típica" value={`−${fmtPct(sim.medianMaxDrawdown, 0)}`} tone={sim.medianMaxDrawdown > 0 ? "neg" : undefined} />
              <StatBox label="Rango 10–90 %" value={`${fmtMoney(sim.p10Final)} – ${fmtMoney(sim.p90Final)}`} />
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function clamp(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.min(1000, Math.max(0, v));
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-subtle-foreground">{label}</dt>
      <dd className="tabular mt-1 font-medium">{value}</dd>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" | undefined }) {
  return (
    <div className="bg-card p-4">
      <dt className="text-[11px] text-subtle-foreground">{label}</dt>
      <dd className={`tabular mt-1.5 text-base font-semibold tracking-tight ${tone === "pos" ? "text-positive" : tone === "neg" ? "text-negative" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function PathsChart({ sim, start }: { sim: ReturnType<typeof simulateKelly>; start: number }) {
  const W = 640;
  const H = 260;
  const pad = { top: 12, right: 12, bottom: 28, left: 52 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;

  // Log scale so a few runaway series don't flatten the rest.
  const lg = (v: number) => Math.log(Math.max(v, 0.01));
  const all = sim.paths.flat().concat(sim.medianPath);
  const minV = lg(Math.min(...all, start));
  const maxV = Math.max(lg(Math.max(...all, start * 1.1)), minV + 0.1);
  const x = (i: number) => pad.left + (i / sim.bets) * innerW;
  const y = (v: number) => pad.top + innerH - ((lg(v) - minV) / (maxV - minV)) * innerH;
  const line = (p: number[]) => p.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const ticks = Array.from({ length: 4 }, (_, i) => Math.exp(minV + ((maxV - minV) / 3) * i));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Simulación de banca">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeDasharray="2 4" />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-subtle-foreground)">
            {fmtMoney(t)}
          </text>
        </g>
      ))}
      <line x1={pad.left} x2={W - pad.right} y1={y(start)} y2={y(start)} stroke="var(--color-border-strong)" />
      {sim.paths.map((p, i) => (
        <path key={i} d={line(p)} fill="none" stroke="var(--color-chart-market)" strokeWidth={1} opacity={0.35} />
      ))}
      <path d={line(sim.medianPath)} fill="none" stroke="var(--color-primary)" strokeWidth={2.2} />
      {[0, 25, 50, 75, 100].map((n) => (
        <text key={n} x={x(n)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-subtle-foreground)">
          {n}
        </text>
      ))}
    </svg>
  );
}
