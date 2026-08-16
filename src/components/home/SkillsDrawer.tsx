import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SVGProps,
} from "react";

type SkillsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yearsOfExperience?: string;
};

type TechnologyKind =
  | "react"
  | "typescript"
  | "tanstack"
  | "next"
  | "gsap"
  | "dotnet"
  | "aws"
  | "postgres";

type Technology = {
  kind: TechnologyKind;
  name: string;
};

const PRIMARY_TECHNOLOGIES: readonly Technology[] = [
  {
    kind: "react",
    name: "React",
  },
  {
    kind: "typescript",
    name: "TypeScript",
  },
  {
    kind: "tanstack",
    name: "TanStack",
  },
  {
    kind: "next",
    name: "Next.js",
  },
  {
    kind: "gsap",
    name: "GSAP",
  },
  {
    kind: "dotnet",
    name: "C# / .NET",
  },
  {
    kind: "aws",
    name: "AWS",
  },
  {
    kind: "postgres",
    name: "PostgreSQL",
  },
] as const;

type IconProps = SVGProps<SVGSVGElement>;

function TechnologyMark({ kind }: { kind: TechnologyKind }) {
  switch (kind) {
    case "react":
      return (
        <svg aria-hidden="true" className="size-full" viewBox="0 0 40 40">
          <circle cx="20" cy="20" fill="#61DAFB" r="3.25" />
          <g
            fill="none"
            stroke="#61DAFB"
            strokeWidth="1.9"
            transform="translate(20 20)"
          >
            <ellipse rx="16" ry="6.2" />
            <ellipse rx="16" ry="6.2" transform="rotate(60)" />
            <ellipse rx="16" ry="6.2" transform="rotate(120)" />
          </g>
        </svg>
      );

    case "typescript":
      return (
        <svg aria-hidden="true" className="size-full" viewBox="0 0 40 40">
          <rect fill="#3178C6" height="40" rx="8" width="40" />
          <text
            fill="white"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="17"
            fontWeight="700"
            x="7.2"
            y="28"
          >
            TS
          </text>
        </svg>
      );

    case "tanstack":
      return (
        <svg aria-hidden="true" className="size-full" viewBox="0 0 40 40">
          <rect fill="#111827" height="40" rx="8" width="40" />
          <path
            d="M7 11h26l-5.3 6.1H12.3L7 11Zm5.3 8.4h15.4l-4.6 5.3h-6.2l-4.6-5.3Zm4.6 7.7h6.2L20 31l-3.1-3.9Z"
            fill="#F97316"
          />
          <path d="M7 11h13v6.1h-7.7L7 11Z" fill="#EF4444" />
          <path d="M20 11h13l-5.3 6.1H20V11Z" fill="#22C55E" />
        </svg>
      );

    case "next":
      return (
        <svg aria-hidden="true" className="size-full" viewBox="0 0 40 40">
          <circle cx="20" cy="20" fill="#0A0A0A" r="20" />
          <path
            d="M11 29V11h3.3l13 16.6"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M26.5 11v12.1"
            stroke="white"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
        </svg>
      );

    case "gsap":
      return (
        <svg aria-hidden="true" className="size-full" viewBox="0 0 40 40">
          <rect fill="#0B0D0C" height="40" rx="8" width="40" />
          <path
            d="M8.5 12h23l-5.9 5.2H8.5V12Zm0 8.1h15l-5.9 5.1H8.5v-5.1Zm0 8h8.1l-4.4 3.9H8.5v-3.9Z"
            fill="#88CE02"
          />
        </svg>
      );

    case "dotnet":
      return (
        <svg aria-hidden="true" className="size-full" viewBox="0 0 40 40">
          <rect fill="#512BD4" height="40" rx="8" width="40" />
          <circle cx="9" cy="27.2" fill="white" r="1.9" />
          <path
            d="M13 14.2h3.3l8.3 12.3V14.2h3.2v17h-3.2L16.2 19v12.2H13v-17Zm16.8 0H38v2.8h-5v4.1h4.3v2.7H33v4.6h5.2v2.8h-8.4v-17Z"
            fill="white"
          />
        </svg>
      );

    case "aws":
      return (
        <svg aria-hidden="true" className="size-full" viewBox="0 0 40 40">
          <rect fill="#FFFFFF" height="40" rx="8" width="40" />
          <text
            fill="#232F3E"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="13.5"
            fontWeight="700"
            x="6.2"
            y="22.2"
          >
            aws
          </text>
          <path
            d="M8 27.1c6.4 3.1 14.1 3.2 21.1.4"
            fill="none"
            stroke="#FF9900"
            strokeLinecap="round"
            strokeWidth="2.1"
          />
          <path
            d="m27.4 26.2 2.5 1.1-1.2 2.3"
            fill="none"
            stroke="#FF9900"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      );

    case "postgres":
      return (
        <svg aria-hidden="true" className="size-full" viewBox="0 0 40 40">
          <rect fill="#336791" height="40" rx="8" width="40" />
          <ellipse
            cx="20"
            cy="12.2"
            fill="none"
            rx="9.8"
            ry="4.2"
            stroke="white"
            strokeWidth="1.8"
          />
          <path
            d="M10.2 12.2v14.5c0 2.3 4.4 4.2 9.8 4.2s9.8-1.9 9.8-4.2V12.2M10.2 19.5c0 2.3 4.4 4.2 9.8 4.2s9.8-1.9 9.8-4.2"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}

function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
    </svg>
  );
}

function ChevronIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m9 5 7 7-7 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DrawerSection({
  eyebrow,
  children,
  className = "",
  showRule = true,
  useColon = false,
}: {
  eyebrow: string;
  children: ReactNode;
  className?: string;
  showRule?: boolean;
  useColon?: boolean;
}) {
  return (
    <section className={`skills-drawer-section ${className}`}>
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-[0.55rem] font-semibold uppercase tracking-[0.17em] text-[#171717]/42">
          {eyebrow}
          {useColon ? ":" : ""}
        </span>

        {showRule ? (
          <span className="h-px min-w-0 flex-1 bg-[#171717]/10" />
        ) : null}
      </div>

      {children}
    </section>
  );
}

export default function SkillsDrawer({
  open,
  onOpenChange,
  yearsOfExperience,
}: SkillsDrawerProps) {
  const drawerRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLButtonElement | null>(null);
  const idleStretchTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const drawerWidthRef = useRef(0);
  const closedXRef = useRef(0);
  const draggingRef = useRef(false);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartClientXRef = useRef(0);
  const dragStartDrawerXRef = useRef(0);
  const dragLastClientXRef = useRef(0);
  const dragLastTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const suppressHandleClickRef = useRef(false);

  const openRef = useRef(open);
  openRef.current = open;

  const calculateDrawerMetrics = useCallback(() => {
    const drawer = drawerRef.current;

    if (!drawer) {
      return;
    }

    const width = drawer.offsetWidth;

    drawerWidthRef.current = width;

    //The drawer surface itself is completely outside the viewport when closed.
    //The Skills tab remains visible only because it is absolutely positioned
    //past the drawer's right edge. There is no persistent white sheet/sliver.
    closedXRef.current = -Math.max(width, 0);
  }, []);

  const setDrawerPositionImmediately = useCallback(
    (nextOpen: boolean) => {
      const drawer = drawerRef.current;

      if (!drawer) {
        return;
      }

      calculateDrawerMetrics();

      gsap.set(drawer, {
        x: nextOpen ? 0 : closedXRef.current,
      });
    },
    [calculateDrawerMetrics],
  );

  //Measure before paint so the initial page never flashes the full white drawer.
  useLayoutEffect(() => {
    const drawer = drawerRef.current;

    if (!drawer) {
      return;
    }

    setDrawerPositionImmediately(openRef.current);

    function handleResize() {
      if (draggingRef.current) {
        return;
      }

      setDrawerPositionImmediately(openRef.current);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setDrawerPositionImmediately]);

  //Controlled open/close animation. Opening deliberately overshoots with an
  //elastic spring, while closing is cleaner and faster so the drawer never feels
  //sluggish when the user clicks away.
  useEffect(() => {
    const drawer = drawerRef.current;
    const overlay = overlayRef.current;

    if (!drawer || !overlay || draggingRef.current) {
      return;
    }

    calculateDrawerMetrics();

    gsap.killTweensOf(drawer);
    gsap.killTweensOf(overlay);

    gsap.set(drawer, {
      scaleX: 1,
      transformOrigin: "left center",
    });

    gsap.to(drawer, {
      x: open ? 0 : closedXRef.current,
      duration: open ? 0.92 : 0.58,
      ease: open ? "elastic.out(1, 0.62)" : "power4.inOut",
      overwrite: true,
    });

    gsap.to(overlay, {
      autoAlpha: open ? 1 : 0,
      duration: open ? 0.34 : 0.24,
      ease: "power2.out",
      overwrite: true,
    });
  }, [calculateDrawerMetrics, open]);

  //The idle affordance never changes drawer.x. Real drag/open/close own that
  //property exclusively. Instead, the ENTIRE closed white sheet stretches a
  //maximum of ~6px toward the viewport using scaleX from its left edge.
  //
  //Because the drawer is translated exactly one full drawer-width offscreen,
  //scaleX > 1 temporarily exposes only those few pixels. Returning to scaleX 1
  //makes the sheet completely disappear again, leaving only the attached tab.
  useEffect(() => {
    const drawer = drawerRef.current;

    if (!drawer || open) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const desktopHandleQuery = window.matchMedia("(min-width: 1101px)");

    if (prefersReducedMotion || !desktopHandleQuery.matches) {
      return;
    }

    calculateDrawerMetrics();

    const drawerWidth = Math.max(drawerWidthRef.current, 1);
    const stretchDistancePx = 0;
    const stretchedScaleX = 1 + stretchDistancePx / drawerWidth;

    gsap.set(drawer, {
      scaleX: 1,
      transformOrigin: "left center",
    });

    const timeline = gsap.timeline({
      delay: 0.85,
    //   repeat: -1,
    //   repeatDelay: 5,
    });

    idleStretchTimelineRef.current = timeline;

    timeline
      .to(drawer, {
        scaleX: stretchedScaleX,
        duration: 0.5,
        ease: "sine.inOut",
      })
      .to(drawer, {
        scaleX: 1,
        duration: 0.72,
        ease: "sine.inOut",
      });

    return () => {
      timeline.kill();

      if (idleStretchTimelineRef.current === timeline) {
        idleStretchTimelineRef.current = null;
      }

      gsap.set(drawer, {
        scaleX: 1,
      });
    };
  }, [calculateDrawerMetrics, open]);

  //Escape and click-away are both explicit close gestures.
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  const finishDrag = useCallback(
    (clientX: number) => {
      const drawer = drawerRef.current;

      if (!drawer || !draggingRef.current) {
        return;
      }

      const pointerId = dragPointerIdRef.current;

      draggingRef.current = false;
      dragPointerIdRef.current = null;

      if (
        pointerId !== null &&
        handleRef.current?.hasPointerCapture(pointerId)
      ) {
        handleRef.current.releasePointerCapture(pointerId);
      }

      calculateDrawerMetrics();

      const currentX = Number(gsap.getProperty(drawer, "x")) || 0;
      const closedX = closedXRef.current;
      const openRatio =
        closedX === 0
          ? 1
          : 1 - Math.abs(currentX / Math.max(Math.abs(closedX), 1));

      const travelled = clientX - dragStartClientXRef.current;
      const velocity = dragVelocityRef.current;

      const shouldOpen =
        velocity > 0.28 ||
        (velocity > -0.28 &&
          (openRatio >= 0.46 || (!openRef.current && travelled > 72)));

      const shouldClose =
        velocity < -0.28 ||
        (velocity < 0.28 &&
          (openRatio < 0.46 || (openRef.current && travelled < -72)));

      const nextOpen = shouldClose
        ? false
        : shouldOpen
          ? true
          : openRef.current;

      //Force the drawer to settle even when the controlled boolean does not
      //change, because the user may have dragged it partway and released.
      gsap.to(drawer, {
        x: nextOpen ? 0 : closedX,
        duration: nextOpen ? 0.78 : 0.5,
        ease: nextOpen ? "elastic.out(1, 0.64)" : "power4.inOut",
        overwrite: true,
      });

      if (nextOpen !== openRef.current) {
        onOpenChange(nextOpen);
      } else if (!nextOpen) {
        idleStretchTimelineRef.current?.restart(true);
      }
    },
    [calculateDrawerMetrics, onOpenChange],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const drawer = drawerRef.current;

      if (!drawer || !draggingRef.current) {
        return;
      }

      const now = performance.now();
      const elapsed = Math.max(now - dragLastTimeRef.current, 1);
      const deltaSinceLast = event.clientX - dragLastClientXRef.current;

      dragVelocityRef.current = deltaSinceLast / elapsed;
      dragLastClientXRef.current = event.clientX;
      dragLastTimeRef.current = now;

      calculateDrawerMetrics();

      const delta = event.clientX - dragStartClientXRef.current;

      if (Math.abs(delta) > 6) {
        suppressHandleClickRef.current = true;
      }

      const nextX = Math.min(
        0,
        Math.max(closedXRef.current, dragStartDrawerXRef.current + delta),
      );

      gsap.set(drawer, {
        x: nextX,
      });
    },
    [calculateDrawerMetrics],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      finishDrag(event.clientX);
    },
    [finishDrag, handlePointerMove],
  );

  const beginDrag = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drawer = drawerRef.current;

      if (!drawer) {
        return;
      }

      calculateDrawerMetrics();

      idleStretchTimelineRef.current?.pause();
      gsap.killTweensOf(drawer);
      gsap.set(drawer, {
        scaleX: 1,
        transformOrigin: "left center",
      });

      draggingRef.current = true;
      dragPointerIdRef.current = event.pointerId;
      dragStartClientXRef.current = event.clientX;
      dragStartDrawerXRef.current = Number(gsap.getProperty(drawer, "x")) || 0;
      dragLastClientXRef.current = event.clientX;
      dragLastTimeRef.current = performance.now();
      dragVelocityRef.current = 0;
      suppressHandleClickRef.current = false;

      event.currentTarget.setPointerCapture(event.pointerId);

      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [calculateDrawerMetrics, handlePointerMove, handlePointerUp],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <>
      <button
        ref={overlayRef}
        aria-hidden={!open}
        aria-label="Close skills drawer"
        className={`fixed inset-0 z-[720] cursor-default bg-[#171717]/[0.035] backdrop-blur-[1px] ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        onClick={() => onOpenChange(false)}
        tabIndex={open ? 0 : -1}
        type="button"
      />

      <aside
        ref={drawerRef}
        aria-hidden={!open}
        aria-label="Skills and profile drawer"
        className={`skills-drawer fixed bottom-0 left-0 top-0 z-[760] w-[min(32vw,32rem)] min-w-[25rem] bg-white text-[#171717] max-[1100px]:w-[min(66vw,31rem)] max-[1100px]:min-w-0 max-[680px]:w-[88vw] max-[680px]:max-w-[24rem] ${
          open ? "shadow-[24px_0_80px_rgba(23,23,23,0.11)]" : "shadow-none"
        }`}
      >
        <style>{`
          .skills-drawer {
            will-change: transform;
            overscroll-behavior: contain;
          }

          .skills-drawer-scroll {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .skills-drawer-scroll::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }

          .skills-drawer-section + .skills-drawer-section {
            margin-top: clamp(1.45rem,2.5vh,2.1rem);
          }

          .skills-drawer-tech {
            transition:
              transform 220ms cubic-bezier(.2,.8,.2,1),
              background-color 220ms ease;
          }

          .skills-drawer-tech:hover {
            transform: translateY(-2px);
            background: rgba(23,23,23,0.035);
          }

          .skills-drawer-contact {
            transition:
              transform 210ms cubic-bezier(.2,.8,.2,1),
              background-color 210ms ease;
          }

          .skills-drawer-contact:hover {
            transform: translateX(3px);
            background: rgba(23,23,23,0.035);
          }

          .skills-drawer-handle {
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
          }

          .skills-drawer-handle-paper {
            pointer-events: none;
            position: absolute;
            bottom: 0;
            left: -4px;
            right: 0;
            top: 0;
            z-index: 0;
            border-radius: 0 0.9rem 0.9rem 0;
            background: #fff;
            transform-origin: left center;
            will-change: transform;
          }

          @media (max-width: 680px) {
            .skills-drawer {
              box-shadow: 18px 0 58px rgba(23,23,23,0.12);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .skills-drawer-tech,
            .skills-drawer-contact {
              transition: none;
            }
          }
        `}</style>

        {/*
          The exposed white tab belongs to the drawer itself, so dragging it moves
          the real panel under the pointer instead of firing an abstract toggle.
        */}
        <button
          ref={handleRef}
          aria-expanded={open}
          aria-label={open ? "Close skills drawer" : "Open skills drawer"}
          className="skills-drawer-handle absolute right-[-2.37rem] top-[42%] z-20 flex h-[5.9rem] w-[2.45rem] -translate-y-1/2 cursor-ew-resize flex-col items-center justify-center text-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/15 max-[1100px]:hidden"
          onClick={() => {
            //A pointer drag naturally emits a click after pointerup in browsers.
            //Suppress that synthetic click when the handle actually travelled,
            //otherwise a successful pull-open would immediately toggle closed.
            if (suppressHandleClickRef.current) {
              suppressHandleClickRef.current = false;
              return;
            }

            onOpenChange(!openRef.current);
          }}
          onPointerDown={beginDrag}
          type="button"
        >
          <span aria-hidden="true" className="skills-drawer-handle-paper" />

          <span className="relative z-10 [writing-mode:vertical-rl] rotate-180 font-mono text-[0.45rem] font-bold uppercase tracking-[0.15em]">
            Skills
          </span>

          <ChevronIcon
            className={`relative z-10 mt-2 size-3 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/*
          Hidden left overscan: the open elastic spring can briefly overshoot
          several pixels without exposing a visual gap at the viewport edge.
          It does not affect layout or the drawer's measured width.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-[-14px] w-4 bg-white"
        />

        <div className="skills-drawer-scroll h-full overflow-y-auto px-[clamp(1.5rem,3vw,2.6rem)] pb-[clamp(1.5rem,4vh,2.8rem)] pt-[clamp(1.4rem,3vh,2.2rem)] max-[680px]:px-5">
          <header className="mb-[clamp(1.6rem,3vh,2.35rem)]">
            <h2 className="font-sans text-[clamp(2.45rem,4.2vw,4.2rem)] font-semibold uppercase leading-[0.82] tracking-[-0.075em] max-[680px]:text-[2.65rem]">
              Skills
            </h2>

            <div className="mt-4 h-px bg-[#171717]/12" />
          </header>

          <DrawerSection eyebrow="Current role" showRule={false} useColon>
            <div>
              <div className="font-sans text-[clamp(1.35rem,2vw,1.75rem)] font-medium tracking-[-0.045em]">
                Software Engineer
              </div>

              <p className="mt-1.5 max-w-[25rem] font-[Garamond,_'Times_New_Roman',_serif] text-[0.94rem] leading-[1.45] text-[#171717]/52">
                React / TypeScript product interfaces with C# / .NET API and
                backend systems.
              </p>
            </div>
          </DrawerSection>

          <DrawerSection eyebrow="Location" showRule={false} useColon>
            <div className="font-sans text-[1rem] font-medium tracking-[-0.025em] text-[#171717]/78">
              Ghana
            </div>
          </DrawerSection>

          <DrawerSection eyebrow="Experience">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-[1rem] bg-[#171717]/[0.035] p-4">
                <div className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-[#171717]/38">
                  Years
                </div>

                <div className="mt-2 font-sans text-[clamp(1.8rem,3vw,2.5rem)] font-semibold tracking-[-0.06em]">
                  {yearsOfExperience ?? "—"}
                </div>
              </div>

              <div className="rounded-[1rem] bg-[#171717]/[0.035] p-4">
                <div className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-[#171717]/38">
                  Focus
                </div>

                <div className="mt-2 font-sans text-[1rem] font-medium leading-[1.2] tracking-[-0.025em]">
                  Front-end
                  <br />+ Backend
                </div>
              </div>
            </div>
          </DrawerSection>

          <DrawerSection eyebrow="Primary technologies">
            <div className="grid grid-cols-2 gap-2.5 max-[420px]:grid-cols-1">
              {PRIMARY_TECHNOLOGIES.map((technology) => (
                <div
                  className="skills-drawer-tech flex min-w-0 items-center gap-3 rounded-[1rem] bg-[#171717]/[0.018] p-3"
                  key={technology.name}
                >
                  <span className="block size-10 shrink-0">
                    <TechnologyMark kind={technology.kind} />
                  </span>

                  <span className="min-w-0 truncate font-sans text-[0.92rem] font-semibold tracking-[-0.025em]">
                    {technology.name}
                  </span>
                </div>
              ))}
            </div>
          </DrawerSection>

          <DrawerSection eyebrow="Contact">
            <div className="space-y-1">
              {[
                {
                  label: "Email",
                  value: "alepnorod@gmail.com",
                  href: "mailto:alepnorod@gmail.com",
                  external: false,
                },
                {
                  label: "WhatsApp",
                  value: "+234 906 410 8594",
                  href: "https://wa.me/2349064108594",
                  external: true,
                },
                {
                  label: "Call",
                  value: "+233 257 880 061",
                  href: "tel:+233257880061",
                  external: false,
                },
                {
                  label: "LinkedIn",
                  value: "doron-pela-48aa62170",
                  href: "https://www.linkedin.com/in/doron-pela-48aa62170/",
                  external: true,
                },
                {
                  label: "GitHub",
                  value: "doron-pela",
                  href: "https://github.com/doron-pela/",
                  external: true,
                },
              ].map((contact) => (
                <a
                  className="skills-drawer-contact grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[0.85rem] px-2.5 py-2.5 max-[420px]:grid-cols-[4.5rem_minmax(0,1fr)_auto]"
                  href={contact.href}
                  key={contact.label}
                  rel={contact.external ? "noreferrer" : undefined}
                  target={contact.external ? "_blank" : undefined}
                >
                  <span className="font-mono text-[0.5rem] font-semibold uppercase tracking-[0.13em] text-[#171717]/38">
                    {contact.label}
                  </span>

                  <span className="min-w-0 truncate font-sans text-[0.82rem] font-medium tracking-[-0.015em] text-[#171717]/78">
                    {contact.value}
                  </span>

                  <ArrowUpRightIcon className="size-3.5 text-[#171717]/38" />
                </a>
              ))}
            </div>
          </DrawerSection>
        </div>
      </aside>
    </>
  );
}
