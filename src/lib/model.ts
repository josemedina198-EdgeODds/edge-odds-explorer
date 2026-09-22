import { HOME_ADVANTAGE, MATCHES, TEAMS, type TeamStats } from "@/data/matches";

export type Outcome = "home" | "draw" | "away";
export const OUTCOMES: Outcome[] = ["home", "draw", "away"];
export const OUTCOME_CODE: Record<Outcome, string> = { home: "1", draw: "X", away: "2" };

const MAX_GOALS = 10;
export const KELLY_CAP = 0.25;

/* ---------- Generic analysis input (demo dataset or live odds) ---------- */

export interface TeamRef {
  name: string;
  short: string;
}

export interface BestOdds {
  odds: number;
  book: string;
}

export interface AnalysisInput {
  id: string;
  league: string;
  kickoff: string;
  home: TeamRef;
  away: TeamRef;
  /** Consensus decimal odds per outcome. */
  odds: Record<Outcome, number>;
  /** Highest odds available per outcome with the bookmaker name (live only). */
  bestOdds?: Record<Outcome, BestOdds>;
  bookmakerCount?: number;
  /** Team keys into the demo dataset; when present the model uses recent form. */
  formKeys?: { home: string; away: string };
}

/* ---------- League context ---------- */

export interface LeagueAverages {
  homeGoals: number;
  awayGoals: number;
}

export function leagueAverages(teams: Record<string, TeamStats> = TEAMS): LeagueAverages {
  let hg = 0,
    hp = 0,
    ag = 0,
    ap = 0;
  for (const t of Object.values(teams)) {
    hg += t.home.goalsFor;
    hp += t.home.played;
    ag += t.away.goalsFor;
    ap += t.away.played;
  }
  return { homeGoals: hg / hp, awayGoals: ag / ap };
}

/* ---------- Poisson model ---------- */

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function poissonPmf(k: number, lambda: number): number {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

export interface Strengths {
  attack: number;
  defense: number;
}

export interface ModelResult {
  lambdaHome: number;
  lambdaAway: number;
  homeStrength?: Strengths;
  awayStrength?: Strengths;
  probs: Record<Outcome, number>;
  mostLikelyScore: { home: number; away: number; p: number };
  /** How the expected goals were obtained. */
  source: "form" | "market";
}

function pmfVector(lambda: number): number[] {
  return Array.from({ length: MAX_GOALS + 1 }, (_, k) => poissonPmf(k, lambda));
}

function outcomeProbs(lambdaHome: number, lambdaAway: number) {
  const pH = pmfVector(lambdaHome);
  const pA = pmfVector(lambdaAway);
  let home = 0,
    draw = 0,
    away = 0;
  let best = { home: 0, away: 0, p: 0 };
  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = (pH[i] ?? 0) * (pA[j] ?? 0);
      if (i > j) home += p;
      else if (i === j) draw += p;
      else away += p;
      if (p > best.p) best = { home: i, away: j, p };
    }
  }
  const total = home + draw + away;
  return {
    probs: { home: home / total, draw: draw / total, away: away / total } as Record<Outcome, number>,
    mostLikelyScore: best,
  };
}

/** Form-based model from the demo dataset. */
export function runModel(
  formKeys: { home: string; away: string },
  teams = TEAMS,
  avg = leagueAverages(teams),
): ModelResult {
  const h = teams[formKeys.home]!;
  const a = teams[formKeys.away]!;

  const homeStrength: Strengths = {
    attack: h.home.goalsFor / h.home.played / avg.homeGoals,
    defense: h.home.goalsAgainst / h.home.played / avg.awayGoals,
  };
  const awayStrength: Strengths = {
    attack: a.away.goalsFor / a.away.played / avg.awayGoals,
    defense: a.away.goalsAgainst / a.away.played / avg.homeGoals,
  };

  const lambdaHome = homeStrength.attack * awayStrength.defense * avg.homeGoals * HOME_ADVANTAGE;
  const lambdaAway = awayStrength.attack * homeStrength.defense * avg.awayGoals;
  const { probs, mostLikelyScore } = outcomeProbs(lambdaHome, lambdaAway);

  return { lambdaHome, lambdaAway, homeStrength, awayStrength, probs, mostLikelyScore, source: "form" };
}

/**
 * Expected goals inferred from the fair market probabilities: grid search over
 * lambda pairs, keeping the pair whose 1X2 distribution is closest to the market.
 */
export function fitLambdas(fair: Record<Outcome, number>): { lambdaHome: number; lambdaAway: number } {
  const grid: number[] = [];
  for (let v = 0.1; v <= 4.0001; v += 0.05) grid.push(Math.round(v * 100) / 100);
  const pmfs = grid.map(pmfVector);

  let bestErr = Infinity;
  let bestPair = { lambdaHome: 1.4, lambdaAway: 1.1 };

  for (let hi = 0; hi < grid.length; hi++) {
    const pH = pmfs[hi]!;
    for (let ai = 0; ai < grid.length; ai++) {
      const pA = pmfs[ai]!;
      let home = 0,
        draw = 0,
        away = 0;
      for (let i = 0; i <= MAX_GOALS; i++) {
        const ph = pH[i] ?? 0;
        if (ph < 1e-9) continue;
        for (let j = 0; j <= MAX_GOALS; j++) {
          const p = ph * (pA[j] ?? 0);
          if (i > j) home += p;
          else if (i === j) draw += p;
          else away += p;
        }
      }
      const t = home + draw + away;
      const err =
        (home / t - fair.home) ** 2 + (draw / t - fair.draw) ** 2 + (away / t - fair.away) ** 2;
      if (err < bestErr) {
        bestErr = err;
        bestPair = { lambdaHome: grid[hi]!, lambdaAway: grid[ai]! };
      }
    }
  }
  return bestPair;
}

export function runMarketModel(fair: Record<Outcome, number>): ModelResult {
  const { lambdaHome, lambdaAway } = fitLambdas(fair);
  const { probs, mostLikelyScore } = outcomeProbs(lambdaHome, lambdaAway);
  return { lambdaHome, lambdaAway, probs, mostLikelyScore, source: "market" };
}

/* ---------- Market ---------- */

export interface MarketResult {
  implied: Record<Outcome, number>;
  fair: Record<Outcome, number>;
  overround: number;
}

export function marketProbabilities(odds: Record<Outcome, number>): MarketResult {
  const implied = { home: 1 / odds.home, draw: 1 / odds.draw, away: 1 / odds.away };
  const overround = implied.home + implied.draw + implied.away;
  return {
    implied,
    fair: {
      home: implied.home / overround,
      draw: implied.draw / overround,
      away: implied.away / overround,
    },
    overround,
  };
}

/* ---------- Value & staking ---------- */

export function expectedValue(p: number, odds: number): number {
  return p * odds - 1;
}

export function kellyFraction(p: number, odds: number, cap = KELLY_CAP): number {
  const b = odds - 1;
  if (b <= 0) return 0;
  const f = (p * b - (1 - p)) / b;
  return Math.min(cap, Math.max(0, f));
}

/* ---------- Full per-match analysis ---------- */

export interface OutcomeAnalysis {
  outcome: Outcome;
  code: string;
  label: string;
  odds: number;
  modelProb: number;
  marketProb: number;
  edge: number;
  ev: number;
  kelly: number;
}

export interface MatchAnalysis {
  match: AnalysisInput;
  model: ModelResult;
  market: MarketResult;
  outcomes: Record<Outcome, OutcomeAnalysis>;
  best: Outcome;
}

export function analyzeMatch(input: AnalysisInput): MatchAnalysis {
  const market = marketProbabilities(input.odds);
  const model = input.formKeys ? runModel(input.formKeys) : runMarketModel(market.fair);
  const labels: Record<Outcome, string> = {
    home: input.home.name,
    draw: "Empate",
    away: input.away.name,
  };

  const outcomes = {} as Record<Outcome, OutcomeAnalysis>;
  for (const o of OUTCOMES) {
    const p = model.probs[o];
    const odds = input.odds[o];
    outcomes[o] = {
      outcome: o,
      code: OUTCOME_CODE[o],
      label: labels[o],
      odds,
      modelProb: p,
      marketProb: market.fair[o],
      edge: p - market.fair[o],
      ev: expectedValue(p, odds),
      kelly: kellyFraction(p, odds),
    };
  }
  const best = OUTCOMES.reduce((b, o) => (outcomes[o].ev > outcomes[b].ev ? o : b), "home" as Outcome);
  return { match: input, model, market, outcomes, best };
}

/** Demo dataset mapped into the generic input shape. */
export function demoInputs(): AnalysisInput[] {
  return MATCHES.map((m) => {
    const h = TEAMS[m.home]!;
    const a = TEAMS[m.away]!;
    return {
      id: m.id,
      league: m.league,
      kickoff: m.kickoff,
      home: { name: h.name, short: h.short },
      away: { name: a.name, short: a.short },
      odds: { ...m.odds },
      bookmakerCount: 1,
      formKeys: { home: m.home, away: m.away },
    } satisfies AnalysisInput;
  });
}

export function analyzeAll(inputs: AnalysisInput[] = demoInputs()): MatchAnalysis[] {
  return inputs.map(analyzeMatch);
}

/* ---------- Monte Carlo ---------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimulationResult {
  paths: number[][];
  medianPath: number[];
  finals: number[];
  medianFinal: number;
  p10Final: number;
  p90Final: number;
  probProfit: number;
  medianMaxDrawdown: number;
  worstMaxDrawdown: number;
  bets: number;
  sims: number;
}

export function simulateKelly(opts: {
  bankroll: number;
  p: number;
  odds: number;
  fraction: number;
  sims?: number;
  bets?: number;
  samplePaths?: number;
  seed?: number;
}): SimulationResult {
  const { bankroll, p, odds, fraction } = opts;
  const sims = opts.sims ?? 1000;
  const bets = opts.bets ?? 100;
  const samplePaths = opts.samplePaths ?? 40;
  const rand = mulberry32(opts.seed ?? 20260918);
  const b = odds - 1;

  const finals: number[] = new Array(sims);
  const drawdowns: number[] = new Array(sims);
  const paths: number[][] = [];
  const allPaths: Float64Array[] = [];

  for (let s = 0; s < sims; s++) {
    let bank = bankroll;
    let peak = bankroll;
    let maxDd = 0;
    const path = new Float64Array(bets + 1);
    path[0] = bank;
    for (let i = 1; i <= bets; i++) {
      const stake = bank * fraction;
      if (rand() < p) bank += stake * b;
      else bank -= stake;
      if (bank > peak) peak = bank;
      const dd = peak > 0 ? (peak - bank) / peak : 0;
      if (dd > maxDd) maxDd = dd;
      path[i] = bank;
    }
    finals[s] = bank;
    drawdowns[s] = maxDd;
    allPaths.push(path);
    if (s < samplePaths) paths.push(Array.from(path));
  }

  const sortedFinals = [...finals].sort((x, y) => x - y);
  const q = (arr: number[], k: number) => arr[Math.min(arr.length - 1, Math.floor(k * arr.length))] ?? 0;
  const sortedDd = [...drawdowns].sort((x, y) => x - y);

  const medianPath: number[] = new Array(bets + 1);
  const col = new Float64Array(sims);
  for (let i = 0; i <= bets; i++) {
    for (let s = 0; s < sims; s++) col[s] = allPaths[s]![i]!;
    const sorted = Float64Array.from(col).sort();
    medianPath[i] = sorted[Math.floor(sims / 2)] ?? 0;
  }

  return {
    paths,
    medianPath,
    finals,
    medianFinal: q(sortedFinals, 0.5),
    p10Final: q(sortedFinals, 0.1),
    p90Final: q(sortedFinals, 0.9),
    probProfit: finals.filter((f) => f > bankroll).length / sims,
    medianMaxDrawdown: q(sortedDd, 0.5),
    worstMaxDrawdown: sortedDd[sortedDd.length - 1] ?? 0,
    bets,
    sims,
  };
}

/* ---------- Formatting helpers ---------- */

export const fmtPct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
export const fmtOdds = (x: number) => x.toFixed(2);
export const fmtEv = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)}%`;
export const fmtMoney = (x: number) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: x < 10 ? 2 : 0 }).format(x);
