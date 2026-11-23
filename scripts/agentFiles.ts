import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { BUILDS, GITHUB_URL, LILO_URL, LINKEDIN_URL, NOW_ITEMS, POSTS, X_URL } from '../constants';
import { FORMATS, GIGS, WORKSHOPS, YOUTUBE_CHANNEL, watchUrl } from '../components/screens/speakingData';

/**
 * The site is a single-page app, so a plain HTTP fetch of wm3.ai returns an empty shell. This plugin writes the
 * same content as static text for agents and scripts, from the data the pages themselves render:
 *
 *   /llms.txt       a short index: who this is, what is here, where the full text and the JSON live
 *   /llms-full.txt  every page as Markdown, in one file
 *   /site.json      the same content as structured JSON
 *   /robots.txt     permission for crawlers, and a pointer to llms.txt
 *
 * Only what the pages already publish goes in. The page prose is wm3/site/*.md, which is authored to be public
 * (see wm3/manifest.json); the LinkedIn post archive stays where it already is, at /wm3/index.json.
 */

const ORIGIN = 'https://www.wm3.ai';

type Page = { slug: string; title: string; route: string; url: string; text: string };

function readPages(root: string): Page[] {
  const dir = path.join(root, 'wm3/site');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf8');
      const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
      const front: Record<string, string> = {};
      for (const line of (m ? m[1] : '').split('\n')) {
        const i = line.indexOf(':');
        if (i > 0) front[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
      const route = front.route ?? f.replace(/\.md$/, '');
      return {
        slug: f.replace(/\.md$/, ''),
        title: front.title ?? f,
        route,
        url: `${ORIGIN}/#${route}`,
        text: (m ? m[2] : raw).trim(),
      };
    });
}

function build(root: string): Record<string, string> {
  const pages = readPages(root);
  const links = { lilo: LILO_URL, linkedin: LINKEDIN_URL, github: GITHUB_URL, x: X_URL, youtube: YOUTUBE_CHANNEL };
  const builds = BUILDS.map((b) => ({
    title: b.title,
    year: b.year,
    kind: b.kind,
    tag: b.tag,
    description: b.desc,
    url: b.href ?? (b.route ? `${ORIGIN}/#${b.route}` : undefined),
  }));
  const speaking = {
    sessions: [...GIGS]
      .sort((a, b) => b.sort.localeCompare(a.sort))
      .map((g) => ({ date: g.sort, when: g.when, host: g.host, title: g.title, kind: g.kind, role: g.role, where: g.where, note: g.note, upcoming: g.upcoming ?? false })),
    workshops: WORKSHOPS.map((w) => ({ title: w.title, covers: w.covers })),
    formats: FORMATS.map((f) => ({ title: f.title, what: f.what, when: f.when, recordings: f.watch.map((w) => ({ label: w.label, url: watchUrl(w.id) })) })),
  };

  const site = {
    name: 'Max Myers',
    site: 'WM3',
    url: ORIGIN,
    description: "Max Myers' site: what he is building, where he has spoken, and an archive of his writing.",
    note: 'The pages are a single-page app. This file, /llms.txt and /llms-full.txt carry the same content as plain data.',
    links,
    now: NOW_ITEMS,
    pages,
    builds,
    writing: POSTS.map((p) => ({ title: p.title, kind: p.kind, date: p.date, blurb: p.blurb, url: p.href })),
    speaking,
    archive: {
      what: "Max's published LinkedIn posts, chunked, each with its date and original URL.",
      index: `${ORIGIN}/wm3/index.json`,
    },
  };

  const index = [
    '# Max Myers (WM3)',
    '',
    `> ${site.description} The pages at ${ORIGIN} are a single-page app, so fetch the files below instead of the HTML.`,
    '',
    '## Machine-readable',
    '',
    `- [Everything as Markdown](${ORIGIN}/llms-full.txt): every page in one file`,
    `- [Everything as JSON](${ORIGIN}/site.json): pages, builds, writing, talks and workshops, structured`,
    `- [Post archive](${ORIGIN}/wm3/index.json): his published LinkedIn posts in chunks, with dates and source URLs`,
    '',
    '## Pages',
    '',
    ...pages.map((p) => `- [${p.title}](${p.url})`),
    '',
    '## Elsewhere',
    '',
    ...Object.entries(links).map(([k, v]) => `- [${k}](${v})`),
    '',
  ].join('\n');

  const full = [
    '# Max Myers (WM3)',
    '',
    `> ${site.description}`,
    '',
    '## Now',
    '',
    ...NOW_ITEMS.map((n) => `- ${n.label}: ${n.text}`),
    '',
    ...pages.flatMap((p) => [`## ${p.title}`, '', `Page: ${p.url}`, '', p.text, '']),
    '## Everything built, as a list',
    '',
    ...builds.map((b) => `- ${b.title} (${b.year}, ${b.tag}): ${b.description}${b.url ? ` ${b.url}` : ''}`),
    '',
    '## Writing',
    '',
    ...site.writing.map((p) => `- [${p.title}](${p.url}) (${p.kind}, ${p.date}): ${p.blurb}`),
    '',
    '## Speaking: sessions',
    '',
    ...speaking.sessions.map((g) => `- ${g.date.replace(/-00$/, '')}: ${g.title}, ${g.host} (${g.role ?? g.kind}${g.where ? `, ${g.where}` : ''}${g.upcoming ? ', upcoming' : ''})`),
    '',
    '## Speaking: workshops on offer',
    '',
    ...speaking.workshops.map((w) => `- ${w.title}: ${w.covers}`),
    '',
    '## Speaking: recurring formats',
    '',
    ...speaking.formats.map((f) => `- ${f.title} (${f.when}): ${f.what}${f.recordings.length ? ` Recordings: ${f.recordings.map((r) => `[${r.label}](${r.url})`).join(', ')}` : ''}`),
    '',
    '## Links',
    '',
    ...Object.entries(links).map(([k, v]) => `- ${k}: ${v}`),
    '',
  ].join('\n');

  const robots = ['User-agent: *', 'Allow: /', '', `# Plain-text version of this site for agents: ${ORIGIN}/llms.txt`, ''].join('\n');

  return {
    'llms.txt': index,
    'llms-full.txt': full,
    'site.json': JSON.stringify(site, null, 2),
    'robots.txt': robots,
  };
}

const TYPES: Record<string, string> = { txt: 'text/plain; charset=utf-8', json: 'application/json; charset=utf-8' };

export default function agentFiles(): Plugin {
  let root = process.cwd();
  return {
    name: 'wm3-agent-files',
    configResolved(c) {
      root = c.root;
    },
    // dev: answer the same paths live, so the files can be checked without a build
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = (req.url ?? '').split('?')[0].replace(/^\//, '');
        if (!['llms.txt', 'llms-full.txt', 'site.json', 'robots.txt'].includes(name)) return next();
        res.setHeader('Content-Type', TYPES[name.split('.').pop() as string]);
        res.end(build(root)[name]);
      });
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(build(root))) this.emitFile({ type: 'asset', fileName, source });
    },
  };
}
