// src/routes/experience/frontend/$projectSlug.tsx
import {
  createFileRoute,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

export const Route = createFileRoute("/experience/frontend/$projectSlug")({
  component: FrontendProjectDetailPage,
});

function getReadableProjectTitle(projectSlug: string) {
  return projectSlug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function FrontendProjectDetailPage() {
  const { projectSlug } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const projectTitle = getReadableProjectTitle(projectSlug);

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

  return (
    <main className="min-h-dvh bg-[#f4f2eb] px-[clamp(1.25rem,4vw,4rem)] py-[clamp(1.5rem,5vw,4.5rem)] text-[#171717]">
      <div className="mx-auto flex min-h-[calc(100dvh-clamp(3rem,10vw,9rem))] w-full max-w-[78rem] flex-col">
        <button
          className="w-fit rounded-full border border-[#171717]/12 bg-white/20 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[#171717]/68 transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-white/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/16"
          onClick={handleBackToPortfolio}
          type="button"
        >
          ← Back to portfolio
        </button>

        <section className="my-auto max-w-[54rem] py-14">
          <p className="mb-4 font-mono text-[clamp(0.64rem,0.8vw,0.76rem)] uppercase tracking-[0.16em] text-[#171717]/42">
            Frontend project
          </p>

          <h1 className="font-sans text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[0.86] tracking-[-0.07em]">
            {projectTitle}
          </h1>

          <div className="mt-[clamp(1.5rem,3vw,2.5rem)] h-px w-full bg-[#171717]/14" />

          <p className="mt-[clamp(1.4rem,2.5vw,2rem)] max-w-[38rem] font-[Garamond,_'Times_New_Roman',_serif] text-[clamp(1.2rem,1.8vw,1.55rem)] leading-[1.55] text-[#171717]/62">
            This is the dedicated project-detail route. The fuller project
            case-study content can be built here without mounting the Spline
            scene or changing the existing scroll-driven portfolio experience.
          </p>
        </section>
      </div>
    </main>
  );
}
