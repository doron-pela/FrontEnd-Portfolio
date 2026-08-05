import type gsap from "gsap";
import type { RefObject } from "react";

import type { HomeSection } from "@/@types/home-section.types";

export type LockDirection = "forward" | "backward";

export type ScrollSectionRuntime<Section extends string = string> = {
  section: Section;
  startY: number;
  revealedProgress: number;
  timelineRef: RefObject<gsap.core.Timeline | null>;
  progressRef: RefObject<number>;
  lockedRef: RefObject<boolean>;
  releasingRef: RefObject<boolean>;
  lockYRef: RefObject<number | null>;
  snapRef: RefObject<boolean>;
  releasedDirectionRef: RefObject<LockDirection | null>;
  getPxDuration: () => number;
  getLockY: () => number;
  localProgressTweenDuration: number;
};

export type RegisterScrollSection<Section extends string = string> = (
  runtime: ScrollSectionRuntime<Section>,
) => () => void;

export type ScrollLockedSectionControllerProps<Section extends string> = {
  positions: Record<Section, number>;
  revealDelaySeconds: Record<Section, number>;
  keyMap: Record<string, Section>;
  scrollDurationSeconds: number;
  runtimesRef: RefObject<Map<Section, ScrollSectionRuntime<Section>>>;
  programmaticScrollRef: RefObject<boolean>;
};

export type ManualScrollSectionProps = {
  startY: number;
  registerSection: RegisterScrollSection<HomeSection>;
  programmaticScrollRef: RefObject<boolean>;
};
