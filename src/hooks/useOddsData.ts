import { useCallback, useEffect, useRef, useState } from "react";
import {
  OddsApiError,
  fetchOdds,
  fetchScores,
  fetchSoccerSports,
  hasApiKey,
  mapEvents,
  mapScores,
  readCache,
  writeCache,
  type FinishedMatch,
  type Sport,
} from "@/lib/oddsApi";
import { demoInputs, type AnalysisInput } from "@/lib/model";

export type DataSource = "live" | "cache" | "demo";

const DEFAULT_LEAGUE = "soccer_spain_la_liga";
const FALLBACK_LEAGUES: Sport[] = [
  { key: "soccer_spain_la_liga", title: "La Liga - España", group: "Soccer", active: true },
  { key: "soccer_epl", title: "Premier League - Inglaterra", group: "Soccer", active: true },
  { key: "soccer_italy_serie_a", title: "Serie A - Italia", group: "Soccer", active: true },
  { key: "soccer_germany_bundesliga", title: "Bundesliga - Alemania", group: "Soccer", active: true },
  { key: "soccer_uefa_champs_league", title: "UEFA Champions League", group: "Soccer", active: true },
];

interface CachedLeague {
  inputs: AnalysisInput[];
  finished: FinishedMatch[];
}

export interface OddsState {
  inputs: AnalysisInput[];
  finished: FinishedMatch[];
  leagues: Sport[];
  league: string;
  source: DataSource;
  updatedAt: number | null;
  loading: boolean;
  error: string | null;
}

export function useOddsData() {
  const demo = useRef(demoInputs());
  const [state, setState] = useState<OddsState>({
    inputs: demo.current,
    finished: [],
    leagues: FALLBACK_LEAGUES,
    league: DEFAULT_LEAGUE,
    source: "demo",
    updatedAt: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async (league: string) => {
    if (!hasApiKey) {
      setState((s) => ({
        ...s,
        league,
        source: "demo",
        inputs: demo.current,
        finished: [],
        loading: false,
        error: "Sin clave de API configurada. Mostrando datos demo.",
      }));
      return;
    }

    setState((s) => ({ ...s, league, loading: true, error: null }));

    try {
      const events = await fetchOdds(league);
      const inputs = mapEvents(events);
      let finished: FinishedMatch[] = [];
      try {
        finished = mapScores(await fetchScores(league));
      } catch {
        /* scores are optional */
      }
      if (!inputs.length) {
        const cached = readCache<CachedLeague>(`odds:${league}`);
        setState((s) => ({
          ...s,
          league,
          loading: false,
          inputs: cached?.data.inputs.length ? cached.data.inputs : demo.current,
          finished: finished.length ? finished : (cached?.data.finished ?? []),
          source: cached?.data.inputs.length ? "cache" : "demo",
          updatedAt: cached?.at ?? null,
          error: "No hay partidos próximos en esta liga. Mostrando datos demo.",
        }));
        return;
      }
      writeCache<CachedLeague>(`odds:${league}`, { inputs, finished });
      setState((s) => ({
        ...s,
        league,
        inputs,
        finished,
        source: "live",
        updatedAt: Date.now(),
        loading: false,
        error: null,
      }));
    } catch (err) {
      const message =
        err instanceof OddsApiError ? err.message : "No se pudo actualizar. Mostrando datos demo.";
      const cached = readCache<CachedLeague>(`odds:${league}`);
      setState((s) => ({
        ...s,
        league,
        loading: false,
        inputs: cached?.data.inputs.length ? cached.data.inputs : demo.current,
        finished: cached?.data.finished ?? [],
        source: cached?.data.inputs.length ? "cache" : "demo",
        updatedAt: cached?.at ?? null,
        error: message,
      }));
    }
  }, []);

  // Initial load: show cache instantly, then fetch once.
  useEffect(() => {
    const cached = readCache<CachedLeague>(`odds:${DEFAULT_LEAGUE}`);
    if (cached?.data.inputs.length) {
      setState((s) => ({
        ...s,
        inputs: cached.data.inputs,
        finished: cached.data.finished ?? [],
        source: "cache",
        updatedAt: cached.at,
      }));
    }
    void load(DEFAULT_LEAGUE);

    if (!hasApiKey) return;
    void fetchSoccerSports()
      .then((leagues) => {
        if (leagues.length) setState((s) => ({ ...s, leagues }));
      })
      .catch(() => undefined);
  }, [load]);

  const refresh = useCallback(() => void load(state.league), [load, state.league]);
  const selectLeague = useCallback((key: string) => void load(key), [load]);

  return { ...state, refresh, selectLeague };
}
