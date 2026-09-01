/**
 * Build the Ask WM3 archive index.
 *
 *   node scripts/ingest.mjs [--wiki <dir>] [--dry-run] [--query "..."]
 *
 * Reads only the paths wm3/manifest.json allows, chunks each post, embeds the
 * chunks with MiniLM, and writes public/wm3/index.json + public/wm3/vectors.bin.
 *
 * The index is served to the browser, so everything written here is public.
 * The manifest is the boundary — see the comment at the top of it before
 * widening anything.
 *
 * Reads the wiki, never writes to it.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pipeline } from '@huggingface/transformers';

const MODEL = 'Xenova/all-MiniLM-L6-v2';
const DIMS = 384;
/** Chunks aim for this many characters; posts shorter than this stay whole. */
const TARGET_CHARS = 900;
const MIN_CHARS = 120;

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const wikiDir = path.resolve(flag('--wiki', process.env.WM3_WIKI ?? '../llmwiki'));
const dryRun = args.includes('--dry-run');
const query = flag('--query', null);

const manifest = JSON.parse(await fs.readFile(path.join(root, 'wm3/manifest.json'), 'utf8'));

/** Turns a manifest glob into a matcher. Only `*` and `**` are supported. */
const toMatcher = (glob) => {
  const rx = glob
    .split('**')
    .map((part) => part.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*'))
    .join('.*');
  return new RegExp(`^${rx}$`);
};
const allow = manifest.allow.map(toMatcher);
const deny = manifest.deny.map(toMatcher);

const isAllowed = (rel) => allow.some((m) => m.test(rel)) && !deny.some((m) => m.test(rel));

async function walk(dir, base = '') {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...(await walk(path.join(dir, entry.name), rel)));
    else out.push(rel);
  }
  return out;
}

/** Minimal frontmatter reader — the wiki's frontmatter is flat scalars plus one nested block. */
function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: raw.trim() };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    // Indented lines belong to a nested block (analytics) we drop wholesale.
    if (!kv) continue;
    let value = kv[2].trim();
    if (value === '' || value === 'null') continue;
    value = value.replace(/^["']|["']$/g, '');
    meta[kv[1]] = value;
  }
  return { meta, body: raw.slice(m[0].length).trim() };
}

/** A post is a placeholder if it has no real body. Those are skipped, not listed by hand. */
const isPlaceholder = (body) => body.length < 40 || /\*body pending\*/i.test(body);

/** Titles come from the filename: 2022-12-20-techsgiving-2022 -> "Techsgiving 2022". */
function titleFrom(file) {
  const slug = path.basename(file, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  return slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

/** Split on blank lines, then glue paragraphs together up to TARGET_CHARS. */
function chunk(body) {
  const paras = body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\[media:[^\]]*\]/g, '').trim())
    .filter(Boolean);

  const chunks = [];
  let buf = '';
  for (const para of paras) {
    if (buf && buf.length + para.length > TARGET_CHARS) {
      chunks.push(buf);
      buf = para;
    } else {
      buf = buf ? `${buf}\n\n${para}` : para;
    }
  }
  if (buf) chunks.push(buf);

  // A trailing hashtag-only fragment carries no meaning on its own.
  return chunks.filter((c) => c.length >= MIN_CHARS || chunks.length === 1);
}

console.log(`wiki    ${wikiDir}`);
console.log(`allow   ${manifest.allow.join(', ')}`);

const files = (await walk(wikiDir)).filter(isAllowed).sort();
console.log(`matched ${files.length} files`);

const records = [];
let skipped = 0;
for (const rel of files) {
  const raw = await fs.readFile(path.join(wikiDir, rel), 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  if (isPlaceholder(body)) {
    skipped++;
    continue;
  }
  const kept = Object.fromEntries(
    manifest.frontmatterKeep.filter((k) => meta[k] != null).map((k) => [k, meta[k]]),
  );
  const title = titleFrom(rel);
  for (const [i, text] of chunk(body).entries()) {
    records.push({ source: 'linkedin', path: rel, title, part: i, text, ...kept });
  }
}

console.log(`posts   ${files.length - skipped} with bodies (${skipped} placeholders skipped)`);

// The site's own pages: what Ask WM3 promises to answer from besides the posts.
// These live in this repo, are authored to be public, and cite an in-app route
// rather than a LinkedIn URL.
const siteDir = path.join(root, 'wm3/site');
const siteFiles = (await walk(siteDir)).filter((f) => f.endsWith('.md')).sort();
for (const rel of siteFiles) {
  const { meta, body } = parseFrontmatter(await fs.readFile(path.join(siteDir, rel), 'utf8'));
  for (const [i, text] of chunk(body).entries()) {
    records.push({
      source: 'site',
      path: `site/${rel}`,
      title: meta.title ?? titleFrom(rel),
      part: i,
      text,
      route: meta.route,
      topic: meta.topic,
    });
  }
}

console.log(`site    ${siteFiles.length} pages`);
console.log(`chunks  ${records.length}`);

if (dryRun && !query) {
  console.log('\n--dry-run: nothing written. Sample:');
  for (const r of records.slice(0, 3)) console.log(` ${r.path}#${r.part}  ${r.text.slice(0, 90)}…`);
  process.exit(0);
}

console.log(`\nembedding with ${MODEL}…`);
const embed = await pipeline('feature-extraction', MODEL);
const vectors = new Float32Array(records.length * DIMS);
for (let i = 0; i < records.length; i++) {
  const out = await embed(records[i].text, { pooling: 'mean', normalize: true });
  vectors.set(out.data, i * DIMS);
  if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${records.length}`);
}

if (query) {
  const q = await embed(query, { pooling: 'mean', normalize: true });
  const scored = records
    .map((r, i) => {
      let dot = 0;
      for (let d = 0; d < DIMS; d++) dot += q.data[d] * vectors[i * DIMS + d];
      return { r, dot };
    })
    .sort((a, b) => b.dot - a.dot)
    .slice(0, 8);
  console.log(`\ntop matches for "${query}":`);
  for (const { r, dot } of scored) {
    console.log(`  ${dot.toFixed(3)}  ${r.path}#${r.part}  ${r.text.slice(0, 70)}…`);
  }
  if (dryRun) process.exit(0);
}

// Vectors are unit-length, so int8 at 1/127 costs ~0.3% of cosine accuracy and
// three quarters of the bytes. Dot product of the dequantized rows is cosine.
const quantized = new Int8Array(vectors.length);
for (let i = 0; i < vectors.length; i++) {
  quantized[i] = Math.max(-127, Math.min(127, Math.round(vectors[i] * 127)));
}

const outDir = path.join(root, 'public/wm3');
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, 'vectors.bin'), Buffer.from(quantized.buffer));
await fs.writeFile(
  path.join(outDir, 'index.json'),
  JSON.stringify({
    model: MODEL,
    dims: DIMS,
    scale: 1 / 127,
    count: records.length,
    builtFrom: manifest.sourceRepo,
    chunks: records,
  }),
);

const bytes = async (f) => (await fs.stat(path.join(outDir, f))).size;
console.log(`\nwrote public/wm3/index.json  ${((await bytes('index.json')) / 1024).toFixed(0)}KB`);
console.log(`wrote public/wm3/vectors.bin ${((await bytes('vectors.bin')) / 1024).toFixed(0)}KB`);
