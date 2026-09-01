import { AnswerLane, LanePreference } from '../../types';
import { Match } from './archive';
import { streamCloud } from './cloud';
import { createSession, nanoIsReady } from './nano';

/**
 * Turning retrieved passages into an answer, down one of three lanes.
 *
 *   cloud   a hosted model via /api/ask
 *   nano    Chrome's on-device Gemini Nano
 *   quoted  no model at all — the passages, verbatim, attributed
 *
 * `auto` walks them in that order and takes the first that produces text.
 * Naming a lane forces it and does not fall through, so the playground can
 * compare them on the same question.
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

/** Nano's stream, normalized. Yields nothing if it never produces text. */
async function* nanoStream(
  question: string,
  matches: Match[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const session = await createSession(SYSTEM_PROMPT);
  if (!session) return;

  try {
    const stream = session.promptStreaming(
      `Passages:\n\n${buildContext(matches)}\n\nQuestion: ${question}`,
    );
    // Chrome has shipped both delta chunks and cumulative snapshots here.
    let emitted = '';
    for await (const piece of stream as AsyncIterable<string>) {
      if (signal?.aborted) break;
      const delta = piece.startsWith(emitted) ? piece.slice(emitted.length) : piece;
      emitted += delta;
      yield delta;
    }
  } finally {
    session.destroy?.();
  }
}

/**
 * Streams an answer as text deltas.
 *
 * `onLane` fires on the first token that actually arrives, so the label
 * describes the words on screen rather than which lane was attempted. A lane
 * that dies part-way keeps whatever it wrote — appending a second lane's
 * output would read as one answer in two voices.
 */
export async function* streamAnswer(
  question: string,
  matches: Match[],
  signal?: AbortSignal,
  onLane?: (lane: AnswerLane) => void,
  preference: LanePreference = 'auto',
): AsyncGenerator<string> {
  const auto = preference === 'auto';

  if (preference === 'cloud' || auto) {
    let emitted = false;
    try {
      for await (const delta of streamCloud(question, matches, signal)) {
        if (signal?.aborted) break;
        if (!emitted && delta.trim()) {
          emitted = true;
          onLane?.('cloud');
        }
        yield delta;
      }
    } catch (err) {
      console.warn('[WM3] cloud lane failed', err);
    }
    if (emitted) return;
    if (preference === 'cloud') {
      onLane?.('quoted');
      yield quoteAnswer(matches);
      return;
    }
  }

  if ((preference === 'nano' || auto) && nanoIsReady()) {
    let emitted = false;
    try {
      for await (const delta of nanoStream(question, matches, signal)) {
        if (signal?.aborted) break;
        if (!emitted && delta.trim()) {
          emitted = true;
          onLane?.('nano');
        }
        yield delta;
      }
    } catch (err) {
      console.warn('[WM3] Gemini Nano generation failed', err);
    }
    if (emitted) return;
  }

  onLane?.('quoted');
  yield quoteAnswer(matches);
}
