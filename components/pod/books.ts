import { AUDIOBOOKS } from './audiobooks';

/**
 * Max's real bookcase, transcribed from a photo of it, shelf by shelf (1 = top). The room's black bookcase and the
 * Library both read this list. Manga series are listed once with their volumes and become one spine per volume.
 *
 * To add a book: put it on a shelf. Mark the one you're reading with reading: true (it lies flat on shelf 4 with a
 * NOW READING card and leads the Library). `size` sets the spine: manga (small), trade, hardcover (tall).
 */
/** Each shelf holds one topic; a small tag on its front edge says which. */
export const SHELF_TOPICS: { [shelf: number]: string } = {
  1: 'Manga',
  2: 'Manga',
  3: 'Biography & product',
  4: 'Startups & money',
  5: 'Mindset & strategy',
  6: 'Engineering & keepsakes',
};

export type Size = 'manga' | 'paperback' | 'trade' | 'hardcover';
export type Book = {
  title: string;
  author?: string;
  shelf: 1 | 2 | 3 | 4 | 5 | 6;
  size?: Size;
  color?: string;
  ink?: string;
  vol?: number;
  series?: string;
  reading?: boolean;
  flat?: boolean;
  /** A print copy of a book Max first read on Audible (he buys the ones he reads). */
  audio?: boolean;
};

const series = (title: string, author: string, vols: number[], shelf: Book['shelf'], color: string, ink?: string): Book[] =>
  vols.map((vol) => ({ title, author, vol, series: title, shelf, size: 'manga', color, ink }));
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const PRINT: Book[] = [
  // shelf 1: Chainsaw Man, Jujutsu Kaisen, The Last Ronin
  { title: 'Fire Punch', author: 'Tatsuki Fujimoto', shelf: 1, size: 'manga', color: '#f2efe8', ink: '#c8202b' },
  ...series('Chainsaw Man', 'Tatsuki Fujimoto', range(1, 21), 1, '#f4f1ea', '#c8202b'),
  ...series('Jujutsu Kaisen', 'Gege Akutami', [0, 10, 11, 12, 21, 25, 28, 29, 30], 1, '#1b1b1f', '#f4f1ea'),
  { title: 'The Last Ronin', author: 'Eastman, Laird, Waltz', shelf: 1, size: 'hardcover', color: '#141416', ink: '#e8e2d4' },
  // shelf 2: Attack on Titan, Soul Eater, Berserk, Uzumaki, JoJo
  ...series('Attack on Titan', 'Hajime Isayama', [1, 2, 3, 4, 5, 6, 7, 8, 25, 26, 27, 28, 29, 33, 34], 2, '#e9a54a', '#1d140c'),
  ...series('Soul Eater', 'Atsushi Ohkubo', [1, 6, 7], 2, '#f2d21b', '#141414'),
  { title: 'Berserk Deluxe Edition 1', author: 'Kentaro Miura', shelf: 2, size: 'hardcover', color: '#151515', ink: '#d62b22' },
  { title: 'Uzumaki', author: 'Junji Ito', shelf: 2, size: 'hardcover', color: '#d9d9d6', ink: '#1b1b1b' },
  { title: "JoJo's Bizarre Adventure", author: 'Hirohiko Araki', shelf: 2, size: 'hardcover', color: '#1f2226', ink: '#e8e8e8' },
  // shelf 3: founders, careers, history
  { title: 'Elon Musk', author: 'Walter Isaacson', shelf: 3, size: 'hardcover', color: '#17181b', ink: '#f2f2f2' },
  { title: 'Steve Jobs', author: 'Walter Isaacson', shelf: 3, size: 'hardcover', color: '#f4f4f2', ink: '#1b1b1b' },
  { title: 'Source Code', author: 'Bill Gates', shelf: 3, size: 'hardcover', color: '#f1f1ef', ink: '#2a2a2a' },
  { title: 'Zero to One', author: 'Peter Thiel', shelf: 4, size: 'trade', color: '#a9c3d6', ink: '#1b1b1b' },
  { title: 'Cracking the Coding Interview', author: 'Gayle Laakmann McDowell', shelf: 6, size: 'hardcover', color: '#5aa83e', ink: '#ffffff' },
  { title: 'Atomic Habits', author: 'James Clear', shelf: 5, size: 'hardcover', color: '#f3efe6', ink: '#2a2a2a' },
  { title: 'How Bad Do You Want It?', author: 'Matt Fitzgerald', shelf: 5, size: 'trade', color: '#1d1d1d', ink: '#f2c230' },
  { title: 'Retire by 30', author: 'Frank Miu', shelf: 4, size: 'trade', color: '#d3241c', ink: '#ffffff' },
  { title: 'March', author: 'John Lewis, Andrew Aydin, Nate Powell', shelf: 3, size: 'trade', color: '#d8c79b', ink: '#1b1b1b' },
  { title: 'Slaying the Dragon', author: 'Michael Johnson', shelf: 3, size: 'hardcover', color: '#1f3a6e', ink: '#f2c230' },
  { title: 'A Promised Land', author: 'Barack Obama', shelf: 3, size: 'hardcover', color: '#e9e9e7', ink: '#1b1b1b' },
  { title: 'Fatal Invention', author: 'Dorothy Roberts', shelf: 3, size: 'trade', color: '#1d1d22', ink: '#cfd4ff' },
  // shelf 4: money and power
  { title: 'Investing 101', author: 'Michele Cagan', shelf: 4, size: 'trade', color: '#f4f2ec', ink: '#1b1b1b', flat: true },
  // Pathion's own SOPs, bound as Pathion books
  { title: 'Reverse Recruiting', author: 'Pathion SOP', shelf: 4, size: 'trade', color: '#0b56f6', ink: '#ffffff' },
  { title: 'How to Rewrite a Resume', author: 'Pathion SOP', shelf: 4, size: 'trade', color: '#e50108', ink: '#ffffff' },
  { title: 'LinkedIn Profile Review', author: 'Pathion SOP · LILO', shelf: 4, size: 'trade', color: '#fae34c', ink: '#141414' },
  { title: 'LinkedIn Profile Optimization', author: 'Pathion SOP', shelf: 4, size: 'trade', color: '#141414', ink: '#fcfef0' },
  { title: 'Release: Staging to Master', author: 'Pathion SOP · engineering', shelf: 4, size: 'trade', color: '#0b56f6', ink: '#ffffff' },
  { title: '$100M Leads', author: 'Alex Hormozi', shelf: 4, size: 'trade', color: '#5a35a8', ink: '#ffffff' },
  { title: '$100M Offers', author: 'Alex Hormozi', shelf: 4, size: 'trade', color: '#2a62c9', ink: '#ffffff' },
  { title: '$100M Money Models', author: 'Alex Hormozi', shelf: 4, size: 'trade', color: '#3e7a3a', ink: '#ffffff' },
  { title: 'The Art of Seduction', author: 'Robert Greene', shelf: 5, size: 'trade', color: '#e86a1e', ink: '#1b1b1b' },
  { title: 'The 48 Laws of Power', author: 'Robert Greene', shelf: 5, size: 'trade', color: '#ee7b22', ink: '#1b1b1b' },
  // shelf 5: the stack lying flat
  { title: "The Champion's Mind", author: 'Jim Afremow', shelf: 5, size: 'trade', color: '#1d1d1d', ink: '#f2f2f2' },
  { title: 'Hardball', author: 'Chris Matthews', shelf: 3, size: 'trade', color: '#d3241c', ink: '#ffffff' },
  { title: 'Howard High School Shield', shelf: 6, size: 'hardcover', color: '#141414', ink: '#e8e2d4', flat: true },
  { title: 'Virgil Abloh: Icons', author: 'Taschen', shelf: 6, size: 'hardcover', color: '#59c04a', ink: '#141414', flat: true },
];

/**
 * Max buys a print copy of every audiobook he reads, so each one he has finished or is part-way through stands on
 * the shelf for its topic. Ones still waiting in the Audible queue are not here yet.
 */
const AUDIO_SHELF: { [title: string]: Book['shelf'] } = {
  'The Lean Product Playbook': 3, 'Obviously Awesome': 3, Loved: 3, 'Building a StoryBrand 2.0': 3, 'Buyer Personas': 3,
  'Continuous Discovery Habits': 3, Transformed: 3, 'The Mom Test': 3, Inspired: 3, 'The 22 Immutable Laws of Branding': 3,
  'Day Trading Attention': 3,
  'Designing Data-Intensive Applications': 6, 'The Pragmatic Programmer': 6, 'Nuts and Bolts': 6,
};
const AUDIO_PRINT: Book[] = AUDIOBOOKS.filter((a) => a.status !== 'queued').map((a) => ({
  title: a.title,
  author: a.author,
  shelf: AUDIO_SHELF[a.title] ?? 5,
  size: 'paperback',
  audio: true,
}));

export const BOOKS: Book[] = [...PRINT, ...AUDIO_PRINT];

/** The record crate by the bed: the four albums in its slots. Title and artist only, no cover art. `track` is the
 * song a click on the sleeve plays on the turntable, as Apple Music's 30-second preview. */
export type Record = { title: string; artist: string; color: string; ink: string; track: string; preview: string };
const PREVIEW = 'https://audio-ssl.itunes.apple.com/itunes-assets/';
export const RECORDS: Record[] = [
  { title: 'Playboi Carti', artist: 'Playboi Carti', color: '#2a2a2e', ink: '#f2f2f2', track: 'Magnolia', preview: `${PREVIEW}AudioPreview211/v4/d6/cd/ef/d6cdef5d-baaa-acfb-11da-3103278ad438/mzaf_2021994347730966010.plus.aac.p.m4a` },
  { title: 'Pink Tape', artist: 'Lil Uzi Vert', color: '#f3a6c8', ink: '#2a1020', track: 'Just Wanna Rock', preview: `${PREVIEW}AudioPreview211/v4/ae/18/19/ae181904-cdc9-a089-2a5a-ce0257279f4b/mzaf_2772915956715751130.plus.aac.p.m4a` },
  { title: 'Whole Lotta Red', artist: 'Playboi Carti', color: '#b3141b', ink: '#111111', track: 'Sky', preview: `${PREVIEW}AudioPreview211/v4/94/e1/4f/94e14f0e-4ae7-7330-b597-7fdca2e32eb5/mzaf_12052515908123345122.plus.aac.p.m4a` },
  { title: 'Utopia', artist: 'Travis Scott', color: '#141414', ink: '#e8e2d4', track: 'FE!N', preview: `${PREVIEW}AudioPreview221/v4/ce/61/9a/ce619acc-40f8-5bf0-c6d8-5649dacc5d3c/mzaf_9048266760750013994.plus.aac.p.m4a` },
];

const CLOTH = ['#2e5d8c', '#b83a26', '#2f6f6b', '#5b4b8a', '#c9a04a', '#1f1f24', '#8c3b5a', '#3d5a3a'];
export const clothFor = (book: Book, i: number) => book.color ?? CLOTH[(i * 7) % CLOTH.length];
export const nowReading = () => BOOKS.find((b) => b.reading) ?? null;

/** The Library's view: manga collapsed to one line per series ("vols 1-21"), everything else as is. */
export function libraryList() {
  const out: { title: string; author?: string; detail?: string; shelf: number; own: boolean; link: ReturnType<typeof bookLink> }[] = [];
  const seen = new Map<string, number[]>();
  for (const b of BOOKS) {
    if (b.series) {
      if (!seen.has(b.series)) {
        seen.set(b.series, []);
        out.push({ title: b.series, author: b.author, shelf: b.shelf, own: false, link: bookLink(b) });
      }
      seen.get(b.series)!.push(b.vol ?? 0);
    } else out.push({ title: b.title, author: b.author, detail: b.audio ? 'Print copy of an audiobook' : undefined, shelf: b.shelf, own: isOwn(b), link: bookLink(b) });
  }
  for (const row of out) {
    const vols = seen.get(row.title);
    if (vols) row.detail = `${vols.length} ${vols.length === 1 ? 'volume' : 'volumes'}`;
  }
  return out;
}

/** Max wrote the Pathion SOPs himself; only those carry the Pathion mark. */
export const isOwn = (book: { author?: string }) => (book.author ?? '').startsWith('Pathion SOP');

/**
 * Where to find a book: Audible for prose, a book search for manga and art books (Audible has no manga).
 * Max's own SOPs are internal, so they have no link.
 */
export function bookLink(book: { title: string; author?: string; series?: string; size?: Size }): { href: string; label: string } | null {
  if (isOwn(book)) return null;
  const first = (book.author ?? '').split(',')[0].trim();
  const q = encodeURIComponent(`${book.series ?? book.title} ${first}`.trim());
  const manga = book.size === 'manga' || !!book.series || NOT_ON_AUDIBLE.has(book.title);
  return manga
    ? { href: `https://www.google.com/search?tbm=bks&q=${q}`, label: 'Find this book' }
    : { href: `https://www.audible.com/search?keywords=${q}`, label: 'Open on Audible' };
}
const NOT_ON_AUDIBLE = new Set(['Fire Punch', 'The Last Ronin', 'Berserk Deluxe Edition 1', 'Uzumaki', "JoJo's Bizarre Adventure", 'March', 'Howard High School Shield', 'Virgil Abloh: Icons']);
