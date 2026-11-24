import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { OUTCOMES, fmtEv, fmtCOP, fmtOdds, fmtPct, type MatchAnalysis, type Outcome, type PythonSimulation, type DecisionResult } from '@/lib/model';
import { Button } from '@/components/ui/button';
interface Props { analysis: MatchAnalysis; selectedOutcome: Outcome; bankroll: number; sim: PythonSimulation; decision: DecisionResult; odds: number; mode: 'kelly' | 'custom'; }
export function buildSummary({ analysis: a, selectedOutcome, bankroll, sim, decision, odds, mode }: Props): string {
  const m = a.match;
  const lines = ['OddsEdge — Escenarios de apuestas en COP', `Partido: ${m.home.name} vs ${m.away.name}`, `Competición: ${m.league}`, `Inicio: ${new Date(m.kickoff).toLocaleString('es-CO')}`, `Datos: ${a.model.source === 'form' ? 'DEMO: estadísticas y cuotas ficticias' : 'Cuotas recibidas de The Odds API (consultar hora por casa)'}`, 'Motor: Python / NumPy en el navegador mediante Pyodide.', 'Probabilidades: ajustadas al propio mercado en vivo; no son un pronóstico independiente.', '', 'Resultado | Cuota consenso | Prob. modelo | Prob. mercado | Valor esperado'];
  for (const o of OUTCOMES) { const x = a.outcomes[o]; lines.push(`${x.code} ${x.label} | ${fmtOdds(x.odds)} | ${fmtPct(x.modelProb)} | ${fmtPct(x.marketProb)} | ${fmtEv(x.ev)}`); }
  lines.push('', 'Cuotas reales por casa:');
  for (const b of m.bookmakers ?? []) lines.push(`${b.title} | ${OUTCOMES.map(o => b.odds[o] === undefined ? '—' : fmtOdds(b.odds[o] ?? 0)).join(' | ')} | ${b.updatedAt ?? 'Hora no informada'}`);
  if (!m.bookmakers?.length) lines.push('Sin desglose disponible.');
  lines.push('', `Selección: ${a.outcomes[selectedOutcome].code} ${a.outcomes[selectedOutcome].label}`, `Cuota simulada: ${fmtOdds(odds)}`, `Banca: ${fmtCOP(bankroll)} COP`, `Modo: ${mode === 'kelly' ? 'Kelly reducido (cuarta parte, base limitada al 25%)' : 'Apuesta personalizada'}`, `Apuesta inicial: ${fmtCOP(decision.stake)} COP`, `Retorno bruto si acierta: ${fmtCOP(decision.stake * odds)} COP`, `Ganancia neta si acierta: ${fmtCOP(decision.stake * (odds - 1))} COP`, `Pérdida si falla: ${fmtCOP(-decision.stake)} COP`, `Valor esperado a la cuota simulada: ${fmtEv(decision.ev)}`, '', 'Árbol de decisiones (reglas, no modelo entrenado):', 'No apostar: cambio neto $0 COP.');
  for (const b of decision.branches) lines.push(`${a.outcomes[b.outcome].code}: ${fmtPct(b.prob)} | neto ${fmtCOP(b.net)} COP | banca restante ${fmtCOP(b.final)} COP`);
  lines.push('', `Monte Carlo: ${sim.sims} series de ${sim.bets} apuestas hipotéticas. Semilla fija: 20260918.`, 'Cuota y probabilidades constantes; apuestas independientes; fracción sobre la banca restante.', `Banca final mediana: ${fmtCOP(sim.medianFinal)} COP`, `Prob. beneficio: ${fmtPct(sim.probProfit)} | Prob. pérdida: ${fmtPct(sim.probLoss)} | Sin cambio: ${fmtPct(sim.probEven)}`, `Caída máxima típica: ${fmtPct(sim.medianMaxDrawdown)}`, `Rango 10–90%: ${fmtCOP(sim.p10Final)} – ${fmtCOP(sim.p90Final)} COP`, '', `Multicriterio — pesos valor/acierto/banca: ${decision.weights.map(w => `${w.toFixed(1)}%`).join(' / ')}`);
  for (const r of decision.ranking) lines.push(`${r.outcome === 'none' ? 'No apostar' : a.outcomes[r.outcome].label}: ${r.score.toFixed(1)} / 100 (no es probabilidad)`);
  lines.push('', 'No se incluyen impuestos, comisiones ni apuestas anuladas. Simulación, no ganancias reales ni garantizadas. Puedes perder tu banca.');
  return lines.join('\n');
}
export function Exportar(props: Props) {
  const [open, setOpen] = useState(false); const [copied, setCopied] = useState(false); const [error, setError] = useState(false);
  const text = buildSummary(props);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setError(false); window.setTimeout(() => setCopied(false), 1800); } catch { setError(true); } };
  const download = () => { const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `oddsedge-${props.analysis.match.home.short}-${props.analysis.match.away.short}.txt`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <div className="mt-8"><Button variant="outline" onClick={() => setOpen(v => !v)} aria-expanded={open}><Download />Exportar análisis</Button>{open && <div className="mt-4"><label htmlFor="analysis-export" className="text-xs text-muted-foreground">Resumen con datos, supuestos y escenarios</label><textarea id="analysis-export" readOnly value={text} rows={12} className="mt-2 w-full rounded-md border border-border bg-surface p-3 text-xs leading-relaxed" /><div className="mt-3 flex flex-wrap gap-2"><Button onClick={copy}>{copied ? <Check /> : <Copy />}{copied ? 'Copiado' : 'Copiar'}</Button><Button variant="outline" onClick={download}><Download />Descargar .txt</Button></div>{error && <p role="alert" className="mt-2 text-xs text-negative">No se pudo copiar. Selecciona el texto o descarga el archivo.</p>}</div>}</div>;
}
