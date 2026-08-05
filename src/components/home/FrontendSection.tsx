import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef } from "react";

import reactLogo from "@/assets/react.svg";

import type { HomeSection } from "@/@types/home-section.types";
import type {
  ManualScrollSectionProps,
  ScrollSectionRuntime,
} from "@/@types/scroll-locked-section.types";
import { setScrollSectionProgressImmediately } from "@/utils/scroll-locked-section.utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FRONTEND_GSAP_HMR_REVISION = import.meta.hot
  ? (import.meta.hot.data.frontendGsapRevision =
      (import.meta.hot.data.frontendGsapRevision ?? 0) + 1)
  : 0;

const FRONTEND_REVEAL_SCROLL_DISTANCE = 520;
const FRONTEND_REVEALED_PROGRESS = 0.2;
const FRONTEND_LOCAL_PROGRESS_TWEEN_DURATION = 0.16;

const FRONTEND_SCENES = [
  {
    number: "01",
    label: "Architecture",
    title: "Interfaces with a system behind them.",
    description:
      "Typed state, reusable primitives and predictable data flow keep ambitious interfaces maintainable after launch.",
    tags: ["React", "TypeScript", "TanStack"],
  },
  {
    number: "02",
    label: "Interaction",
    title: "Motion that explains what changed.",
    description:
      "Transitions preserve context, establish hierarchy and make complex workflows feel immediate instead of mechanical.",
    tags: ["GSAP", "Motion", "Spline"],
  },
  {
    number: "03",
    label: "Performance",
    title: "Fast enough to disappear.",
    description:
      "Rendering, caching and loading behavior are treated as product decisions, not cleanup work after the interface is built.",
    tags: ["60 FPS", "Prefetch", "Resilience"],
  },
] as const;

const GRID_COLUMNS = Array.from({ length: 11 });
const GRID_ROWS = Array.from({ length: 7 });

export default function FrontendSection({
  startY,
  registerSection,
  programmaticScrollRef,
}: ManualScrollSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const frontendTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const frontendProgressRef = useRef(FRONTEND_REVEALED_PROGRESS);
  const frontendLockedRef = useRef(false);
  const frontendReleasingRef = useRef(false);
  const frontendLockYRef = useRef<number | null>(null);
  const frontendSnapRef = useRef(false);
  const frontendReleasedDirectionRef = useRef<"forward" | "backward" | null>(
    null,
  );

  //This section is a three-scene editorial sequence, so its local scroll distance is intentionally based on viewport travel rather than About's overflowing text height.
  const getFrontendPxDuration = useCallback(() => {
    return Math.max(window.innerHeight * 2.9, 2200);
  }, []);

  const getFrontendLockY = useCallback(() => {
    return startY + FRONTEND_REVEAL_SCROLL_DISTANCE;
  }, [startY]);

  const runtimeRef = useRef<ScrollSectionRuntime<HomeSection> | null>(null);

  if (!runtimeRef.current) {
    runtimeRef.current = {
      section: "experience",
      startY,
      revealedProgress: FRONTEND_REVEALED_PROGRESS,
      timelineRef: frontendTimelineRef,
      progressRef: frontendProgressRef,
      lockedRef: frontendLockedRef,
      releasingRef: frontendReleasingRef,
      lockYRef: frontendLockYRef,
      snapRef: frontendSnapRef,
      releasedDirectionRef: frontendReleasedDirectionRef,
      getPxDuration: getFrontendPxDuration,
      getLockY: getFrontendLockY,
      localProgressTweenDuration: FRONTEND_LOCAL_PROGRESS_TWEEN_DURATION,
    };
  }

  const runtime = runtimeRef.current;
  runtime.startY = startY;
  runtime.getPxDuration = getFrontendPxDuration;
  runtime.getLockY = getFrontendLockY;

  useEffect(() => {
    return registerSection(runtime);
  }, [registerSection, runtime]);

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
        ".frontend-grid-vertical",
        section,
      );
      const horizontalGridLines = gsap.utils.toArray<HTMLElement>(
        ".frontend-grid-horizontal",
        section,
      );
      const titleLines = gsap.utils.toArray<HTMLElement>(
        ".frontend-title-line",
        section,
      );
      const introItems = gsap.utils.toArray<HTMLElement>(
        ".frontend-intro-item",
        section,
      );
      const cards = gsap.utils.toArray<HTMLElement>(".frontend-card", section);
      const sceneLabels = gsap.utils.toArray<HTMLElement>(
        ".frontend-scene-label",
        section,
      );
      const sceneNumbers = gsap.utils.toArray<HTMLElement>(
        ".frontend-scene-number",
        section,
      );
      const stack = section.querySelector<HTMLElement>(".frontend-stack");
      const progressRail = section.querySelector<HTMLElement>(
        ".frontend-progress-rail",
      );
      const progressFill = section.querySelector<HTMLElement>(
        ".frontend-progress-fill",
      );
      const finalCopy = section.querySelector<HTMLElement>(
        ".frontend-final-copy",
      );
      const footerRule = section.querySelector<HTMLElement>(
        ".frontend-footer-rule",
      );

      const [architectureCard, interactionCard, performanceCard] = cards;

      if (
        !architectureCard ||
        !interactionCard ||
        !performanceCard ||
        !stack ||
        !progressRail ||
        !progressFill ||
        !finalCopy ||
        !footerRule
      ) {
        return;
      }

      const architectureRows = gsap.utils.toArray<HTMLElement>(
        ".frontend-code-row",
        architectureCard,
      );
      const interactionRows = gsap.utils.toArray<HTMLElement>(
        ".frontend-code-row",
        interactionCard,
      );
      const performanceRows = gsap.utils.toArray<HTMLElement>(
        ".frontend-code-row",
        performanceCard,
      );
      const cardRules = gsap.utils.toArray<HTMLElement>(
        ".frontend-card-rule",
        section,
      );
      const cardChips = gsap.utils.toArray<HTMLElement>(
        ".frontend-card-chip",
        section,
      );
      const orbitDots = gsap.utils.toArray<HTMLElement>(
        ".frontend-orbit-dot",
        section,
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
        transformOrigin: "left center",
        autoAlpha: 0,
      });

      gsap.set(titleLines, {
        yPercent: 115,
      });

      gsap.set(introItems, {
        autoAlpha: 0,
        y: 24,
      });

      gsap.set(stack, {
        autoAlpha: 0,
        x: 140,
      });

      gsap.set(cards, {
        transformOrigin: "center center",
      });

      gsap.set(architectureCard, {
        autoAlpha: 1,
        y: 0,
        xPercent: 0,
        scale: 1,
        zIndex: 3,
      });

      gsap.set(interactionCard, {
        autoAlpha: 0.48,
        y: 38,
        xPercent: 0,
        scale: 0.955,
        zIndex: 2,
      });

      gsap.set(performanceCard, {
        autoAlpha: 0.2,
        y: 76,
        xPercent: 0,
        scale: 0.91,
        zIndex: 1,
      });

      gsap.set(sceneLabels, {
        autoAlpha: (index) => (index === 0 ? 1 : 0.28),
      });

      gsap.set(sceneNumbers, {
        autoAlpha: (index) => (index === 0 ? 1 : 0),
        yPercent: (index) => (index === 0 ? 0 : 80),
      });

      gsap.set(progressRail, {
        autoAlpha: 0,
      });

      gsap.set(progressFill, {
        scaleY: 0,
        transformOrigin: "top center",
      });

      gsap.set(cardRules, {
        scaleX: 0,
        transformOrigin: "left center",
      });

      gsap.set([...architectureRows, ...interactionRows, ...performanceRows], {
        autoAlpha: 0,
        x: -16,
      });

      gsap.set(cardChips, {
        autoAlpha: 0,
        y: 12,
      });

      gsap.set(orbitDots, {
        autoAlpha: 0,
        scale: 0,
        transformOrigin: "center center",
      });

      gsap.set(finalCopy, {
        autoAlpha: 0,
        y: 24,
      });

      gsap.set(footerRule, {
        scaleX: 0,
        transformOrigin: "left center",
      });

      const timeline = gsap.timeline({
        paused: true,
        defaults: {
          ease: "none",
        },
      });

      frontendTimelineRef.current = timeline;

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
            autoAlpha: 0.22,
            stagger: 0.016,
            duration: 0.52,
            ease: "power2.out",
          },
          0,
        )
        .to(
          horizontalGridLines,
          {
            scaleX: 1,
            autoAlpha: 0.22,
            stagger: 0.02,
            duration: 0.52,
            ease: "power2.out",
          },
          0.04,
        )
        .to(
          titleLines,
          {
            yPercent: 0,
            stagger: 0.08,
            duration: 0.58,
            ease: "power4.out",
          },
          0.1,
        )
        .to(
          introItems,
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.055,
            duration: 0.42,
            ease: "power3.out",
          },
          0.28,
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
          progressRail,
          {
            autoAlpha: 1,
            duration: 0.24,
          },
          0.52,
        )
        .addLabel("locked-story", 0.95)
        .to(
          progressFill,
          {
            scaleY: 1,
            duration: 3.25,
            ease: "none",
          },
          "locked-story",
        )
        .to(
          architectureCard.querySelectorAll(".frontend-card-rule"),
          {
            scaleX: 1,
            stagger: 0.06,
            duration: 0.42,
            ease: "power3.out",
          },
          0.96,
        )
        .to(
          architectureRows,
          {
            autoAlpha: 1,
            x: 0,
            stagger: 0.055,
            duration: 0.34,
            ease: "power2.out",
          },
          1.02,
        )
        .to(
          architectureCard.querySelectorAll(".frontend-card-chip"),
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.04,
            duration: 0.28,
            ease: "power2.out",
          },
          1.12,
        )
        .to(
          architectureCard,
          {
            xPercent: -118,
            autoAlpha: 0,
            scale: 0.88,
            duration: 0.66,
            ease: "power3.inOut",
          },
          1.55,
        )
        .to(
          interactionCard,
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            zIndex: 3,
            duration: 0.66,
            ease: "power3.inOut",
          },
          1.55,
        )
        .to(
          performanceCard,
          {
            y: 38,
            autoAlpha: 0.48,
            scale: 0.955,
            zIndex: 2,
            duration: 0.66,
            ease: "power3.inOut",
          },
          1.55,
        )
        .to(
          sceneLabels,
          {
            autoAlpha: (index) => (index === 1 ? 1 : 0.28),
            duration: 0.28,
          },
          1.55,
        )
        .to(
          sceneNumbers,
          {
            autoAlpha: (index) => (index === 1 ? 1 : 0),
            yPercent: (index) => (index === 1 ? 0 : -80),
            duration: 0.32,
            ease: "power2.inOut",
          },
          1.55,
        )
        .to(
          interactionCard.querySelectorAll(".frontend-card-rule"),
          {
            scaleX: 1,
            stagger: 0.06,
            duration: 0.42,
            ease: "power3.out",
          },
          1.78,
        )
        .to(
          interactionRows,
          {
            autoAlpha: 1,
            x: 0,
            stagger: 0.055,
            duration: 0.34,
            ease: "power2.out",
          },
          1.84,
        )
        .to(
          interactionCard.querySelectorAll(".frontend-card-chip"),
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.04,
            duration: 0.28,
            ease: "power2.out",
          },
          1.96,
        )
        .to(
          orbitDots,
          {
            autoAlpha: 1,
            scale: 1,
            stagger: 0.08,
            duration: 0.36,
            ease: "back.out(2)",
          },
          2.02,
        )
        .to(
          orbitDots,
          {
            x: (index) => (index - 1) * 34,
            y: (index) => (index % 2 === 0 ? -16 : 18),
            duration: 0.52,
            ease: "power2.inOut",
          },
          2.18,
        )
        .to(
          interactionCard,
          {
            xPercent: -118,
            autoAlpha: 0,
            scale: 0.88,
            duration: 0.66,
            ease: "power3.inOut",
          },
          2.6,
        )
        .to(
          performanceCard,
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            zIndex: 3,
            duration: 0.66,
            ease: "power3.inOut",
          },
          2.6,
        )
        .to(
          sceneLabels,
          {
            autoAlpha: (index) => (index === 2 ? 1 : 0.28),
            duration: 0.28,
          },
          2.6,
        )
        .to(
          sceneNumbers,
          {
            autoAlpha: (index) => (index === 2 ? 1 : 0),
            yPercent: (index) => (index === 2 ? 0 : -80),
            duration: 0.32,
            ease: "power2.inOut",
          },
          2.6,
        )
        .to(
          performanceCard.querySelectorAll(".frontend-card-rule"),
          {
            scaleX: 1,
            stagger: 0.06,
            duration: 0.42,
            ease: "power3.out",
          },
          2.82,
        )
        .to(
          performanceRows,
          {
            autoAlpha: 1,
            x: 0,
            stagger: 0.055,
            duration: 0.34,
            ease: "power2.out",
          },
          2.9,
        )
        .to(
          performanceCard.querySelectorAll(".frontend-card-chip"),
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.04,
            duration: 0.28,
            ease: "power2.out",
          },
          3.0,
        )
        .to(
          cards,
          {
            xPercent: (index) => (index - 1) * 76,
            y: 0,
            autoAlpha: 1,
            scale: 0.58,
            zIndex: 1,
            stagger: 0.035,
            duration: 0.72,
            ease: "power3.inOut",
          },
          3.48,
        )
        .to(
          finalCopy,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            ease: "power3.out",
          },
          3.65,
        )
        .to(
          footerRule,
          {
            scaleX: 1,
            duration: 0.46,
            ease: "power3.out",
          },
          3.65,
        )
        .to(
          titleLines,
          {
            x: (index) => (index === 0 ? -70 : 70),
            autoAlpha: 0,
            stagger: 0.05,
            duration: 0.48,
            ease: "power3.in",
          },
          4.2,
        )
        .to(
          cards,
          {
            y: -70,
            autoAlpha: 0,
            stagger: 0.035,
            duration: 0.48,
            ease: "power3.in",
          },
          4.2,
        )
        .to(
          section,
          {
            autoAlpha: 0,
            filter: "blur(8px)",
            duration: 0.62,
            ease: "power2.in",
          },
          4.28,
        );

      console.log("Frontend timeline duration:", timeline.duration());

      ScrollTrigger.create({
        trigger: document.documentElement,
        start: startY,
        end: getFrontendLockY,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (
            frontendLockedRef.current ||
            frontendReleasingRef.current ||
            programmaticScrollRef.current
          ) {
            return;
          }

          const releasedDirection = frontendReleasedDirectionRef.current;

          if (releasedDirection === "forward") {
            setScrollSectionProgressImmediately(runtime, 1);
            return;
          }

          if (releasedDirection === "backward" && self.direction > 0) {
            return;
          }

          const progress = self.progress * FRONTEND_REVEALED_PROGRESS;

          setScrollSectionProgressImmediately(runtime, progress);

          if (releasedDirection === "backward" && self.progress <= 0) {
            frontendReleasedDirectionRef.current = null;
            setScrollSectionProgressImmediately(runtime, 0);
          }
        },
      });

      return () => {
        frontendTimelineRef.current = null;
      };
    },
    {
      scope: sectionRef,
      dependencies: [
        getFrontendLockY,
        getFrontendPxDuration,
        startY,
        FRONTEND_GSAP_HMR_REVISION,
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden text-[#171717]"
    >
      <div
        ref={stageRef}
        className="absolute inset-0 will-change-[transform,opacity]"
      >
        <div
          ref={viewportRef}
          className="relative h-screen w-screen overflow-hidden"
        >
          <div ref={contentRef} className="relative h-full w-full">
            <div aria-hidden="true" className="absolute inset-[4vw] opacity-70">
              {GRID_COLUMNS.map((_, index) => (
                <span
                  className="frontend-grid-vertical absolute top-0 h-full w-px bg-[#171717]/20"
                  key={`column-${index}`}
                  style={{ left: `${index * 10}%` }}
                />
              ))}

              {GRID_ROWS.map((_, index) => (
                <span
                  className="frontend-grid-horizontal absolute left-0 h-px w-full bg-[#171717]/20"
                  key={`row-${index}`}
                  style={{ top: `${index * 16.666}%` }}
                />
              ))}
            </div>

            <div className="absolute left-[6vw] top-[10vh] z-10 w-[min(38vw,38rem)] max-[900px]:left-[5vw] max-[900px]:top-[7vh] max-[900px]:w-[90vw]">
              <div className="frontend-intro-item mb-5 flex items-center gap-4 font-mono text-[clamp(0.66rem,0.72vw,0.8rem)] uppercase tracking-[0.2em] text-[#171717]/48">
                <span className="inline-flex size-2 rounded-full bg-[#e0b900]" />
                <span>Frontend systems / 02</span>
              </div>

              <h2
                className="m-0 font-sans text-[clamp(3.2rem,7.3vw,8.7rem)] font-semibold uppercase leading-[0.78] tracking-[-0.09em]"
                aria-label="Frontend Engineering"
              >
                <span className="block overflow-hidden pb-[0.08em]">
                  <span className="frontend-title-line block will-change-transform">
                    Front
                  </span>
                </span>
                <span className="block overflow-hidden pb-[0.08em]">
                  <span className="frontend-title-line block pl-[0.72em] will-change-transform">
                    End
                  </span>
                </span>
              </h2>

              <p className="frontend-intro-item mt-7 max-w-[28rem] font-mono text-[clamp(0.72rem,0.82vw,0.92rem)] uppercase leading-[1.8] tracking-[0.08em] text-[#171717]/55 max-[900px]:mt-4 max-[900px]:max-w-[20rem] max-[900px]:text-[0.65rem]">
                Architecture, motion and performance treated as one product
                system.
              </p>
            </div>

            <div className="frontend-stack absolute right-[6vw] top-1/2 z-20 h-[min(62vh,42rem)] w-[min(45vw,44rem)] -translate-y-1/2 will-change-[transform,opacity] max-[900px]:right-[5vw] max-[900px]:top-auto max-[900px]:bottom-[5vh] max-[900px]:h-[45vh] max-[900px]:w-[90vw] max-[900px]:translate-y-0">
              {FRONTEND_SCENES.map((scene, sceneIndex) => (
                <article
                  className="frontend-card absolute inset-0 overflow-hidden rounded-[1.4rem] border border-[#171717]/18 bg-[#f2f0e9]/92 shadow-[0_18px_70px_rgba(0,0,0,0.06)] backdrop-blur-[10px] will-change-[transform,opacity]"
                  data-frontend-card={sceneIndex}
                  key={scene.number}
                >
                  <div className="flex h-12 items-center justify-between border-b border-[#171717]/12 px-5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[#171717]/45">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[#171717]/18" />
                      <span className="size-2 rounded-full bg-[#171717]/18" />
                      <span className="size-2 rounded-full bg-[#e0b900]" />
                    </div>
                    <span>{scene.label}</span>
                  </div>

                  <div className="grid h-[calc(100%_-_3rem)] grid-cols-[1.05fr_0.95fr] max-[600px]:grid-cols-1">
                    <div className="relative flex flex-col justify-between border-r border-[#171717]/12 p-[clamp(1.1rem,2vw,2rem)] max-[600px]:border-r-0 max-[600px]:border-b">
                      <div>
                        <span className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-[#171717]/38">
                          Scene {scene.number}
                        </span>
                        <h3 className="mt-4 max-w-[19rem] text-[clamp(1.45rem,2.4vw,2.8rem)] font-semibold leading-[0.95] tracking-[-0.06em]">
                          {scene.title}
                        </h3>
                        <p className="mt-5 max-w-[22rem] font-[Garamond,_'Times_New_Roman',_serif] text-[clamp(0.88rem,1vw,1.1rem)] leading-[1.55] text-[#171717]/60 max-[600px]:hidden">
                          {scene.description}
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {scene.tags.map((tag) => (
                          <span
                            className="frontend-card-chip rounded-full border border-[#171717]/15 px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[#171717]/55"
                            key={tag}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="relative overflow-hidden p-[clamp(1rem,1.7vw,1.6rem)]">
                      {sceneIndex === 0 ? (
                        <div className="flex h-full flex-col rounded-xl border border-[#171717]/12 bg-white/45 p-4">
                          <div className="frontend-card-rule h-px w-full bg-[#171717]/18" />
                          <div className="mt-4 grid flex-1 grid-cols-[0.34fr_0.66fr] gap-3">
                            <div className="rounded-lg bg-[#e0b900]/88 p-3">
                              <img
                                alt="React"
                                className="size-12 opacity-65"
                                src={reactLogo}
                              />
                            </div>
                            <div className="space-y-3 pt-1">
                              {[82, 58, 72, 43].map((width) => (
                                <div
                                  className="frontend-code-row h-2 rounded-full bg-[#171717]/16"
                                  key={width}
                                  style={{ width: `${width}%` }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="frontend-card-rule mt-4 h-px w-full bg-[#171717]/18" />
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {["DATA", "STATE", "VIEW"].map((item) => (
                              <div
                                className="frontend-code-row rounded-md border border-[#171717]/12 py-3 text-center font-mono text-[0.55rem] tracking-[0.12em] text-[#171717]/45"
                                key={item}
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {sceneIndex === 1 ? (
                        <div className="relative flex h-full items-center justify-center rounded-xl border border-[#171717]/12 bg-white/45">
                          <div className="absolute h-[68%] w-[68%] rounded-full border border-[#171717]/12" />
                          <div className="absolute h-[44%] w-[44%] rounded-full border border-[#171717]/12" />
                          <span className="frontend-orbit-dot absolute size-3 rounded-full bg-[#e0b900]" />
                          <span className="frontend-orbit-dot absolute size-2 rounded-full bg-[#171717]/55" />
                          <span className="frontend-orbit-dot absolute size-2.5 rounded-full border border-[#171717]/40 bg-[#f2f0e9]" />
                          <div className="w-[72%] space-y-4">
                            {[92, 68, 84, 48].map((width) => (
                              <div className="frontend-code-row" key={width}>
                                <div className="mb-2 flex items-center justify-between font-mono text-[0.5rem] uppercase tracking-[0.14em] text-[#171717]/38">
                                  <span>Timeline</span>
                                  <span>{width}%</span>
                                </div>
                                <div className="h-1 overflow-hidden rounded-full bg-[#171717]/10">
                                  <div
                                    className="frontend-card-rule h-full rounded-full bg-[#171717]/45"
                                    style={{ width: `${width}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {sceneIndex === 2 ? (
                        <div className="grid h-full grid-cols-2 gap-3">
                          {[
                            ["60", "FPS"],
                            ["98", "PERF"],
                            ["0.8", "LCP"],
                            ["A", "11Y"],
                          ].map(([value, label], metricIndex) => (
                            <div
                              className="frontend-code-row flex flex-col justify-between rounded-xl border border-[#171717]/12 bg-white/45 p-4"
                              key={label}
                            >
                              <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-[#171717]/38">
                                0{metricIndex + 1}
                              </span>
                              <div>
                                <strong className="block text-[clamp(1.7rem,3vw,3.4rem)] font-semibold leading-none tracking-[-0.08em]">
                                  {value}
                                </strong>
                                <span className="mt-2 block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[#171717]/45">
                                  {label}
                                </span>
                              </div>
                              <div className="frontend-card-rule h-px w-full bg-[#e0b900]" />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="frontend-progress-rail absolute right-[2.8vw] top-[18vh] z-30 h-[64vh] w-px bg-[#171717]/16 max-[900px]:right-[2vw] max-[900px]:top-[24vh] max-[900px]:h-[54vh]">
              <div className="frontend-progress-fill absolute inset-x-0 top-0 h-full bg-[#e0b900]" />
            </div>

            <div className="absolute bottom-[7vh] left-[6vw] z-30 flex items-end gap-8 max-[900px]:bottom-auto max-[900px]:left-auto max-[900px]:right-[5vw] max-[900px]:top-[7vh]">
              <div className="relative h-16 w-16 overflow-hidden max-[900px]:h-10 max-[900px]:w-10">
                {FRONTEND_SCENES.map((scene) => (
                  <span
                    className="frontend-scene-number absolute inset-0 flex items-center font-mono text-[clamp(1.5rem,2.6vw,3rem)] font-semibold tracking-[-0.08em]"
                    key={scene.number}
                  >
                    {scene.number}
                  </span>
                ))}
              </div>

              <div className="flex gap-5 max-[900px]:hidden">
                {FRONTEND_SCENES.map((scene) => (
                  <span
                    className="frontend-scene-label font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[#171717]/50"
                    key={scene.label}
                  >
                    {scene.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="frontend-final-copy absolute bottom-[6.5vh] right-[6vw] z-30 w-[min(34vw,32rem)] text-right max-[900px]:hidden">
              <div className="frontend-footer-rule mb-4 ml-auto h-px w-full bg-[#171717]/24" />
              <p className="font-mono text-[0.66rem] uppercase leading-[1.7] tracking-[0.14em] text-[#171717]/48">
                The best interface is not decoration. It is a visible expression
                of a reliable system underneath.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
