import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

import type { HomeSection } from "@/@types/home-section.types";
import type {
  ManualScrollSectionProps,
  ScrollSectionRuntime,
} from "@/@types/scroll-locked-section.types";
import ProjectScreenshotGallery from "@/components/projects/ScreenshotGallery";
import {
  BACKEND_DATA,
  BACKEND_PROJECTS,
} from "@/data/home/backend/data-backend";
import { hasScreenshotSource } from "@/components/projects/screenshot-gallery.utils";
import { setScrollSectionProgressImmediately } from "@/utils/scroll-locked-section.utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const BACKEND_GSAP_HMR_REVISION = import.meta.hot
  ? (import.meta.hot.data.backendGsapRevision =
      (import.meta.hot.data.backendGsapRevision ?? 0) + 1)
  : 0;

const BACKEND_REVEAL_SCROLL_DISTANCE = 520;

//This is only the safe pre-timeline fallback. Once the timeline exists, the
//runtime handoff is calculated from the exact "locked-story" label so pressing
//2 and organic scrolling both stop with project 01 fully assembled.
const BACKEND_REVEALED_PROGRESS = 0.2;

const BACKEND_LOCAL_PROGRESS_TWEEN_DURATION = 0.3;
const BACKEND_LOCKED_STORY_TIME = 1.42;

//Once project 01 is fully assembled, every project owns one equal virtual
//timeline slot. The first 0.4s of each slot is the fully readable card hold;
//the remaining 0.76s is either the transition into the next assembled card or,
//for the final project, the section outro. Keeping these values explicit makes
//the physical scroll allocation mathematically uniform across project count.
const BACKEND_SCENE_HOLD_TIME = 0.4;
const BACKEND_SCENE_TRANSITION_TIME = 0.76;
const BACKEND_SCENE_SCROLL_SLOT_TIME =
  BACKEND_SCENE_HOLD_TIME + BACKEND_SCENE_TRANSITION_TIME;

//The progress line always stops just before the existing project dots. On wide
//desktop it is vertical; at <=1180px it lies horizontally on the bottom bed of
//the composition immediately to the right of the unchanged horizontal dot row.
const BACKEND_TIMELINE_NAV_CLEARANCE_PX = 6;
const BACKEND_TIMELINE_HORIZONTAL_THICKNESS_PX = 2;

//Browser page zoom changes window.devicePixelRatio in Chromium/Firefox. We
//capture the DPR from the first mounted version of this section as the 1x
//reference and apply the inverse ratio only to textual UI layers. This keeps
//the existing viewport media queries fully in charge of responsive layout
//while preventing Ctrl +/- from making project copy and its spacing balloon
//or collapse independently of the intended composition.
const BACKEND_BROWSER_ZOOM_MIN_COMPENSATION = 0.48;
const BACKEND_BROWSER_ZOOM_MAX_COMPENSATION = 2.1;

type BackendZoomAwareWindow = Window & {
  __backendSectionBaseDevicePixelRatio?: number;
};

function getBackendBaseDevicePixelRatio() {
  if (typeof window === "undefined") {
    return 1;
  }

  const zoomAwareWindow = window as BackendZoomAwareWindow;

  if (!zoomAwareWindow.__backendSectionBaseDevicePixelRatio) {
    zoomAwareWindow.__backendSectionBaseDevicePixelRatio =
      window.devicePixelRatio || 1;
  }

  return zoomAwareWindow.__backendSectionBaseDevicePixelRatio;
}

function rememberBackendProjectReturnState(projectIndex: number) {
  //TanStack's `state` option belongs to the DESTINATION history entry. For a
  //true Back restoration we need the metadata on the CURRENT home entry, so
  //update only that browser-history state while preserving TanStack's own keys.
  const currentHistoryState = window.history.state ?? {};

  window.history.replaceState(
    {
      ...currentHistoryState,
      portfolioReturn: {
        section: "systems",
        projectIndex,
        locked: true,
      },
    },
    "",
    window.location.href,
  );
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[clamp(0.95rem,1vw,1.08rem)] shrink-0"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.014-1.7-2.782.604-3.369-1.34-3.369-1.34-.455-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.003.071 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.091-.646.349-1.087.635-1.337-2.221-.253-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.03-2.683-.103-.253-.447-1.269.098-2.645 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.202 2.392.099 2.645.64.699 1.029 1.592 1.029 2.683 0 3.842-2.337 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.337-.012 2.415-.012 2.744 0 .267.18.578.688.48A10.004 10.004 0 0 0 22 12c0-5.523-4.477-10-10-10Z" />
    </svg>
  );
}

const GRID_COLUMNS = Array.from({ length: 11 });
const GRID_ROWS = Array.from({ length: 7 });

export default function BackendSection({
  startY,
  registerSection,
  programmaticScrollRef,
}: ManualScrollSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const timelineVerticalRailRef = useRef<HTMLDivElement | null>(null);
  const timelineHorizontalRailRef = useRef<HTMLDivElement | null>(null);

  const backendTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const backendProgressRef = useRef(BACKEND_REVEALED_PROGRESS);
  const backendLockedRef = useRef(false);
  const backendReleasingRef = useRef(false);
  const backendLockYRef = useRef<number | null>(null);
  const backendSnapRef = useRef(false);
  const backendReleasedDirectionRef = useRef<"forward" | "backward" | null>(
    null,
  );

  //Backend scroll distance is derived from the projects that actually exist.
  //The controller advances normalized timeline progress by deltaY / distance.
  //Because local ownership begins at revealedProgress rather than at 0, divide
  //by the remaining normalized range so the LOCKED portion itself receives
  //exactly one viewport-height of physical scroll per rendered project.
  //Combined with the equal virtual scene slots below, every card therefore gets
  //the same physical scroll allocation regardless of how many projects exist.
  const getBackendPxDuration = useCallback(() => {
    const revealedProgress =
      runtimeRef.current?.revealedProgress ?? BACKEND_REVEALED_PROGRESS;
    const lockedProgressRange = Math.max(1 - revealedProgress, 0.0001);

    return (
      (window.innerHeight * 0.5 * BACKEND_PROJECTS.length) / lockedProgressRange
    );
  }, []);

  const getBackendLockY = useCallback(() => {
    return startY + BACKEND_REVEAL_SCROLL_DISTANCE;
  }, [startY]);

  const seekBackendScene = useCallback(
    (sceneIndex: number) => {
      const timeline = backendTimelineRef.current;

      if (
        !timeline ||
        !backendLockedRef.current ||
        backendReleasingRef.current ||
        programmaticScrollRef.current
      ) {
        return;
      }

      const labelTime = timeline.labels[`backend-scene-${sceneIndex}`];

      if (labelTime === undefined) {
        return;
      }

      const targetProgress = labelTime / Math.max(timeline.duration(), 1);

      gsap.killTweensOf(timeline);

      gsap.to(timeline, {
        progress: targetProgress,
        duration: 0.55,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: () => {
          backendProgressRef.current = timeline.progress();
        },
        onComplete: () => {
          backendProgressRef.current = targetProgress;
        },
      });
    },
    [programmaticScrollRef],
  );

  const runtimeRef = useRef<ScrollSectionRuntime<HomeSection> | null>(null);

  if (!runtimeRef.current) {
    runtimeRef.current = {
      section: "systems",
      startY,
      revealedProgress: BACKEND_REVEALED_PROGRESS,
      timelineRef: backendTimelineRef,
      progressRef: backendProgressRef,
      lockedRef: backendLockedRef,
      releasingRef: backendReleasingRef,
      lockYRef: backendLockYRef,
      snapRef: backendSnapRef,
      releasedDirectionRef: backendReleasedDirectionRef,
      getPxDuration: getBackendPxDuration,
      getLockY: getBackendLockY,
      localProgressTweenDuration: BACKEND_LOCAL_PROGRESS_TWEEN_DURATION,
    };
  }

  const runtime = runtimeRef.current;
  runtime.startY = startY;
  runtime.getPxDuration = getBackendPxDuration;
  runtime.getLockY = getBackendLockY;

  useEffect(() => {
    return registerSection(runtime);
  }, [registerSection, runtime]);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const verticalRail = timelineVerticalRailRef.current;
    const horizontalRail = timelineHorizontalRailRef.current;

    if (!section || !content || !verticalRail || !horizontalRail) return;

    let frame = 0;

    //The two orientations are separate DOM rails on purpose. The previous
    //single-element implementation had to switch width/height/visibility and
    //positioning modes at 1180px, which made the horizontal state vulnerable to
    //stale geometry. Both rails now share the same progress value, while each
    //owns only the geometry for its orientation. The unfilled track remains
    //completely invisible; only the travelled line itself is rendered.
    const syncTimelineRailGeometry = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const cardNav = section.querySelector<HTMLElement>(".backend-card-nav");
        const gallery = section.querySelector<HTMLElement>(
          ".backend-project-gallery-shell",
        );
        const stack = section.querySelector<HTMLElement>(".backend-stack");

        if (!cardNav || !stack) return;

        const contentRect = content.getBoundingClientRect();
        const navRect = cardNav.getBoundingClientRect();
        const stackRect = stack.getBoundingClientRect();
        const galleryRect = gallery?.getBoundingClientRect() ?? null;

        //Wide desktop: start where the screenshot region begins and stop just
        //before the first dot in the vertical navigator. The rail itself is
        //mirrored to the far-left edge below; its vertical math is unchanged.
        const verticalAnchorRect = galleryRect ?? stackRect;
        const verticalTop = Math.max(
          verticalAnchorRect.top - contentRect.top,
          0,
        );
        const verticalBottom =
          navRect.top - contentRect.top - BACKEND_TIMELINE_NAV_CLEARANCE_PX;
        const verticalHeight = Math.max(verticalBottom - verticalTop, 0);

        verticalRail.style.top = `${verticalTop}px`;
        verticalRail.style.height = `${verticalHeight}px`;
        verticalRail.style.visibility =
          verticalHeight > 1 ? "visible" : "hidden";

        //<=1180px: the Backend navigator is mirrored to the left. Start the
        //line immediately AFTER the dots and extend it toward the screenshot /
        //stack region. The progress span itself fills right->left in CSS so its
        //travel still resolves toward the project navigator.
        let horizontalLeft =
          navRect.right - contentRect.left + BACKEND_TIMELINE_NAV_CLEARANCE_PX;
        let horizontalRight =
          (galleryRect ?? stackRect).right - contentRect.left;

        //If transient card transforms make gallery geometry invalid, fall back
        //to the stable stack's right edge instead of hiding the indicator.
        if (horizontalRight <= horizontalLeft + 1) {
          horizontalRight = stackRect.right - contentRect.left;
        }

        horizontalLeft = Math.min(
          Math.max(horizontalLeft, 0),
          contentRect.width,
        );
        horizontalRight = Math.min(
          Math.max(horizontalRight, horizontalLeft),
          contentRect.width,
        );

        const horizontalWidth = Math.max(horizontalRight - horizontalLeft, 0);
        const horizontalTop =
          navRect.top -
          contentRect.top +
          navRect.height / 2 -
          BACKEND_TIMELINE_HORIZONTAL_THICKNESS_PX / 2;

        horizontalRail.style.left = `${horizontalLeft}px`;
        horizontalRail.style.width = `${horizontalWidth}px`;
        horizontalRail.style.top = `${horizontalTop}px`;
        horizontalRail.style.height = `${BACKEND_TIMELINE_HORIZONTAL_THICKNESS_PX}px`;
        horizontalRail.style.visibility =
          horizontalWidth > 1 ? "visible" : "hidden";
      });
    };

    syncTimelineRailGeometry();

    const resizeObserver = new ResizeObserver(syncTimelineRailGeometry);
    resizeObserver.observe(content);

    const cardNav = section.querySelector<HTMLElement>(".backend-card-nav");
    const gallery = section.querySelector<HTMLElement>(
      ".backend-project-gallery-shell",
    );
    const stack = section.querySelector<HTMLElement>(".backend-stack");

    if (cardNav) resizeObserver.observe(cardNav);
    if (gallery) resizeObserver.observe(gallery);
    if (stack) resizeObserver.observe(stack);

    window.addEventListener("resize", syncTimelineRailGeometry, {
      passive: true,
    });

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncTimelineRailGeometry);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    // Browser zoom and device DPR are not the same thing. In particular,
    // DevTools mobile emulation can report a high DPR even though the mobile
    // media-query layout is already perfectly sized. Only apply inverse-DPR
    // compensation in a desktop interaction environment where Ctrl +/- is
    // actually relevant. Coarse-pointer / touch layouts always stay at 1x and
    // therefore remain governed exclusively by the existing responsive CSS.
    const desktopInteractionQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );

    let resolutionQuery: MediaQueryList | null = null;

    const syncBrowserZoomCompensation = () => {
      if (!desktopInteractionQuery.matches) {
        section.style.setProperty("--backend-browser-zoom-compensation", "1");
        return;
      }

      // Capture the reference DPR only once we are actually in the desktop
      // interaction mode. This prevents a mobile-emulation DPR (2x/3x, etc.)
      // from ever becoming the reference used for desktop Ctrl +/- behavior.
      const baseDevicePixelRatio = getBackendBaseDevicePixelRatio();
      const currentDevicePixelRatio = window.devicePixelRatio || 1;
      const browserZoomRatio =
        currentDevicePixelRatio / Math.max(baseDevicePixelRatio, 0.0001);
      const inverseZoom = 1 / Math.max(browserZoomRatio, 0.0001);
      const compensation = Math.min(
        Math.max(inverseZoom, BACKEND_BROWSER_ZOOM_MIN_COMPENSATION),
        BACKEND_BROWSER_ZOOM_MAX_COMPENSATION,
      );

      section.style.setProperty(
        "--backend-browser-zoom-compensation",
        compensation.toFixed(4),
      );
    };

    const bindResolutionQuery = () => {
      resolutionQuery?.removeEventListener("change", handleResolutionChange);

      resolutionQuery = window.matchMedia(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`,
      );
      resolutionQuery.addEventListener("change", handleResolutionChange);
    };

    function handleResolutionChange() {
      syncBrowserZoomCompensation();
      bindResolutionQuery();
    }

    function handleInteractionModeChange() {
      syncBrowserZoomCompensation();
      bindResolutionQuery();
    }

    syncBrowserZoomCompensation();
    bindResolutionQuery();

    window.addEventListener("resize", syncBrowserZoomCompensation, {
      passive: true,
    });
    desktopInteractionQuery.addEventListener(
      "change",
      handleInteractionModeChange,
    );

    return () => {
      window.removeEventListener("resize", syncBrowserZoomCompensation);
      desktopInteractionQuery.removeEventListener(
        "change",
        handleInteractionModeChange,
      );
      resolutionQuery?.removeEventListener("change", handleResolutionChange);
      section.style.removeProperty("--backend-browser-zoom-compensation");
    };
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const viewport = viewportRef.current;
      const content = contentRef.current;

      if (!section || !stage || !viewport || !content) {
        return;
      }

      const verticalGridLines = gsap.utils.toArray<HTMLElement>(
        ".backend-grid-vertical",
        section,
      );
      const horizontalGridLines = gsap.utils.toArray<HTMLElement>(
        ".backend-grid-horizontal",
        section,
      );
      const titleLines = gsap.utils.toArray<HTMLElement>(
        ".backend-title-line",
        section,
      );
      const introItems = gsap.utils.toArray<HTMLElement>(
        ".backend-intro-item",
        section,
      );
      const cards = gsap.utils.toArray<HTMLElement>(".backend-card", section);
      const sceneNavButtons = gsap.utils.toArray<HTMLElement>(
        ".backend-scene-nav-button",
        section,
      );
      const sceneNavDots = gsap.utils.toArray<HTMLElement>(
        ".backend-scene-nav-dot",
        section,
      );
      const stack = section.querySelector<HTMLElement>(".backend-stack");
      const cardNav = section.querySelector<HTMLElement>(".backend-card-nav");

      if (cards.length !== BACKEND_PROJECTS.length || !stack || !cardNav) {
        return;
      }

      const projectCopy = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".backend-project-copy", card),
      );
      const projectRules = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".backend-project-rule", card),
      );
      const projectGlass = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".backend-liquid-glass", card),
      );
      const projectShots = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".backend-project-shot", card),
      );
      const technologyText = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".backend-technology-text", card),
      );
      const projectLinks = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".backend-project-link", card),
      );

      gsap.set(section, {
        autoAlpha: 0,
        filter: "blur(0px)",
      });

      //Unlike About, this section has no shared 3D tilt. Its visual language is a flat editorial interface system.
      gsap.set(stage, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
      });

      gsap.set(verticalGridLines, {
        scaleY: 0,
        transformOrigin: "top center",
        autoAlpha: 0,
      });

      gsap.set(horizontalGridLines, {
        scaleX: 0,
        transformOrigin: "right center",
        autoAlpha: 0,
      });

      gsap.set(titleLines, {
        yPercent: 115,
      });

      gsap.set(introItems, {
        autoAlpha: 0,
        y: 18,
      });

      gsap.set(stack, {
        autoAlpha: 0,
        x: -92,
      });

      gsap.set(cardNav, {
        autoAlpha: 0,
        x: -10,
      });

      section.style.setProperty("--backend-timeline-progress", "0");

      //Each project still has a strict card-sized coordinate system. The card
      //itself is intentionally invisible; only its arranged children render.
      gsap.set(cards, {
        transformOrigin: "center center",
        autoAlpha: (index) => (index === 0 ? 1 : 0),
        xPercent: (index) => (index === 0 ? 0 : -8),
        y: (index) => (index === 0 ? 0 : 16),
        scale: (index) => (index === 0 ? 1 : 0.987),
        filter: "blur(0px)",
        zIndex: (index) => BACKEND_PROJECTS.length - index,
      });

      projectCopy.forEach((items) => {
        gsap.set(items, {
          autoAlpha: 0,
          y: 18,
        });
      });

      projectRules.forEach((items) => {
        gsap.set(items, {
          scaleX: 0,
          transformOrigin: "right center",
        });
      });

      projectGlass.forEach((items) => {
        gsap.set(items, {
          autoAlpha: 0,
        });
      });

      projectShots.forEach((items) => {
        gsap.set(items, {
          y: 22,
          x: -12,
          scale: 0.985,
        });
      });

      technologyText.forEach((items) => {
        gsap.set(items, {
          autoAlpha: 0,
          y: 10,
        });
      });

      projectLinks.forEach((items) => {
        gsap.set(items, {
          autoAlpha: 0,
          y: 10,
        });
      });

      //Keep every navigator hit target fully opaque so its hover title remains
      //crisp. Active/inactive state is expressed only by the dot itself.
      gsap.set(sceneNavButtons, {
        autoAlpha: 1,
      });

      gsap.set(sceneNavDots, {
        autoAlpha: (index) => (index === 0 ? 1 : 0.58),
        scale: (index) => (index === 0 ? 1.28 : 0.82),
      });

      const timeline = gsap.timeline({
        paused: true,
        defaults: {
          ease: "none",
        },
      });

      backendTimelineRef.current = timeline;

      //Both visible progress lines mirror the timeline's normalized 0-1
      //playhead through one section-level CSS variable. This remains correct for
      //ScrollTrigger scrubbing, locally locked wheel/touch progress, programmatic
      //section navigation and dot-based scene seeking without introducing a tween
      //that could change the story timeline's duration.
      timeline.eventCallback("onUpdate", () => {
        section.style.setProperty(
          "--backend-timeline-progress",
          timeline.progress().toString(),
        );
      });

      const revealProject = (sceneIndex: number, startTime: number) => {
        timeline
          .to(
            projectCopy[sceneIndex] ?? [],
            {
              autoAlpha: 1,
              y: 0,
              stagger: 0.055,
              duration: 0.42,
              ease: "power3.out",
            },
            startTime,
          )
          .to(
            projectRules[sceneIndex] ?? [],
            {
              scaleX: 1,
              stagger: 0.07,
              duration: 0.4,
              ease: "power3.out",
            },
            startTime + 0.08,
          )
          .to(
            projectGlass[sceneIndex] ?? [],
            {
              autoAlpha: 1,
              stagger: 0.045,
              duration: 0.38,
              ease: "power2.out",
            },
            startTime + 0.1,
          )
          .to(
            projectShots[sceneIndex] ?? [],
            {
              x: 0,
              y: 0,
              scale: 1,
              stagger: 0.04,
              duration: 0.56,
              ease: "power4.out",
            },
            startTime + 0.1,
          )
          .to(
            technologyText[sceneIndex] ?? [],
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.34,
              ease: "power3.out",
            },
            startTime + 0.17,
          )
          .to(
            projectLinks[sceneIndex] ?? [],
            {
              autoAlpha: 1,
              y: 0,
              stagger: 0.06,
              duration: 0.34,
              ease: "power3.out",
            },
            startTime + 0.2,
          );
      };

      timeline
        .addLabel("reveal", 0)
        .to(
          section,
          {
            autoAlpha: 1,
            duration: 0.08,
          },
          0,
        )
        .to(
          verticalGridLines,
          {
            scaleY: 1,
            autoAlpha: 0.14,
            stagger: 0.016,
            duration: 0.5,
            ease: "power2.out",
          },
          0,
        )
        .to(
          horizontalGridLines,
          {
            scaleX: 1,
            autoAlpha: 0.14,
            stagger: 0.02,
            duration: 0.5,
            ease: "power2.out",
          },
          0.04,
        )
        .to(
          titleLines,
          {
            yPercent: 0,
            stagger: 0.08,
            duration: 0.56,
            ease: "power4.out",
          },
          0.1,
        )
        .to(
          introItems,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            ease: "power3.out",
          },
          0.25,
        )
        .to(
          stack,
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.62,
            ease: "power4.out",
          },
          0.3,
        )
        .to(
          cardNav,
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.36,
            ease: "power3.out",
          },
          0.48,
        );

      revealProject(0, 0.62);

      timeline
        .addLabel("locked-story", BACKEND_LOCKED_STORY_TIME)
        .addLabel("backend-scene-0", BACKEND_LOCKED_STORY_TIME);

      //Every project after the first is generated from the same scene slot.
      //Project 01 is fully assembled at locked-story. It then receives exactly
      //BACKEND_SCENE_HOLD_TIME before the next transition begins. Every later
      //assembled project repeats that same slot, so adding/removing projects can
      //never leave a giant trailing timeline gap or unequal per-card scroll.
      const transitionStarts = Array.from(
        { length: Math.max(BACKEND_PROJECTS.length - 1, 0) },
        (_, transitionIndex) =>
          BACKEND_LOCKED_STORY_TIME +
          BACKEND_SCENE_HOLD_TIME +
          transitionIndex * BACKEND_SCENE_SCROLL_SLOT_TIME,
      );

      transitionStarts.forEach((transitionStart, transitionIndex) => {
        const sceneIndex = transitionIndex + 1;
        const previousCard = cards[sceneIndex - 1];
        const currentCard = cards[sceneIndex];

        if (!previousCard || !currentCard) return;

        timeline
          .to(
            previousCard,
            {
              xPercent: 14,
              y: -14,
              autoAlpha: 0,
              scale: 0.975,
              filter: "blur(4px)",
              duration: 0.62,
              ease: "power3.inOut",
            },
            transitionStart,
          )
          .to(
            currentCard,
            {
              xPercent: 0,
              y: 0,
              autoAlpha: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: 0.66,
              ease: "power3.inOut",
            },
            transitionStart,
          )
          .to(
            sceneNavButtons,
            {
              autoAlpha: 1,
              duration: 0.28,
            },
            transitionStart,
          )
          .to(
            sceneNavDots,
            {
              autoAlpha: (index) => (index === sceneIndex ? 1 : 0.58),
              scale: (index) => (index === sceneIndex ? 1.28 : 0.82),
              duration: 0.28,
              ease: "power2.inOut",
            },
            transitionStart,
          );

        revealProject(sceneIndex, transitionStart + 0.14);

        timeline.addLabel(
          `backend-scene-${sceneIndex}`,
          transitionStart + BACKEND_SCENE_TRANSITION_TIME,
        );
      });

      const lastSceneLabelTime =
        BACKEND_LOCKED_STORY_TIME +
        Math.max(BACKEND_PROJECTS.length - 1, 0) *
          BACKEND_SCENE_SCROLL_SLOT_TIME;
      const finalCardExitStart = lastSceneLabelTime + BACKEND_SCENE_HOLD_TIME;

      //The final project owns the same complete slot as every earlier project.
      //Its first 0.4s is the readable hold; the remaining 0.76s is used for the
      //outro. The section fade ends exactly at the end of that slot, so the full
      //locked timeline is N equal project slots for N rendered projects.
      timeline
        .to(
          cards[BACKEND_PROJECTS.length - 1],
          {
            xPercent: 10,
            y: -26,
            autoAlpha: 0,
            scale: 0.975,
            filter: "blur(4px)",
            duration: 0.5,
            ease: "power3.in",
          },
          finalCardExitStart,
        )
        .to(
          titleLines,
          {
            x: (index) => (index === 0 ? 52 : -52),
            autoAlpha: 0,
            stagger: 0.05,
            duration: 0.46,
            ease: "power3.in",
          },
          lastSceneLabelTime + 0.46,
        )
        .to(
          cardNav,
          {
            autoAlpha: 0,
            x: -12,
            duration: 0.32,
            ease: "power2.in",
          },
          lastSceneLabelTime + 0.5,
        )
        .to(
          section,
          {
            autoAlpha: 0,
            filter: "blur(8px)",
            duration: 0.6,
            ease: "power2.in",
          },
          lastSceneLabelTime + 0.56,
        );

      const lockedStoryTime =
        timeline.labels["locked-story"] ?? BACKEND_LOCKED_STORY_TIME;

      //Derive the handoff from the exact first-project-complete label instead
      //of keeping a magic normalized progress value. This makes key 2 land on
      //the same fully revealed state even when the timeline duration changes.
      runtime.revealedProgress =
        lockedStoryTime / Math.max(timeline.duration(), 0.0001);

      backendProgressRef.current = runtime.revealedProgress;

      console.log("Backend timeline duration:", timeline.duration());
      console.log("Backend revealed progress:", runtime.revealedProgress);

      ScrollTrigger.create({
        trigger: document.documentElement,
        start: startY,
        end: getBackendLockY,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (
            backendLockedRef.current ||
            backendReleasingRef.current ||
            programmaticScrollRef.current
          ) {
            return;
          }

          const releasedDirection = backendReleasedDirectionRef.current;

          if (releasedDirection === "forward") {
            setScrollSectionProgressImmediately(runtime, 1);
            return;
          }

          if (releasedDirection === "backward" && self.direction > 0) {
            return;
          }

          const progress = self.progress * runtime.revealedProgress;

          setScrollSectionProgressImmediately(runtime, progress);

          if (releasedDirection === "backward" && self.progress <= 0) {
            backendReleasedDirectionRef.current = null;
            setScrollSectionProgressImmediately(runtime, 0);
          }
        },
      });

      return () => {
        backendTimelineRef.current = null;
        section.style.removeProperty("--backend-timeline-progress");
      };
    },
    {
      scope: sectionRef,
      dependencies: [
        getBackendLockY,
        getBackendPxDuration,
        startY,
        BACKEND_GSAP_HMR_REVISION,
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      data-scroll-locked-section="systems"
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden text-[#171717]"
    >
      <style>{`
        /*
          Use CSS zoom instead of transform: scale() so compensated text also
          consumes proportionally less/more layout space. The outer section and
          its media-query breakpoints are intentionally left untouched.
        */
        .backend-browser-zoom-compensated {
          zoom: var(--backend-browser-zoom-compensation, 1);
        }

        /*
          Touch/mobile layouts must remain exactly as authored by the existing
          media queries. This CSS guard mirrors the JS guard above and prevents
          device-emulation DPR from ever shrinking the tuned phone/tablet UI.
        */
        @media (hover: none), (pointer: coarse) {
          .backend-browser-zoom-compensated {
            zoom: 1 !important;
          }
        }

        /*
          Mobile now uses a deliberate information hierarchy rather than trying
          to preserve every desktop-sized text layer inside a narrow, short
          viewport. The section intro and repository action are secondary on
          phones, so removing them buys real vertical room without touching the
          project description, primary destinations, gallery or story timeline.
          The H2 also scales against BOTH width and height so a wider-but-short
          phone cannot make the heading grow just because vw increased.
        */
        @media (max-width: 680px) {
          .backend-compact-phone-intro,
          .backend-mobile-hidden-repository {
            display: none !important;
          }

          .backend-compact-phone-heading {
            font-size: clamp(1.7rem, min(8.2vw, 4.4vh), 2.2rem) !important;
            line-height: 0.78 !important;
          }

          .backend-compact-phone-composition {
            gap: clamp(0.58rem, 1.2vh, 0.78rem) !important;
          }
        }

        /*
          Short-phone fit mode starts before the examples become pathological,
          not after overlap has already occurred. The project composition stops
          using the normal mobile upward nudge and is aligned from the TOP of
          the stack. That makes the H2/stack boundary deterministic: if content
          ever becomes taller than its available region it can only grow toward
          the bottom, never upward through the section heading.

          The remaining typography and vertical rhythm then scale primarily from
          viewport HEIGHT. Description is intentionally never clamped here.
        */
        @media (max-width: 680px) and (max-height: 820px) {
          .backend-desktop-project-layout {
            justify-content: flex-start !important;
            transform: translateY(0) !important;
          }

          .backend-desktop-project-title-block {
            margin-top: 0 !important;
            flex-shrink: 0;
          }

          .backend-compact-phone-project-title {
            font-size: clamp(1.02rem, min(5.5vw, 2.8vh), 1.34rem) !important;
            line-height: 1 !important;
          }

          .backend-compact-phone-project-row {
            margin-top: clamp(0.48rem, 1.05vh, 0.62rem) !important;
            gap: clamp(0.42rem, 0.9vh, 0.58rem) !important;
          }

          .backend-compact-phone-detail {
            gap: clamp(0.12rem, 0.3vh, 0.18rem) !important;
            padding-block: clamp(0.28rem, 0.62vh, 0.42rem) !important;
          }

          .backend-compact-phone-detail-value {
            font-size: clamp(0.7rem, min(3.25vw, 1.68vh), 0.8rem) !important;
            line-height: 1.38 !important;
          }

          .backend-compact-phone-technology {
            margin-top: clamp(0.3rem, 0.65vh, 0.44rem) !important;
            font-size: clamp(0.53rem, min(2.35vw, 1.32vh), 0.62rem) !important;
            line-height: 1.38 !important;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
          }

          .backend-compact-phone-links {
            margin-top: clamp(0.34rem, 0.72vh, 0.5rem) !important;
            column-gap: clamp(0.34rem, 1.2vw, 0.46rem) !important;
            row-gap: clamp(0.24rem, 0.55vh, 0.34rem) !important;
          }

          .backend-compact-phone-action {
            padding: clamp(0.31rem, 0.72vh, 0.42rem)
              clamp(0.58rem, 2.1vw, 0.72rem) !important;
            font-size: clamp(0.46rem, min(2.05vw, 1.12vh), 0.52rem) !important;
          }

          .backend-compact-phone-gallery {
            height: min(16vh, 7.75rem) !important;
          }
        }

        /*
          Narrow short phones cannot afford a second editorial paragraph after
          Description. This deliberately covers the 390/391/392px seam as one
          continuous geometry range, so changing width by a pixel can no longer
          restore Outcome/My work and suddenly push the whole card into the H2.
        */
        @media (max-width: 430px) and (max-height: 820px) {
          .backend-project-detail-secondary {
            display: none !important;
          }
        }

        /*
          Wider short phones have more line width, so keep their secondary detail
          when possible but cap it to two lines. This is the dynamic truncation
          layer: Description remains complete, while lower-priority copy is the
          first text allowed to surrender height as the viewport gets shorter.
        */
        @media (min-width: 431px) and (max-width: 680px) and (max-height: 820px) {
          .backend-project-detail-secondary .backend-compact-phone-detail-value {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
          }
        }

        /*
          At genuinely shallow phone heights, secondary editorial rows disappear
          everywhere and the technology line is reduced to one line. The gallery
          remains visible and simply gives up a small amount of height. This is
          intentionally the final fallback, after heading/action reduction and
          truncation have already done the cheaper work.
        */
        @media (max-width: 680px) and (max-height: 700px) {
          .backend-project-detail-secondary {
            display: none !important;
          }

          .backend-compact-phone-technology {
            -webkit-line-clamp: 1;
          }

          .backend-compact-phone-gallery {
            height: min(14.5vh, 6.6rem) !important;
          }
        }

        /*
          Wide desktop uses the stack's existing flex-1 height as the exact
          safe vertical region below the rendered section heading + intro.
          The project title stays at the top of that region and the lower row
          consumes only the remaining height. Inside the copy column, every
          rendered editorial group (Description, Outcome, technologies and
          actions) becomes a direct flex item so the free vertical space is
          distributed equally between them. This never needs a guessed pixel
          offset from the heading: the parent's shrink-0 header has already
          established the real computed boundary for us.
        */
        @media (min-width: 1181px) {
          .backend-desktop-project-layout {
            justify-content: flex-start;
          }

          .backend-desktop-project-row {
            flex: 1 1 0%;
            min-height: 0;
          }

          .backend-desktop-project-gallery,
          .backend-desktop-copy-column,
          .backend-desktop-copy-distribution {
            height: 100%;
            min-height: 0;
          }

          .backend-desktop-project-gallery {
            min-height: 0 !important;
          }

          .backend-desktop-copy-column {
            align-self: stretch;
          }

          .backend-desktop-copy-distribution {
            justify-content: space-between;
          }

          .backend-desktop-detail-list {
            display: contents;
          }

          .backend-desktop-technology,
          .backend-desktop-links {
            margin-top: 0 !important;
          }
        }

        /*
          The real short-desktop pressure starts at the 1181px layout handoff.
          At <=1180px the existing stacked composition already uses the wider
          31rem copy column and height-aware type. At 1181px the layout becomes
          two-column, the copy narrows to roughly 40% of the 58vw composition,
          and the desktop type minima become much larger. On a short viewport
          that combination creates extra line wraps and pushes the action row
          below the stage. Keep every project field and the gallery intact here;
          only let typography and its immediate vertical rhythm contract gently
          with viewport HEIGHT.
        */
        @media (min-width: 1181px) and (max-width: 1400px) and (max-height: 900px) {
          .backend-desktop-project-title-block {
            margin-top: clamp(0.45rem, 1.35vh, 0.78rem) !important;
          }

          .backend-desktop-project-title {
            font-size: clamp(1.18rem, 2.9vh, 1.7rem) !important;
            line-height: 0.91 !important;
          }

          .backend-desktop-project-row {
            margin-top: clamp(0.38rem, 0.95vh, 0.62rem) !important;
          }

          .backend-compact-phone-detail {
            gap: clamp(0.2rem, 0.5vh, 0.34rem) !important;
            padding-block: clamp(0.38rem, 0.88vh, 0.62rem) !important;
          }

          .backend-desktop-detail-label {
            font-size: clamp(0.46rem, 0.92vh, 0.54rem) !important;
            letter-spacing: 0.13em !important;
          }

          .backend-compact-phone-detail-value {
            font-size: clamp(0.84rem, 1.85vh, 0.98rem) !important;
            line-height: 1.34 !important;
          }

          .backend-desktop-technology {
            font-size: clamp(0.58rem, 1.15vh, 0.72rem) !important;
            line-height: 1.42 !important;
          }

          .backend-desktop-links {
            column-gap: clamp(0.45rem, 0.72vw, 0.78rem) !important;
            row-gap: clamp(0.3rem, 0.7vh, 0.42rem) !important;
          }

          .backend-compact-phone-action {
            padding: clamp(0.36rem, 0.74vh, 0.48rem)
              clamp(0.62rem, 0.74vw, 0.86rem) !important;
            font-size: clamp(0.56rem, 1.08vh, 0.64rem) !important;
          }

          .backend-desktop-links .backend-project-link {
            letter-spacing: 0.1em;
          }

          .backend-desktop-links svg {
            width: clamp(0.74rem, 1.5vh, 0.86rem);
            height: clamp(0.74rem, 1.5vh, 0.86rem);
          }
        }

        /*
          Only genuinely shallow desktop windows need information reduction.
          Keep every detail through ordinary 800-ish short-desktop heights. At
          <=680px, hide only secondary editorial rows. The remaining Description
          stays at the top of the copy column, while technologies and actions
          form the lower cluster via auto margin. This preserves the useful
          vertical separation instead of bunching all surviving copy together in
          one centered block.
        */
        @media (min-width: 1181px) and (max-width: 1400px) and (max-height: 680px) {
          .backend-project-detail-secondary {
            display: none !important;
          }

          .backend-desktop-copy-distribution {
            justify-content: flex-start !important;
            gap: 0 !important;
          }

          .backend-desktop-technology {
            margin-top: auto !important;
          }

          .backend-desktop-links {
            margin-top: clamp(0.38rem, 0.9vh, 0.58rem) !important;
          }
        }

        .backend-timeline-progress-horizontal {
          transform: scaleX(var(--backend-timeline-progress, 0));
          transform-origin: right center;
        }

        .backend-timeline-progress-vertical {
          transform: scaleY(var(--backend-timeline-progress, 0));
          transform-origin: top center;
        }
      `}</style>

      <div
        ref={stageRef}
        className="absolute inset-0 will-change-[transform,opacity]"
      >
        <div
          ref={viewportRef}
          className="relative h-full w-full overflow-hidden"
        >
          <div ref={contentRef} className="relative h-full w-full">
            <div
              aria-hidden="true"
              className="absolute inset-[4vw] opacity-48 max-[680px]:inset-[5vw] max-[680px]:opacity-30"
            >
              {GRID_COLUMNS.map((_, index) => (
                <span
                  className="backend-grid-vertical absolute top-0 h-full w-px bg-[#171717]/14"
                  key={`column-${index}`}
                  style={{ left: `${index * 10}%` }}
                />
              ))}

              {GRID_ROWS.map((_, index) => (
                <span
                  className="backend-grid-horizontal absolute left-0 h-px w-full bg-[#171717]/14"
                  key={`row-${index}`}
                  style={{ top: `${index * 16.666}%` }}
                />
              ))}
            </div>

            {/*
                The visible project composition stays capped at 58vw on desktop
                so it remains on the left side of the Spline stage instead of
                colliding with the robot. The project copy has a stable left-side
                home whether screenshots exist or not; when media exists, it occupies
                the right side. On phone-sized viewports the Spline robot occupies
                the lower-right of the stage, so the entire section moves into a
                left-side safe column (4vw left gutter, 27vw right gutter) and
                reserves the top ~11vh for the future navbar.
              */}
            <div className="backend-compact-phone-composition absolute bottom-[3.25vh] left-[4.35vw] top-[clamp(5.5rem,8.6vh,7.8rem)] z-20 flex min-h-0 w-[min(58vw,70rem)] flex-col gap-[clamp(0.95rem,1.55vh,1.35rem)] max-[1180px]:w-[min(76vw,46rem)] min-[901px]:max-[1180px]:gap-[clamp(0.72rem,1.2vh,0.9rem)] max-[900px]:bottom-[3.5vh] max-[900px]:left-[4.5vw] max-[900px]:top-[clamp(5.25rem,8vh,6.5rem)] max-[900px]:w-[91vw] max-[680px]:bottom-[4vh] max-[680px]:left-[4vw] max-[680px]:right-[27vw] max-[680px]:top-[clamp(5.15rem,9.8vh,6.25rem)] max-[680px]:w-auto max-[680px]:gap-[clamp(0.72rem,1.25vh,1rem)]">
              <div className="backend-browser-zoom-compensated z-40 mr-auto flex w-full shrink-0 flex-col items-start text-left">
                <h2
                  className="backend-compact-phone-heading m-0 font-[ui-rounded,'SF_Pro_Rounded','Arial_Rounded_MT_Bold',sans-serif] text-[clamp(2.35rem,2.5vw,4.5rem)] font-semibold uppercase leading-[0.78] tracking-[-0.085em] min-[681px]:max-[1180px]:text-[clamp(2.05rem,3.25vw,2.75rem)] min-[681px]:max-[1180px]:leading-[0.8] min-[901px]:max-[1180px]:text-[clamp(1.8rem,3.55vh,2.05rem)] min-[901px]:max-[1180px]:leading-[0.78] max-[680px]:text-[clamp(2.15rem,9.4vw,2.9rem)] max-[680px]:leading-[0.75]"
                  aria-label={BACKEND_DATA.ariaLabel}
                >
                  <span className="block overflow-y-clip pb-[0.08em]">
                    <span className="backend-title-line block will-change-transform">
                      {BACKEND_DATA.titleLines[0]}
                    </span>
                  </span>
                  <span className="block overflow-y-clip pb-[0.08em]">
                    <span className="backend-title-line block will-change-transform">
                      {BACKEND_DATA.titleLines[1]}
                    </span>
                  </span>
                </h2>

                <p className="backend-intro-item backend-compact-phone-intro mt-2 max-w-[24rem] font-mono text-[clamp(0.58rem,0.66vw,0.74rem)] uppercase leading-[1.6] tracking-[0.09em] text-[#171717]/44 min-[901px]:max-[1180px]:mt-[0.32rem] min-[901px]:max-[1180px]:text-[0.5rem] min-[901px]:max-[1180px]:leading-[1.45] max-[900px]:max-w-[18rem] max-[900px]:text-[0.5rem] max-[680px]:mt-2 max-[680px]:max-w-[16rem] max-[680px]:text-[0.47rem] max-[680px]:leading-[1.55]">
                  {BACKEND_DATA.intro}
                </p>
              </div>

              <div className="backend-stack relative z-30 min-h-0 w-full flex-1 overflow-visible will-change-[transform,opacity]">
                {BACKEND_PROJECTS.map((project, sceneIndex) => {
                  //A screenshot entry with src: null is only configuration or
                  //placeholder metadata. It must not reserve gallery space.
                  //When screenshots exist they render to the RIGHT of the stable
                  //left-aligned copy on desktop. A small independent gap
                  //keeps the media visually related to the copy without
                  //forcing either side into a shared geometric "slot".
                  const screenshots = (project.screenshots ?? []).filter(
                    hasScreenshotSource,
                  );
                  const hasScreenshots = screenshots.length > 0;

                  //Only render detail rows that actually have content. The
                  //divider belongs to the row itself, so an empty optional
                  //field can never leave behind an orphan h-px rule or label.
                  //On short phone viewports the CSS compact mode keeps only
                  //Description visible; My work and Outcome remain available
                  //everywhere else without changing the data model or timeline.
                  const projectDetails = [
                    { label: "Description", value: project.description },
                    { label: "My work", value: project.contribution },
                    { label: "Outcome", value: project.outcome },
                  ].filter(
                    (detail): detail is { label: string; value: string } =>
                      Boolean(detail.value?.trim()),
                  );

                  //The copy never changes sides. Screenshot availability only
                  //controls whether the right-side media region is rendered.

                  return (
                    <article
                      className="backend-card absolute inset-0 overflow-visible bg-transparent will-change-[transform,opacity,filter]"
                      key={project.title}
                    >
                      {/*
                          The title is separated from the lower desktop row on
                          purpose. Gallery + details then share one flex row and
                          therefore one natural height. Adding technologies, links
                          or longer copy grows that row upward from the fixed bottom
                          edge and the gallery stretches with it automatically.
                        */}
                      {/*
                        From 901px through 1180px the project is still in the
                        stacked tablet/laptop composition, while its copy width
                        has already reached the 31rem cap. In that band, letting
                        vw-based type and vertical spacing continue growing can
                        make the project's natural height exceed the stack and
                        push the centered composition upward into the header.
                        Keep the same structure, but use a deliberately compact
                        vertical rhythm so the whole project remains self-contained.
                      */}
                      <div className="backend-desktop-project-layout flex h-full min-h-0 w-full flex-col justify-end max-[1180px]:justify-center max-[680px]:-translate-y-[clamp(0.35rem,1.2vh,0.75rem)]">
                        <div className="backend-desktop-project-title-block backend-browser-zoom-compensated backend-project-copy mt-[5vh] relative z-30 mr-auto w-full max-w-[23rem] text-left max-[1180px]:max-w-[31rem] min-[901px]:max-[1180px]:shrink-0 max-[680px]:max-w-none">
                          <h3 className="backend-desktop-project-title backend-compact-phone-project-title ml-auto max-w-[23rem] font-['Dancing_Script','Segoe_Script','Brush_Script_MT',cursive] text-[clamp(1.85rem,2vw,3.25rem)] font-semibold leading-[0.92] tracking-[-0.065em] max-[1180px]:max-w-[31rem] max-[1180px]:text-[clamp(1.55rem,2.7vw,1.9rem)] min-[681px]:max-[1180px]:text-[clamp(1.35rem,2.25vw,1.75rem)] min-[681px]:max-[1180px]:leading-[0.94] min-[901px]:max-[1180px]:text-[clamp(1.15rem,2.5vh,1.35rem)] min-[901px]:max-[1180px]:leading-[0.94] max-[680px]:max-w-full max-[680px]:text-[clamp(1.45rem,6.7vw,2rem)] max-[680px]:leading-[0.96]">
                            {project.title}
                          </h3>
                        </div>

                        <div className="backend-desktop-project-row backend-compact-phone-project-row mt-[clamp(1.15rem,1.75vh,1.55rem)] flex min-h-0 w-full items-stretch justify-start gap-[clamp(0.42rem,0.62vw,0.72rem)] max-[1180px]:flex-col max-[1180px]:items-start max-[1180px]:gap-[clamp(1rem,1.65vh,1.4rem)] min-[901px]:max-[1180px]:mt-[clamp(0.42rem,0.85vh,0.58rem)] min-[901px]:max-[1180px]:shrink-0 min-[901px]:max-[1180px]:gap-[clamp(0.56rem,1vh,0.72rem)] max-[680px]:mt-[0.72rem] max-[680px]:gap-[clamp(0.88rem,1.45vh,1.12rem)]">
                          {hasScreenshots ? (
                            <div className="backend-desktop-project-gallery backend-compact-phone-gallery relative z-20 order-2 flex min-h-0 min-w-0 flex-1 self-stretch items-stretch overflow-visible min-[1181px]:basis-[60%] min-[1181px]:min-h-[min(56vh,35rem)] max-[1180px]:order-2 max-[1180px]:mr-auto max-[1180px]:h-[min(27vh,17rem)] max-[1180px]:w-full max-[1180px]:max-w-[34rem] max-[1180px]:flex-none max-[1180px]:self-auto min-[901px]:max-[1180px]:h-[min(24vh,15rem)] max-[900px]:h-[min(25vh,15.5rem)] max-[680px]:h-[min(19vh,11.25rem)] max-[680px]:max-w-none">
                              <div className="h-full min-h-0 w-full">
                                <ProjectScreenshotGallery
                                  orientation="backend"
                                  projectTitle={project.title}
                                  screenshots={screenshots}
                                />
                              </div>
                            </div>
                          ) : null}

                          <div
                            className={`backend-desktop-copy-column relative z-30 order-1 flex min-w-0 flex-col items-start text-left ${
                              hasScreenshots
                                ? "basis-[40%] max-w-[23rem] max-[1180px]:basis-auto max-[1180px]:w-full max-[1180px]:max-w-[31rem] max-[680px]:max-w-none"
                                : "w-full max-w-[31rem] max-[680px]:max-w-none"
                            }`}
                          >
                            <div className="backend-desktop-copy-distribution backend-browser-zoom-compensated flex w-full flex-col items-start">
                              {projectDetails.length > 0 ? (
                                <div className="backend-desktop-detail-list backend-project-copy mr-auto w-full max-w-[23rem] max-[1180px]:max-w-[31rem] max-[680px]:max-w-none">
                                  {projectDetails.map((detail, detailIndex) => (
                                    <div
                                      className={
                                        detail.label === "Description"
                                          ? "backend-project-detail-row backend-project-detail-primary"
                                          : "backend-project-detail-row backend-project-detail-secondary"
                                      }
                                      key={detail.label}
                                    >
                                      <div
                                        className={`backend-project-rule h-px w-full ${
                                          detailIndex === 0
                                            ? "bg-[#171717]/18"
                                            : "bg-[#171717]/12"
                                        }`}
                                      />

                                      <div className="backend-project-copy backend-compact-phone-detail flex flex-col items-start gap-[clamp(0.45rem,0.7vh,0.62rem)] py-[clamp(0.92rem,1.35vh,1.18rem)] text-left max-[1180px]:gap-[0.32rem] max-[1180px]:py-[0.7rem] min-[901px]:max-[1180px]:gap-[0.22rem] min-[901px]:max-[1180px]:py-[clamp(0.42rem,0.8vh,0.5rem)] max-[680px]:gap-[0.3rem] max-[680px]:py-[0.66rem]">
                                        <span className="backend-desktop-detail-label font-mono text-[clamp(0.57rem,0.62vw,0.68rem)] uppercase tracking-[0.16em] text-[#171717]/42 max-[1180px]:text-[0.52rem] max-[1180px]:tracking-[0.14em] min-[901px]:max-[1180px]:text-[0.46rem] min-[901px]:max-[1180px]:tracking-[0.13em] max-[680px]:text-[0.46rem] max-[680px]:tracking-[0.14em]">
                                          {detail.label}
                                        </span>
                                        <p className="backend-compact-phone-detail-value max-w-[22rem] font-[Garamond,_'Times_New_Roman',_serif] text-[clamp(1.16rem,1vw,1.42rem)] leading-[1.54] text-[#171717]/64 max-[1180px]:max-w-[30rem] max-[1180px]:text-[clamp(0.92rem,1.45vw,1.04rem)] max-[1180px]:leading-[1.45] min-[901px]:max-[1180px]:text-[clamp(0.82rem,1.75vh,0.9rem)] min-[901px]:max-[1180px]:leading-[1.36] max-[680px]:max-w-none max-[680px]:text-[0.86rem] max-[680px]:leading-[1.48]">
                                          {detail.value}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              <p className="backend-desktop-technology backend-technology-text backend-compact-phone-technology mr-auto mt-[clamp(1rem,1.5vh,1.3rem)] w-full max-w-[23rem] text-left font-mono text-[clamp(0.76rem,0.82vw,0.92rem)] font-medium leading-[1.65] tracking-[0.035em] text-[#171717]/68 max-[1180px]:mt-[0.78rem] max-[1180px]:max-w-[31rem] max-[1180px]:text-[0.74rem] min-[901px]:max-[1180px]:mt-[0.5rem] min-[901px]:max-[1180px]:text-[0.66rem] min-[901px]:max-[1180px]:leading-[1.5] max-[680px]:mt-[0.72rem] max-[680px]:max-w-none max-[680px]:text-[0.7rem] max-[680px]:leading-[1.6]">
                                {project.technologies?.join(", ")}
                              </p>

                              {/* Explicit project destinations live with the copy.
                                  The screenshot gallery itself is intentionally
                                  only a media/carousel interaction. The internal
                                  detail link is optional as well: adding a
                                  detailsSlug to a project is what makes the
                                  "View project" action appear. */}
                              {(project.liveUrl ||
                                project.repositoryUrl ||
                                project.detailsSlug) && (
                                <div className="backend-desktop-links backend-project-copy backend-compact-phone-links mr-auto mt-[clamp(1.05rem,1.6vh,1.4rem)] flex w-full max-w-[23rem] flex-wrap items-center justify-start gap-x-[clamp(1.2rem,1.8vw,1.95rem)] gap-y-3 max-[1180px]:mt-[0.78rem] max-[1180px]:max-w-[31rem] max-[1180px]:gap-x-3 max-[1180px]:gap-y-2 min-[901px]:max-[1180px]:mt-[0.5rem] min-[901px]:max-[1180px]:gap-x-2.5 min-[901px]:max-[1180px]:gap-y-1.5 max-[680px]:mt-[0.82rem] max-[680px]:max-w-none">
                                  {project.liveUrl ? (
                                    <a
                                      className="backend-project-link backend-compact-phone-action pointer-events-auto inline-flex items-center justify-center rounded-full border border-[#171717]/14 bg-white/[0.08] px-[clamp(1.05rem,1.22vw,1.3rem)] py-[clamp(0.6rem,0.72vw,0.76rem)] font-mono text-[clamp(0.68rem,0.76vw,0.84rem)] uppercase tracking-[0.12em] text-[#171717]/72 backdrop-blur-[8px] transition-[transform,background-color,opacity] duration-200 hover:-translate-y-px hover:bg-white/20 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/16 max-[1180px]:px-[0.92rem] max-[1180px]:py-[0.58rem] max-[1180px]:text-[0.62rem] min-[901px]:max-[1180px]:px-[0.84rem] min-[901px]:max-[1180px]:py-[0.5rem] min-[901px]:max-[1180px]:text-[0.58rem] max-[680px]:text-[0.6rem]"
                                      href={project.liveUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      Visit live site ↗
                                    </a>
                                  ) : null}

                                  {project.repositoryUrl ? (
                                    <a
                                      className="backend-project-link backend-compact-phone-action backend-mobile-hidden-repository pointer-events-auto inline-flex items-center justify-center gap-[clamp(0.42rem,0.52vw,0.58rem)] rounded-full border border-[#171717]/11 bg-white/[0.045] px-[clamp(1.05rem,1.22vw,1.3rem)] py-[clamp(0.6rem,0.72vw,0.76rem)] font-mono text-[clamp(0.68rem,0.76vw,0.84rem)] uppercase tracking-[0.12em] text-[#171717]/62 backdrop-blur-[8px] transition-[transform,background-color,opacity] duration-200 hover:-translate-y-px hover:bg-white/16 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/14 max-[1180px]:gap-[0.38rem] max-[1180px]:px-[0.92rem] max-[1180px]:py-[0.58rem] max-[1180px]:text-[0.62rem] min-[901px]:max-[1180px]:px-[0.84rem] min-[901px]:max-[1180px]:py-[0.5rem] min-[901px]:max-[1180px]:text-[0.58rem] max-[680px]:text-[0.6rem]"
                                      href={project.repositoryUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      <GitHubIcon />
                                      <span>Repository ↗</span>
                                    </a>
                                  ) : null}

                                  {project.detailsSlug ? (
                                    <Link
                                      className="backend-project-link backend-compact-phone-action pointer-events-auto inline-flex items-center justify-center rounded-full border border-[#171717]/78 bg-[#171717] px-[clamp(1.12rem,1.32vw,1.42rem)] py-[clamp(0.62rem,0.76vw,0.8rem)] font-mono text-[clamp(0.68rem,0.76vw,0.84rem)] uppercase tracking-[0.12em] text-[#f4f2eb] shadow-[0_8px_22px_rgba(23,23,23,0.08)] transition-[transform,background-color,opacity] duration-200 hover:-translate-y-px hover:bg-[#171717]/88 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/22 max-[1180px]:px-[0.98rem] max-[1180px]:py-[0.6rem] max-[1180px]:text-[0.62rem] min-[901px]:max-[1180px]:px-[0.88rem] min-[901px]:max-[1180px]:py-[0.52rem] min-[901px]:max-[1180px]:text-[0.58rem] max-[680px]:text-[0.6rem]"
                                      onClick={(event) => {
                                        //Modified clicks may open a new tab and
                                        //leave this home entry active, so only
                                        //stamp a return point for same-tab nav.
                                        if (
                                          event.defaultPrevented ||
                                          event.button !== 0 ||
                                          event.metaKey ||
                                          event.ctrlKey ||
                                          event.shiftKey ||
                                          event.altKey
                                        ) {
                                          return;
                                        }

                                        rememberBackendProjectReturnState(
                                          sceneIndex,
                                        );
                                      }}
                                      params={{
                                        projectSlug: project.detailsSlug,
                                      }}
                                      to="/experience/backend/$projectSlug"
                                    >
                                      View project →
                                    </Link>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/*
                Timeline progress is intentionally separate from the dot nav.
                There is no visible background track: only the travelled portion
                is drawn. Wide desktop keeps the vertical line beside the vertical
                dots; <=1180px lays that same line horizontally on the bottom bed
                immediately before the unchanged horizontal dot navigator.
              */}
            <div
              aria-hidden="true"
              className="backend-timeline-rail pointer-events-none absolute left-[2.1vw] z-[65] hidden w-[2px] overflow-hidden rounded-full min-[1181px]:block"
              ref={timelineVerticalRailRef}
              style={{ height: 0, top: 0 }}
            >
              <span className="backend-timeline-progress-vertical absolute inset-0 h-full w-full bg-[#171717]/72 will-change-transform" />
            </div>

            <div
              aria-hidden="true"
              className="backend-timeline-rail pointer-events-none absolute z-[65] overflow-hidden rounded-full min-[1181px]:hidden"
              ref={timelineHorizontalRailRef}
              style={{ height: 0, left: 0, top: 0, width: 0 }}
            >
              <span className="backend-timeline-progress-horizontal absolute inset-0 h-full w-full bg-[#171717]/76 will-change-transform" />
            </div>

            {/*
                Project navigation is intentionally dots-only. Every project gets
                one standalone black dot. On wide desktop viewports the dots form
                a vertical stack on the far-left edge, anchored from the bottom
                upward so they stay clear of the copy. Tablet/mobile keep the
                compact bottom row. Hovering or keyboard focusing reveals the
                project title; clicking seeks the local GSAP timeline directly to
                that project's fully assembled scene.
              */}
            <nav
              aria-label="Backend project navigation"
              className="backend-card-nav pointer-events-auto absolute bottom-[2.8vh] left-[4.35vw] z-[70] flex h-auto flex-row items-center justify-start gap-[clamp(0.42rem,0.62vw,0.64rem)] min-[1181px]:bottom-[3.25vh] min-[1181px]:left-[1.05vw] min-[1181px]:flex-col min-[1181px]:gap-[0.12rem] max-[900px]:bottom-[2.6vh] max-[900px]:left-[4.5vw] max-[680px]:bottom-[2.1vh] max-[680px]:left-[4vw] max-[680px]:gap-[0.42rem]"
            >
              {BACKEND_PROJECTS.map((project, sceneIndex) => (
                <button
                  aria-label={`Show ${project.title}`}
                  className="backend-scene-nav-button group relative flex size-9 cursor-pointer items-center justify-center outline-none min-[1181px]:size-8 max-[680px]:size-6"
                  key={project.title}
                  onClick={() => seekBackendScene(sceneIndex)}
                  type="button"
                >
                  <span className="pointer-events-none absolute bottom-[calc(100%+0.52rem)] left-0 w-max max-w-[min(19rem,36vw)] translate-y-1 rounded-[0.72rem] border border-[#171717]/11 bg-[#f4f2eb]/96 px-[clamp(0.72rem,0.92vw,0.96rem)] py-[clamp(0.52rem,0.66vw,0.68rem)] text-left opacity-0 shadow-[0_10px_28px_rgba(23,23,23,0.08)] backdrop-blur-[12px] transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 min-[1181px]:bottom-auto min-[1181px]:left-[calc(100%+0.45rem)] min-[1181px]:top-1/2 min-[1181px]:-translate-y-1/2 min-[1181px]:group-hover:-translate-y-1/2 min-[1181px]:group-focus-visible:-translate-y-1/2 max-[680px]:hidden">
                    <span className="block font-sans text-[clamp(0.82rem,0.96vw,1.04rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-[#171717] max-[680px]:text-[0.76rem]">
                      {project.title}
                    </span>
                  </span>

                  <span className="backend-scene-nav-dot block size-[0.58rem] shrink-0 rounded-full bg-[#171717] shadow-[0_0_0_1px_rgba(244,242,235,0.9)] will-change-transform max-[680px]:size-[0.46rem]" />
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
