// src/components/home/SkillsDrawer.tsx
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import arrowUpRightIcon from "@/assets/home/skills/ui/arrow-up-right.svg";
import chevronRightIcon from "@/assets/home/skills/ui/chevron-right.svg";
import { SKILLS_DATA } from "@/data/home/skills/data-skills";

type SkillsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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
}: SkillsDrawerProps) {
  const drawerRef = useRef<HTMLElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollContentRef = useRef<HTMLDivElement | null>(null);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const scrollThumbRef = useRef<HTMLDivElement | null>(null);
  const idleStretchTimelineRef = useRef<gsap.core.Timeline | null>(null);

  const scrollSyncFrameRef = useRef<number | null>(null);
  const scrollThumbDraggingRef = useRef(false);
  const scrollThumbPointerIdRef = useRef<number | null>(null);
  const scrollThumbStartClientYRef = useRef(0);
  const scrollThumbStartScrollTopRef = useRef(0);

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

  //The native scroll container remains responsible for the actual scrolling so
  //wheel, touch, trackpad and keyboard movement stay browser-fast. This custom
  //thumb is only a visual/drag affordance, kept in sync imperatively without
  //putting high-frequency scroll position into React state.
  const syncScrollThumb = useCallback(() => {
    const scroll = scrollRef.current;
    const track = scrollTrackRef.current;
    const thumb = scrollThumbRef.current;

    if (!scroll || !track || !thumb) {
      return;
    }

    const viewportHeight = scroll.clientHeight;
    const contentHeight = scroll.scrollHeight;
    const trackHeight = track.clientHeight;
    const maxScrollTop = Math.max(contentHeight - viewportHeight, 0);
    const isScrollable = maxScrollTop > 1 && trackHeight > 1;

    track.dataset.scrollable = isScrollable ? "true" : "false";

    if (!isScrollable) {
      thumb.style.height = "0px";
      thumb.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    const minimumThumbHeight = 44;
    const proportionalThumbHeight =
      trackHeight * (viewportHeight / Math.max(contentHeight, 1));
    const thumbHeight = Math.min(
      trackHeight,
      Math.max(minimumThumbHeight, proportionalThumbHeight),
    );
    const maxThumbTravel = Math.max(trackHeight - thumbHeight, 0);
    const progress = scroll.scrollTop / maxScrollTop;
    const thumbY = progress * maxThumbTravel;

    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translate3d(0, ${thumbY}px, 0)`;
  }, []);

  const scheduleScrollThumbSync = useCallback(() => {
    if (scrollSyncFrameRef.current !== null) {
      return;
    }

    scrollSyncFrameRef.current = requestAnimationFrame(() => {
      scrollSyncFrameRef.current = null;
      syncScrollThumb();
    });
  }, [syncScrollThumb]);

  const handleScrollTrackPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.target === scrollThumbRef.current) {
        return;
      }

      const scroll = scrollRef.current;
      const track = scrollTrackRef.current;
      const thumb = scrollThumbRef.current;

      if (!scroll || !track || !thumb) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const trackRect = track.getBoundingClientRect();
      const thumbHeight = thumb.offsetHeight;
      const maxThumbTravel = Math.max(trackRect.height - thumbHeight, 0);
      const maxScrollTop = Math.max(
        scroll.scrollHeight - scroll.clientHeight,
        0,
      );

      if (maxThumbTravel <= 0 || maxScrollTop <= 0) {
        return;
      }

      const nextThumbY = Math.min(
        Math.max(event.clientY - trackRect.top - thumbHeight / 2, 0),
        maxThumbTravel,
      );

      scroll.scrollTop = (nextThumbY / maxThumbTravel) * maxScrollTop;
      syncScrollThumb();
    },
    [syncScrollThumb],
  );

  const beginScrollThumbDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const scroll = scrollRef.current;

      if (!scroll) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      scrollThumbDraggingRef.current = true;
      scrollThumbPointerIdRef.current = event.pointerId;
      scrollThumbStartClientYRef.current = event.clientY;
      scrollThumbStartScrollTopRef.current = scroll.scrollTop;

      scrollTrackRef.current?.setAttribute("data-dragging", "true");
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const moveScrollThumb = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        !scrollThumbDraggingRef.current ||
        scrollThumbPointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      const scroll = scrollRef.current;
      const track = scrollTrackRef.current;
      const thumb = scrollThumbRef.current;

      if (!scroll || !track || !thumb) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const maxScrollTop = Math.max(
        scroll.scrollHeight - scroll.clientHeight,
        0,
      );
      const maxThumbTravel = Math.max(
        track.clientHeight - thumb.offsetHeight,
        0,
      );

      if (maxScrollTop <= 0 || maxThumbTravel <= 0) {
        return;
      }

      const deltaY = event.clientY - scrollThumbStartClientYRef.current;

      scroll.scrollTop =
        scrollThumbStartScrollTopRef.current +
        deltaY * (maxScrollTop / maxThumbTravel);

      syncScrollThumb();
    },
    [syncScrollThumb],
  );

  const finishScrollThumbDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        scrollThumbPointerIdRef.current !== null &&
        scrollThumbPointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      scrollThumbDraggingRef.current = false;
      scrollThumbPointerIdRef.current = null;
      scrollTrackRef.current?.setAttribute("data-dragging", "false");

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      scheduleScrollThumbSync();
    },
    [scheduleScrollThumbSync],
  );

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

  //Keep the visual thumb synchronized with native scroll geometry. Resize
  //observation covers viewport changes as well as content-height changes from
  //fonts/assets, while requestAnimationFrame coalesces fast wheel/trackpad input.
  useEffect(() => {
    const scroll = scrollRef.current;
    const scrollContent = scrollContentRef.current;

    if (!scroll || !scrollContent) {
      return;
    }

    scheduleScrollThumbSync();

    scroll.addEventListener("scroll", scheduleScrollThumbSync, {
      passive: true,
    });

    const resizeObserver = new ResizeObserver(scheduleScrollThumbSync);
    resizeObserver.observe(scroll);
    resizeObserver.observe(scrollContent);

    window.addEventListener("resize", scheduleScrollThumbSync, {
      passive: true,
    });

    return () => {
      scroll.removeEventListener("scroll", scheduleScrollThumbSync);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleScrollThumbSync);
    };
  }, [scheduleScrollThumbSync]);

  //Opening makes the scrollbar eligible to appear; closing hides it via CSS.
  //A fresh sync on every state change makes sure the thumb is correctly sized
  //before the user starts scrolling the newly opened drawer.
  useEffect(() => {
    const frame = requestAnimationFrame(scheduleScrollThumbSync);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [open, scheduleScrollThumbSync]);

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

      if (scrollSyncFrameRef.current !== null) {
        cancelAnimationFrame(scrollSyncFrameRef.current);
      }
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
        data-open={open ? "true" : "false"}
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
            overscroll-behavior: contain;
            scroll-behavior: auto;
          }

          .skills-drawer-scroll::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }

          .skills-drawer-scrollbar {
            position: absolute;
            bottom: 1rem;
            right: 0.48rem;
            top: 1rem;
            z-index: 35;
            width: 4px;
            border-radius: 9999px;
            background: rgba(23, 23, 23, 0.055);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
              opacity 180ms ease,
              visibility 180ms ease,
              background-color 180ms ease;
          }

          .skills-drawer[data-open="true"]
            .skills-drawer-scrollbar[data-scrollable="true"] {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
          }

          .skills-drawer-scrollbar:hover,
          .skills-drawer-scrollbar[data-dragging="true"] {
            background: rgba(23, 23, 23, 0.085);
          }

          .skills-drawer-scrollbar-thumb {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            min-height: 2.75rem;
            border-radius: inherit;
            background: rgba(23, 23, 23, 0.34);
            cursor: grab;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            will-change: transform, height;
            transition: background-color 160ms ease;
          }

          .skills-drawer-scrollbar-thumb:hover,
          .skills-drawer-scrollbar[data-dragging="true"]
            .skills-drawer-scrollbar-thumb {
            background: rgba(23, 23, 23, 0.52);
          }

          .skills-drawer-scrollbar[data-dragging="true"]
            .skills-drawer-scrollbar-thumb {
            cursor: grabbing;
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

            .skills-drawer-scrollbar {
              right: 0.32rem;
              width: 3px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .skills-drawer-tech,
            .skills-drawer-contact,
            .skills-drawer-scrollbar,
            .skills-drawer-scrollbar-thumb {
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

          <img
            alt=""
            aria-hidden="true"
            className={`relative z-10 mt-2 size-3 opacity-80 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
            src={chevronRightIcon}
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

        {/*
          Keep the browser's native overflow mechanics for immediate wheel,
          trackpad, touch and keyboard response. Stopping wheel propagation here
          prevents the page-level scroll-lock controller from also reacting to
          the same gesture while the pointer is over the drawer.
        */}
        <div
          className="skills-drawer-scroll h-full overflow-y-auto px-[clamp(1.5rem,3vw,2.6rem)] pb-[clamp(1.5rem,4vh,2.8rem)] pt-[clamp(1.4rem,3vh,2.2rem)] outline-none max-[680px]:px-5"
          id="skills-drawer-scroll"
          onTouchMove={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
          ref={scrollRef}
          tabIndex={open ? 0 : -1}
        >
          <div ref={scrollContentRef}>
            <header className="mb-[clamp(1.6rem,3vh,2.35rem)]">
              <h2 className="font-sans text-[clamp(2.45rem,2vw,4.2rem)] font-semibold uppercase leading-[0.82] tracking-[-0.075em] max-[680px]:text-[2.65rem]">
                {SKILLS_DATA.title}
              </h2>

              <div className="mt-4 h-px bg-[#171717]/12" />
            </header>

            <DrawerSection
              eyebrow={SKILLS_DATA.currentRoles.eyebrow}
              showRule={false}
              useColon
            >
              <div className="space-y-4">
                {SKILLS_DATA.currentRoles.roles.map((role, index) => (
                  <div
                    className={
                      index === 0 ? "" : "border-t border-[#171717]/10 pt-4"
                    }
                    key={role.title}
                  >
                    <div className="font-sans text-[clamp(1.35rem,2vw,1.75rem)] font-medium tracking-[-0.045em]">
                      {role.title}
                    </div>

                    <p className="mt-1.5 max-w-[25rem] font-[Garamond,_'Times_New_Roman',_serif] text-[0.94rem] leading-[1.45] text-[#171717]/52">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection
              eyebrow={SKILLS_DATA.location.eyebrow}
              showRule={false}
              useColon
            >
              <div className="font-sans text-[1rem] font-medium tracking-[-0.025em] text-[#171717]/78">
                {SKILLS_DATA.location.value}
              </div>
            </DrawerSection>

            <DrawerSection eyebrow={SKILLS_DATA.experience.eyebrow}>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[1rem] bg-[#171717]/[0.035] p-4">
                  <div className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-[#171717]/38">
                    {SKILLS_DATA.experience.yearsLabel}
                  </div>

                  <div className="mt-2 font-sans text-[clamp(1.8rem,3vw,2.5rem)] font-semibold tracking-[-0.06em]">
                    {SKILLS_DATA.experience.years}
                  </div>
                </div>

                <div className="rounded-[1rem] bg-[#171717]/[0.035] p-4">
                  <div className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-[#171717]/38">
                    {SKILLS_DATA.experience.focusLabel}
                  </div>

                  <div className="mt-2 font-sans text-[1rem] font-medium leading-[1.2] tracking-[-0.025em]">
                    {SKILLS_DATA.experience.focusLines.map((line, index) => (
                      <span key={line}>
                        {line}
                        {index <
                        SKILLS_DATA.experience.focusLines.length - 1 ? (
                          <br />
                        ) : null}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </DrawerSection>

            <DrawerSection eyebrow={SKILLS_DATA.technologiesEyebrow}>
              <div className="grid grid-cols-2 gap-2.5 max-[420px]:grid-cols-1">
                {SKILLS_DATA.primaryTechnologies.map((technology) => (
                  <div
                    className="skills-drawer-tech flex min-w-0 items-center gap-3 rounded-[1rem] bg-[#171717]/[0.018] p-3"
                    key={technology.name}
                  >
                    <span className="block size-10 shrink-0">
                      <img
                        alt=""
                        aria-hidden="true"
                        className="size-full object-contain"
                        src={technology.iconSrc}
                      />
                    </span>

                    <span className="min-w-0 truncate font-sans text-[0.92rem] font-semibold tracking-[-0.025em]">
                      {technology.name}
                    </span>
                  </div>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection eyebrow={SKILLS_DATA.contactEyebrow}>
              <div className="space-y-1">
                {SKILLS_DATA.contacts.map((contact) => (
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

                    <img
                      alt=""
                      aria-hidden="true"
                      className="size-3.5 opacity-[0.38]"
                      src={arrowUpRightIcon}
                    />
                  </a>
                ))}
              </div>
            </DrawerSection>
          </div>
        </div>

        {/*
          The visible scrollbar is deliberately separate from the native
          scrollbar, which remains hidden. It only appears while the drawer is
          open AND the content actually overflows. Dragging the thumb writes
          directly to native scrollTop, so there is no smooth-scroll lag.
        */}
        <div
          aria-hidden="true"
          className="skills-drawer-scrollbar"
          data-dragging="false"
          data-scrollable="false"
          onPointerDown={handleScrollTrackPointerDown}
          ref={scrollTrackRef}
        >
          <div
            className="skills-drawer-scrollbar-thumb"
            onLostPointerCapture={finishScrollThumbDrag}
            onPointerCancel={finishScrollThumbDrag}
            onPointerDown={beginScrollThumbDrag}
            onPointerMove={moveScrollThumb}
            onPointerUp={finishScrollThumbDrag}
            ref={scrollThumbRef}
          />
        </div>
      </aside>
    </>
  );
}
