import { useEffect, useState } from "react";
import { ArrowRight, Database, Cpu, Target, X } from "lucide-react";
import { fmtPct } from "@/lib/model";

interface HeroProps {
  matchCount: number;
  positiveCount: number;
  bestEv: number;
}

const STEPS = [
  {
    icon: Database,
    title: "Datos",
    text: "Tomamos los goles a favor y en contra de cada equipo, separados en casa y fuera, y las cuotas 1X2 del mercado.",
  },
  {
    icon: Cpu,
    title: "Modelo",
    text: "Con esa forma reciente estimamos cuántos goles espera marcar cada equipo y traducimos eso en probabilidades para el 1, la X y el 2.",
  },
  {
    icon: Target,
    title: "Decisión",
    text: "Comparamos tu probabilidad con la del mercado, medimos el valor de cada cuota y te sugerimos cuánto apostar según tu banca.",
  },
];

export function Hero({ matchCount, positiveCount, bestEv }: HeroProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <section id="top" className="relative overflow-hidden border-b border-border">
      <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden />
      <div className="container-edge relative py-24 md:py-32">
        <div className="max-w-3xl animate-fade-up">
          <p className="eyebrow mb-5 flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-primary" />
            Análisis de valor · Fútbol
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-6xl">
            Encuentra el valor donde el mercado no lo ve.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            La plataforma que compara tu modelo de probabilidad con las cuotas del mercado para
            encontrar valor esperado positivo.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#partidos"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Ver partidos <ArrowRight className="size-4" />
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 items-center rounded-lg border border-border-strong bg-surface px-5 text-sm font-medium transition-colors hover:bg-surface-raised"
            >
              Cómo funciona
            </button>
          </div>
        </div>

        <dl className="mt-16 grid max-w-2xl grid-cols-3 divide-x divide-border border-y border-border">
          <Stat label="Partidos analizados" value={String(matchCount)} />
          <Stat label="Cuotas con valor" value={String(positiveCount)} />
          <Stat label="Mejor valor esperado" value={`+${fmtPct(bestEv)}`} positive />
        </dl>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-title"
        >
          <div
            className="card-edge w-full max-w-lg animate-fade-up p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Cómo funciona</p>
                <h2 id="how-title" className="mt-2 text-xl font-semibold tracking-tight">
                  Tres pasos, sin ruido.
                </h2>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <ol className="mt-6 space-y-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface">
                    <s.icon className="size-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      <span className="mr-2 tabular text-subtle-foreground">0{i + 1}</span>
                      {s.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <a
              href="#partidos"
              onClick={() => setOpen(false)}
              className="mt-7 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
            >
              Ver partidos
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="px-4 py-5 first:pl-0">
      <dt className="text-[11px] font-medium uppercase tracking-wider text-subtle-foreground">{label}</dt>
      <dd className={`mt-1.5 tabular text-2xl font-semibold tracking-tight ${positive ? "text-positive" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
