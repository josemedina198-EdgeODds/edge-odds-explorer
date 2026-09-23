import { useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const NAV = [
  { label: "Partidos", href: "#partidos" },
  { label: "Resultados", href: "#resultados" },
  { label: "Comparador", href: "#comparador" },
  { label: "Valor Esperado", href: "#valor-esperado" },
  { label: "Calculadora", href: "#calculadora" },
  { label: "Referencias", href: "#referencias" },
];

export function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5">
      <span className="grid size-7 place-items-center rounded-md border border-border-strong bg-surface">
        <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
          <path
            d="M2.5 11.5 6 6.5l2.6 2.4L13.5 3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          />
          <circle cx="6" cy="6.5" r="1.4" fill="currentColor" className="text-primary" />
          <path d="M2.5 13.5h11" stroke="currentColor" strokeWidth="1.2" className="text-subtle-foreground" />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        Odds<span className="text-primary">Edge</span>
      </span>
    </a>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container-edge flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
            className="grid size-9 place-items-center rounded-lg border border-border-strong bg-surface text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            type="button"
            className="hidden h-9 items-center rounded-lg border border-border-strong bg-surface px-4 text-[13px] font-medium transition-colors hover:bg-surface-raised md:inline-flex"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            aria-label="Menú"
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-lg border border-border-strong bg-surface lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="container-edge flex flex-col py-3">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
            <button
              type="button"
              className="mt-2 h-10 rounded-lg border border-border-strong bg-surface text-sm font-medium"
            >
              Iniciar sesión
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
