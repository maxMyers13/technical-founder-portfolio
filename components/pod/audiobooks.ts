/**
 * Max's Audible library (from his account page, Nov 2026). Books he also owns in print are on the bookcase instead.
 * status: 'listening' = in progress, 'finished', 'queued' = in the library, not started yet.
 */
export type Audiobook = { title: string; author: string; status: 'listening' | 'finished' | 'queued' };

export const AUDIOBOOKS: Audiobook[] = [
  { title: 'Site Reliability Engineering', author: 'Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Richard Murphy', status: 'queued' },
  { title: 'The Challenger Sale', author: 'Matthew Dixon, Brent Adamson', status: 'queued' },
  { title: 'Price To Scale', author: 'Ajit Ghuman, Jan Pasternak', status: 'queued' },
  { title: 'The Lean Product Playbook', author: 'Dan Olsen', status: 'listening' },
  { title: 'Obviously Awesome', author: 'April Dunford', status: 'listening' },
  { title: 'Vibe Coding', author: 'Gene Kim, Steve Yegge', status: 'queued' },
  { title: 'The Score Takes Care of Itself', author: 'Bill Walsh, Steve Jamison, Craig Walsh', status: 'queued' },
  { title: 'Loved', author: 'Martina Lauchengco', status: 'listening' },
  { title: 'Flow', author: 'Mihaly Csikszentmihalyi', status: 'queued' },
  { title: 'Einstein', author: 'Walter Isaacson', status: 'queued' },
  { title: 'Building a StoryBrand 2.0', author: 'Donald Miller', status: 'listening' },
  { title: 'Good to Great', author: 'Jim Collins', status: 'queued' },
  { title: 'Buyer Personas', author: 'Adele Revella', status: 'listening' },
  { title: 'Homo Deus', author: 'Yuval Noah Harari', status: 'queued' },
  { title: 'Buy Back Your Time', author: 'Dan Martell', status: 'listening' },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', status: 'listening' },
  { title: 'Day Trading Attention', author: 'Gary Vaynerchuk', status: 'finished' },
  { title: 'Who Not How', author: 'Dan Sullivan, Benjamin Hardy', status: 'queued' },
  { title: 'Building a Second Brain', author: 'Tiago Forte', status: 'queued' },
  { title: 'Exactly What to Say', author: 'Phil M. Jones', status: 'listening' },
  { title: 'The Motive', author: 'Patrick Lencioni', status: 'finished' },
  { title: 'Por Que Mudei?', author: 'Lázaro Ramos', status: 'queued' },
  { title: 'Hackers & Painters', author: 'Paul Graham', status: 'queued' },
  { title: 'Continuous Discovery Habits', author: 'Teresa Torres', status: 'listening' },
  { title: 'Eat That Frog!', author: 'Brian Tracy', status: 'listening' },
  { title: 'The Pragmatic Programmer', author: 'David Thomas, Andrew Hunt', status: 'listening' },
  { title: 'Transformed', author: 'Marty Cagan', status: 'finished' },
  { title: 'Nuts and Bolts', author: 'Roma Agrawal', status: 'listening' },
  { title: 'The Mom Test', author: 'Rob Fitzpatrick', status: 'listening' },
  { title: 'The 12 Week Year', author: 'Brian P. Moran, Michael Lennington', status: 'listening' },
  { title: 'The Lean Startup', author: 'Eric Ries', status: 'queued' },
  { title: 'Inspired', author: 'Marty Cagan', status: 'listening' },
  { title: 'The 33 Strategies of War', author: 'Robert Greene', status: 'listening' },
  { title: 'The 22 Immutable Laws of Branding', author: 'Al Ries, Laura Ries', status: 'listening' },
  { title: 'How to Win Friends & Influence People', author: 'Dale Carnegie', status: 'listening' },
  { title: 'Blitzscaling', author: 'Reid Hoffman, Chris Yeh', status: 'queued' },
  { title: 'Crucial Conversations', author: 'Joseph Grenny, Kerry Patterson, Ron McMillan, Al Switzler, Emily Gregory', status: 'listening' },
  { title: 'Stop Doing That Sh*t', author: 'Gary John Bishop', status: 'listening' },
  { title: 'Never Split the Difference', author: 'Chris Voss, Tahl Raz', status: 'listening' },
  { title: 'Models', author: 'Mark Manson', status: 'queued' },
  { title: 'The Value of Others', author: 'Orion Taraban', status: 'queued' },
];

export const audibleLink = (a: { title: string; author: string }) =>
  `https://www.audible.com/search?keywords=${encodeURIComponent(`${a.title} ${a.author.split(',')[0].trim()}`)}`;
