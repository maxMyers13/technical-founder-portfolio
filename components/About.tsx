import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-[#000318] border-y border-slate-900">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-xs font-mono text-brightBlue mb-4 tracking-widest uppercase">
          // About_Me
        </h2>
        <h3 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Bridging the gap between <br className="hidden md:block"/> silicon and sentiment.
        </h3>
        <div className="space-y-6 text-slate-400 text-lg leading-relaxed font-light">
          <p>
            I'm an engineer who obsesses over the "how" as much as the "what". 
            My background isn't just in writing code—it's in architecting systems that survive the chaos of scale. 
            From optimizing V8 garbage collection cycles to designing distributed consensus algorithms, 
            I find joy in the invisible layers that power the web.
          </p>
          <p>
            Currently, I'm focused on <span className="text-white font-medium">WebAssembly</span> as the next frontier 
            of cloud computing, building tools that let developers run untrusted code safely at the edge.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;