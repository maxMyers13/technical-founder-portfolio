import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-[#000318] border-y border-slate-900">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-xs font-mono text-brightBlue mb-4 tracking-widest uppercase">
          // About_Me
        </h2>
        <div className="space-y-6 text-slate-400 text-lg leading-relaxed font-light text-left">
          <p>
            I've always believed education is about clarity. Growing up, nothing frustrated me more than unclear instructions, so I've made a habit of building things that feel simple no matter how complex they are underneath.
          </p>
          <p>
            I spent the last few years on Microsoft Edge's Web Platform team, shipping browser APIs that developers actually want to use. The Find on Page API for WebView2 is the highlight, picked up by Epic, DuckDuckGo, GitHub Desktop, and the Chromium project. I also worked on Window Controls Overlay and co-built PWA Hub, which reaches 330M+ users.
          </p>
          <p>
            I'm now full-time on LILO, a coding-education platform that runs Python, Java, and C/C++/Rust client-side in the browser via WebAssembly, with a local LLM doing the tutoring. Bootstrapped to $25,800 with 0% churn and 313 users, and we're piloting in CS classrooms at UMD this fall.
          </p>
          <p>
            The work I'm proudest of bridges complex technology and how people actually learn. That's the thread through all of it.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
