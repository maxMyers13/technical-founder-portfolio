import { Match } from './archive';

/**
 * Turning retrieved passages into an answer.
 *
 * Two lanes. If Chrome's Prompt API already has Gemini Nano on this machine,
 * the passages are written up on-device. Otherwise the passages are quoted
 * directly. The quoting lane is the default, not a degraded mode — it is the
 * one that runs for every phone, every Safari, and every desktop that hasn't
 * got the model.
 */

const SYSTEM_PROMPT = `You are WM3, the archive interface on Max Myers' site wm3.ai.

Answer ONLY from the passages given to you. They are Max's own published writing and pages.

Rules:
- If the passages do not answer the question, say so plainly. Never guess, never fill gaps from your own knowledge.
- Refer to Max in the third person.
- Two short paragraphs at most. No preamble, no "based on the passages".
- Do not invent numbers, dates, employers or names that are not in the passages.`;

type PromptApi = {
  availability(): Promise<string>;
  create(options?: unknown): Promise<{
    promptStreaming(input: string): AsyncIterable<string> | ReadableStream<string>;
    destroy?(): void;
  }>;
};

/** Chrome exposes this as `LanguageModel`; older origin-trial builds used `window.ai.languageModel`. */
function getPromptApi(): PromptApi | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { LanguageModel?: PromptApi; ai?: { languageModel?: PromptApi } };
  return w.LanguageModel ?? w.ai?.languageModel ?? null;
}

/**
 * Only "available" counts. On a portfolio a visitor is a reader, not a user who
 * opted into a tool — we never trigger the multi-gigabyte model download, and
 * "downloadable" is treated exactly like "no".
 */
export async function nanoReady(): Promise<boolean> {
  const api = getPromptApi();
  if (!api) return false;
  try {
    const state = await api.availability();
    return state === 'available' || state === 'readily';
  } catch {
    return false;
  }
}

function buildContext(matches: Match[]): string {
  return matches
    .map((m, i) => `[${i + 1}] ${m.chunk.title}${m.chunk.date ? ` (${m.chunk.date})` : ''}\n${m.chunk.text}`)
    .join('\n\n');
}

/** Longest quote to show before trimming — roughly a readable paragraph. */
const QUOTE_CHARS = 420;

/** Trim to the last sentence that fits, so a quote never ends mid-clause. */
function trimToSentence(text: string): string {
  const clean = text.trim().replace(/\n{3,}/g, '\n\n');
  if (clean.length <= QUOTE_CHARS) return clean;

  const window = clean.slice(0, QUOTE_CHARS);
  const lastStop = Math.max(window.lastIndexOf('. '), window.lastIndexOf('.\n'));
  return `${(lastStop > QUOTE_CHARS * 0.5 ? window.slice(0, lastStop + 1) : window).trim()}…`;
}

/** The no-model answer: Max's own words, attributed, never paraphrased. */
export function quoteAnswer(matches: Match[]): string {
  const lead =
    matches.length === 1
      ? 'From the archive:'
      : 'From the archive — the closest things Max has written:';

  const passages = matches
    .slice(0, 2)
    .map((m) => {
      const when = m.chunk.date ? `, ${m.chunk.date}` : '';
      return `“${trimToSentence(m.chunk.text)}”\n— ${m.chunk.title}${when}`;
    })
    .join('\n\n');

  return `${lead}\n\n${passages}`;
}

/**
 * Streams an answer as text deltas. Falls back to the quoting lane if the
 * Prompt API is absent or throws part-way through.
 */
export async function* streamAnswer(
  question: string,
  matches: Match[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const api = getPromptApi();

  if (api && (await nanoReady())) {
    try {
      const session = await api.create({
        initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
        // Chrome warns and degrades output quality without this.
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
      });
      const input = `Passages:\n\n${buildContext(matches)}\n\nQuestion: ${question}`;
      const stream = session.promptStreaming(input);

      // Chrome has shipped both delta chunks and cumulative snapshots here.
      let emitted = '';
      for await (const piece of stream as AsyncIterable<string>) {
        if (signal?.aborted) break;
        const delta = piece.startsWith(emitted) ? piece.slice(emitted.length) : piece;
        emitted += delta;
        yield delta;
      }
      session.destroy?.();
      if (emitted.trim()) return;
    } catch {
      // Fall through to quoting — a half-written on-device answer is worse
      // than a clean set of quotes.
    }
  }

  yield quoteAnswer(matches);
}
