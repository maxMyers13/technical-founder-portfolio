import { streamText } from 'ai';

export const config = { runtime: 'nodejs' };

/**
 * The cloud lane for Ask WM3.
 *
 * Retrieval still happens in the browser — the passages arrive with the
 * request, already chosen. This route only writes them up. That keeps the
 * archive index out of the server entirely and means the model never sees
 * anything the reader could not already read on the page.
 */

const SYSTEM_PROMPT = `You are WM3, the archive interface on Max Myers' site wm3.ai.

Answer ONLY from the passages given to you. They are Max's own published writing and pages.

Rules:
- If the passages do not answer the question, say so plainly. Never guess, never fill gaps from your own knowledge.
- Refer to Max in the third person.
- Two short paragraphs at most. No preamble, no "based on the passages".
- Do not invent numbers, dates, employers or names that are not in the passages.`;

// Gemini 3 Flash, on the AI Gateway free tier ($5 of credits a month per team).
// Override without a deploy by setting WM3_MODEL in the project's env.
const MODEL = process.env.WM3_MODEL ?? 'google/gemini-3-flash';

/** Ceilings so a stray client can't run up a bill on an open endpoint. */
const MAX_QUESTION_CHARS = 2000;
const MAX_PASSAGE_CHARS = 12000;
const MAX_PASSAGES = 8;

interface Passage {
  title: string;
  date?: string;
  text: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let question: string;
  let passages: Passage[];
  try {
    const body = (await req.json()) as { question?: unknown; passages?: unknown };
    question = String(body.question ?? '').slice(0, MAX_QUESTION_CHARS);
    passages = Array.isArray(body.passages) ? (body.passages as Passage[]) : [];
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  if (!question.trim() || passages.length === 0) {
    return new Response('Bad request', { status: 400 });
  }

  const context = passages
    .slice(0, MAX_PASSAGES)
    .map((p, i) => `[${i + 1}] ${p.title}${p.date ? ` (${p.date})` : ''}\n${p.text}`)
    .join('\n\n')
    .slice(0, MAX_PASSAGE_CHARS);

  try {
    const result = streamText({
      model: MODEL,
      system: SYSTEM_PROMPT,
      prompt: `Passages:\n\n${context}\n\nQuestion: ${question}`,
      maxOutputTokens: 600,
      providerOptions: { gateway: { tags: ['feature:ask-wm3', 'site:wm3.ai'] } },
    });

    return result.toTextStreamResponse({
      headers: { 'x-wm3-model': MODEL, 'cache-control': 'no-store' },
    });
  } catch (err) {
    // The browser falls back to quoting, so a failure here is a downgrade
    // rather than a dead end. Log enough to tell which it was.
    console.error('[WM3] cloud lane failed', err);
    const status =
      typeof err === 'object' && err && 'statusCode' in err ? Number(err.statusCode) : 500;
    return new Response('Generation failed', { status: status === 429 || status === 402 ? status : 502 });
  }
}
