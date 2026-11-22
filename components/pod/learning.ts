/**
 * What Max is learning right now: shown on the second monitor on the desk (a learning.md file) and in the Library.
 * Newest first. `note` is optional.
 */
export type Topic = { topic: string; note?: string };

export const LEARNING: Topic[] = [
  { topic: 'WebGL2 + GLSL', note: 'shadows, SSAO, bloom, god rays (this room)' },
  // [ADD WHAT YOU'RE LEARNING] — { topic: '...', note: '...' }
];
