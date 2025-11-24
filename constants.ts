import { Project, SpeakingEngagement, Resource } from './types';

export const HERO_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'Find on Page API',
    description: 'High-performance text search within rendered DOM elements using shadow-root traversal.',
    techStack: ['C++', 'Chromium', 'Browser API'],
    category: 'Infrastructure',
    image: '/webview2Logo.png',
    link: 'https://github.com/MicrosoftEdge/WebView2Feedback/blob/api-findonpage/FindOnPage.md',
  },
  {
    id: 'p2',
    title: 'Adaptive Learning Platform',
    description: 'WebAssembly-powered coding projects that run Python tests directly in the browser for instant feedback. Go + MongoDB backend that logs every submission and completion for progress tracking and analytics. Scales from a single learner to tens of thousands of concurrent sessions without adding server execution load.',
    techStack: ['Go', 'WASM', 'Typescript'],
    category: 'Product',
    image: '/metrics.png',
    link: 'https://github.com/microsoft/adaptive-learning-platform',
  },
  {
    id: 'p3',
    title: 'Chromium Media Telemetry Copilot',
    description: 'Natural-language telemetry assistant integrating Titan MCP with an LLM-driven orchestrator. Enables engineers to ask questions like "What’s causing PlayReady failures this week?" and receive real Titan query results with clear, structured explanations.',
    techStack: ['Typescript', 'VSCode', 'LLM'],
    category: 'WebAssembly',
    image: '/Microsoft Hackathon Demo.png',
    link: 'https://github.com/microsoft/chromium-media-telemetry-copilot',
  },
];

export const FEATURED_PROJECTS: Project[] = [
  ...HERO_PROJECTS,
  // {
  //   id: 'p4',
  //   title: 'Distributed Log Mesh',
  //   description: 'A decentralized logging architecture ensuring zero-loss data ingestion during partition events.',
  //   techStack: ['Elixir', 'Kafka', 'ClickHouse'],
  //   category: 'Infrastructure',
  //   image: 'https://picsum.photos/600/400?random=4',
  //   link: '#',
  // },
  // {
  //   id: 'p5',
  //   title: 'Semantic Code Search',
  //   description: 'Vector-based code search tool allowing natural language queries over large monorepos.',
  //   techStack: ['Python', 'PyTorch', 'Postgres'],
  //   category: 'AI',
  //   image: 'https://picsum.photos/600/400?random=5',
  //   link: '#',
  // },
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
    title: 'How to Tailor Your Resume',
    description: 'A GitBook heavily documenting how to tailor your resume for each company you apply to.',
    type: 'GitBook',
    link: 'https://www.linkedin.com/pulse/important-tailor-your-resume-maxwell-myers-3suqc',
  },
  {
    id: 'r2',
    title: 'LLM Prompt Cookbook',
    description: 'Curated recipes for structured data extraction using Gemini and other models.',
    type: 'Cookbook',
    link: 'https://lilo.gitbook.io/lilocookbook',
  },
  {
    id: 'r3',
    title: 'The Art of RFCs',
    description: 'Templates and guide for writing Request for Comments that get approved.',
    type: 'SOP',
    link: '#',
  },
];