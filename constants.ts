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
  {
    id: 'p5',
    title: 'Killing the Cloud Sandbox (SRE Day 2026)',
    description:
      'Technical talk on moving language runtimes and AI inference from cloud servers to the student browser via WebAssembly. Covers the cost model, the Java/CheerpJ workaround, and on-device AI tutor economics.',
    techStack: ['WebAssembly', 'EdgeAI', 'Talk'],
    category: 'Talks/Writing',
    image: '/assets/talks/previews/killing-cloud-sandbox-projected-costs.png',
    link: 'https://youtu.be/uVoWMcnwAAE',
    linkText: 'Watch the talk',
  },
];

export const HERO_PROJECTS: Project[] = FEATURED_PROJECTS.slice(0, 3);

export const SPEAKING_DATA: SpeakingEngagement[] = [
  {
    id: 's1',
    event: 'SRE Day 2026 (Seattle + Austin) | Invited Speaker',
    title: 'Killing the Cloud Sandbox',
    description:
      'How we moved language runtimes and AI inference off cloud servers and into the student browser via WebAssembly, eliminating per-execution cost. Includes the cost model, the Java challenge, and the on-device AI economics.',
    primaryLink: {
      url: 'https://youtu.be/uVoWMcnwAAE',
      label: 'Watch the talk',
    },
    secondaryLink: {
      url: '/assets/talks/KillingTheCloudSandbox-Seattle.pdf',
      label: 'Download slides',
    },
    previewImage: '/assets/talks/previews/killing-cloud-sandbox-projected-costs.png',
    secondaryPreviewImage: '/assets/talks/previews/killing-cloud-sandbox-fork-in-road.png',
    featured: true,
  },
  {
    id: 's2',
    event: 'Techsgiving Workshop, November 2025 | Invited Speaker',
    title: 'AI Resumes That Land Interviews',
    description:
      'A 15-minute AI-driven workflow for tailoring resumes to job descriptions without fabricating metrics.',
    primaryLink: {
      url: '/assets/talks/Techsgiving-Workshop.pdf',
      label: 'Download slides',
    },
    featured: false,
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
