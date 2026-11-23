let worker: Worker | undefined;
let sequence = 0;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

export function runPython<T>(payload: unknown): Promise<T> {
  if (!worker) {
    worker = new Worker(new URL('../workers/analytics.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
      const job = pending.get(event.data.id);
      if (!job) return;
      pending.delete(event.data.id);
      if (event.data.error) job.reject(new Error(event.data.error));
      else job.resolve(event.data.result);
    };
    worker.onerror = () => {
      for (const job of pending.values()) job.reject(new Error('Python no está disponible. Intenta recargar la página.'));
      pending.clear();
      worker?.terminate();
      worker = undefined;
    };
  }
  const current = worker;
  return new Promise<T>((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve: (value) => resolve(value as T), reject });
    current.postMessage({ id, payload });
  });
}
