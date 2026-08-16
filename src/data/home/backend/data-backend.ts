import type { PortfolioProject } from "@/data/projects/project.types";

//This is the single source of truth for every backend project. The homepage
//story and the /experience/backend/$projectSlug detail route both consume this
//same array, so editing project copy, links, technologies or screenshots here
//updates every presentation of that project.
export const BACKEND_PROJECTS: readonly PortfolioProject[] = [
  {
    title: "OWD Web Platform",
    description:
      "A multi-surface company platform spanning public content, administration, permissions, editorial workflows and reusable product experiences.",
    contribution:
      "I built and integrated frontend systems across authentication, data-heavy admin workflows, responsive public pages and reusable content architecture.",
    outcome:
      "A coherent frontend that can grow without every new page becoming a one-off implementation.",
    technologies: ["React", "TypeScript", "TanStack", "Motion"],
    liveUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiGJLht7PMLiAUqQDL7ZgMtRelOBVbaXEYNLte-qqB2w&s=10",
    repositoryUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiGJLht7PMLiAUqQDL7ZgMtRelOBVbaXEYNLte-qqB2w&s=10",
    detailsSlug: "owd-web-platform",
    screenshots: [
      {
        src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiGJLht7PMLiAUqQDL7ZgMtRelOBVbaXEYNLte-qqB2w&s=10",
        alt: "OWD platform primary interface",
      },
      {
        src: "https://wallpaperaccess.com/full/630926.jpg",
        alt: "OWD platform secondary interface",
      },
      {
        src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZbtobzF1g7XjTcnL1fp4YyYGwebCCIK57-ASmI6J1PKugQDbxKhCuKMw&s=10",
        alt: "OWD platform supporting interface",
      },
      {
        src: "https://images.unsplash.com/photo-1722944982712-62e216333a31?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZXBpYyUyMHdhbGxwYXBlcnxlbnwwfHwwfHx8MA%3D%3D",
        alt: "OWD platform supporting interface",
      },
      {
        src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2Dr85yiVhJYE298y-uDnWIy0MB3dZzXV1gHNMHBXVyfOaOgaMy8c1RB_p&s=10",
        alt: "OWD platform supporting interface",
      },
      {
        src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4AdSp_ZkorulQ42jxu1YpWbn5Eqki-sifCmhKcVZF0A&s=10",
        alt: "OWD platform supporting interface",
      },
    ],
  },
  {
    title: "Spline Portfolio",
    description:
      "A portfolio where the 3D Spline scene remains the visual stage while browser scroll becomes a timeline through the site's content.",
    contribution:
      "I engineered the scroll-lock controller, GSAP section timelines, direction-aware handoffs and programmatic navigation around the persistent 3D scene.",
    outcome:
      "A single continuous environment instead of disconnected sections layered over an unrelated 3D background.",
    technologies: ["GSAP", "Spline", "ScrollTrigger", "React"],
    liveUrl: null,
    repositoryUrl: null,
    detailsSlug: "spline-portfolio",
    screenshots: [
      {
        src: null,
        alt: "Spline portfolio hero sequence",
        aspectRatio: 16 / 9,
      },
      {
        src: null,
        alt: "Spline portfolio scroll sequence",
        aspectRatio: 4 / 3,
      },
    ],
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
  return BACKEND_PROJECTS.find((project) => project.detailsSlug === projectSlug);
}
