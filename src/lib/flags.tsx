import { useState } from "react";
import { Trophy } from "lucide-react";

/** Lowercase, strip accents and extra spaces. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/ ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const RAW_TEAMS: Record<string, string> = {
  "Real Madrid": "es", "FC Barcelona": "es", Barcelona: "es", "Sevilla FC": "es", Sevilla: "es",
  "Athletic Club": "es", "Athletic Bilbao": "es", "Atlético de Madrid": "es", "Atletico Madrid": "es",
  "Villarreal CF": "es", Villarreal: "es", "Real Betis": "es", "Valencia CF": "es", Valencia: "es",
  "Girona FC": "es", Girona: "es", "Real Sociedad": "es", "Celta Vigo": "es", Osasuna: "es",
  Getafe: "es", Mallorca: "es", "Rayo Vallecano": "es", Alaves: "es", Espanyol: "es", Elche: "es",
  Levante: "es", "Real Oviedo": "es",
  "Manchester City": "gb-eng", Liverpool: "gb-eng", Arsenal: "gb-eng", Chelsea: "gb-eng",
  Tottenham: "gb-eng", "Tottenham Hotspur": "gb-eng", "Manchester United": "gb-eng",
  "Newcastle United": "gb-eng", "Aston Villa": "gb-eng", Everton: "gb-eng", "West Ham United": "gb-eng",
  Brighton: "gb-eng", "Brighton and Hove Albion": "gb-eng", Fulham: "gb-eng", Brentford: "gb-eng",
  "Crystal Palace": "gb-eng", "Nottingham Forest": "gb-eng", Bournemouth: "gb-eng",
  "Wolverhampton Wanderers": "gb-eng", Burnley: "gb-eng", "Leeds United": "gb-eng", Sunderland: "gb-eng",
  "Bayern Munich": "de", "Borussia Dortmund": "de", "RB Leipzig": "de", "Bayer Leverkusen": "de",
  "Eintracht Frankfurt": "de", "VfB Stuttgart": "de", "Borussia Monchengladbach": "de", "Werder Bremen": "de",
  "VfL Wolfsburg": "de", "SC Freiburg": "de", "Union Berlin": "de", "FSV Mainz 05": "de",
  "Inter Milan": "it", Inter: "it", "AC Milan": "it", Juventus: "it", Napoli: "it", "AS Roma": "it",
  Lazio: "it", Atalanta: "it", Fiorentina: "it", Bologna: "it", Torino: "it", Genoa: "it",
  "Paris Saint-Germain": "fr", "Paris Saint Germain": "fr", Marseille: "fr", Lyon: "fr", Monaco: "fr",
  Lille: "fr", Nice: "fr", Lens: "fr", Rennes: "fr",
  Benfica: "pt", Porto: "pt", "FC Porto": "pt", "Sporting CP": "pt", "Sporting Lisbon": "pt", Braga: "pt",
  Ajax: "nl", PSV: "nl", "PSV Eindhoven": "nl", Feyenoord: "nl", "AZ Alkmaar": "nl",
  Celtic: "gb-sct", Rangers: "gb-sct",
  Galatasaray: "tr", "Fenerbahçe": "tr", Besiktas: "tr", Trabzonspor: "tr",
  Olympiacos: "gr", Panathinaikos: "gr", "PAOK": "gr",
  "Shakhtar Donetsk": "ua", "Dynamo Kyiv": "ua",
  "Club Brugge": "be", Anderlecht: "be", Antwerp: "be", Gent: "be", "Union Saint-Gilloise": "be",
  "Standard Liege": "be", Genk: "be", Charleroi: "be", Mechelen: "be", "Cercle Brugge": "be",
  "OH Leuven": "be", Kortrijk: "be", Eupen: "be", Westerlo: "be", RWDM: "be", "St. Truiden": "be",
  "Red Bull Salzburg": "at", "Sturm Graz": "at", "Young Boys": "ch", Basel: "ch",
  Copenhagen: "dk", Midtjylland: "dk", "Bodo/Glimt": "no", Molde: "no", Rosenborg: "no",
  "Slavia Prague": "cz", "Sparta Prague": "cz", "Legia Warsaw": "pl", "Lech Poznan": "pl",
  Ferencvaros: "hu", "Steaua Bucharest": "ro", "FCSB": "ro", "Partizan Belgrade": "rs",
  "Red Star Belgrade": "rs", "Dinamo Zagreb": "hr", "Hajduk Split": "hr", Ludogorets: "bg",
  APOEL: "cy", "Maccabi Tel Aviv": "il", "Hapoel Be'er Sheva": "il", AIK: "se", "Malmo FF": "se",
  "Spartak Moscow": "ru", Zenit: "ru", "CSKA Moscow": "ru", "Dynamo Moscow": "ru",
  "Lokomotiv Moscow": "ru", Krasnodar: "ru",
};

export const TEAM_FLAGS: Record<string, string> = Object.fromEntries(
  Object.entries(RAW_TEAMS).map(([k, v]) => [normalize(k), v]),
);
export const TEAM_NAMES: string[] = Object.keys(RAW_TEAMS);

export function teamFlag(name: string): string | null {
  const n = normalize(name);
  if (TEAM_FLAGS[n]) return TEAM_FLAGS[n]!;
  for (const [k, v] of Object.entries(TEAM_FLAGS)) {
    if (k.length >= 4 && (n.startsWith(k + " ") || n.endsWith(" " + k) || k.startsWith(n + " "))) return v;
  }
  return null;
}

export const COUNTRY_NAMES: Record<string, string> = {
  es: "España", "gb-eng": "Inglaterra", "gb-sct": "Escocia", it: "Italia", de: "Alemania", fr: "Francia",
  pt: "Portugal", nl: "Holanda Países Bajos", tr: "Turquía", gr: "Grecia", ua: "Ucrania", be: "Bélgica",
  at: "Austria", ch: "Suiza", dk: "Dinamarca", no: "Noruega", cz: "Chequia", pl: "Polonia", hu: "Hungría",
  ro: "Rumania", rs: "Serbia", hr: "Croacia", bg: "Bulgaria", cy: "Chipre", il: "Israel", se: "Suecia",
  ru: "Rusia", mx: "México", ar: "Argentina", br: "Brasil", us: "Estados Unidos EEUU", sa: "Arabia Saudita",
  qa: "Catar Qatar", ae: "Emiratos", jp: "Japón", kr: "Corea", au: "Australia", cl: "Chile", co: "Colombia",
  pe: "Perú", uy: "Uruguay", py: "Paraguay", bo: "Bolivia", ec: "Ecuador", ve: "Venezuela", fi: "Finlandia",
  ie: "Irlanda", cn: "China", eu: "Europa",
};

/** League flag from sport key. "eu" = UEFA; "cup" = trophy icon. */
const LEAGUE_RULES: [RegExp, string][] = [
  [/uefa|champs_league|europa|conference/, "eu"],
  [/libertadores|sudamericana|world_cup|fifa|club_world|concacaf|afc|caf/, "cup"],
  [/spain/, "es"], [/epl|england|efl|fa_cup/, "gb-eng"], [/scotland|spl/, "gb-sct"],
  [/italy/, "it"], [/germany/, "de"], [/france/, "fr"], [/portugal/, "pt"], [/netherlands/, "nl"],
  [/turkey/, "tr"], [/greece/, "gr"], [/ukraine/, "ua"], [/belgium/, "be"], [/austria/, "at"],
  [/switzerland/, "ch"], [/denmark/, "dk"], [/norway/, "no"], [/czech/, "cz"], [/poland/, "pl"],
  [/hungary/, "hu"], [/romania/, "ro"], [/serbia/, "rs"], [/croatia/, "hr"], [/bulgaria/, "bg"],
  [/cyprus/, "cy"], [/israel/, "il"], [/sweden/, "se"], [/russia/, "ru"], [/mexico/, "mx"],
  [/argentina/, "ar"], [/brazil/, "br"], [/usa|mls/, "us"], [/saudi/, "sa"], [/qatar/, "qa"],
  [/uae/, "ae"], [/japan/, "jp"], [/korea/, "kr"], [/australia/, "au"], [/chile/, "cl"],
  [/colombia/, "co"], [/peru/, "pe"], [/uruguay/, "uy"], [/paraguay/, "py"], [/bolivia/, "bo"],
  [/ecuador/, "ec"], [/venezuela/, "ve"], [/finland/, "fi"], [/ireland/, "ie"], [/china/, "cn"],
];

export function leagueFlag(key: string): string | null {
  return LEAGUE_RULES.find(([re]) => re.test(key))?.[1] ?? null;
}

export const isMultinational = (code: string | null) => code === "eu" || code === "cup";

const SIZES = { sm: "size-5", md: "size-7", lg: "size-8" } as const;

export function Flag({
  code,
  name,
  size = "sm",
}: {
  code: string | null;
  name: string;
  size?: keyof typeof SIZES;
}) {
  const [broken, setBroken] = useState(false);
  const cls = `${SIZES[size]} shrink-0 overflow-hidden rounded-full border border-border-strong bg-surface`;
  if (code === "cup")
    return (
      <span className={`${cls} grid place-items-center text-primary`} title={name}>
        <Trophy className="size-3/5" />
      </span>
    );
  if (!code || broken)
    return (
      <span className={`${cls} grid place-items-center text-[10px] font-bold text-muted-foreground`} title={name}>
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={name}
      loading="lazy"
      onError={() => setBroken(true)}
      className={`${cls} object-cover`}
    />
  );
}

export function TeamFlag({ name, size = "sm" }: { name: string; size?: keyof typeof SIZES }) {
  return <Flag code={teamFlag(name)} name={name} size={size} />;
}
