/**
 * Source of truth: the "Pathion Workshops & Events Catalog" Google Doc (Marketing folder, started Nov 21, 2026).
 * Titles are copied from it, and it copies them from each deck's Canva title slide. Only sessions the doc marks
 * delivered are listed, plus the ones booked after today. Sessions it asks to confirm (the Dec 28, 2025 church
 * chat, the Nov 12, 2026 Towson booking) stay off until they're confirmed. Contacts and fees stay in the doc.
 */

export type GigKind = 'workshop' | 'talk' | 'panel' | 'host' | 'guest';

export type Gig = {
  /** Sort key, YYYY-MM-DD; a day of 00 means only the month is known. */
  sort: string;
  when: string;
  host: string;
  title: string;
  kind: GigKind;
  /** The role line when it says more than the kind does (moderator, organizer). */
  role?: string;
  where?: string;
  note?: string;
  upcoming?: boolean;
};

export const GIGS: Gig[] = [
  // ---------- workshops ----------
  { sort: '2026-11-30', when: 'Nov 30', host: 'UMD Terp Tech Path', title: 'Resume workshop', kind: 'workshop', upcoming: true },
  { sort: '2026-11-23', when: 'Nov 23', host: 'UMD Terp Tech Path, with ColorStack UMD, BES and Code:Black', title: 'How to Build a Personal Project With AI That Actually Gets You Hired', kind: 'workshop', upcoming: true },
  { sort: '2026-10-26', when: 'Oct 26', host: 'Howard Community College × NCNW (R.I.S.E.)', title: 'LinkedIn & AI Job Application Workshop', kind: 'workshop', note: 'invited back next year' },
  { sort: '2026-05-28', when: 'May 28', host: 'DCPS Persist', title: 'LinkedIn Workshop', kind: 'workshop', where: 'Zoom' },
  { sort: '2026-02-28', when: 'Feb 28', host: 'NCCU, The Movement Street: Move with a Purpose', title: 'LinkedIn and Resume room', kind: 'workshop', where: 'virtual' },
  { sort: '2025-12-12', when: 'Dec 12', host: 'Techsgiving Summit 2025', title: 'AI Resumes That Land Interviews', kind: 'workshop', note: 'recorded' },
  { sort: '2025-12-03', when: 'Dec 3', host: 'Howard Community College × NCNW (RISE)', title: 'LinkedIn Crash Course', kind: 'workshop' },
  { sort: '2025-11-14', when: 'Nov 14', host: 'Code Differently AI Hackathon', title: 'Building Smarter with AI CLI Tools, then mentoring', kind: 'workshop', where: 'Wilmington, DE' },
  { sort: '2025-11-10', when: 'Nov 10', host: 'UMD Code:Black / Terp Tech Path', title: 'Using AI to Tailor Your Resume, plus free resume rewrites', kind: 'workshop' },
  { sort: '2025-08-28', when: 'Aug 28', host: 'LILO cohort', title: 'Resume Repair Workshop', kind: 'workshop' },
  { sort: '2025-01-04', when: 'Jan 4', host: 'Peoples Community Baptist Church, College Chapter 2025', title: 'LinkedIn and resumes', kind: 'workshop', note: 'recorded' },
  { sort: '2024-03-25', when: 'Late Mar', host: 'USF SHPE', title: 'Securing the Return Offer', kind: 'workshop', note: 'with Gerdin · 50+ attendees' },
  { sort: '2023-11-08', when: 'Nov 8', host: 'UMD Kubasik First Impact, Gossett Hall', title: 'Resume Repair Workshop', kind: 'workshop' },
  { sort: '2023-11-04', when: 'Nov 4', host: 'NSBE Region II Fall Regional Conference', title: 'LinkedIn Crash Course', kind: 'workshop', where: 'Norfolk, VA' },
  { sort: '2023-06-00', when: 'Before Feb 2024', host: 'UMD Gossett Fellows', title: 'Resume, LinkedIn and cover letter workshop', kind: 'workshop' },
  { sort: '2023-02-00', when: 'Feb', host: 'Montgomery College Presidential Scholars', title: 'Career branding: resume, LinkedIn, cover letter, networking', kind: 'workshop', note: 'three hours' },
  { sort: '2023-01-00', when: 'Jan', host: 'Peoples Community Baptist Church', title: 'Career readiness', kind: 'workshop', note: 'the first one' },
  // ---------- events ----------
  { sort: '2026-11-04', when: 'Nov 4', host: 'Pathion at AfroTech', title: 'Connect with Pathion meetup and a live resume roast', kind: 'host', where: 'Houston' },
  { sort: '2026-09-11', when: 'Sep 11–12', host: 'LILO Summer Academy', title: 'Academy Hackathon', kind: 'host', note: '13 submissions' },
  { sort: '2026-06-15', when: 'Jun 15 – Aug 31', host: 'LILO Summer Academy', title: 'Weekly kickoff lectures, ending with Career Readiness', kind: 'host', note: '12 weeks' },
  { sort: '2026-05-11', when: 'May 11', host: 'SREday Austin', title: 'Killing the Cloud Sandbox', kind: 'talk' },
  { sort: '2026-04-21', when: 'Apr 21', host: 'SREday Seattle', title: 'Killing the Cloud Sandbox', kind: 'talk' },
  { sort: '2026-02-28', when: 'Feb 28', host: 'NCCU, The Movement Street', title: 'Industry panel at Move with a Purpose', kind: 'panel', where: 'virtual' },
  { sort: '2025-06-09', when: 'Jun 9', host: 'Maryland Made Terps Career Exposure Tour, at Microsoft', title: 'Breaking Into & Thriving in Tech', kind: 'panel', role: 'host' },
  { sort: '2025-03-26', when: 'Mar 26', host: 'FIU Code Crunch', title: 'SWE Convos, with Gerdin', kind: 'guest', where: 'Zoom' },
  { sort: '2024-09-00', when: 'Sep', host: 'Tech for Social Good mixer, Seattle', title: 'Lightning talk on LILO’s mission', kind: 'talk' },
  { sort: '2024-04-10', when: 'Apr', host: 'Tips with Taylor Live', title: 'From Intern to Insider', kind: 'guest' },
  { sort: '2024-04-02', when: 'Apr 2', host: 'Fellowship / First Tech Fund', title: 'Intro to Coding Careers', kind: 'panel' },
  { sort: '2024-03-00', when: 'Mar', host: 'Wayne State University, Women in Tech', title: 'Guest speaker', kind: 'talk' },
  { sort: '2024-02-13', when: 'Feb 13', host: 'LILO, on LinkedIn Live', title: 'Tech Interview Mastery', kind: 'panel', role: 'moderator' },
  { sort: '2023-11-27', when: 'Nov 27', host: 'LILO', title: 'First online panel: LinkedIn, job search, networking', kind: 'panel', role: 'moderator' },
  { sort: '2023-11-26', when: 'Nov 26', host: 'LILO, on Instagram Live', title: 'Elevating Your LinkedIn Profile', kind: 'panel', role: 'moderator' },
  { sort: '2023-02-01', when: 'Feb', host: 'UMD Maryland Made Terps, Glazer auditorium', title: 'Centering Black Voices in Career Readiness', kind: 'panel', role: 'organizer & moderator' },
];

export const KIND_LABEL: Record<GigKind, string> = {
  workshop: 'Workshop',
  talk: 'Talk',
  panel: 'Panel',
  host: 'Host',
  guest: 'Guest',
};

/** The workshops in the catalog, in plain English. `slide` is the deck's title slide in public/assets/workshops. */
export const WORKSHOPS: { slide: string; title: string; covers: string }[] = [
  { slide: 'linkedin-crash-course', title: 'LinkedIn Crash Course: How to Make Recruiters Click Your Profile', covers: 'Winning the first glance, writing experience as evidence, showing your work, and how to run the search.' },
  { slide: 'resume-repair', title: 'Resume Repair Workshop', covers: 'Why the resume still matters, what to fix, cover letters and networking, then live critiques.' },
  { slide: 'ai-resumes', title: 'AI Resumes That Land Interviews', covers: 'Why AI resume tailoring usually fails, and LILO’s 15-minute, five-step workflow, demoed live.' },
  { slide: 'linkedin-and-ai', title: 'LinkedIn & AI Job Application Workshop', covers: 'The LinkedIn Crash Course and AI resume tailoring back to back, half an hour each.' },
  { slide: 'return-offer', title: 'Securing the Return Offer', covers: 'Before, during and after the internship: the search, the resume, LinkedIn, and negotiating the offer.' },
  { slide: 'ai-cli-tools', title: 'Building Smarter with AI CLI Tools', covers: 'Why AI command-line tools matter, real builds, debugging with them, and the toolkit.' },
  { slide: 'technical-writing', title: 'Technical Writing as a Career Weapon: Documentation is Distribution', covers: 'Why engineers should post, building credibility, docs as content and as product, and where to publish.' },
  { slide: 'personal-project', title: 'How to Build a Personal Project With AI That Actually Gets You Hired', covers: 'Picking what to build, building it with AI, and explaining your decisions in the interview.' },
];

/** The Pathion channel, where the recordings below live. */
export const YOUTUBE_CHANNEL = 'https://www.youtube.com/@joinpathion';
export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/**
 * Formats Pathion runs on its own channels, the ones Max hosts or co-hosts. `watch` lists the recordings that are
 * public on the YouTube channel (video ids read off its Live tab on Nov 22, 2026); episodes that only ran on
 * LinkedIn Live or Discord have no link.
 */
export const FORMATS: { title: string; what: string; when: string; watch: { label: string; id: string }[] }[] = [
  {
    title: 'Roast Your Resume', what: 'Live critiques of submitted resumes on LinkedIn Live, YouTube or Discord.', when: '10 episodes, Mar 2025 to Oct 2026',
    watch: [{ label: 'Part 1', id: '5ktcp6AM19Q' }, { label: 'Part 2', id: '66HqG495oT4' }, { label: 'With Kwaku', id: 'kf3it25Df0o' }],
  },
  {
    title: 'Live Mock Interview', what: 'A full interview, streamed, so everyone watching learns from one candidate.', when: 'Summer 2025 and 2026',
    watch: [{ label: 'Mock interview', id: '3ywovn6tpw0' }],
  },
  {
    title: 'Weekly Kickoff', what: 'Monday nights on YouTube Live for the Summer Academy: the week’s learning, deadlines and events.', when: '12 weeks, summer 2026',
    watch: [{ label: 'Wk 1', id: 'YsEXGqHw8mw' }, { label: 'Wk 2', id: 'Ja7xqonsSJw' }, { label: 'Wk 3', id: 'jegMxqQ27Wg' }, { label: 'Wk 4', id: 'hxqNAqoaf1A' }, { label: 'Wk 5', id: 'NogzsCk1zq0' }, { label: 'Wk 6', id: '72-U7htj34k' }, { label: 'Wk 7', id: 'jYSYvET5M4g' }, { label: 'Wk 8', id: '1H3Jk0ZuOX4' }, { label: 'Wk 9', id: 'UsD0wMkzkbs' }, { label: 'Wk 10', id: 'S7vnlQqeLR8' }, { label: 'Wk 11', id: 'tTgVfykPfHM' }, { label: 'Wk 12', id: 'tXjbRjv8a4M' }],
  },
  {
    title: 'Academy Hackathon', what: 'A kickoff stream, a 24-hour build in teams of two to four, three-minute demos and judging.', when: 'Sep 2026',
    watch: [{ label: 'Kickoff', id: 'XgyG0cGZfR4' }, { label: 'Build 1', id: 'CKVjnXJqhxQ' }, { label: 'Build 2', id: 'hgZcgq18lSw' }, { label: 'Winning project', id: 'WbIb-SBFMYU' }],
  },
];

/** Everyone who has booked a session, from the catalog's "Who we've worked with" table. */
export const HOSTS: string[] = [
  'University of Maryland',
  'NSBE Region II',
  'Techsgiving',
  'SREday',
  'AfroTech',
  'Howard Community College × NCNW',
  'NCCU, The Movement Street',
  'DCPS Persist',
  'USF SHPE',
  'Wayne State Women in Tech',
  'FIU Code Crunch',
  'Code Differently',
  'Fellowship / First Tech Fund',
  'Tech for Social Good, Seattle',
  'Tips with Taylor',
  'Montgomery College Presidential Scholars',
  'Peoples Community Baptist Church',
];
