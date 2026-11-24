/**
 * The Odds API client — browser only, CORS-enabled, no backend.
 * Results are cached in localStorage so a failed refresh falls back to the last
 * good response before dropping to the demo dataset.
 */

import type { AnalysisInput, BestOdds, BookmakerQuote, Outcome } from "./model";

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
  last_update?: string;
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

export type Region = "eu" | "uk" | "us" | "au";
export const REGIONS: Region[] = ["eu", "uk", "us", "au"];

export async function fetchOdds(sportKey: string, regions: Region[]): Promise<ApiEvent[]> {
  const data = await get<ApiEvent[]>(`/sports/${sportKey}/odds/`, {
    regions: regions.join(","),
    markets: "h2h",
    oddsFormat: "decimal",
  });
  addCredits(regions.length);
  return data;
}

/* ---------- Local credit estimate ---------- */

const monthKey = () => new Date().toISOString().slice(0, 7);

export function readCredits(): number {
  const c = readCache<{ month: string; used: number }>("credits");
  return c && c.data.month === monthKey() ? c.data.used : 0;
}

function addCredits(n: number) {
  writeCache("credits", { month: monthKey(), used: readCredits() + n });
}

/** Decimal odds; converts American format if it slipped through. */
export function toDecimal(price: number): number {
  if (price >= 100) return price / 100 + 1;
  if (price <= -100) return 100 / Math.abs(price) + 1;
  return price;
}

export async function fetchScores(sportKey: string): Promise<ScoreEvent[]> {
  const data = await get<ScoreEvent[]>(`/sports/${sportKey}/scores/`, { daysFrom: "1" });
  addCredits(2);
  return data;
}

/* ---------- Mapping & aggregation ---------- */

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length === 0) return 0;
  return s.length % 2 ? (s[mid] ?? 0) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
}

export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^(fc|cf|ac|sc|de|del|la|el|the|club)$/i.test(w));
  const base = words.length ? words : name.split(/\s+/);
  if (base.length === 1) return (base[0] ?? name).slice(0, 3).toUpperCase();
  return base
    .slice(0, 3)
    .map((w) => w[0] ?? "")
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
    const bookmakers: BookmakerQuote[] = [];

    for (const bk of ev.bookmakers ?? []) {
      const h2h = bk.markets?.find((m) => m.key === "h2h");
      if (!h2h) continue;
      let used = false;
      const quote: BookmakerQuote = { key: bk.key, title: bk.title, odds: {}, ...(bk.last_update ? { updatedAt: bk.last_update } : {}) };
      for (const raw of h2h.outcomes ?? []) {
        const o = { name: raw.name, price: raw.price };
        const key: Outcome | null =
          o.name === ev.home_team ? "home" : o.name === ev.away_team ? "away" : o.name === "Draw" ? "draw" : null;
        if (!key || !Number.isFinite(o.price) || o.price <= 1) continue;
        buckets[key].push(o.price);
        quote.odds[key] = o.price;
        if (o.price > best[key].odds) best[key] = { odds: o.price, book: bk.title };
        used = true;
      }
      if (used) { books++; bookmakers.push(quote); }
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
      bookmakers,
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
