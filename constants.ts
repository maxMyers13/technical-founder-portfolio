import { Project, SpeakingEngagement, Resource } from './types';

export const FEATURED_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'LILO',
    description:
      'Browser-native coding-education platform. All code executes client-side in WebAssembly at zero marginal cost: Python via Pyodide, Java via CheerpJ, C/C++/Rust via the WASI component model. A quantized LLM runs locally via WebNN for AI tutoring. Live with 313 users.',
    techStack: ['WebAssembly', 'Pyodide', 'CheerpJ', 'WebNN', 'Next.js'],
    category: 'Product',
    image: '/metrics.png',
    link: 'https://learnwleo.com',
    linkText: 'Visit LILO',
  },
  {
    id: 'p2',
    title: 'Find on Page API (Microsoft WebView2)',
    description:
      'Led end-to-end development of the native programmatic text-search API across Win32/C++, WinRT/C#, and .NET. 14 features shipped, multi-process Mojo IPC architecture, collaborated with stakeholders from Epic, DuckDuckGo, GitHub, and Google\'s Chromium project.',
    techStack: ['C++', 'WinRT', 'Chromium', 'Mojo'],
    category: 'Browser Platform',
    image: '/webview2Logo.png',
    link: 'https://learn.microsoft.com/en-us/microsoft-edge/webview2/release-notes/',
    linkText: 'View Documentation',
  },
  {
    id: 'p3',
    title: 'Window Controls Overlay (Microsoft Edge)',
    description:
      'Built support for desktop PWAs to render web content into the OS title bar area, including `app-region` drag handles. Shipped to Microsoft Edge 105 stable. Closes the visual gap between web apps and native desktop apps on Windows, macOS, and Linux.',
    techStack: ['PWA', 'ChromiumPlatform', 'CSS'],
    category: 'Browser Platform',
    image: '/Microsoft Hackathon Demo.png',
    link: 'https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/window-controls-overlay',
    linkText: 'View Documentation',
  },
  {
    id: 'p4',
    title: 'PWA Hub for Microsoft Edge',
    description:
      'Co-built the in-browser surface for discovering and managing installed PWAs and web apps. Shipped to 330M+ monthly active users. Win32/WinUI C++ backend, ReactJS frontend, Mojo IPC between them.',
    techStack: ['C++', 'WinUI', 'React', 'Mojo'],
    category: 'Browser Platform',
    image: '/webview2Logo.png',
    link: 'https://blogs.windows.com/msedgedev/2022/05/18/find-and-manage-your-installed-apps-and-sites/',
    linkText: 'Read announcement',
  },
];

export const HERO_PROJECTS: Project[] = FEATURED_PROJECTS.slice(0, 3);

export const SPEAKING_DATA: SpeakingEngagement[] = [
  {
    id: 's1',
    event: 'SRE Day 2026 (Austin and Seattle)',
    title: 'Killing the Cloud Sandbox',
    description:
      'Invited speaker. A technical talk on running language runtimes and AI inference entirely client-side via WebAssembly to eliminate per-user cloud execution cost.',
    recordingUrl: 'https://youtu.be/uVoWMcnwAAE',
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
];
