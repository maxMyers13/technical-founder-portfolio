import React, { useCallback, useEffect, useState } from 'react';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Ask from './components/screens/Ask';
import Builds from './components/screens/Builds';
import Home from './components/screens/Home';
import Life from './components/screens/Life';
import Lilo from './components/screens/Lilo';
import Speaking from './components/screens/Speaking';
import Writing from './components/screens/Writing';
import { useWm3Chat } from './hooks/useWm3Chat';
import { BuildFilter, Route, Theme } from './types';

const THEME_KEY = 'wm3-theme';

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>('home');
  const [theme, setTheme] = useState<Theme>('system');
  const [filter, setFilter] = useState<BuildFilter>('everything');
  const [askTeaser, setAskTeaser] = useState('');
  const [composer, setComposer] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const chat = useWm3Chat();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') setTheme(stored);
    } catch {
      // Theme is a nicety; a locked-down localStorage just means "system".
    }
  }, []);

  const changeTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Ignore — the theme still applies for this session.
    }
    if (next === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
    setTheme(next);
  }, []);

  const navigate = useCallback((next: Route) => {
    setRoute(next);
    window.scrollTo(0, 0);
  }, []);

  /** Jump to Life and land on "the name" section the footer refers to. */
  const navigateToName = useCallback(() => {
    setRoute('life');
    window.setTimeout(() => {
      const el = document.getElementById('the-name');
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 100);
    }, 80);
  }, []);

  /** Ask from anywhere: land on the Ask screen, then send. */
  const askFromAnywhere = useCallback(
    (question: string) => {
      if (!question.trim()) return;
      chat.warmNano();
      setRoute('ask');
      setAskTeaser('');
      window.scrollTo(0, 0);
      window.setTimeout(() => chat.ask(question), 60);
    },
    [chat],
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar onNavigate={navigate} theme={theme} onThemeChange={changeTheme} />

      {route === 'home' && (
        <Home
          onNavigate={navigate}
          askValue={askTeaser}
          onAskChange={setAskTeaser}
          onAsk={askFromAnywhere}
        />
      )}
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

      <Footer onNavigate={navigate} onNavigateToName={navigateToName} />
    </div>
  );
};

export default App;
