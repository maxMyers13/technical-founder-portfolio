export type Route = 'home' | 'writing' | 'builds' | 'ask' | 'life' | 'lilo' | 'speaking';

export type Theme = 'system' | 'light' | 'dark';

export type BuildKind = 'serious' | 'side';

export type BuildFilter = 'everything' | BuildKind;

export interface Build {
  kind: BuildKind;
  year: string;
  tag: string;
  title: string;
  desc: string;
  cta: string;
  /** External destination. Omitted for rows that navigate in-app or go nowhere. */
  href?: string;
  /** In-app destination, taken instead of href when present. */
  route?: Route;
  img?: string;
  caption?: string;
}

export interface Post {
  date: string;
  kind: string;
  title: string;
  blurb: string;
  href: string;
}

export interface Source {
  title: string;
  date: string;
  /** Archive path shown on the expanded source card. */
  path: string;
  /** External URL, when the source lives off-site. */
  url?: string;
  /** In-app destination, for sources that are pages on this site. */
  route?: Route;
}

export interface Answer {
  text: string;
  sources: Source[];
  notFound?: boolean;
}

export interface UserMessage {
  role: 'user';
  text: string;
}

export interface AssistantMessage {
  role: 'assistant';
  /** Text revealed so far by the stream. */
  text: string;
  /** The complete answer the stream is working towards. */
  full: string;
  sources: Source[];
  notFound: boolean;
  pending: boolean;
  streaming: boolean;
  error: boolean;
}

export type Message = UserMessage | AssistantMessage;
