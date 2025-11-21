export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  category: 'Infrastructure' | 'AI' | 'WebAssembly' | 'Product';
  image: string;
  link: string;
}

export interface SpeakingEngagement {
  id: string;
  event: string;
  title: string;
  date: string;
  type: 'Keynote' | 'Workshop' | 'Panel';
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'Article' | 'GitBook' | 'SOP' | 'Cookbook';
  link: string;
}