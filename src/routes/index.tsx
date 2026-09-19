import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { analyzeAll, OUTCOMES, type Outcome } from "@/lib/model";
import { Header } from "@/components/edge/Header";
import { Hero } from "@/components/edge/Hero";
import { Matches } from "@/components/edge/Matches";
import { Comparador } from "@/components/edge/Comparador";
import { ValorEsperado } from "@/components/edge/ValorEsperado";
import { Calculadora } from "@/components/edge/Calculadora";
import { Footer } from "@/components/edge/Footer";

const TITLE = "Edge Analytics — Valor esperado en apuestas de fútbol";
const DESCRIPTION =
  "Compara tu modelo de probabilidad con las cuotas del mercado, detecta valor esperado positivo y calcula cuánto apostar.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const analyses = useMemo(() => analyzeAll(), []);

  // Default selection: the outcome with the highest EV across all matches.
  const initial = useMemo(() => {
    let best = { matchId: analyses[0]!.match.id, outcome: "home" as Outcome, ev: -Infinity };
    for (const a of analyses)
      for (const o of OUTCOMES)
        if (a.outcomes[o].ev > best.ev) best = { matchId: a.match.id, outcome: o, ev: a.outcomes[o].ev };
    return best;
  }, [analyses]);

  const [selectedMatch, setSelectedMatch] = useState(initial.matchId);
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>(initial.outcome);
  const [bankroll, setBankroll] = useState(100);
  const [runKey, setRunKey] = useState(0);

  const analysis = (analyses.find((a) => a.match.id === selectedMatch) ?? analyses[0])!;

  const positiveCount = analyses.reduce(
    (n, a) => n + OUTCOMES.filter((o) => a.outcomes[o].ev > 0).length,
    0,
  );

  const onSelect = useCallback((matchId: string, outcome: Outcome) => {
    setSelectedMatch(matchId);
    setSelectedOutcome(outcome);
    setRunKey((k) => k + 1);
  }, []);

  const onAnalyze = useCallback(() => {
    setRunKey((k) => k + 1);
    document.getElementById("valor-esperado")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero matchCount={analyses.length} positiveCount={positiveCount} bestEv={Math.max(0, initial.ev)} />
        <Matches
          analyses={analyses}
          selectedMatch={selectedMatch}
          selectedOutcome={selectedOutcome}
          onSelect={onSelect}
        />
        <Comparador
          analysis={analysis}
          selectedOutcome={selectedOutcome}
          onSelectOutcome={setSelectedOutcome}
          onAnalyze={onAnalyze}
          runKey={runKey}
        />
        <ValorEsperado analysis={analysis} selectedOutcome={selectedOutcome} onSelectOutcome={setSelectedOutcome} />
        <Calculadora analysis={analysis} selectedOutcome={selectedOutcome} bankroll={bankroll} onBankroll={setBankroll} />
      </main>
      <Footer />
    </div>
  );
}
