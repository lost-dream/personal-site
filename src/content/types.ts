export type MediaAsset = {
  src: string;
  alt: string;
  poster?: string;
};

export type ContactItem = {
  label: string;
  value: string;
  href?: string;
};

export type ProjectItem = {
  title: string;
  period: string;
  teamGoal: string;
  role: string;
  action: string;
  result: string;
  reflection: string;
  aspect: 'wide' | 'portrait' | 'square';
  media?: MediaAsset;
};

export type StrengthItem = {
  title: string;
  evidence: string;
  relatedExperience: string;
};

export type HobbyItem = {
  title: string;
  note: string;
  aspect: 'wide' | 'portrait' | 'square';
  media?: MediaAsset;
};

export type ProfileContent = {
  identity: {
    name: string;
    role: string;
    summary: string;
    school: string;
    major: string;
    grade: string;
    target: string;
    portrait?: MediaAsset;
  };
  stats: Array<{ label: string; value: string }>;
  experiences: Array<{ period: string; title: string; description: string }>;
  projects: ProjectItem[];
  strengths: StrengthItem[];
  hobbies: HobbyItem[];
  contacts: ContactItem[];
  resume?: MediaAsset;
  heroVideo?: MediaAsset;
};
