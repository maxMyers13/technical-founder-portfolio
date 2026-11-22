import { Route } from '../../types';

export type WorldId = 'lilo' | 'builds' | 'ask' | 'life' | 'speaking' | 'writing' | 'library';

export interface World {
  id: WorldId;
  label: string;
  hint: string;
  /** The console button's colour dot, matched to the object in the pod. */
  dot: string;
  /** The full page this world opens onto. */
  route: Route;
}

export const WORLDS: World[] = [
  { id: 'lilo', label: 'Pathion', hint: 'the company, and LILO, what Max builds now', dot: '#2E5D8C', route: 'lilo' },
  { id: 'builds', label: 'Builds', hint: 'Edge, Chromium and side quests', dot: '#B39A6E', route: 'builds' },
  { id: 'ask', label: 'Ask WM3', hint: 'ask the post archive anything', dot: '#FFF6E5', route: 'ask' },
  { id: 'life', label: 'Life', hint: 'Maryland, track, Microsoft', dot: '#C9A04A', route: 'life' },
  { id: 'speaking', label: 'Speaking', hint: 'talks and workshops', dot: '#B83A26', route: 'speaking' },
  { id: 'writing', label: 'Writing', hint: 'guides, written properly', dot: '#2F6F6B', route: 'writing' },
  { id: 'library', label: 'Library', hint: 'books Max has read and his favourite games', dot: '#7A4A2A', route: 'writing' },
];

/**
 * An open world lives in the hash as `#now/<id>`, so it can be linked to and
 * the back button closes it. App's router treats any unknown hash, this one
 * included, as home, which is where the pod renders.
 */
export const WORLD_HASH_PREFIX = 'now/';

export function worldFromHash(): WorldId | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '').toLowerCase();
  if (!hash.startsWith(WORLD_HASH_PREFIX)) return null;
  const id = hash.slice(WORLD_HASH_PREFIX.length);
  return WORLDS.find((w) => w.id === id)?.id ?? null;
}
