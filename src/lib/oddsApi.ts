/**
 * The Odds API client — browser only, CORS-enabled, no backend.
 * Results are cached in localStorage so a failed refresh falls back to the last
 * good response before dropping to the demo dataset.
 */

import type { AnalysisInput, BestOdds, Outcome } from "./model";

const BASE = "https://api.the-odds-api.com/v4";
const KEY = import.meta.env["VITE_ODDS_API_KEY"] as string | undefined;

export const hasApiKey = Boolean(KEY);

export interface Sport {
  key: string;
  title: string;
  group: string;
  active: boolean;
}

interface ApiBookmaker {
  key: string;
  title: string;
  markets: { key: string; outcomes: { name: string; price: number }[] }[];
}

interface ApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: ApiBookmaker[];
}

export interface ScoreEvent {
  id: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: { name: string; score: string }[] | null;
}

export class OddsApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

function messageFor(status: number): string {
  if (status === 401) return "Clave de API inválida. Mostrando datos demo.";
  if (status === 422) return "Liga no disponible en la API. Mostrando datos demo.";
  if (status === 429) return "Límite de API alcanzado. Usando datos demo.";
  return `No se pudo actualizar (error ${status}). Mostrando datos demo.`;
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!KEY) throw new OddsApiError("Falta la clave de API. Mostrando datos demo.");
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("apiKey", KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch {
    throw new OddsApiError("Sin conexión con el servicio de cuotas. Mostrando datos demo.");
  }
  if (!res.ok) throw new OddsApiError(messageFor(res.status), res.status);
  return (await res.json()) as T;
}

/* ---------- Cache ---------- */

interface Cached<T> {
  at: number;
  data: T;
}

function cacheKey(name: string) {
  return `oddsedge:${name}`;
}

export function readCache<T>(name: string): Cached<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(name));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached<T>;
    return parsed && typeof parsed.at === "number" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(name: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(name), JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* storage full or blocked — ignore */
  }
}

/* ---------- Endpoints ---------- */

export async function fetchSoccerSports(): Promise<Sport[]> {
  const all = await get<Sport[]>("/sports");
  return all
    .filter((s) => s.key.startsWith("soccer_") && s.active)
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function fetchOdds(sportKey: string): Promise<ApiEvent[]> {
  return get<ApiEvent[]>(`/sports/${sportKey}/odds/`, {
    regions: "us",
    markets: "h2h",
    oddsFormat: "decimal",
  });
}

export async function fetchScores(sportKey: string): Promise<ScoreEvent[]> {
  return get<ScoreEvent[]>(`/sports/${sportKey}/scores/`, { daysFrom: "3" });
}

/* ---------- Mapping & aggregation ---------- */

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length === 0) return 0;
  return s.length % 2 ? s[mid]! : ((s[mid - 1]! + s[mid]!) / 2);
}

export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^(fc|cf|ac|sc|de|del|la|el|the|club)$/i.test(w));
  const base = words.length ? words : name.split(/\s+/);
  if (base.length === 1) return base[0]!.slice(0, 3).toUpperCase();
  return base
    .slice(0, 3)
    .map((w) => w[0]!)
    .join("")
    .toUpperCase();
}

/** Turn raw API events into analysis inputs with consensus + best odds. */
export function mapEvents(events: ApiEvent[], limit = 20): AnalysisInput[] {
  const now = Date.now();
  const out: AnalysisInput[] = [];

  for (const ev of events) {
    if (new Date(ev.commence_time).getTime() < now) continue;
    const buckets: Record<Outcome, number[]> = { home: [], draw: [], away: [] };
    const best: Record<Outcome, BestOdds> = {
      home: { odds: 0, book: "" },
      draw: { odds: 0, book: "" },
      away: { odds: 0, book: "" },
    };
    let books = 0;

    for (const bk of ev.bookmakers ?? []) {
      const h2h = bk.markets?.find((m) => m.key === "h2h");
      if (!h2h) continue;
      let used = false;
      for (const o of h2h.outcomes ?? []) {
        const key: Outcome | null =
          o.name === ev.home_team ? "home" : o.name === ev.away_team ? "away" : o.name === "Draw" ? "draw" : null;
        if (!key || !Number.isFinite(o.price) || o.price <= 1) continue;
        buckets[key].push(o.price);
        if (o.price > best[key].odds) best[key] = { odds: o.price, book: bk.title };
        used = true;
      }
      if (used) books++;
    }

    if (!buckets.home.length || !buckets.draw.length || !buckets.away.length) continue;

    out.push({
      id: ev.id,
      league: ev.sport_title,
      kickoff: ev.commence_time,
      home: { name: ev.home_team, short: initials(ev.home_team) },
      away: { name: ev.away_team, short: initials(ev.away_team) },
      odds: {
        home: median(buckets.home),
        draw: median(buckets.draw),
        away: median(buckets.away),
      },
      bestOdds: best,
      bookmakerCount: books,
    });
  }

  out.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  return out.slice(0, limit);
}

export interface FinishedMatch {
  id: string;
  league: string;
  kickoff: string;
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  result: Outcome;
}

export function mapScores(events: ScoreEvent[], limit = 8): FinishedMatch[] {
  const out: FinishedMatch[] = [];
  for (const ev of events) {
    if (!ev.completed || !ev.scores) continue;
    const hs = ev.scores.find((s) => s.name === ev.home_team);
    const as = ev.scores.find((s) => s.name === ev.away_team);
    const hg = Number(hs?.score);
    const ag = Number(as?.score);
    if (!Number.isFinite(hg) || !Number.isFinite(ag)) continue;
    out.push({
      id: ev.id,
      league: ev.sport_title,
      kickoff: ev.commence_time,
      home: ev.home_team,
      away: ev.away_team,
      homeGoals: hg,
      awayGoals: ag,
      result: hg > ag ? "home" : hg === ag ? "draw" : "away",
    });
  }
  out.sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());
  return out.slice(0, limit);
}
