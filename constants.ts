import { Build, Post } from './types';

export const LILO_URL = 'https://learnwleo.com';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/maxwellmyers1/';
export const LINKEDIN_ACTIVITY_URL = 'https://www.linkedin.com/in/maxwellmyers1/recent-activity/all/';
export const GITHUB_URL = 'https://github.com/maxMyers13';
export const X_URL = 'https://x.com/wmMaxm';
export const EMAIL = 'max@learnwleo.com';
export const TALK_VIDEO_URL = 'https://youtu.be/uVoWMcnwAAE';
export const RESUME_POST_URL =
  'https://www.linkedin.com/pulse/important-tailor-your-resume-maxwell-myers-3suqc';
export const COOKBOOK_URL = 'https://lilo.gitbook.io/lilocookbook';
export const WEBVIEW2_RELEASE_NOTES_URL =
  'https://learn.microsoft.com/en-us/microsoft-edge/webview2/release-notes/';
export const PWA_HUB_URL =
  'https://blogs.windows.com/msedgedev/2022/05/18/find-and-manage-your-installed-apps-and-sites/';
export const WCO_DOCS_URL =
  'https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/window-controls-overlay';
export const CHROMIUM_URL = 'https://chromium.org';

export const SANDBOX_SLIDES = '/assets/killing-the-cloud-sandbox.pdf';
export const TECHSGIVING_SLIDES = '/assets/techsgiving-workshop.pdf';

export const NOW_ITEMS: { label: string; text: string }[] = [
  {
    label: 'building',
    text: "LILO's on-device tutor. Current fight: WebNN inference on a $60 Chromebook without melting it.",
  },
  {
    label: 'wiring up',
    text: "WM3 answers from 213 of my LinkedIn posts now — embedded, searched and written up in your browser, with receipts. Next: widening the allowlist.",
  },
  {
    label: 'thinking about',
    text: 'What a personal AI archive should refuse to answer. If WM3 can speak for me, where does “me” stop and the model start?',
  },
];

export const POSTS: Post[] = [
  {
    date: '2025',
    kind: 'guide',
    title: 'How to tailor your resume',
    blurb: 'The full method I teach students, documented properly instead of as a thread.',
    href: RESUME_POST_URL,
  },
  {
    date: '2025',
    kind: 'cookbook',
    title: 'LLM prompt cookbook',
    blurb: 'Recipes for structured extraction that survive contact with real data.',
    href: COOKBOOK_URL,
  },
];

export const BUILDS: Build[] = [
  {
    kind: 'serious',
    year: '2024–now',
    tag: 'the big one',
    title: 'LILO',
    desc: "Coding education with no cloud sandbox. Python via Pyodide, Java via CheerpJ, C/C++/Rust via WASI, and a quantized tutor on WebNN — all in the student's browser.",
    route: 'lilo',
    cta: 'Case study →',
    img: '/assets/metrics.png',
    caption: 'live metrics, August 2026',
  },
  {
    kind: 'side',
    year: '2026',
    tag: 'meta · new',
    title: "WM3 (this site's brain)",
    desc: "Retrieval over my public post archive, running entirely in your tab: MiniLM embeds the question on your machine, cosine search over a 371-chunk index, and Chrome's on-device model writes the answer when it's there. No server, no API key, no question ever leaves the page.",
    route: 'ask',
    cta: 'Ask it →',
  },
  {
    kind: 'side',
    year: 'hackathon',
    tag: 'weird one-off',
    title: 'Media Telemetry Copilot',
    desc: 'A VS Code extension that streams a Copilot diagnosis of PlayReady media failures — first slice wired a readiness analyzer to the VS Code Language Model API on sample telemetry.',
    cta: '',
    img: '/assets/hackathon-demo.png',
    caption: 'the copilot mid-diagnosis, hackathon demo',
  },
  {
    kind: 'serious',
    year: '2024',
    tag: 'day job, once',
    title: 'Find on Page API, WebView2',
    desc: 'Led it end-to-end at Microsoft: 14 features across Win32/C++, WinRT/C# and .NET on multi-process Mojo IPC, shipped to stable with Epic, DuckDuckGo and GitHub in the room.',
    href: WEBVIEW2_RELEASE_NOTES_URL,
    cta: 'Docs →',
  },
  {
    kind: 'serious',
    year: '2021',
    tag: 'intern summer',
    title: 'PWA Hub, Microsoft Edge',
    desc: 'Co-built the surface for finding and managing installed web apps on a two-person team. C++/WinUI backend, React front end. 330M+ monthly users.',
    href: PWA_HUB_URL,
    cta: 'Announcement →',
  },
  {
    kind: 'serious',
    year: '2022',
    tag: 'intern summer',
    title: 'Draggable regions, WebView2',
    desc: "Native C++ API for webkit-app-region in WebView2 — custom window dragging for Outlook's new desktop client and its 400M+ users.",
    cta: '',
  },
  {
    kind: 'serious',
    year: '2022',
    tag: 'day job, once',
    title: 'Window Controls Overlay',
    desc: 'Let desktop PWAs draw into the OS title bar. Shipped in Edge 105 stable across Windows, macOS and Linux.',
    href: WCO_DOCS_URL,
    cta: 'Docs →',
  },
  {
    kind: 'serious',
    year: '2024–26',
    tag: 'upstream',
    title: 'Chromium media pipeline',
    desc: 'Building, measuring and landing media features upstream in Chromium — day to day alongside Google and open-source contributors.',
    href: CHROMIUM_URL,
    cta: 'Chromium →',
  },
  {
    kind: 'serious',
    year: '2026',
    tag: 'talk',
    title: 'Killing the Cloud Sandbox',
    desc: 'The SRE Day talk on moving runtimes and inference into the browser: the cost model, the Java challenge, the on-device AI economics.',
    href: TALK_VIDEO_URL,
    cta: 'Watch →',
    img: '/assets/talk-wasm-arch.png',
    caption: 'the architecture slide',
  },
];

export const BUILD_FILTERS: { key: 'everything' | 'serious' | 'side'; label: string }[] = [
  { key: 'everything', label: 'Everything' },
  { key: 'serious', label: 'Serious' },
  { key: 'side', label: 'Side quests' },
];

export const STARTER_QUESTIONS = [
  'What is Max building right now?',
  'How does he tailor a resume?',
  'What does WM3 actually stand for?',
  'What’s the deal with the track thing?',
];
