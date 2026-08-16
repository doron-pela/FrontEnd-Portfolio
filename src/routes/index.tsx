import { createFileRoute, useLocation } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { AboutSection } from "@/components/home/AboutSection";
import BackendSection from "@/components/home/BackendSection";
import ContactSection from "@/components/home/ContactSection";
import FrontendSection from "@/components/home/FrontendSection";
import { ScrollLockedSectionController } from "@/components/home/ScrollLockedSection";
import SkillsDrawer from "@/components/home/SkillsDrawer";
import Navbar from "@/components/Navbar";
import type { HomeSection } from "@/@types/home-section.types";
import type {
  RegisterScrollSection,
  ScrollSectionRestoreState,
  ScrollSectionRuntime,
} from "@/@types/scroll-locked-section.types";
import type { PortfolioReturnState } from "@/@types/router-history.types";

export const Route = createFileRoute("/")({
  component: HomePage,
});

//When the sections begin to show
const HOME_SECTIONS: Record<HomeSection, number> = {
  init: 0,
  about: 820,
  experience: 2550,
  systems: 4000,
  contact: 5900,
};

const SECTION_REVEAL_DELAY_SECONDS: Record<HomeSection, number> = {
  init: 1,
  about: 1,
  experience: 1,
  systems: 1,
  contact: 1,
};

const SECTION_SCROLL_DURATION_SECONDS = 3;

const SECTION_KEY_MAP: Record<string, HomeSection> = {
  "0": "init",
  "1": "about",
  "2": "experience",
  "3": "systems",
  "4": "contact",
};

const RESUME_DOWNLOAD_HREF = "/resume.pdf";
const HOME_RESUME_FADE_DISTANCE_PX = 320;

function ResumeDownloadButton() {
  const linkRef = useRef<HTMLAnchorElement | null>(null);

  //This is intentionally derived directly from the browser's real scrollY
  //rather than HomeSection state. "Home" here means exactly the visual base:
  //scrollY === 0. As soon as the user leaves that base, the button continuously
  //fades away without entering the ScrollLockedSection controller at all.
  useLayoutEffect(() => {
    const link = linkRef.current;

    if (!link) {
      return;
    }

    let frame = 0;

    const syncVisibility = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const progress = Math.min(
          Math.max(window.scrollY / HOME_RESUME_FADE_DISTANCE_PX, 0),
          1,
        );
        const opacity = 1 - progress;
        const translateY = progress * 10;
        const scale = 1 - progress * 0.025;
        const isInteractive = opacity > 0.08;

        link.style.opacity = opacity.toFixed(4);
        link.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        link.style.pointerEvents = isInteractive ? "auto" : "none";
        link.style.visibility = opacity <= 0.001 ? "hidden" : "visible";
        link.tabIndex = isInteractive ? 0 : -1;
        link.setAttribute("aria-hidden", isInteractive ? "false" : "true");
      });
    };

    syncVisibility();

    window.addEventListener("scroll", syncVisibility, {
      passive: true,
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", syncVisibility);
    };
  }, []);

  return (
    <a
      ref={linkRef}
      aria-label="Download Doron Pela resume"
      className="group pointer-events-none fixed bottom-[clamp(0.9rem,2.4vh,1.7rem)] left-[clamp(0.85rem,2.4vw,2.2rem)] z-[480] flex min-h-11 items-center gap-3 rounded-full border border-white/72 bg-white/58 px-[clamp(0.95rem,1.5vw,1.3rem)] py-3 font-mono text-[clamp(0.56rem,0.62vw,0.68rem)] font-bold uppercase tracking-[0.13em] text-[#171717]/78 opacity-0 shadow-[0_12px_34px_rgba(23,23,23,0.07)] backdrop-blur-[20px] transition-[background-color,box-shadow] duration-200 hover:bg-white/78 hover:shadow-[0_14px_38px_rgba(23,23,23,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/16 max-[680px]:bottom-3 max-[680px]:left-3 max-[680px]:min-h-10 max-[680px]:gap-2.5 max-[680px]:px-3.5 max-[680px]:py-2.5 max-[680px]:text-[0.53rem]"
      download="Doron-Pela-Resume.pdf"
      href={RESUME_DOWNLOAD_HREF}
    >
      <span>Download resume</span>

      <svg
        aria-hidden="true"
        className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-y-0.5"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 4v11M7.5 11.5 12 16l4.5-4.5M5 20h14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.65"
        />
      </svg>
    </a>
  );
}

function HomePage() {
  const location = useLocation();
  const [skillsDrawerOpen, setSkillsDrawerOpen] = useState(false);
  const sectionRuntimesRef = useRef(
    new Map<HomeSection, ScrollSectionRuntime<HomeSection>>(),
  );
  const programmaticScrollRef = useRef(false);

  //The project-detail link stores this on the HOME history entry before it
  //leaves. Returning with browser/TanStack history therefore gives this exact
  //entry its project index back without putting restoration data in the URL.
  const portfolioReturnStateRef = useRef<PortfolioReturnState | undefined>(
    location.state.portfolioReturn,
  );
  const routeRestoreStateRef =
    useRef<ScrollSectionRestoreState<HomeSection> | null>(
      portfolioReturnStateRef.current?.locked
        ? {
            section: portfolioReturnStateRef.current.section,
            timelineLabel: `${
              portfolioReturnStateRef.current.section === "systems"
                ? "backend"
                : "frontend"
            }-scene-${portfolioReturnStateRef.current.projectIndex}`,
          }
        : null,
    );

  //The project-return metadata must survive pure browser Back/Forward cycling.
  //If it is deleted immediately on the first return, a later Alt+Forward followed
  //by Alt+Back reaches the same HOME history entry without enough information to
  //reconstruct the locally locked Frontend scene. Keep the metadata on that exact
  //history entry until the user actually starts interacting with the homepage.
  //
  //This still solves the older stale-refresh problem: once the user scrolls,
  //touches, uses section-navigation keys, or clicks into the live homepage, the
  //return instruction is consumed from THIS home entry. A later refresh from a
  //different section therefore cannot incorrectly jump back to the old project.
  const clearPortfolioReturnState = useCallback(() => {
    const currentHistoryState = (window.history.state ?? {}) as Record<
      string,
      unknown
    >;

    if (!("portfolioReturn" in currentHistoryState)) {
      return;
    }

    const nextHistoryState = { ...currentHistoryState };

    delete nextHistoryState.portfolioReturn;

    window.history.replaceState(nextHistoryState, "", window.location.href);
    portfolioReturnStateRef.current = undefined;
  }, []);

  useEffect(() => {
    if (!portfolioReturnStateRef.current) {
      return;
    }

    function handleHomepagePointerDown(event: PointerEvent) {
      const target = event.target;

      //The loading screen is only a visual overlay. Clicking/tapping it must not
      //consume route-return metadata before the restored homepage is presented.
      if (target instanceof Element && target.closest(".spline-loader-shell")) {
        return;
      }

      clearPortfolioReturnState();
    }

    function handleHomepageWheel() {
      clearPortfolioReturnState();
    }

    function handleHomepageTouchStart() {
      clearPortfolioReturnState();
    }

    function handleHomepageKeyDown(event: KeyboardEvent) {
      //Alt+Left / Alt+Right are browser-history commands. They are specifically
      //the navigation path that needs this metadata to remain on the home entry.
      if (event.altKey || event.metaKey || event.ctrlKey) {
        return;
      }

      const consumesReturnState =
        event.key in SECTION_KEY_MAP ||
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "PageDown" ||
        event.key === "PageUp" ||
        event.key === " " ||
        event.key === "Home" ||
        event.key === "End";

      if (consumesReturnState) {
        clearPortfolioReturnState();
      }
    }

    window.addEventListener("pointerdown", handleHomepagePointerDown, {
      capture: true,
    });
    window.addEventListener("wheel", handleHomepageWheel, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchstart", handleHomepageTouchStart, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", handleHomepageKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handleHomepagePointerDown, {
        capture: true,
      });
      window.removeEventListener("wheel", handleHomepageWheel, {
        capture: true,
      });
      window.removeEventListener("touchstart", handleHomepageTouchStart, {
        capture: true,
      });
      window.removeEventListener("keydown", handleHomepageKeyDown);
    };
  }, [clearPortfolioReturnState]);

  //Called, this function is our actual effect in every section component
  const registerSection = useCallback<RegisterScrollSection<HomeSection>>(
    (runtime) => {
      sectionRuntimesRef.current.set(runtime.section, runtime);

      return () => {
        if (sectionRuntimesRef.current.get(runtime.section) === runtime) {
          sectionRuntimesRef.current.delete(runtime.section);
        }
      };
    },
    [],
  );

  return (
    <>
      {/*
        Navbar intentionally belongs to the homepage route, not __root.tsx.
        SplineScene mounts this entire <Outlet /> only after its loading screen
        has completed, so the navbar cannot appear during loading and enters the
        DOM at the exact same lifecycle boundary as the homepage controller and
        section overlays. Project-detail routes never mount this index route, so
        they naturally remain navbar-free and keep their dedicated Back control.
      */}
      <Navbar onSkillsOpen={() => setSkillsDrawerOpen(true)} />

      {/*
        This action belongs only to the homepage base composition. It is kept out
        of the scroll-section controller and derives its visibility directly from
        window.scrollY, fading away continuously as the visitor leaves scrollY 0.
      */}
      <ResumeDownloadButton />

      {/*
        Skills is an overlay owned by the homepage, not another HomeSection.
        Opening it therefore never changes global scrollY, ScrollTrigger state,
        route history, the active Spline camera, or the current manual section.
      */}
      <SkillsDrawer
        open={skillsDrawerOpen}
        onOpenChange={setSkillsDrawerOpen}
      />

      {/* <p className="max-w-[200px] absolute top-11/20 left-8/17 z-10 font-bold font-[white] text-lg">
        I am a fullstack engineer based in Ghana
      </p> */}

      <ScrollLockedSectionController<HomeSection>
        positions={HOME_SECTIONS}
        revealDelaySeconds={SECTION_REVEAL_DELAY_SECONDS}
        keyMap={SECTION_KEY_MAP}
        scrollDurationSeconds={SECTION_SCROLL_DURATION_SECONDS}
        runtimesRef={sectionRuntimesRef}
        programmaticScrollRef={programmaticScrollRef}
        restoreState={routeRestoreStateRef.current}
      />

      <AboutSection
        startY={HOME_SECTIONS.about}
        registerSection={registerSection}
        programmaticScrollRef={programmaticScrollRef}
      />

      <FrontendSection
        startY={HOME_SECTIONS.experience}
        registerSection={registerSection}
        programmaticScrollRef={programmaticScrollRef}
      />

      <BackendSection
        startY={HOME_SECTIONS.systems}
        registerSection={registerSection}
        programmaticScrollRef={programmaticScrollRef}
      />

      <ContactSection
        startY={HOME_SECTIONS.contact}
        registerSection={registerSection}
        programmaticScrollRef={programmaticScrollRef}
      />
    </>
  );
}
