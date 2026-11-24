import { useCallback, useEffect, useRef, useState } from "react";
import {
  OddsApiError,
  REGIONS,
  fetchOdds,
  fetchScores,
  fetchSoccerSports,
  hasApiKey,
  mapEvents,
  mapScores,
  readCache,
  readCredits,
  writeCache,
  type FinishedMatch,
  type Region,
  type Sport,
} from "@/lib/oddsApi";
import { demoInputs, type AnalysisInput } from "@/lib/model";

export type DataSource = "live" | "cache" | "demo";

const DEFAULT_LEAGUE = "soccer_spain_la_liga";
const FRESH_MS = 45 * 60_000;
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
  region: Region;
  combine: boolean;
  source: DataSource;
  updatedAt: number | null;
  loading: boolean;
  error: string | null;
  credits: number;
}

const regionTag = (region: Region, combine: boolean) => (combine ? "all" : region);
export const oddsCacheKey = (league: string, tag: string) => `odds_${league}_${tag}`;

/** Remember team names per league so search can find them later. */
function rememberTeams(league: string, inputs: AnalysisInput[]) {
  const prev = readCache<string[]>(`teams_${league}`)?.data ?? [];
  const set = new Set(prev);
  for (const i of inputs) {
    set.add(i.home.name);
    set.add(i.away.name);
  }
  writeCache(`teams_${league}`, [...set].slice(-120));
}

export function useOddsData() {
  const demo = useRef(demoInputs());
  const [state, setState] = useState<OddsState>({
    inputs: demo.current,
    finished: [],
    leagues: FALLBACK_LEAGUES,
    league: DEFAULT_LEAGUE,
    region: "eu",
    combine: false,
    source: "demo",
    updatedAt: null,
    loading: false,
    error: null,
    credits: 0,
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const requestId = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const load = useCallback(async (league: string, region: Region, combine: boolean, force: boolean) => {
    const job = ++requestId.current;
    const key = oddsCacheKey(league, regionTag(region, combine));
    const cached = readCache<CachedLeague>(key);
    const base = { league, region, combine };

    if (!force && cached?.data.inputs.length && Date.now() - cached.at < FRESH_MS) {
      setState((s) => ({
        ...s,
        ...base,
        inputs: cached.data.inputs,
        finished: cached.data.finished ?? [],
        source: "cache",
        updatedAt: cached.at,
        loading: false,
        error: null,
        credits: readCredits(),
      }));
      return;
    }

    if (!hasApiKey) {
      setState((s) => ({
        ...s,
        ...base,
        source: "demo",
        inputs: demo.current,
        finished: [],
        loading: false,
        error: "Sin clave de API configurada. Mostrando datos demo.",
      }));
      return;
    }

    setState((s) => ({ ...s, ...base, loading: true, error: null }));

    const fallback = (message: string) => {
      if (job !== requestId.current) return;
      setAutoRefresh(false);
      setState((s) => ({
        ...s,
        ...base,
        loading: false,
        inputs: cached?.data.inputs.length ? cached.data.inputs : demo.current,
        finished: cached?.data.finished ?? [],
        source: cached?.data.inputs.length ? "cache" : "demo",
        updatedAt: cached?.at ?? null,
        error: cached?.data.inputs.length ? message.replace("Mostrando datos demo.", "Mostrando datos guardados.") : message,
        credits: readCredits(),
      }));
    };

    try {
      const events = await fetchOdds(league, combine ? REGIONS : [region]);
      const inputs = mapEvents(events);
      const cachedScores = readCache<FinishedMatch[]>(`scores_${league}`);
      let finished: FinishedMatch[] = cachedScores?.data ?? [];
      if (!cachedScores || Date.now() - cachedScores.at >= FRESH_MS) {
        try {
          finished = mapScores(await fetchScores(league));
          writeCache(`scores_${league}`, finished);
        } catch { /* Scores are optional; preserve the last successful result. */ }
      }
      if (job !== requestId.current) return;
      if (!inputs.length) {
        fallback("No hay partidos próximos en esta liga y región. Mostrando datos demo.");
        return;
      }
      writeCache<CachedLeague>(key, { inputs, finished });
      rememberTeams(league, inputs);
      setState((s) => ({
        ...s,
        ...base,
        inputs,
        finished,
        source: "live",
        updatedAt: Date.now(),
        loading: false,
        error: null,
        credits: readCredits(),
      }));
    } catch (err) {
      fallback(err instanceof OddsApiError ? err.message : "Límite de API o error. Usando datos demo.");
    }
  }, []);

  useEffect(() => {
    setState((s) => ({ ...s, credits: readCredits() }));
    void load(DEFAULT_LEAGUE, "eu", false, false);
    if (!hasApiKey) return;
    const sports = readCache<Sport[]>("sports");
    if (sports?.data.length) setState((s) => ({ ...s, leagues: sports.data }));
    if (sports && Date.now() - sports.at < 12 * 3_600_000) return;
    void fetchSoccerSports()
      .then((leagues) => {
        if (!leagues.length) return;
        writeCache("sports", leagues);
        setState((s) => ({ ...s, leagues }));
      })
      .catch(() => undefined);
  }, [load]);

  const refresh = useCallback(() => {
    const s = stateRef.current;
    void load(s.league, s.region, s.combine, true);
  }, [load]);
  const selectLeague = useCallback((key: string) => {
    const s = stateRef.current;
    void load(key, s.region, s.combine, false);
  }, [load]);
  const selectRegion = useCallback((region: Region) => {
    const s = stateRef.current;
    void load(s.league, region, false, false);
  }, [load]);
  const setCombine = useCallback((combine: boolean) => {
    const s = stateRef.current;
    void load(s.league, s.region, combine, false);
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      const current = stateRef.current;
      if (readCredits() >= 490 || current.error) { setAutoRefresh(false); return; }
      if (document.visibilityState === "visible" && !current.loading) refresh();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, refresh]);

  return { ...state, refresh, selectLeague, selectRegion, setCombine, autoRefresh, setAutoRefresh };
}
