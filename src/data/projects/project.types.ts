export type ProjectScreenshot = {
  src: string | null;
  alt: string;
  objectPosition?: string;
  aspectRatio?: number;
};

export type RenderableProjectScreenshot = ProjectScreenshot & {
  src: string;
};

export type PortfolioProject = {
  title: string;
  description: string | null;
  contribution?: string | null;
  outcome?: string | null;
  technologies: readonly string[];
  screenshots?: readonly ProjectScreenshot[];
  liveUrl?: string | null;
  repositoryUrl?: string | null;
  detailsSlug?: string | null;
};

export type ProjectDomain = "frontend" | "backend";
