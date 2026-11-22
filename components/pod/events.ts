import { SANDBOX_SLIDES, TALK_VIDEO_URL, TECHSGIVING_SLIDES } from '../../constants';

/**
 * Source of truth: the "Pathion Workshops & Events Catalog" Google Doc (titles, dates, roles). Photos come from
 * the Pathion shared drive, resized and stripped of EXIF.
 *
 * Conferences and events Max has a badge from. Each badge on the lanyard hook in the pod opens its event,
 * and the Speaking wall frames every photo here. Captions only say what the photo's capture date and the
 * post archive support (the same rule as the Life page), so don't add a claim a photo can't back up.
 */
export type EventPhoto = { src: string; alt: string; caption: string };

export type PodEvent = {
  id: string;
  /** Badge face: the event name as printed (\n for a line break), the role line, and the lanyard colour. */
  badge: string;
  role: string;
  color: string;
  name: string;
  when: string;
  where?: string;
  about: string;
  photos: EventPhoto[];
  links: { label: string; href: string }[];
};

export const EVENTS: PodEvent[] = [
  {
    id: 'afrotech',
    badge: 'AFROTECH\nHOUSTON',
    role: 'HOST',
    color: '#6b2fb3',
    name: 'Pathion at AfroTech',
    when: 'November 4, 2026',
    where: 'Houston',
    about:
      'Pathion hosted a Connect with Pathion meetup and a live resume roast at AfroTech in Houston. The team came in suits the year before.',
    photos: [
      { src: '/assets/photos/events/afrotech-2026-meetup.jpg', alt: 'A large group at the Connect with Pathion meetup at AfroTech, two people holding Pathion signs', caption: 'Connect with Pathion @ AfroTech · November 4, 2026' },
      { src: '/assets/photos/the-team.jpg', alt: 'Max and three others in suits at AfroTech', caption: 'AfroTech ’25 · October 2025' },
      { src: '/assets/photos/on-stage-conference.jpg', alt: 'Max on stage at a conference', caption: 'on stage · November 2024' },
    ],
    links: [],
  },
  {
    id: 'sre-day',
    badge: 'SREDAY',
    role: 'SPEAKER',
    color: '#d33b2c',
    name: 'SREday 2026',
    when: 'April 21 & May 11, 2026',
    where: 'Seattle & Austin',
    about:
      'Invited talk, “Killing the Cloud Sandbox”: how LILO moved language runtimes and AI inference off cloud servers and into the student’s browser, eliminating per-execution cost. The cost model, the Java challenge, and the on-device AI economics.',
    photos: [
      { src: '/assets/photos/events/sreday-austin-2026.jpg', alt: 'Max smiling in Austin, wearing his SREday name tag', caption: 'SREday Austin · May 2026' },
      { src: '/assets/photos/events/sreday-austin-2026-street.jpg', alt: 'Max leaning on a tiled column in downtown Austin', caption: 'downtown Austin · May 2026' },
      { src: '/assets/talk-costs.png', alt: 'Projected costs slide', caption: 'the cost model' },
      { src: '/assets/talk-wasm-arch.png', alt: 'Architecture slide: runtimes in the browser', caption: 'runtimes in the browser' },
      { src: '/assets/talk-fork.png', alt: 'Architecture decision slide', caption: 'the architecture decision' },
    ],
    links: [
      { label: 'Watch the talk', href: TALK_VIDEO_URL },
      { label: 'Slides (PDF)', href: SANDBOX_SLIDES },
    ],
  },
  {
    id: 'techsgiving',
    badge: 'TECHSGIVING',
    role: 'SPEAKER',
    color: '#2f6f6b',
    name: 'Techsgiving Summit 2025',
    when: 'December 12, 2025',
    about:
      'Invited workshop, “AI Resumes That Land Interviews: LILO’s 15-minute AI workflow to land interviews in 30 days”: the three legs of landing any role, why AI resume tailoring fails, the five-step workflow, and a live demo. It was recorded.',
    photos: [
      { src: '/assets/photos/events/techsgiving-2025-demo.jpg', alt: 'Max holding up a phone demo at Techsgiving Summit 2025, Gerdin Ventura beside him', caption: 'a live demo at Techsgiving, with Gerdin' },
      { src: '/assets/photos/on-stage-room.jpg', alt: 'Max on stage at Techsgiving Summit 2025, presenting to a full room', caption: 'on stage at Techsgiving Summit ’25' }],
    links: [{ label: 'Slides (PDF)', href: TECHSGIVING_SLIDES }],
  },
  {
    id: 'yc-startup-school',
    badge: 'YC STARTUP\nSCHOOL',
    role: 'FOUNDER',
    color: '#f26522',
    name: 'YC Startup School',
    when: 'July 2026',
    about: 'Y Combinator’s Startup School, the same month Max left Microsoft to build LILO full-time.',
    photos: [{ src: '/assets/photos/yc-startup-school.jpg', alt: 'Max in front of the Y Combinator wall', caption: 'YC Startup School · July 2026' }],
    links: [],
  },
];

export const eventById = (id: string | null | undefined) => EVENTS.find((e) => e.id === id) ?? null;
