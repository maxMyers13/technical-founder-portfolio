import { AnswerLane } from '../../types';
import { Match } from './archive';
import { createSession, nanoIsReady } from './nano';

/**
 * Turning retrieved passages into an answer.
 *
 * Gemini Nano is the default lane — when Chrome can run it, the passages are
 * written up on the reader's own machine. Quoting is what happens when it
 * can't: on every phone, every Safari, and every desktop while the model is
 * still downloading. Quoting cannot hallucinate, so it is a fine place to land.
 */

const SYSTEM_PROMPT = `You are WM3, the archive interface on Max Myers' site wm3.ai.

Answer ONLY from the passages given to you. They are Max's own published writing and pages.

Rules:
- If the passages do not answer the question, say so plainly. Never guess, never fill gaps from your own knowledge.
- Refer to Max in the third person.
- Two short paragraphs at most. No preamble, no "based on the passages".
- Do not invent numbers, dates, employers or names that are not in the passages.`;

/** Longest quote to show before trimming — roughly a readable paragraph. */
const QUOTE_CHARS = 420;

function buildContext(matches: Match[]): string {
  return matches
    .map(
      (m, i) =>
        `[${i + 1}] ${m.chunk.title}${m.chunk.date ? ` (${m.chunk.date})` : ''}\n${m.chunk.text}`,
    )
    .join('\n\n');
}

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
 * Streams an answer as text deltas.
 *
 * `onLane` fires as soon as the lane is settled — which is only once the first
 * token actually arrives, not when Nano is merely reported ready. A session
 * that opens and then dies still ends up quoting, and the reader should be
 * told what wrote the words they are looking at, not what was attempted.
 */
export async function* streamAnswer(
  question: string,
  matches: Match[],
  signal?: AbortSignal,
  onLane?: (lane: AnswerLane) => void,
): AsyncGenerator<string> {
  if (nanoIsReady()) {
    const session = await createSession(SYSTEM_PROMPT);
    if (session) {
      // Tracked outside the try: if Nano dies part-way we must not append
      // quotes to what it already wrote, which would read as one answer in
      // two voices. Whatever landed stands on its own.
      let emitted = '';
      try {
        const input = `Passages:\n\n${buildContext(matches)}\n\nQuestion: ${question}`;
        const stream = session.promptStreaming(input);

        // Chrome has shipped both delta chunks and cumulative snapshots here.
        for await (const piece of stream as AsyncIterable<string>) {
          if (signal?.aborted) break;
          const delta = piece.startsWith(emitted) ? piece.slice(emitted.length) : piece;
          if (!emitted && delta.trim()) onLane?.('nano');
          emitted += delta;
          yield delta;
        }
      } catch (err) {
        console.warn('[WM3] Gemini Nano generation failed', err);
      } finally {
        session.destroy?.();
      }
      if (emitted.trim()) return;
    }
  }

  onLane?.('quoted');
  yield quoteAnswer(matches);
}
