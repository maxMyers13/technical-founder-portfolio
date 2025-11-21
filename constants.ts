import { Project, SpeakingEngagement, Resource } from './types';

export const HERO_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Find on Page API',
    description: 'High-performance text search within rendered DOM elements using shadow-root traversal.',
    techStack: ['Rust', 'WASM', 'Browser API'],
    category: 'Infrastructure',
    image: 'https://picsum.photos/600/400?random=1',
    link: '#',
  },
  {
    id: 'p2',
    title: 'Adaptive Learning Platform',
    description: 'AI-driven curriculum adjustment engine handling 50k concurrent websocket connections.',
    techStack: ['Go', 'gRPC', 'Redis'],
    category: 'Product',
    image: 'https://picsum.photos/600/400?random=2',
    link: '#',
  },
  {
    id: 'p3',
    title: 'WASM Exec Engine',
    description: 'Sandboxed execution environment for user-submitted plugins in edge computing nodes.',
    techStack: ['C++', 'WebAssembly', 'V8'],
    category: 'WebAssembly',
    image: 'https://picsum.photos/600/400?random=3',
    link: '#',
  },
];

export const FEATURED_PROJECTS: Project[] = [
  ...HERO_PROJECTS,
  {
    id: 'p4',
    title: 'Distributed Log Mesh',
    description: 'A decentralized logging architecture ensuring zero-loss data ingestion during partition events.',
    techStack: ['Elixir', 'Kafka', 'ClickHouse'],
    category: 'Infrastructure',
    image: 'https://picsum.photos/600/400?random=4',
    link: '#',
  },
  {
    id: 'p5',
    title: 'Semantic Code Search',
    description: 'Vector-based code search tool allowing natural language queries over large monorepos.',
    techStack: ['Python', 'PyTorch', 'Postgres'],
    category: 'AI',
    image: 'https://picsum.photos/600/400?random=5',
    link: '#',
  },
];

export const SPEAKING_DATA: SpeakingEngagement[] = [
  {
    id: 's1',
    event: 'SystemsScale 2024',
    title: 'Breaking Monoliths without Breaking Teams',
    date: 'Oct 2024',
    type: 'Keynote',
  },
  {
    id: 's2',
    event: 'WASM I/O',
    title: 'The Future of Edge Compute',
    date: 'Aug 2024',
    type: 'Panel',
  },
  {
    id: 's3',
    event: 'React Advanced',
    title: 'Performance Tuning React Internals',
    date: 'June 2024',
    type: 'Workshop',
  },
];

export const RESOURCES: Resource[] = [
  {
    id: 'r1',
    title: 'Scaling Engineering Teams',
    description: 'A GitBook heavily documenting our SOPs for hiring, onboarding, and incident response.',
    type: 'GitBook',
    link: '#',
  },
  {
    id: 'r2',
    title: 'LLM Prompt Cookbook',
    description: 'Curated recipes for structured data extraction using Gemini and other models.',
    type: 'Cookbook',
    link: '#',
  },
  {
    id: 'r3',
    title: 'The Art of RFCs',
    description: 'Templates and guide for writing Request for Comments that get approved.',
    type: 'SOP',
    link: '#',
  },
];