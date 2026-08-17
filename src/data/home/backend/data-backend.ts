import type { PortfolioProject } from "@/data/projects/project.types";
import { getProjectScreenshotsWithFallback } from "@/utils/home-asset-registry";

//This is the single source of truth for every backend project's metadata. The
//homepage story and the /experience/backend/$projectSlug detail route both
//consume this same array. Screenshot files themselves are auto-discovered from
//src/assets/home/projects/backend/<project-folder>/ so adding/removing local
//images updates every presentation without maintaining screenshot imports.
export const BACKEND_PROJECTS: readonly PortfolioProject[] = [
  {
    title: "Xceed365HR",
    description:
      "Talpro Software's unified, AI-powered HR and payroll platform for African enterprises, spanning core HR, payroll, hiring, learning, talent and agentic workflows.",
    contribution:
      "I build C# / ASP.NET Core API endpoints and backend workflows, and contribute Python RAG/agent systems for retrieval, grounding and evaluation.",
    outcome:
      "Supports HR and payroll operations for 70,000+ employees across enterprise customers.",
    technologies: [
      "C#",
      "ASP.NET Core",
      "REST APIs",
      "Python",
      "RAG",
      "Vector Retrieval",
    ],
    liveUrl: "https://www.xceed365hr.com/",
    repositoryUrl: null,
    detailsSlug: "xceed365hr",
    screenshots: getProjectScreenshotsWithFallback(
      "backend",
      "xceed365hr",
      "Xceed365HR",
      [],
    ),
  },
  // {
  //   title: "Homepage Visual CMS",
  //   description:
  //     "A visual homepage editing experience where structured content remains type-safe while the administrator sees changes in the actual page composition.",
  //   contribution:
  //     "I worked on the editor architecture, live preview behavior, reusable section configuration and the bridge between structured values and presentation.",
  //   outcome:
  //     "Content editing feels visual without turning the production homepage into an unrestricted page builder.",
  //   technologies: ["React", "Puck", "TipTap", "TypeScript"],
  //   liveUrl: null,
  //   repositoryUrl: null,
  //   screenshots: [
  //     {
  //       src: null,
  //       alt: "Homepage visual editor canvas",
  //       aspectRatio: 16 / 10,
  //     },
  //     {
  //       src: null,
  //       alt: "Homepage visual editor controls",
  //       aspectRatio: 3 / 4,
  //     },
  //   ],
  // },
  // {
  //   title: "Products + Case Studies",
  //   description:
  //     "Reusable product and case-study experiences driven by structured API data instead of duplicated presentation content.",
  //   contribution:
  //     "I translated backend contracts into client models, reusable cards, detail screens, media treatment and testimonial mappings while preserving the designed UI.",
  //   outcome:
  //     "One source of truth can now power multiple polished client experiences and their administration surfaces.",
  //   technologies: ["React", "API", "Rich Text", "Schema"],
  //   liveUrl: null,
  //   repositoryUrl: null,
  //   screenshots: [
  //     {
  //       src: null,
  //       alt: "Product and case studies index",
  //       aspectRatio: 16 / 10,
  //     },
  //     {
  //       src: null,
  //       alt: "Product and case study detail",
  //       aspectRatio: 4 / 5,
  //     },
  //   ],
  // },
  // {
  //   title: "Events + Community",
  //   description:
  //     "Interactive event and publishing surfaces that combine discovery, registration intent, comments, reactions, filtering and rich content.",
  //   contribution:
  //     "I integrated the frontend data flows, optimistic interaction patterns, prefetch strategy, auth-aware routing and responsive presentation.",
  //   outcome:
  //     "The public experience remains immediate even when the workflows behind it involve authentication and server state.",
  //   technologies: ["React Query", "Routing", "Optimistic UI", "Prefetch"],
  //   liveUrl: null,
  //   repositoryUrl: null,
  //   screenshots: [
  //     {
  //       src: null,
  //       alt: "Events discovery interface",
  //       aspectRatio: 16 / 10,
  //     },
  //     {
  //       src: null,
  //       alt: "Community discussion interface",
  //       aspectRatio: 3 / 4,
  //     },
  //   ],
  // },
] as const;

export const BACKEND_DATA = {
  ariaLabel: "Backend Engineering",
  titleLines: ["Back", "End"],
  intro: "Selected backend proof of work.",
  detailEyebrow: "Backend project",
  projects: BACKEND_PROJECTS,
} as const;

export type BackendProject = PortfolioProject;

export function getBackendProjectBySlug(projectSlug: string) {
  return BACKEND_PROJECTS.find(
    (project) => project.detailsSlug === projectSlug,
  );
}
