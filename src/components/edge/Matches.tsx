import { useEffect, useMemo, useState } from "react";
import { CalendarX, Flame, RefreshCw, Search } from "lucide-react";
import { OUTCOMES, fmtEv, fmtOdds, type MatchAnalysis, type Outcome } from "@/lib/model";
import { readCache, type Sport } from "@/lib/oddsApi";
import type { DataSource } from "@/hooks/useOddsData";
import type { AnalysisInput } from "@/lib/model";

interface Props {
  analyses: MatchAnalysis[];
  selectedMatch: string;
  selectedOutcome: Outcome;
  onSelect: (matchId: string, outcome: Outcome) => void;
  leagues: Sport[];
  league: string;
  onLeague: (key: string) => void;
  source: DataSource;
  updatedAt: number | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function Crest({ short }: { short: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border-strong bg-surface text-[11px] font-bold tracking-wide text-muted-foreground">
      {short}
    </span>
  );
}

export function EvTag({ ev, size = "sm" }: { ev: number; size?: "sm" | "md" }) {
  const pos = ev >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-md border tabular font-semibold ${
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs"
      } ${
        pos
          ? "border-positive/30 bg-positive/10 text-positive"
          : "border-negative/30 bg-negative/10 text-negative"
      }`}
    >
      {fmtEv(ev)}
    </span>
  );
}

/* ---------- league helpers ---------- */

const LEAGUE_CODES: [RegExp, string, string][] = [
  [/champs|champions/, "CL", "Europa"],
  [/europa_conference|conference/, "UC", "Europa"],
  [/europa/, "EL", "Europa"],
  [/spain/, "ES", "España"],
  [/epl|england/, "EN", "Inglaterra"],
  [/italy/, "IT", "Italia"],
  [/germany/, "DE", "Alemania"],
  [/france/, "FR", "Francia"],
  [/portugal/, "PT", "Portugal"],
  [/netherlands/, "NL", "Países Bajos"],
  [/brazil/, "BR", "Brasil"],
  [/argentina/, "AR", "Argentina"],
  [/mexico/, "MX", "México"],
  [/usa|mls/, "US", "EE. UU."],
  [/colombia/, "CO", "Colombia"],
  [/turkey/, "TR", "Turquía"],
  [/belgium/, "BE", "Bélgica"],
  [/scotland|spl/, "SC", "Escocia"],
  [/japan/, "JP", "Japón"],
  [/korea/, "KR", "Corea"],
  [/australia/, "AU", "Australia"],
  [/chile/, "CH", "Chile"],
  [/fifa|world/, "WC", "Internacional"],
];

function leagueMeta(l: Sport) {
  const hit = LEAGUE_CODES.find(([re]) => re.test(l.key));
  const [name, country] = l.title.split(" - ");
  return {
    code: hit?.[1] ?? l.title.slice(0, 2).toUpperCase(),
    country: country ?? hit?.[2] ?? "",
    name: name ?? l.title,
  };
}

function LeagueDot({ code, active }: { code: string; active?: boolean }) {
  return (
    <span
      className={`grid size-7 shrink-0 place-items-center rounded-full border text-[10px] font-bold tracking-wide ${
        active ? "border-primary/50 bg-primary/10 text-primary" : "border-border-strong bg-surface text-muted-foreground"
      }`}
    >
      {code}
    </span>
  );
}

/* ---------- date helpers ---------- */

type Tab = "all" | "today" | "tomorrow" | "weekend" | "week";
const TABS: { key: Tab; label: string; empty: string }[] = [
  { key: "all", label: "Todos", empty: "Sin partidos disponibles." },
  { key: "today", label: "Hoy", empty: "Sin partidos para hoy." },
  { key: "tomorrow", label: "Mañana", empty: "Sin partidos para mañana." },
  { key: "weekend", label: "Fin de semana", empty: "Sin partidos este fin de semana." },
  { key: "week", label: "Próximos 7 días", empty: "Sin partidos en los próximos 7 días." },
];

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function dayDiff(iso: string, now: number) {
  return Math.round((startOfDay(new Date(iso)) - startOfDay(new Date(now))) / DAY);
}

function weekendRange(now: number) {
  const d = new Date(now);
  const dow = d.getDay(); // 0 sun .. 6 sat
  const today = startOfDay(d);
  if (dow === 0) return [today - DAY * 2, today + DAY];
  const fri = today + ((5 - dow + 7) % 7) * DAY;
  const start = dow === 6 ? today - DAY : fri;
  return [start, start + DAY * 3];
}

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-ES", o);
const fmtHour = fmt({ hour: "2-digit", minute: "2-digit" });
const fmtShortDay = fmt({ weekday: "short", day: "numeric" });
const fmtLongDay = fmt({ weekday: "short", day: "numeric", month: "short" });
const fmtFarDay = fmt({ weekday: "long", day: "numeric", month: "short" });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function dayHeading(iso: string, now: number) {
  const diff = dayDiff(iso, now);
  const d = new Date(iso);
  if (diff === 0) return { lead: "Hoy", rest: fmtLongDay.format(d) };
  if (diff === 1) return { lead: "Mañana", rest: fmtLongDay.format(d) };
  if (diff === -1) return { lead: "Ayer", rest: fmtLongDay.format(d) };
  return { lead: null, rest: cap(fmtFarDay.format(d)) };
}

function shortDay(iso: string, now: number) {
  const diff = dayDiff(iso, now);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return fmtShortDay.format(new Date(iso));
}

/* ---------- source bar ---------- */

function SourceInfo({
  source,
  updatedAt,
  loading,
  onRefresh,
}: Pick<Props, "source" | "updatedAt" | "loading" | "onRefresh">) {
  const live = source === "live";
  const label = live ? "En vivo" : source === "cache" ? "Guardado" : "Demo";
  return (
    <div className="flex shrink-0 items-center gap-3">
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
          live
            ? "border-positive/30 bg-positive/10 text-positive"
            : "border-border-strong bg-surface text-muted-foreground"
        }`}
      >
        <span className={`size-1.5 rounded-full ${live ? "bg-positive" : "bg-subtle-foreground"}`} />
        {label}
      </span>
      {updatedAt && (
        <span className="tabular hidden text-xs text-subtle-foreground sm:inline">
          Actualizado: {fmtHour.format(new Date(updatedAt))}
        </span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        aria-label="Actualizar cuotas"
        className="grid size-9 place-items-center rounded-full border border-border-strong bg-surface text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground disabled:opacity-50"
      >
        <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

/* ---------- odds button & row ---------- */

function OddsButton({
  analysis,
  outcome,
  active,
  onClick,
}: {
  analysis: MatchAnalysis;
  outcome: Outcome;
  active: boolean;
  onClick: () => void;
}) {
  const oa = analysis.outcomes[outcome];
  const pos = oa.ev > 0;
  const best = analysis.best === outcome && pos;
  const base = active
    ? "border-primary bg-primary text-primary-foreground"
    : best
      ? "border-positive/50 bg-positive/[0.07] hover:bg-positive/[0.12]"
      : pos
        ? "border-positive/30 bg-surface hover:bg-surface-raised"
        : "border-border bg-surface hover:border-border-strong hover:bg-surface-raised";
  const oddsColor = active ? "" : pos ? "text-positive" : "text-negative";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-pressed={active}
      className={`flex h-[62px] w-full flex-col items-center justify-center gap-0.5 rounded-lg border px-1 transition-colors ${base}`}
    >
      <span className={`text-[10px] font-semibold ${active ? "opacity-80" : "text-subtle-foreground"}`}>
        {oa.code}
      </span>
      <span className={`tabular text-[15px] font-semibold leading-none ${oddsColor}`}>{fmtOdds(oa.odds)}</span>
      <span
        className={`tabular inline-flex items-center gap-0.5 text-[10px] font-semibold leading-none ${
          active ? "opacity-80" : pos ? "text-positive" : "text-negative/70"
        }`}
      >
        {best && <Flame className="size-2.5" />}
        {best ? `VALOR ${fmtEv(oa.ev)}` : fmtEv(oa.ev)}
      </span>
    </button>
  );
}

function TeamLine({ name, short }: { name: string; short: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border-strong bg-surface text-[9px] font-bold text-muted-foreground">
        {short.slice(0, 3)}
      </span>
      <span className="truncate text-sm font-medium">{name}</span>
    </div>
  );
}

function MatchRow({
  a,
  isSel,
  selectedOutcome,
  onSelect,
  now,
}: {
  a: MatchAnalysis;
  isSel: boolean;
  selectedOutcome: Outcome;
  onSelect: Props["onSelect"];
  now: number;
}) {
  const start = new Date(a.match.kickoff).getTime();
  const soon = start - now < 2 * 3_600_000 && now - start < 2 * 3_600_000;
  const fallback: Outcome = a.outcomes[a.best].ev > 0 ? a.best : selectedOutcome;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(a.match.id, isSel ? selectedOutcome : fallback)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(a.match.id, isSel ? selectedOutcome : fallback)}
      className={`grid cursor-pointer grid-cols-[56px_minmax(0,1fr)] items-center gap-x-3 gap-y-3 border-b border-border px-4 py-3 transition-colors hover:bg-surface/60 sm:grid-cols-[64px_minmax(0,1fr)_minmax(0,300px)] ${
        isSel ? "bg-surface/70 shadow-[inset_3px_0_0_var(--color-primary)]" : ""
      }`}
    >
      <div className="flex flex-col">
        <span className="tabular flex items-center gap-1.5 text-[15px] font-semibold">
          {soon && (
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-positive" />
            </span>
          )}
          {fmtHour.format(new Date(a.match.kickoff))}
        </span>
        <span className="text-[11px] text-subtle-foreground">{shortDay(a.match.kickoff, now)}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <TeamLine name={a.match.home.name} short={a.match.home.short} />
        <TeamLine name={a.match.away.name} short={a.match.away.short} />
      </div>
      <div className="col-span-2 grid grid-cols-3 gap-2 sm:col-span-1">
        {OUTCOMES.map((o) => (
          <OddsButton
            key={o}
            analysis={a}
            outcome={o}
            active={isSel && selectedOutcome === o}
            onClick={() => onSelect(a.match.id, o)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export function Matches({
  analyses,
  selectedMatch,
  selectedOutcome,
  onSelect,
  leagues,
  league,
  onLeague,
  source,
  updatedAt,
  loading,
  error,
  onRefresh,
}: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const l of leagues) {
      const c = readCache<{ inputs: AnalysisInput[] }>(`odds:${l.key}`);
      if (c?.data.inputs.length) next[l.key] = c.data.inputs.length;
    }
    next[league] = analyses.length;
    setCounts(next);
  }, [leagues, league, analyses.length, updatedAt]);

  const visibleLeagues = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? leagues.filter((l) => l.title.toLowerCase().includes(q)) : leagues;
    if (q) return list;
    const top = list.slice(0, 10);
    const cur = leagues.find((l) => l.key === league);
    if (cur && !top.includes(cur)) top.push(cur);
    return top;
  }, [leagues, query, league]);

  const current = leagues.find((l) => l.key === league);
  const meta = current ? leagueMeta(current) : { code: "—", country: "", name: "Liga" };

  const sorted = useMemo(
    () => [...analyses].sort((a, b) => a.match.kickoff.localeCompare(b.match.kickoff)),
    [analyses],
  );

  const { groups, truncated } = useMemo(() => {
    let list = sorted;
    let truncated = false;
    if (tab === "today") list = sorted.filter((a) => dayDiff(a.match.kickoff, now) === 0);
    if (tab === "tomorrow") list = sorted.filter((a) => dayDiff(a.match.kickoff, now) === 1);
    if (tab === "weekend") {
      const [s, e] = weekendRange(now);
      list = sorted.filter((a) => {
        const t = new Date(a.match.kickoff).getTime();
        return t >= s! && t < e!;
      });
    }
    if (tab === "week") {
      const inRange = sorted.filter((a) => {
        const d = dayDiff(a.match.kickoff, now);
        return d >= 0 && d < 7;
      });
      truncated = inRange.length < sorted.filter((a) => dayDiff(a.match.kickoff, now) >= 0).length;
      list = inRange;
    }
    const map = new Map<string, MatchAnalysis[]>();
    for (const a of list) {
      const k = String(startOfDay(new Date(a.match.kickoff)));
      map.set(k, [...(map.get(k) ?? []), a]);
    }
    return { groups: [...map.values()], truncated };
  }, [sorted, tab, now]);

  const emptyText = TABS.find((t) => t.key === tab)!.empty;

  return (
    <section id="partidos" className="container-edge py-16 md:py-20">
      <div className="mb-6">
        <p className="eyebrow">Partidos</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Elige una cuota para analizarla.</h2>
      </div>

      <div className="card-edge overflow-hidden md:grid md:grid-cols-[272px_minmax(0,1fr)]">
        {/* Sidebar (desktop) */}
        <aside className="hidden border-r border-border md:block">
          <div className="border-b border-border p-3">
            <label className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-muted-foreground">
              <Search className="size-3.5 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar liga"
                aria-label="Buscar liga"
                className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle-foreground"
              />
            </label>
          </div>
          <nav className="max-h-[640px] overflow-y-auto py-1">
            {visibleLeagues.map((l) => {
              const m = leagueMeta(l);
              const active = l.key === league;
              return (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => onLeague(l.key)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    active
                      ? "bg-surface-raised shadow-[inset_3px_0_0_var(--color-primary)]"
                      : "hover:bg-surface"
                  }`}
                >
                  <LeagueDot code={m.code} active={active} />
                  <span className={`min-w-0 flex-1 truncate text-[13px] ${active ? "font-semibold" : "text-muted-foreground"}`}>
                    {m.name}
                  </span>
                  {counts[l.key] !== undefined && (
                    <span className="tabular rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-subtle-foreground">
                      {counts[l.key]}
                    </span>
                  )}
                </button>
              );
            })}
            {!visibleLeagues.length && <p className="px-4 py-6 text-xs text-subtle-foreground">Sin coincidencias.</p>}
          </nav>
        </aside>

        {/* Chips (mobile) */}
        <div className="flex gap-2 overflow-x-auto border-b border-border p-3 md:hidden">
          {leagues.map((l) => {
            const m = leagueMeta(l);
            const active = l.key === league;
            return (
              <button
                key={l.key}
                type="button"
                onClick={() => onLeague(l.key)}
                className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs ${
                  active ? "border-primary/50 bg-surface-raised font-semibold" : "border-border text-muted-foreground"
                }`}
              >
                <LeagueDot code={m.code} active={active} />
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Main */}
        <div className="min-w-0">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <LeagueDot code={meta.code} active />
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold">{meta.name}</h3>
                <p className="truncate text-xs text-subtle-foreground">
                  {meta.country && `${meta.country} · `}
                  {analyses.length} {analyses.length === 1 ? "partido" : "partidos"}
                </p>
              </div>
            </div>
            <SourceInfo source={source} updatedAt={updatedAt} loading={loading} onRefresh={onRefresh} />
          </header>
          {error && (
            <p className="border-b border-border bg-surface px-4 py-2 text-xs text-muted-foreground">{error}</p>
          )}

          <div className="flex gap-1 overflow-x-auto border-b border-border px-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative shrink-0 px-3 py-3 text-[13px] font-medium transition-colors ${
                  tab === t.key ? "text-foreground" : "text-subtle-foreground hover:text-muted-foreground"
                }`}
              >
                {t.label}
                {tab === t.key && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>

          <div className="max-h-[640px] overflow-y-auto">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
                <CalendarX className="size-6 text-subtle-foreground" />
                <p className="text-sm text-muted-foreground">{emptyText}</p>
              </div>
            ) : (
              groups.map((g) => {
                const h = dayHeading(g[0]!.match.kickoff, now);
                return (
                  <div key={g[0]!.match.kickoff}>
                    <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                      {h.lead && <span className="text-primary">{h.lead}</span>}
                      {h.lead && " — "}
                      {h.rest}
                    </div>
                    {g.map((a) => (
                      <MatchRow
                        key={a.match.id}
                        a={a}
                        isSel={a.match.id === selectedMatch}
                        selectedOutcome={selectedOutcome}
                        onSelect={onSelect}
                        now={now}
                      />
                    ))}
                  </div>
                );
              })
            )}
            {truncated && tab === "week" && (
              <p className="px-4 py-3 text-center text-[11px] text-subtle-foreground">Mostrando los próximos 7 días</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
