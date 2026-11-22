/**
 * Max's favourite games: the room's games shelf and the Library both read this list. Add titles in any order;
 * `color` is the case (optional). Titles only, no box art or logos.
 */
/** `href`: where clicking the case in the room (or the row in the Library) takes you: the game's own page. */
export type Game = { title: string; platform?: string; color?: string; note?: string; href?: string };

export const GAMES: Game[] = [
  { title: 'Destiny', platform: 'PS4', color: '#e8e6df', href: 'https://en.wikipedia.org/wiki/Destiny_(video_game)' },
  { title: 'Super Smash Flash 2', platform: 'Flash', color: '#c8202b', href: 'https://www.mcleodgaming.com/' },
  { title: 'Super Smash Bros. Ultimate', platform: 'Switch', color: '#c8202b', note: '999+ hours with friends.', href: 'https://en.wikipedia.org/wiki/Super_Smash_Bros._Ultimate' },
  { title: 'LittleBigPlanet 2', platform: 'PS3', color: '#1d3f8f', note: 'The pod this room is a nod to.', href: 'https://en.wikipedia.org/wiki/LittleBigPlanet_2' },
  { title: 'Uncharted 3', platform: 'PS3', color: '#1d3f8f', href: "https://en.wikipedia.org/wiki/Uncharted_3:_Drake's_Deception" },
]

const CASE = ['#1d3f8f', '#20232a', '#c8202b', '#0f6b4f', '#5b2a86', '#e2e2e6'];
export const caseFor = (g: Game, i: number) => g.color ?? CASE[i % CASE.length];
