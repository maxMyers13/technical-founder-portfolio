import { Answer, Build, Post } from './types';

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
    text: "WM3's retrieval backend — embeddings and a deny-by-default allowlist over the public post archive, so answers come with receipts.",
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
    desc: "The retrieval backend for Ask WM3: Workers AI embeddings, a vector index and D1 over a deny-by-default allowlist of the public post archive, streamed answers with citations. The site you're on is the front half.",
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
  'Why did he leave Microsoft?',
  'What does WM3 actually stand for?',
  'What’s the deal with the track thing?',
];

const NOT_IN_ARCHIVE: Answer = {
  text: 'That isn’t in the archive — and WM3 doesn’t guess. It only answers from what Max has actually published: the builds, the talks, the posts, and this site.\n\nTry asking what he’s building, why he left Microsoft, or what WM3 stands for. Or email the human: max@learnwleo.com.',
  sources: [],
  notFound: true,
};

/**
 * The demo slice of the archive. Keyword-matched until the retrieval
 * backend is wired up — and it returns NOT_IN_ARCHIVE rather than guessing.
 */
export function answerFor(question: string): Answer {
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (has('build', 'lilo', 'now', 'chromebook', 'webnn', 'working on')) {
    return {
      text: 'Right now, LILO. The current fight is the on-device tutor — a quantized model running through WebNN so hints work on a $60 Chromebook without an inference bill or a privacy conversation. The runtime side already ships: Python on Pyodide, Java on CheerpJ, C, C++ and Rust through the WASI component model. Nothing leaves the tab.\n\nHe’s also wiring this site’s archive into WM3 — retrieval over the public posts — so answers like this one come with receipts.',
      sources: [
        { title: 'LILO', date: '2024–now', path: 'builds/lilo', url: LILO_URL },
        {
          title: 'Killing the Cloud Sandbox',
          date: 'SRE Day 2026',
          path: 'talks/killing-the-cloud-sandbox',
          url: TALK_VIDEO_URL,
        },
      ],
    };
  }

  if (has('microsoft', 'edge', 'leave', 'left', 'quit', 'webview', 'pwa')) {
    return {
      text: 'Five years in and around Microsoft Edge: three internships — PWA Hub in 2021, draggable window regions for Outlook in 2022, the first programmatic Find API in 2023 — then full-time from January 2024, leading the WebView2 Find on Page API end-to-end (14 features across Win32/C++, WinRT/C# and .NET), then media pipeline work upstream in Chromium.\n\nHe left in July 2026, not because of Edge but because LinkedInOrLeftOut — the side project — had grown into an eighteen-person team and one genuinely hard engineering question: how do you give a kid on a $60 Chromebook an instant, private coding environment? Answering that full-time is LILO.',
      sources: [
        { title: 'PWA Hub announcement', date: '2022', path: 'builds/pwa-hub', url: PWA_HUB_URL },
        {
          title: 'WebView2 release notes',
          date: '2024',
          path: 'builds/find-on-page',
          url: WEBVIEW2_RELEASE_NOTES_URL,
        },
      ],
    };
  }

  if (has('track', 'mile', 'captain', 'fast', '400', 'running', ' run')) {
    return {
      text: 'At UMD he captained the Division I track and field team, 2021–2023 — the official job description was “primary liaison between coaching staff and 30 athletes,” which meant a lot of phone calls. Two years as a Barry & Mary Gossett Fellow ran alongside it.\n\nWhat he runs these days isn’t in the archive, and he’d probably like to keep it that way.',
      sources: [{ title: 'Life', date: 'the UMD years', path: 'life', route: 'life' }],
    };
  }

  if (has('resume', 'interview', 'hire', 'job search')) {
    return {
      text: 'He documented the whole method — the one he teaches students — in “How to tailor your resume.” Short version: tailor to the job description without fabricating a single metric. The 15-minute AI-assisted version became the Techsgiving workshop.',
      sources: [
        {
          title: 'How to tailor your resume',
          date: '2025',
          path: 'writing/how-to-tailor-your-resume',
          url: RESUME_POST_URL,
        },
        {
          title: 'AI Resumes That Land Interviews',
          date: 'Nov 2025',
          path: TECHSGIVING_SLIDES,
          url: TECHSGIVING_SLIDES,
        },
      ],
    };
  }

  if (has('wm3', 'name', 'stand for', 'mad', 'called')) {
    return {
      text: 'WM3 originally stood for “What Made Max Mad?” — three M’s, courtesy of the Mad Max moniker, and a running list of things that set him off. Unclear instructions, mostly.\n\nOver time the framing shifted to a better question: “What Made Max?” This site — and this interface — is the attempt to answer it.',
      sources: [{ title: 'The name', date: 'site lore', path: 'life#the-name', route: 'life' }],
    };
  }

  return NOT_IN_ARCHIVE;
}
