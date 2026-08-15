// src/routes/index.tsx
import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

import { AboutSection } from "@/components/home/AboutSection";
import FrontendSection from "@/components/home/FrontendSection";
import { ScrollLockedSectionController } from "@/components/home/ScrollLockedSection";
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
  systems: 4408,
  projects: 5900,
};

const SECTION_REVEAL_DELAY_SECONDS: Record<HomeSection, number> = {
  init: 1,
  about: 1,
  experience: 1,
  systems: 1,
  projects: 1,
};

const SECTION_SCROLL_DURATION_SECONDS = 3;

const SECTION_KEY_MAP: Record<string, HomeSection> = {
  "0": "init",
  "1": "about",
  "2": "experience",
  "3": "systems",
  "4": "projects",
};

function HomePage() {
  const location = useLocation();
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
            timelineLabel: `frontend-scene-${portfolioReturnStateRef.current.projectIndex}`,
          }
        : null,
    );

  //The project-return state is a one-shot instruction, not persistent homepage
  //state. We copy it into routeRestoreStateRef synchronously above, then remove
  //only our custom key from this history entry. TanStack's own history keys are
  //left untouched, so its normal scroll restoration remains free to restore the
  //actual window position on later homepage refreshes or history navigations.
  useEffect(() => {
    if (!portfolioReturnStateRef.current) {
      return;
    }

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
  }, []);

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
    </>
  );
}
