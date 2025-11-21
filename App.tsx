import React from 'react';
import GridBackground from './components/ui/GridBackground';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Speaking from './components/Speaking';
import Resources from './components/Resources';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen font-sans text-slate-200 antialiased selection:bg-brightBlue selection:text-white overflow-x-hidden">
      <GridBackground />
      <Navbar />
      
      <main>
        <Hero />
        <About />
        <Projects />
        <Speaking />
        <Resources />
      </main>
      
      <Footer />
    </div>
  );
};

export default App;