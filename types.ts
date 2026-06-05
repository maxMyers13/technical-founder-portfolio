export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  category: 'Browser Platform' | 'Product' | 'Talks/Writing';
  image: string;
  link: string;
  linkText: string;
}

export interface SpeakingLink {
  url: string;
  label: string;
}

export interface SpeakingEngagement {
  id: string;
  event: string;
  title: string;
  description: string;
  primaryLink: SpeakingLink;
  secondaryLink?: SpeakingLink;
  previewImage?: string;
  secondaryPreviewImage?: string;
  featured?: boolean;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'Article' | 'GitBook' | 'SOP' | 'Cookbook';
  link: string;
}
