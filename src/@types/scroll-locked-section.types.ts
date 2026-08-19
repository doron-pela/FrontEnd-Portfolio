// src/@types/scroll-locked-section.types.ts
import type { RefObject } from "react";

import type { HomeSection } from "@/@types/home-section.types";

export type LockDirection = "forward" | "backward";

//Reminder for myself: Generic just means the parameterized type that will be passed <something> is used inside this type definition.
//The = string means default it to string type
//Each section component in the homepage must construct its runtime object and set (register) it as the global runtime ref .current in its useEffect.
export type ScrollSectionRuntime<Section extends string = string> = {
  section: Section;
  startY: number;
  revealedProgress: number; //Default revelation point along the section's timeline that we should get to after a programmatic scroll.
  timelineRef: RefObject<gsap.core.Timeline | null>;
  progressRef: RefObject<number>;
  lockedRef: RefObject<boolean>;
  releasingRef: RefObject<boolean>;
  lockYRef: RefObject<number | null>;
  snapRef: RefObject<boolean>;
  releasedDirectionRef: RefObject<LockDirection | null>;
  getPxDuration: () => number; //Full pixel length of the section
  getLockY: () => number;
  localProgressTweenDuration: number;
};

//A route return can rebuild an already-known manual section instantly. A label
//is preferred because it stays meaningful when the timeline duration changes;
//progress remains available for generic/manual restoration cases.
export type ScrollSectionRestoreState<Section extends string = string> = {
  section: Section;
  timelineLabel?: string;
  progress?: number;
};

//Clean up function for each section's useEffect (Cleanup function in useEff.. must always return void)
export type RegisterScrollSection<Section extends string = string> = (
  runtime: ScrollSectionRuntime<Section>,
) => () => void;

//Global null-returning component (no markup) instantiated in the index.tsx to manage global scroll control and timeline/animation/runtime execution handling for events.
export type ScrollLockedSectionControllerProps<Section extends string> = {
  positions: Record<Section, number>;
  revealDelaySeconds: Record<Section, number>;
  keyMap: Record<string, Section>;
  scrollDurationSeconds: number;
  runtimesRef: RefObject<Map<Section, ScrollSectionRuntime<Section>>>; //Record<> and Map<> are the same except that record takes <strings|nums|symbols as key, v>, while map takes <anything as key, v>
  //RuntimesRef will globally hold the registered runtime for any of the sections that register
  programmaticScrollRef: RefObject<boolean>;
  onCurrentSectionChange?: (section: Section) => void;
  restoreState?: ScrollSectionRestoreState<Section> | null;
};

//Passed as props to each section in homepage
export type ManualScrollSectionProps = {
  startY: number;
  registerSection: RegisterScrollSection<HomeSection>;
  programmaticScrollRef: RefObject<boolean>;
};
