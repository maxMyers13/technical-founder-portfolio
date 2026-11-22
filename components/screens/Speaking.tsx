import React from 'react';
import { EMAIL, SANDBOX_SLIDES, TALK_VIDEO_URL, TECHSGIVING_SLIDES } from '../../constants';
import { Route } from '../../types';
import { FORMATS, GIGS, Gig, HOSTS, KIND_LABEL, WORKSHOPS, YOUTUBE_CHANNEL, watchUrl } from './speakingData';

interface Props {
  onNavigate: (route: Route) => void;
}

const PRINTS = [
  { src: '/assets/photos/events/sreday-austin-2026.jpg', alt: 'Max in Austin wearing his SREday name tag', caption: 'SREday Austin · May 2026', tilt: -2.5 },
  { src: '/assets/photos/events/afrotech-2026-meetup.jpg', alt: 'A large group at the Connect with Pathion meetup at AfroTech', caption: 'Pathion at AfroTech · Nov 2026', tilt: 1.8 },
  { src: '/assets/photos/on-stage-room.jpg', alt: 'Max presenting to a full room at Techsgiving Summit 2025', caption: 'Techsgiving Summit · Dec 2025', tilt: -1.2 },
  { src: '/assets/photos/the-team.jpg', alt: 'Max and three others in suits at AfroTech', caption: 'AfroTech · Oct 2025', tilt: 2.2 },
  { src: '/assets/photos/on-stage-conference.jpg', alt: 'Max at the AfroTech conference wall', caption: 'AfroTech · Nov 2024', tilt: -1.6 },
];

const delivered = GIGS.filter((g) => !g.upcoming);
const firstYear = Math.min(...GIGS.map((g) => Number(g.sort.slice(0, 4))));
const byYear = GIGS.slice()
  .sort((a, b) => b.sort.localeCompare(a.sort))
  .reduce<Record<string, Gig[]>>((acc, g) => {
    (acc[g.sort.slice(0, 4)] ||= []).push(g);
    return acc;
  }, {});
const years = Object.keys(byYear).sort().reverse();

const Speaking: React.FC<Props> = () => (
  <main className="spk">
    <h1 className="craft-dup">Speaking</h1>

    <section className="spk-intro">
      <p className="spk-lede">
        I give the talk I’d want to sit through: one hard technical decision, the numbers behind it, and what broke. Most
        of it is workshops that leave a room with something finished: a rewritten resume, a sharper profile, a plan for a
        project.
      </p>
      <ul className="spk-stats" aria-label="At a glance">
        <li className="spk-stat spk-stat--red">
          <b>{delivered.length}</b>
          <span>sessions since {firstYear}</span>
        </li>
        <li className="spk-stat spk-stat--gold">
          <b>{HOSTS.length}</b>
          <span>hosts</span>
        </li>
        <li className="spk-stat spk-stat--teal">
          <b>{WORKSHOPS.length}</b>
          <span>workshops I teach</span>
        </li>
      </ul>
    </section>

    <section className="spk-hosts" aria-label="Hosts">
      <h2 className="spk-mini">Booked by</h2>
      <ul>
        {HOSTS.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </section>

    <section className="spk-feature" aria-label="Featured">
      <article className="spk-card spk-card--talk">
        <img src="/assets/photos/events/sreday-austin-2026.jpg" alt="Max smiling in Austin, wearing his SREday name tag" loading="lazy" />
        <div className="spk-card__body">
          <span className="spk-kicker">Invited talk · SREday Seattle & Austin · 2026</span>
          <h2>Killing the Cloud Sandbox</h2>
          <p>
            How LILO moved language runtimes and AI inference off cloud servers and into the student’s browser: the cost
            model, the Java problem, and the economics of on-device AI.
          </p>
          <div className="spk-actions">
            <a className="craft-btn spk-btn spk-btn--red" href={TALK_VIDEO_URL} target="_blank" rel="noopener noreferrer">
              Watch the talk
            </a>
            <a className="craft-btn spk-btn" href={SANDBOX_SLIDES} target="_blank" rel="noopener noreferrer">
              Slides (PDF)
            </a>
          </div>
        </div>
      </article>
      <article className="spk-card spk-card--workshop">
        <img src="/assets/photos/events/techsgiving-2025-demo.jpg" alt="Max holding up a phone demo at Techsgiving Summit 2025" loading="lazy" />
        <div className="spk-card__body">
          <span className="spk-kicker">Invited workshop · Techsgiving Summit · Dec 2025</span>
          <h2>AI Resumes That Land Interviews</h2>
          <p>LILO’s 15-minute AI workflow to land interviews in 30 days: why AI tailoring usually fails, and a live demo.</p>
          <div className="spk-actions">
            <a className="craft-btn spk-btn" href={TECHSGIVING_SLIDES} target="_blank" rel="noopener noreferrer">
              Slides (PDF)
            </a>
          </div>
        </div>
      </article>
    </section>

    <section className="spk-prints" aria-label="Photos">
      {PRINTS.map((p) => (
        <figure key={p.src} className="spk-print" style={{ rotate: `${p.tilt}deg` }}>
          <img src={p.src} alt={p.alt} loading="lazy" />
          <figcaption>{p.caption}</figcaption>
        </figure>
      ))}
    </section>

    <section className="spk-section">
      <h2 className="spk-h">What I teach</h2>
      <p className="spk-sub">Every workshop is taught from its own deck. Ask for one by name.</p>
      <ol className="spk-workshops">
        {WORKSHOPS.map((w, i) => (
          <li key={w.title} className="spk-ws">
            <img className="spk-ws__slide" src={`/assets/workshops/${w.slide}.jpg`} alt={`Title slide of the ${w.title} deck`} width={960} height={540} loading="lazy" />
            <span className="spk-ws__n">{String(i + 1).padStart(2, '0')}</span>
            <h3>{w.title}</h3>
            <p>{w.covers}</p>
          </li>
        ))}
      </ol>
    </section>

    <section className="spk-section">
      <h2 className="spk-h">Every gig</h2>
      <p className="spk-sub">Newest first. Workshops, talks, panels, and events I hosted.</p>
      <div className="spk-years">
        {years.map((y) => (
          <div key={y} className="spk-year">
            <h3 className="spk-year__label">{y}</h3>
            <ul className="spk-gigs">
              {byYear[y].map((g) => (
                <li key={g.sort + g.title} className={`spk-gig${g.upcoming ? ' spk-gig--soon' : ''}`}>
                  <span className="spk-gig__when">{g.when}</span>
                  <span className="spk-gig__what">
                    <b>{g.title}</b>
                    <span>
                      {g.host}
                      {g.where ? ` · ${g.where}` : ''}
                      {g.note ? ` · ${g.note}` : ''}
                    </span>
                  </span>
                  <span className={`spk-chip spk-chip--${g.upcoming ? 'soon' : g.kind}`}>
                    {g.upcoming ? 'Upcoming' : g.role ? g.role[0].toUpperCase() + g.role.slice(1) : KIND_LABEL[g.kind]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>

    <section className="spk-section">
      <h2 className="spk-h">On our own channels</h2>
      <p className="spk-sub">
        Pathion’s recurring live formats, on{' '}
        <a href={YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer">
          YouTube
        </a>
        , LinkedIn Live and Discord. Each button opens that recording.
      </p>
      <ul className="spk-formats">
        {FORMATS.map((f) => (
          <li key={f.title} className="spk-format">
            <h3>{f.title}</h3>
            <p>{f.what}</p>
            <ul className="spk-eps" aria-label={`${f.title} on YouTube`}>
              {f.watch.map((v) => (
                <li key={v.id}>
                  <a href={watchUrl(v.id)} target="_blank" rel="noopener noreferrer" aria-label={`${f.title}, ${v.label}, on YouTube`}>
                    {v.label}
                  </a>
                </li>
              ))}
            </ul>
            <span>{f.when}</span>
          </li>
        ))}
      </ul>
    </section>

    <section className="spk-bio">
      <h2 className="spk-h">Bio for programs</h2>
      <p>
        Maxwell Myers is the co-founder and CEO of LinkedInOrLeftOut, where he’s building LILO: coding education that runs
        language runtimes and an AI tutor entirely in the browser. He spent five years in and around Microsoft Edge, three
        internships and then full-time on the Web Platform team, leading the WebView2 Find on Page API end to end and
        working upstream in Chromium’s media pipeline. He studied computer science at the University of Maryland, where he
        also captained the Division I track and field team.
      </p>
      <a className="craft-btn spk-btn spk-btn--red spk-btn--big" href={`mailto:${EMAIL}?subject=Speaking%20invite`}>
        Invite me to speak
      </a>
    </section>
  </main>
);

export default Speaking;
