/**
 * Chrome's built-in Gemini Nano, via the Prompt API.
 *
 * Nano is the default lane: if it can run here, WM3 writes its answers with it.
 * What Nano never does is make the reader wait. Asking a question starts the
 * model download and answers from the archive in the same breath — quoting for
 * that question, and writing from the next one on, once the model has landed.
 *
 * Adapted from mvp-web-app's hintEval/nanoLoad.ts, which learned these failure
 * modes the hard way.
 */

export type NanoState =
  | 'unsupported'
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'ready'
  | 'failed';

export interface NanoStatus {
  state: NanoState;
  /** 0–100 while downloading. */
  percent: number;
}

type Session = {
  promptStreaming(input: string): AsyncIterable<string> | ReadableStream<string>;
  destroy?(): void;
};

type PromptApi = {
  availability(): Promise<string>;
  create(options?: unknown): Promise<Session>;
};

/** Chrome exposes this as `LanguageModel`; older origin-trial builds used `window.ai.languageModel`. */
export function getPromptApi(): PromptApi | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { LanguageModel?: PromptApi; ai?: { languageModel?: PromptApi } };
  return w.LanguageModel ?? w.ai?.languageModel ?? null;
}

let status: NanoStatus = { state: 'unsupported', percent: 0 };
let downloadStarted = false;
const listeners = new Set<(s: NanoStatus) => void>();

function set(next: Partial<NanoStatus>) {
  status = { ...status, ...next };
  for (const fn of listeners) fn(status);
}

export function getNanoStatus(): NanoStatus {
  return status;
}

export function onNanoStatus(fn: (s: NanoStatus) => void): () => void {
  listeners.add(fn);
  fn(status);
  return () => listeners.delete(fn);
}

export const nanoIsReady = () => status.state === 'ready';

/** Read availability without side effects. Older builds used `readily`/`after-download`. */
async function readAvailability(): Promise<NanoState> {
  const api = getPromptApi();
  if (!api) return 'unsupported';
  try {
    const v = await api.availability();
    if (v === 'available' || v === 'readily') return 'ready';
    if (v === 'downloadable' || v === 'after-download') return 'downloadable';
    if (v === 'downloading') return 'downloading';
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

/** Probe on load so the UI can say what lane it is on before anything is asked. */
export async function probeNano(): Promise<NanoState> {
  const state = await readAvailability();
  set({ state });
  return state;
}

/**
 * Start (or join) the model download and resolve when Nano is usable.
 *
 * MUST be called synchronously from a click — Chrome requires user activation
 * to begin the fetch, and an `await` before this consumes it. Never throws:
 * a machine that cannot run Nano is the normal case, not an error.
 */
export async function ensureNano(): Promise<boolean> {
  if (status.state === 'ready') return true;
  if (downloadStarted) return false;

  const api = getPromptApi();
  if (!api) {
    set({ state: 'unsupported' });
    return false;
  }

  downloadStarted = true;
  const before = await readAvailability();
  if (before === 'ready') {
    set({ state: 'ready' });
    return true;
  }
  if (before === 'unsupported' || before === 'unavailable') {
    set({ state: before });
    return false;
  }

  set({ state: 'downloading', percent: 0 });

  let session: Session | null = null;
  try {
    session = await api.create({
      monitor(m: EventTarget) {
        m.addEventListener('downloadprogress', (event: Event) => {
          // Spec sends `loaded` as an overall 0–1 fraction; older builds sent
          // byte counts with a `total` alongside. Normalize both.
          const e = event as ProgressEvent & { loaded?: number; total?: number };
          const fraction =
            typeof e.total === 'number' && e.total > 0
              ? e.loaded! / e.total
              : typeof e.loaded === 'number'
                ? e.loaded
                : 0;
          set({ percent: Math.max(0, Math.min(100, Math.round(fraction * 100))) });
        });
      },
    });
  } catch (err) {
    // NotAllowedError means the click's activation was already spent;
    // QuotaExceededError means there isn't ~22GB free. Neither is worth
    // showing a reader — they get quoted answers, which is a fine outcome.
    console.warn('[WM3] Gemini Nano download did not start', err);
    set({ state: 'failed' });
    return false;
  } finally {
    session?.destroy?.();
  }

  // create() resolving is the success signal, but confirm rather than assume.
  const after = await readAvailability();
  set({ state: after === 'ready' ? 'ready' : 'failed', percent: 100 });
  return after === 'ready';
}

/** Open a session for one answer. Returns null if Nano isn't usable. */
export async function createSession(systemPrompt: string): Promise<Session | null> {
  const api = getPromptApi();
  if (!api || status.state !== 'ready') return null;
  try {
    return await api.create({
      initialPrompts: [{ role: 'system', content: systemPrompt }],
      // Chrome warns and degrades output quality without these.
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }],
    });
  } catch (err) {
    console.warn('[WM3] Gemini Nano session failed', err);
    set({ state: 'failed' });
    return null;
  }
}
