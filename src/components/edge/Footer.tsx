import { Logo } from "./Header";

export function Footer({ source }: { source: "live" | "cache" | "demo" }) {
  return (
    <footer id="referencias" className="border-t border-border">
      <div className="container-edge py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Compara tu modelo con el mercado y decide con números, no con intuición. Todos los
              cálculos numéricos se ejecutan en Python en tu navegador. Se consulta The Odds API para obtener datos; tu banca no se envía a ese servicio.
            </p>
          </div>
          <div>
            <p className="eyebrow">Referencias de datos</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                Cuotas 1X2:{" "}
                {source === "demo"
                  ? "conjunto de demostración incluido en la app."
                  : "consenso (mediana) de las casas disponibles para cada partido."}
              </li>
              <li>Probabilidades del mercado sin el margen de la casa.</li>
              <li>Los datos guardados conservan su fecha; no son precios actuales.</li>
              <li><a href="https://www.the-odds-api.com/liveapi/guides/v4/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Documentación y cobertura de The Odds API ↗</a></li>
              <li><a href="https://www.the-odds-api.com/sports-odds-data/update-intervals.html" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Frecuencia de actualización del proveedor ↗</a></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">Producto</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#guia" className="hover:text-foreground">Guía del simulador</a></li>
              <li><a href="#partidos" className="hover:text-foreground">Partidos</a></li>
              <li><a href="#resultados" className="hover:text-foreground">Resultados</a></li>
              <li><a href="#comparador" className="hover:text-foreground">Comparador</a></li>
              <li><a href="#valor-esperado" className="hover:text-foreground">Valor esperado</a></li>
              <li><a href="#calculadora" className="hover:text-foreground">Calculadora</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-subtle-foreground md:flex-row md:items-center md:justify-between">
          <span>© 2026 OddsEdge</span>
          <span>Apuesta con responsabilidad. Solo mayores de 18 años.</span>
        </div>
      </div>
    </footer>
  );
}
