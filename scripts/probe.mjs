/**
 * Query the built index without re-embedding it.
 *
 *   node scripts/probe.mjs "why did he leave Microsoft" "favourite movie" ...
 *
 * Use it to sanity-check retrieval and to calibrate the score floor that
 * decides when WM3 refuses instead of answering.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pipeline } from '@huggingface/transformers';

const root = path.resolve(import.meta.dirname, '..');
const index = JSON.parse(await fs.readFile(path.join(root, 'public/wm3/index.json'), 'utf8'));
const raw = await fs.readFile(path.join(root, 'public/wm3/vectors.bin'));
const vectors = new Int8Array(raw.buffer, raw.byteOffset, raw.byteLength);

const embed = await pipeline('feature-extraction', index.model);
const { dims, scale } = index;

for (const query of process.argv.slice(2)) {
  const q = await embed(query, { pooling: 'mean', normalize: true });
  const scored = index.chunks
    .map((c, i) => {
      let dot = 0;
      for (let d = 0; d < dims; d++) dot += q.data[d] * vectors[i * dims + d] * scale;
      return { c, dot };
    })
    .sort((a, b) => b.dot - a.dot);

  console.log(`\n"${query}"  best=${scored[0].dot.toFixed(3)}`);
  for (const { c, dot } of scored.slice(0, 4)) {
    console.log(`  ${dot.toFixed(3)}  ${c.path.replace('linkedin/posts/', '')}#${c.part}`);
  }
}
