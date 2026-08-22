import { useNavigate, useRouter } from "@tanstack/react-router";

import ProjectDetailMasonry from "@/components/projects/ProjectDetailMasonry";
import type {
  PortfolioProject,
  ProjectDomain,
} from "@/data/projects/project.types";
import { hasScreenshotSource } from "@/data/projects/project.utils";

type ProjectDetailPageProps = {
  domain: ProjectDomain;
  eyebrow: string;
  project: PortfolioProject | undefined;
  requestedSlug: string;
};

function ArrowUpRightIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function getReadableProjectTitle(projectSlug: string) {
  return projectSlug
    .split("-")
    .filter(Boolean) //false, null, undefined, "", NaN, 0.. all falsy values. Same as writing .filter(projectSlug)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ProjectDetailPage({
  // domain,
  eyebrow,
  project,
  requestedSlug,
}: ProjectDetailPageProps) {
  const navigate = useNavigate();
  const router = useRouter();

  function handleBackToPortfolio() {
    //A real history Back returns to the SAME home history entry. That lets
    //TanStack's scrollRestoration restore its cached window position and lets
    //our controller read the project/lock metadata stored on that same entry.
    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    //Direct visits/new tabs have no in-app history entry to return to.
    void navigate({
      to: "/",
    });
  }

  const pageBackground = "black";
  const projectTitle = project?.title ?? getReadableProjectTitle(requestedSlug);

  if (!project) {
    return (
      <main
        className="min-h-dvh px-[clamp(1.25rem,4vw,4rem)] py-[clamp(1.5rem,5vw,4.5rem)] text-white"
        style={{ backgroundColor: pageBackground }}
      >
        <div className="mx-auto flex min-h-[calc(100dvh-clamp(3rem,10vw,9rem))] w-full max-w-[92rem] flex-col">
          <button
            className="cursor-pointer w-fit rounded-full border border-white/12 bg-white/28 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-white/68 transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/16"
            onClick={handleBackToPortfolio}
            type="button"
          >
            ← Back to portfolio
          </button>

          <section className="my-auto max-w-[58rem] py-16">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-white/42">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-sans text-[clamp(3rem,8vw,7rem)] font-semibold leading-[0.86] tracking-[-0.07em]">
              {projectTitle}
            </h1>
            <p className="mt-8 max-w-[42rem] font-[Garamond,_'Times_New_Roman',_serif] text-[clamp(1.2rem,1.8vw,1.55rem)] leading-[1.55] text-white/62">
              This project does not currently have a matching data entry. Add or
              correct its detailsSlug in the centralized project data source.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const projectDetails = [
    { label: "My work", value: project.contribution },
    { label: "Outcome", value: project.outcome },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value?.trim()),
  );

  //Project screenshots are optional in the centralized project model. Normalize
  //them once here so the masonry always receives a concrete array, and discard
  //placeholder entries whose src is null before rendering the detail gallery.
  const screenshots = (project.screenshots ?? []).filter(hasScreenshotSource);
  const hasDestinations = Boolean(project.liveUrl || project.repositoryUrl);

  return (
    <main
      className="min-h-dvh overflow-x-hidden text-white"
      style={{ backgroundColor: pageBackground }}
    >
      <div className="sticky top-0 z-50 border-b border-white/35 px-[clamp(1rem,3.2vw,3rem)] py-3 backdrop-blur-[18px]">
        <div className="mx-auto flex w-full max-w-[108rem] items-center justify-between gap-4">
          <button
            className="cursor-pointer rounded-full border border-white/12 bg-white/35 px-4 py-2 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/68 transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-white/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/16"
            onClick={handleBackToPortfolio}
            type="button"
          >
            ← Back to portfolio
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[108rem] px-[clamp(1.15rem,4vw,4.5rem)] pb-[clamp(5rem,10vw,10rem)] pt-[clamp(3rem,7vw,7rem)]">
        <header className="grid items-end gap-[clamp(2rem,5vw,6rem)] border-b border-white/13 pb-[clamp(2rem,5vw,5rem)] min-[900px]:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
          <div>
            <p className="font-mono text-[clamp(0.62rem,0.72vw,0.8rem)] font-semibold uppercase tracking-[0.17em] text-white/42">
              {eyebrow}
            </p>

            <h1 className="mt-[clamp(0.8rem,1.6vw,1.4rem)] max-w-[14ch] font-sans text-[clamp(3.8rem,9vw,9.5rem)] font-semibold leading-[0.8] tracking-[-0.085em]">
              {project.title}
            </h1>
          </div>

          <div className="min-[900px]:pb-2">
            {project.description ? (
              <p className="max-w-[34rem] font-[Garamond,_'Times_New_Roman',_serif] text-[clamp(1.18rem,1.55vw,1.55rem)] leading-[1.52] tracking-[-0.018em] text-white/64">
                {project.description}
              </p>
            ) : null}

            {hasDestinations ? (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {project.liveUrl ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.11em] text-black transition-transform duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/22"
                    href={project.liveUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Visit live site
                    <ArrowUpRightIcon />
                  </a>
                ) : null}

                {project.repositoryUrl ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/26 px-4 py-2.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.11em] text-white/68 transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-white/52 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/16"
                    href={project.repositoryUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Repository
                    <ArrowUpRightIcon />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <section className="grid gap-x-[clamp(2rem,5vw,5rem)] gap-y-8 py-[clamp(2.5rem,5vw,5rem)] min-[800px]:grid-cols-[minmax(13rem,0.42fr)_minmax(0,1.58fr)]">
          <div>
            <p className="font-mono text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-white/38">
              Technologies
            </p>

            <p className="mt-3 max-w-[30rem] font-mono text-[clamp(0.78rem,0.9vw,0.95rem)] leading-[1.7] tracking-[0.025em] text-white/68">
              {project.technologies?.join(", ")}
            </p>
          </div>

          {projectDetails.length > 0 ? (
            <div className="grid gap-0 min-[980px]:grid-cols-3">
              {projectDetails.map((detail, index) => (
                <article
                  className={`border-white/11 py-5 min-[980px]:px-[clamp(1.25rem,2vw,2rem)] min-[980px]:py-0 ${
                    index === 0
                      ? "border-t min-[980px]:border-l-0 min-[980px]:border-t-0"
                      : "border-t min-[980px]:border-l min-[980px]:border-t-0"
                  }`}
                  key={detail.label}
                >
                  <p className="font-mono text-[0.56rem] font-semibold uppercase tracking-[0.15em] text-white/38">
                    {detail.label}
                  </p>
                  <p className="mt-3 font-[Garamond,_'Times_New_Roman',_serif] text-[clamp(1.05rem,1.3vw,1.3rem)] leading-[1.55] text-white/62">
                    {detail.value}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <ProjectDetailMasonry
          projectTitle={project.title}
          screenshots={screenshots}
        />

        <footer className="mt-[clamp(4rem,9vw,9rem)] border-t border-white/12 pt-7">
          <button
            className="cursor-pointer rounded-full border border-white/13 bg-white/25 px-4 py-2.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/62 transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-white/52 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/16"
            onClick={handleBackToPortfolio}
            type="button"
          >
            ← Back to portfolio
          </button>
        </footer>
      </div>
    </main>
  );
}
