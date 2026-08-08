import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef } from "react";

import { AboutSection } from "@/components/home/AboutSection";
import FrontendSection from "@/components/home/FrontendSection";
import { ScrollLockedSectionController } from "@/components/home/ScrollLockedSection";
import type { HomeSection } from "@/@types/home-section.types";
import type {
  RegisterScrollSection,
  ScrollSectionRuntime,
} from "@/@types/scroll-locked-section.types";

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
  const sectionRuntimesRef = useRef(
    new Map<HomeSection, ScrollSectionRuntime<HomeSection>>(),
  );
  const programmaticScrollRef = useRef(false);

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
      <ScrollLockedSectionController<HomeSection>
        positions={HOME_SECTIONS}
        revealDelaySeconds={SECTION_REVEAL_DELAY_SECONDS}
        keyMap={SECTION_KEY_MAP}
        scrollDurationSeconds={SECTION_SCROLL_DURATION_SECONDS}
        runtimesRef={sectionRuntimesRef}
        programmaticScrollRef={programmaticScrollRef}
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
