export type ImageResponse = {
  b64_json: string;
  timings?: { inference: number };
};

export type ContentBlock =
  | { type: 'text'; content: string; generating: boolean; context?: string }
  | { type: 'image'; content: ImageResponse | null; generating: boolean; prompt: string }
  | { type: 'video'; content: string; generating: boolean };

export type PageContent = {
  blocks: ContentBlock[];
};

export type PageProps = {
  index: number;
  page: PageContent;
  setPageContent: (content: PageContent) => void;
  userAPIKey: string;
  iterativeMode: boolean;
  isGeneratingDocx: boolean;
  storyPrompt: string;
  imageCount: number;
  onDeletePage: () => void;
  onAddVideo: (videoUrl: string) => void;
};

export type LanguageVersion = {
  language: string;
  pages: PageContent[];
};

export type ComicPage = {
  panels: {
    type: 'image' | 'text';
    content: string;
    size: 'small' | 'medium' | 'large';
    speechBubble: boolean;
  }[];
};
