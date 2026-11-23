import { useEffect, useState } from 'react';
import { HOME_ADVANTAGE, TEAMS } from '@/data/matches';
import type { AnalysisInput, MatchAnalysis } from '@/lib/model';
import { runPython } from '@/lib/pythonEngine';

export function usePythonAnalysis(inputs: AnalysisInput[]) {
  const [state, setState] = useState<{ analyses: MatchAnalysis[]; loading: boolean; error: string | null }>({ analyses: [], loading: true, error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ analyses: [], loading: true, error: null });
    void runPython<MatchAnalysis[]>({ kind: 'analyze', inputs, teams: TEAMS, advantage: HOME_ADVANTAGE }).then(
      analyses => { if (active) setState({ analyses, loading: false, error: null }); },
      () => { if (active) setState({ analyses: [], loading: false, error: 'No se pudo iniciar el motor Python. Comprueba tu conexión.' }); },
    );
    return () => { active = false; };
  }, [inputs, retry]);
  return { ...state, retry: () => setRetry(v => v + 1) };
}
