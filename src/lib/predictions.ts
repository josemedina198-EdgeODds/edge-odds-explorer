import type { Outcome } from "./model";
import { readCache, writeCache } from "./oddsApi";

export type PredictionMap = Record<string, Outcome>;

const NAME = "predictions";

export function readPredictions(): PredictionMap {
  return readCache<PredictionMap>(NAME)?.data ?? {};
}

export function savePredictions(next: PredictionMap) {
  const merged = { ...readPredictions(), ...next };
  // keep the store small
  const entries = Object.entries(merged).slice(-200);
  writeCache<PredictionMap>(NAME, Object.fromEntries(entries));
}
