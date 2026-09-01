import { Match } from './archive';

/**
 * The cloud lane: a hosted model, reached through /api/ask.
 *
 * Only the chosen passages and the question cross the wire — retrieval stays
 * in the browser, so the server never holds the index and the model never sees
 * anything the reader could not already read on the page.
 */

export async function* streamCloud(
  question: string,
  matches: Match[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal,
    body: JSON.stringify({
      question,
      passages: matches.map((m) => ({
        title: m.chunk.title,
        date: m.chunk.date,
        text: m.chunk.text,
      })),
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`/api/ask responded ${response.status}`);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) yield value;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}
