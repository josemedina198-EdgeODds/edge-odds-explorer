import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OUTCOMES, type Outcome } from "@/lib/model";
import { useOddsData } from "@/hooks/useOddsData";
import { readPredictions, savePredictions, type PredictionMap } from "@/lib/predictions";
import { Header } from "@/components/edge/Header";
import { Hero } from "@/components/edge/Hero";
import { Matches } from "@/components/edge/Matches";
import { Resultados } from "@/components/edge/Resultados";
import { Comparador } from "@/components/edge/Comparador";
import { ValorEsperado } from "@/components/edge/ValorEsperado";
import { Calculadora } from "@/components/edge/Calculadora";
import { usePythonAnalysis } from "@/hooks/usePythonAnalysis";
import { Guia } from "@/components/edge/Guia";
import { Actualizacion } from "@/components/edge/Actualizacion";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/edge/Footer";

const TITLE = "OddsEdge — Simulador Python de apuestas y escenarios en COP";
const DESCRIPTION =
  "Compara cuotas reales de fútbol entre casas y explora escenarios de ganancias y pérdidas en COP con Python, Monte Carlo y decisiones multicriterio.";

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
  const {
    inputs, finished, leagues, league, source, updatedAt, loading, error, refresh, selectLeague,
    region, combine, credits, selectRegion, setCombine, autoRefresh, setAutoRefresh,
  } =
    useOddsData();

  const { analyses, loading: pythonLoading, error: pythonError, retry } = usePythonAnalysis(inputs);

  const bestOverall = useMemo(() => {
    let best = { matchId: analyses[0]?.match.id ?? "", outcome: "home" as Outcome, ev: -Infinity };
    for (const a of analyses)
      for (const o of OUTCOMES)
        if (a.outcomes[o].ev > best.ev) best = { matchId: a.match.id, outcome: o, ev: a.outcomes[o].ev };
    return best;
  }, [analyses]);

  const [selectedMatch, setSelectedMatch] = useState(bestOverall.matchId);
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>(bestOverall.outcome);
  const [bankroll, setBankroll] = useState(100000);
  const [runKey, setRunKey] = useState(0);
  const [predictions, setPredictions] = useState<PredictionMap>({});

  // Keep the selection valid when the dataset changes (league switch / refresh).
  useEffect(() => {
    if (!analyses.some((a) => a.match.id === selectedMatch)) {
      setSelectedMatch(bestOverall.matchId);
      setSelectedOutcome(bestOverall.outcome);
      setRunKey((k) => k + 1);
    }
  }, [analyses, bestOverall, selectedMatch]);

  // Record the model's pick per match so finished games can be scored later.
  useEffect(() => {
    if (!analyses.length) return;
    const next: PredictionMap = {};
    for (const a of analyses) next[a.match.id] = a.best;
    savePredictions(next);
    setPredictions(readPredictions());
  }, [analyses]);

  const analysis = (analyses.find((a) => a.match.id === selectedMatch) ?? analyses[0]);

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
        <Hero
          matchCount={analyses.length}
          positiveCount={positiveCount}
          bestEv={Math.max(0, bestOverall.ev === -Infinity ? 0 : bestOverall.ev)}
        />
        <Guia />
        <Actualizacion enabled={autoRefresh} onEnabled={setAutoRefresh} combine={combine} credits={credits} error={error} />
        {pythonLoading && <p role="status" className="container-edge py-6 text-sm text-muted-foreground">Preparando Python y calculando probabilidades… La primera carga puede tardar unos segundos.</p>}
        {pythonError && <div role="alert" className="container-edge py-6"><p className="text-sm text-negative">{pythonError}</p><Button variant="outline" className="mt-3" onClick={retry}>Reintentar Python</Button></div>}
        <Matches
          analyses={analyses}
          selectedMatch={selectedMatch}
          selectedOutcome={selectedOutcome}
          onSelect={onSelect}
          leagues={leagues}
          league={league}
          onLeague={selectLeague}
          source={source}
          updatedAt={updatedAt}
          loading={loading || pythonLoading}
          error={error}
          onRefresh={refresh}
          region={region}
          onRegion={selectRegion}
          combine={combine}
          onCombine={setCombine}
          credits={credits}
        />
        <Resultados finished={finished} predictions={predictions} />
        {analysis && (
          <>
            <Comparador
              analysis={analysis}
              selectedOutcome={selectedOutcome}
              onSelectOutcome={setSelectedOutcome}
              onAnalyze={onAnalyze}
              runKey={runKey}
            />
            <ValorEsperado
              analysis={analysis}
              selectedOutcome={selectedOutcome}
              onSelectOutcome={setSelectedOutcome}
            />
            <Calculadora
              analysis={analysis}
              selectedOutcome={selectedOutcome}
              bankroll={bankroll}
              onBankroll={setBankroll}
            />
          </>
        )}
      </main>
      <Footer source={source} />
    </div>
  );
}
