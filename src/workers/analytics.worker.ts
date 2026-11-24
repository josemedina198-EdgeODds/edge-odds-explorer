import { loadPyodide } from 'pyodide';
import engine from '../python/engine.py?raw';

const runtime = (async () => {
  const py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/' });
  await py.loadPackage('numpy');
  await py.runPythonAsync(engine);
  return py;
})();

self.onmessage = async (event: MessageEvent<{ id: number; payload: unknown }>) => {
  const { id, payload } = event.data;
  try {
    const py = await runtime;
    // Dispatch is synchronous; no globals are shared across concurrent async calls.
    const dispatch = py.globals['get']('dispatch');
    try {
      const result = JSON.parse(dispatch(JSON.stringify(payload)) as string) as unknown;
      self.postMessage({ id, result });
    } finally { dispatch.destroy(); }
  } catch {
    self.postMessage({ id, error: 'No se pudo iniciar Python. Revisa tu conexión y vuelve a intentar.' });
  }
};
