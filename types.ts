export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  category: 'Browser Platform' | 'Product';
  image: string;
  link: string;
  linkText: string;
}

export interface SpeakingEngagement {
  id: string;
  event: string;
  title: string;
  description: string;
  recordingUrl: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'Article' | 'GitBook' | 'SOP' | 'Cookbook';
  link: string;
}
