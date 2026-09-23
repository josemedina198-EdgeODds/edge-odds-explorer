import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import {
  OUTCOMES,
  fmtEv,
  fmtMoney,
  fmtOdds,
  fmtPct,
  type MatchAnalysis,
  type Outcome,
  type SimulationResult,
} from "@/lib/model";

interface Props {
  analysis: MatchAnalysis;
  selectedOutcome: Outcome;
  bankroll: number;
  sim: SimulationResult;
}

function buildSummary({ analysis, selectedOutcome, bankroll, sim }: Props): string {
  const m = analysis.match;
  const oa = analysis.outcomes[selectedOutcome];
  const stake = bankroll * oa.kelly;
  const lines: string[] = [];
  lines.push("OddsEdge — Resumen de análisis");
  lines.push(`Generado: ${new Date().toLocaleString("es-ES")}`);
  lines.push("");
  lines.push(`Partido: ${m.home.name} vs ${m.away.name}`);
  lines.push(`Competición: ${m.league}`);
  lines.push(`Comienzo: ${new Date(m.kickoff).toLocaleString("es-ES")}`);
  lines.push(`Goles esperados: ${m.home.name} ${analysis.model.lambdaHome.toFixed(2)} — ${m.away.name} ${analysis.model.lambdaAway.toFixed(2)}`);
  lines.push("");
  lines.push("Resultado | Cuota | Prob. modelo | Prob. mercado | Valor esperado");
  for (const o of OUTCOMES) {
    const x = analysis.outcomes[o];
    lines.push(
      `${x.code} ${x.label} | ${fmtOdds(x.odds)} | ${fmtPct(x.modelProb)} | ${fmtPct(x.marketProb)} | ${fmtEv(x.ev)}`,
    );
  }
  if (m.bestOdds && (m.bookmakerCount ?? 0) > 1) {
    lines.push("");
    lines.push("Mejor cuota disponible:");
    for (const o of OUTCOMES) {
      const b = m.bestOdds[o];
      lines.push(`${analysis.outcomes[o].code} → ${fmtOdds(b.odds)} (${b.book})`);
    }
  }
  lines.push("");
  lines.push(`Selección: ${oa.code} ${oa.label} @ ${fmtOdds(oa.odds)}`);
  lines.push(`Banca: ${fmtMoney(bankroll)} u`);
  lines.push(`Stake sugerido: ${fmtMoney(stake)} u (${fmtPct(oa.kelly)} de la banca)`);
  lines.push("");
  lines.push(`Simulación: ${sim.sims} series de ${sim.bets} apuestas`);
  lines.push(`Banca final mediana: ${fmtMoney(sim.medianFinal)} u`);
  lines.push(`Probabilidad de beneficio: ${fmtPct(sim.probProfit, 0)}`);
  lines.push(`Caída máxima típica: ${fmtPct(sim.medianMaxDrawdown, 0)}`);
  lines.push(`Rango 10–90%: ${fmtMoney(sim.p10Final)} – ${fmtMoney(sim.p90Final)} u`);
  return lines.join("\n");
}

export function Exportar(props: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => buildSummary(props), [props]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oddsedge-${props.analysis.match.home.short}-${props.analysis.match.away.short}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-strong bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-raised"
      >
        <Download className="size-4" /> Exportar análisis
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <textarea
            readOnly
            value={text}
            rows={12}
            className="tabular w-full resize-y rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button
              type="button"
              onClick={download}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong bg-card px-4 text-sm font-medium transition-colors hover:bg-surface-raised"
            >
              <Download className="size-4" /> Descargar .txt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
