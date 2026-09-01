import { Source } from '../../types';

/**
 * Retrieval over the archive index built by scripts/ingest.mjs.
 *
 * The index (chunk text + metadata) and the vectors ship as static files; the
 * query is embedded in the browser with MiniLM, so a question never leaves the
 * page. Nothing here talks to a server.
 */

export interface Chunk {
  source: 'linkedin' | 'site';
  path: string;
  title: string;
  part: number;
  text: string;
  /** Canonical LinkedIn permalink, on post chunks. */
  url?: string;
  /** In-app destination, on site-page chunks. */
  route?: string;
  date?: string;
  topic?: string;
}

interface Index {
  model: string;
  dims: number;
  scale: number;
  count: number;
  chunks: Chunk[];
}

export interface Match {
  chunk: Chunk;
  score: number;
}

/**
 * Cosine below this reads as "the archive has nothing on this". Calibrated with
 * scripts/probe.mjs: real questions about the archive land 0.33–0.65, while
 * off-archive ones ("what is the capital of France") sit under 0.10.
 */
export const SCORE_FLOOR = 0.3;

let indexPromise: Promise<{ index: Index; vectors: Int8Array }> | null = null;
let embedderPromise: Promise<(text: string) => Promise<Float32Array>> | null = null;

/** Both static files, fetched once and kept for the session. */
function loadIndex() {
  indexPromise ??= (async () => {
    const [index, vectorBytes] = await Promise.all([
      fetch('/wm3/index.json').then((r) => r.json() as Promise<Index>),
      fetch('/wm3/vectors.bin').then((r) => r.arrayBuffer()),
    ]);
    return { index, vectors: new Int8Array(vectorBytes) };
  })();
  return indexPromise;
}

/**
 * MiniLM, self-hosted. transformers.js and the ~23MB model are only fetched
 * when someone actually asks something, and the browser caches both afterwards.
 */
function loadEmbedder() {
  embedderPromise ??= (async () => {
    const { pipeline, env } = await import('@huggingface/transformers');

    // The model is served from this origin and the ONNX runtime is bundled by
    // Vite, so nothing here reaches a CDN or a third party.
    // In the browser transformers.js defaults to remote-only, so local has to
    // be turned on explicitly as remote is turned off.
    env.allowLocalModels = true;
    env.allowRemoteModels = false;
    env.localModelPath = '/wm3/model/';

    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      dtype: 'q8',
      device: 'wasm',
    });

    return async (text: string) => {
      const out = await extractor(text, { pooling: 'mean', normalize: true });
      return out.data as Float32Array;
    };
  })();
  return embedderPromise;
}

/** Warm the model without asking anything, so the first question feels quick. */
export function prewarm() {
  void loadIndex();
  void loadEmbedder().catch(() => {});
}

export async function search(question: string, topK = 5): Promise<Match[]> {
  const [{ index, vectors }, embed] = await Promise.all([loadIndex(), loadEmbedder()]);
  const query = await embed(question);
  const { dims, scale } = index;

  const scored: Match[] = index.chunks.map((chunk, i) => {
    let dot = 0;
    for (let d = 0; d < dims; d++) dot += query[d] * vectors[i * dims + d] * scale;
    return { chunk, score: dot };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * One citation per source document — several chunks of the same post are one
 * receipt, not three.
 */
export function toSources(matches: Match[]): Source[] {
  const seen = new Set<string>();
  const sources: Source[] = [];
  for (const { chunk } of matches) {
    if (seen.has(chunk.path)) continue;
    seen.add(chunk.path);
    sources.push({
      title: chunk.title,
      date: chunk.date ?? (chunk.source === 'site' ? 'this site' : ''),
      path: chunk.path,
      url: chunk.url,
      route: chunk.route as Source['route'],
    });
  }
  return sources;
}
