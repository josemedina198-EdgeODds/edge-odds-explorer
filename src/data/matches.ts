/**
 * Static dataset — single source of truth for the app.
 * Replace with real historical data later; every number on the page is derived from this.
 *
 * Team form: last 5 home matches and last 5 away matches (goals for / against).
 */

export interface SplitStats {
  played: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface TeamStats {
  name: string;
  short: string; // crest placeholder initials
  home: SplitStats;
  away: SplitStats;
}

export interface Match {
  id: string;
  league: string;
  kickoff: string; // ISO date
  home: string; // team key
  away: string; // team key
  odds: { home: number; draw: number; away: number };
}

export const TEAMS: Record<string, TeamStats> = {
  "Real Madrid": {
    name: "Real Madrid",
    short: "RMA",
    home: { played: 5, goalsFor: 12, goalsAgainst: 3 },
    away: { played: 5, goalsFor: 8, goalsAgainst: 5 },
  },
  "Atlético de Madrid": {
    name: "Atlético de Madrid",
    short: "ATM",
    home: { played: 5, goalsFor: 8, goalsAgainst: 3 },
    away: { played: 5, goalsFor: 5, goalsAgainst: 4 },
  },
  "FC Barcelona": {
    name: "FC Barcelona",
    short: "BAR",
    home: { played: 5, goalsFor: 13, goalsAgainst: 4 },
    away: { played: 5, goalsFor: 9, goalsAgainst: 6 },
  },
  "Real Sociedad": {
    name: "Real Sociedad",
    short: "RSO",
    home: { played: 5, goalsFor: 7, goalsAgainst: 5 },
    away: { played: 5, goalsFor: 4, goalsAgainst: 7 },
  },
  "Sevilla FC": {
    name: "Sevilla FC",
    short: "SEV",
    home: { played: 5, goalsFor: 6, goalsAgainst: 6 },
    away: { played: 5, goalsFor: 3, goalsAgainst: 8 },
  },
  "Athletic Club": {
    name: "Athletic Club",
    short: "ATH",
    home: { played: 5, goalsFor: 9, goalsAgainst: 4 },
    away: { played: 5, goalsFor: 6, goalsAgainst: 6 },
  },
  "Villarreal CF": {
    name: "Villarreal CF",
    short: "VIL",
    home: { played: 5, goalsFor: 9, goalsAgainst: 5 },
    away: { played: 5, goalsFor: 7, goalsAgainst: 7 },
  },
  "Real Betis": {
    name: "Real Betis",
    short: "BET",
    home: { played: 5, goalsFor: 7, goalsAgainst: 6 },
    away: { played: 5, goalsFor: 5, goalsAgainst: 8 },
  },
  "Valencia CF": {
    name: "Valencia CF",
    short: "VAL",
    home: { played: 5, goalsFor: 5, goalsAgainst: 6 },
    away: { played: 5, goalsFor: 3, goalsAgainst: 9 },
  },
  "Girona FC": {
    name: "Girona FC",
    short: "GIR",
    home: { played: 5, goalsFor: 8, goalsAgainst: 7 },
    away: { played: 5, goalsFor: 6, goalsAgainst: 9 },
  },
};

export const MATCHES: Match[] = [
  {
    id: "m1",
    league: "LaLiga · Jornada 6",
    kickoff: "2026-09-19T19:00:00Z",
    home: "Real Madrid",
    away: "Sevilla FC",
    odds: { home: 1.38, draw: 5.0, away: 8.0 },
  },
  {
    id: "m2",
    league: "LaLiga · Jornada 6",
    kickoff: "2026-09-19T21:00:00Z",
    home: "Real Sociedad",
    away: "FC Barcelona",
    odds: { home: 4.6, draw: 4.0, away: 1.7 },
  },
  {
    id: "m3",
    league: "LaLiga · Jornada 6",
    kickoff: "2026-09-20T14:00:00Z",
    home: "Athletic Club",
    away: "Atlético de Madrid",
    odds: { home: 2.75, draw: 3.1, away: 2.7 },
  },
  {
    id: "m4",
    league: "LaLiga · Jornada 6",
    kickoff: "2026-09-20T16:15:00Z",
    home: "Villarreal CF",
    away: "Real Betis",
    odds: { home: 1.95, draw: 3.6, away: 3.8 },
  },
  {
    id: "m5",
    league: "LaLiga · Jornada 6",
    kickoff: "2026-09-20T19:00:00Z",
    home: "Valencia CF",
    away: "Girona FC",
    odds: { home: 2.3, draw: 3.3, away: 3.2 },
  },
];

/** Multiplier applied to home expected goals. */
export const HOME_ADVANTAGE = 1.08;
