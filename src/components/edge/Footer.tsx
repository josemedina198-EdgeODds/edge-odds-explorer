import { MATCHES, TEAMS } from "@/data/matches";
import { Logo } from "./Header";

export function Footer() {
  const teams = Object.keys(TEAMS).length;
  return (
    <footer id="referencias" className="border-t border-border">
      <div className="container-edge py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Compara tu modelo con el mercado y decide con números, no con intuición. Todos los
              cálculos se ejecutan en tu navegador; ningún dato sale de tu dispositivo.
            </p>
          </div>
          <div>
            <p className="eyebrow">Referencias de datos</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                Forma reciente: últimos 5 partidos en casa y 5 fuera de {teams} equipos.
              </li>
              <li>Cuotas 1X2: cierre de mercado, {MATCHES.length} partidos de muestra.</li>
              <li>Conjunto de datos de demostración, listo para sustituir por histórico real.</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">Producto</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#partidos" className="hover:text-foreground">Partidos</a></li>
              <li><a href="#comparador" className="hover:text-foreground">Comparador</a></li>
              <li><a href="#valor-esperado" className="hover:text-foreground">Valor esperado</a></li>
              <li><a href="#calculadora" className="hover:text-foreground">Calculadora</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-subtle-foreground md:flex-row md:items-center md:justify-between">
          <span>© 2026 Edge Analytics</span>
          <span>Apuesta con responsabilidad. Solo mayores de 18 años.</span>
        </div>
      </div>
    </footer>
  );
}
