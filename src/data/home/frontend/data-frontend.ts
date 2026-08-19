import type { PortfolioProject } from "@/data/projects/project.types";
import { getProjectScreenshots } from "@/utils/home-asset-registry";

// const mediaQuery = window.matchMedia("(max-width: 399px)");

// const padding = mediaQuery.matches
//   ? ""
//   : "ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ"; ;

//This is the single source of truth for every frontend project's metadata. The
//homepage story and the /experience/frontend/$projectSlug detail route both
//consume this same array. Screenshot files themselves are auto-discovered from
//src/assets/home/projects/frontend/<project-folder>/ so adding/removing local
//images updates every presentation without maintaining screenshot imports.
export const FRONTEND_PROJECTS: readonly PortfolioProject[] = [
  {
    title: "Cybervylle",
    description:
      "A game discovery platform built for finding what’s worth playing next. Explore new and upcoming releases, filter by platform and date, compare ratings and Metacritic reviews, see where each game is available, and save your favorites",
    outcome: `Gave gaming lounges and arcade communities a better way to surface relevant titles to players, compare reception across games, and quickly identify what was available on different platforms before adding something new to the rotation`,
    technologies: ["React", "TanStack Query", "RAWG API", "Axios", "Motion "],
    liveUrl: "https://cybervylle.vercel.app/",
    repositoryUrl: "https://github.com/doron-pela/Cyberville",
    detailsSlug: "cybervylle",
    screenshots: getProjectScreenshots("frontend", "cybervylle", "Cybervylle"),
  },
  {
    title: "Ashesi-CV-Generator",
    description:
      "A web-based CV builder for Ashesi University students that turns form entries into a consistently formatted CV ready to download.",
    outcome:
      "Helped my Alma mater's Career Services center to make CV formatting faster, simpler and consistent without repeatedly editing document templates.",
    technologies: [],
    liveUrl: "https://ashesi-cv-generator.vercel.app",
    repositoryUrl: null,
    detailsSlug: "ashesi-cv-generator",
    screenshots: getProjectScreenshots(
      "frontend",
      "ashesi-cv-generator",
      "Ashesi CV Generator",
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
  //   detailsSlug: "homepage-visual-cms",
  //   screenshots: getProjectScreenshots(
  //     "frontend",
  //     "homepage-visual-cms",
  //     "Homepage Visual CMS",
  //   ),
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
  //   detailsSlug: "products-case-studies",
  //   screenshots: getProjectScreenshots(
  //     "frontend",
  //     "products-case-studies",
  //     "Products + Case Studies",
  //   ),
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
  //   detailsSlug: "events-community",
  //   screenshots: getProjectScreenshots(
  //     "frontend",
  //     "events-community",
  //     "Events + Community",
  //   ),
  // },
] as const;

export const FRONTEND_DATA = {
  ariaLabel: "Frontend Engineering",
  titleLines: ["Front", "End"],
  intro: "Selected frontend proof of work.",
  detailEyebrow: "Frontend project",
  projects: FRONTEND_PROJECTS,
} as const;

export type FrontendProject = PortfolioProject;

export function getFrontendProjectBySlug(projectSlug: string) {
  return FRONTEND_PROJECTS.find(
    (project) => project.detailsSlug === projectSlug,
  );
}
