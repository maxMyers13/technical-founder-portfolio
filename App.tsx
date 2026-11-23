import React, { useCallback, useEffect, useState } from 'react';
import Footer from './components/Footer';
import CraftHeader from './components/craft/CraftHeader';
import LevelBanner from './components/craft/LevelBanner';
import TabBar from './components/craft/TabBar';
import './components/craft/craft.css';
import Ask from './components/screens/Ask';
import Builds from './components/screens/Builds';
import Pod from './components/pod/Pod';
import Life from './components/screens/Life';
import Lilo from './components/screens/Lilo';
import Speaking from './components/screens/Speaking';
import Writing from './components/screens/Writing';
import { useWm3Chat } from './hooks/useWm3Chat';
import { BuildFilter, Route } from './types';
import Builder from './components/builder/Builder';

/**
 * Every screen has a hash, so a page can be linked to, bookmarked, and reached
 * with the back button. Home is `#now` because that is what its tab is called.
 */
const ROUTE_HASH: Record<Route, string> = {
  home: 'now',
  writing: 'writing',
  builds: 'builds',
  ask: 'ask',
  life: 'life',
  lilo: 'lilo',
  speaking: 'speaking',
  // the character builder: not on any bar, reached by its link
  builder: 'builder',
};

const HASH_ROUTE: Record<string, Route> = Object.fromEntries(
  Object.entries(ROUTE_HASH).map(([route, hash]) => [hash, route as Route]),
);

/** An unknown or missing hash lands on home rather than a blank screen. */
function routeFromHash(): Route {
  if (typeof window === 'undefined') return 'home';
  return HASH_ROUTE[window.location.hash.replace(/^#/, '').toLowerCase()] ?? 'home';
}

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [filter, setFilter] = useState<BuildFilter>('everything');
  const [askTeaser, setAskTeaser] = useState('');
  const [composer, setComposer] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const chat = useWm3Chat();

  // Back and forward move between screens, not just through scroll positions.
  useEffect(() => {
    const onHashChange = () => {
      setRoute(routeFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    setRoute(next);
    window.scrollTo(0, 0);
    // Assigning the hash pushes a history entry, which is what makes back work.
    if (window.location.hash.replace(/^#/, '') !== ROUTE_HASH[next]) {
      window.location.hash = ROUTE_HASH[next];
    }
  }, []);

  /** Jump to Life and land on "the name" section the footer refers to. */
  const navigateToName = useCallback(() => {
    navigate('life');
    window.setTimeout(() => {
      const el = document.getElementById('the-name');
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 100);
    }, 80);
  }, [navigate]);

  /** Ask from anywhere: land on the Ask screen, then send. */
  const askFromAnywhere = useCallback(
    (question: string) => {
      if (!question.trim()) return;
      chat.warmNano();
      navigate('ask');
      setAskTeaser('');
      window.setTimeout(() => chat.ask(question), 60);
    },
    [chat, navigate],
  );

  const sendComposer = useCallback(() => {
    chat.ask(composer);
    setComposer('');
  }, [chat, composer]);

  const clearConversation = useCallback(() => {
    chat.clear();
    setExpanded({});
    setComposer('');
  }, [chat]);

  const toggleSource = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const page = route !== 'home' && route !== 'builder';
  return (
    <div
      className={route === 'home' || route === 'builder' ? undefined : 'craft'}
      style={route === 'home' ? { minHeight: '100vh', background: 'var(--bg)' } : undefined}
    >
      {/* The character builder is a full-screen tool of its own, with no site chrome round it. */}
      {route === 'builder' && <Builder onNavigate={navigate} />}
      {/* Home is the pod: a full-bleed room with its own header, console and footer. */}
      {route === 'home' && <Pod onNavigate={navigate} onAsk={askFromAnywhere} />}

      {/* Every other page wears the pod's materials: its header, a diorama with the page's sign, a stitched sheet. */}
      {page && <CraftHeader route={route} onNavigate={navigate} />}
      {route !== 'home' && route !== 'builder' && <LevelBanner route={route} compact={route === 'ask'} />}
      {page && (
        <div className="craft-sheet">
          {route === 'writing' && <Writing onNavigate={navigate} />}
          {route === 'builds' && (
            <Builds onNavigate={navigate} filter={filter} onFilterChange={setFilter} />
          )}
          {route === 'ask' && (
            <Ask
              messages={chat.messages}
              streaming={chat.streaming}
              nano={chat.nano}
              preference={chat.preference}
              onPreferenceChange={chat.setPreference}
              composer={composer}
              expanded={expanded}
              onToggleSource={toggleSource}
              onComposerChange={setComposer}
              onAsk={(q) => chat.ask(q)}
              onSend={sendComposer}
              onStop={chat.stop}
              onClear={clearConversation}
              onRetry={chat.retry}
              onNavigate={navigate}
            />
          )}
          {route === 'life' && <Life onNavigate={navigate} />}
          {route === 'lilo' && <Lilo onNavigate={navigate} />}
          {route === 'speaking' && <Speaking onNavigate={navigate} />}
        </div>
      )}

      {page && <Footer onNavigate={navigate} onNavigateToName={navigateToName} />}

      {/* Phones: one dock at the bottom of every screen, the room included. */}
      {route !== 'builder' && <TabBar route={route} onNavigate={navigate} />}
    </div>
  );
};

export default App;
