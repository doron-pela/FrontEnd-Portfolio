import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useCallback, useEffect, useRef } from "react";

import type {
  LockDirection,
  ScrollLockedSectionControllerProps,
  ScrollSectionRuntime,
} from "@/@types/scroll-locked-section.types";
import { setScrollSectionProgressImmediately } from "@/utils/scroll-locked-section.utils";

gsap.registerPlugin(ScrollToPlugin);

//event.deltaMode is the wheel distance unit. And it can be any one of these, depending on the environment of our application:

//event.deltaY is the scrolling amount (Wheeling amount) +ve = we scrolled down or zoomed out (remember its from (0,0)). -ve, scrolled up or wheeled in.

//DOM_DELTA_PIXEL is the default pixel (px) unit of wheel distance. --- denoted as 0
//DOM_DELTA_LINE is the line (roughly 16 px depending on font) unit of wheel distance. --- denoted as 1
//DOM_DELTA_PAGE is the page (roughly window.innerHeight: the client's/viewport's height) unit of wheel distance --- denoted as 2

//We want to work with pixels, so normalizeWheelDelta()
function normalizeWheelDelta(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * window.innerHeight;
  }

  return event.deltaY;
}

//Keep the output less than 1 (staying within the gsap timeline - 0-1), but also allow for a range between
function clampSectionProgress(value: number, revealedProgress: number) {
  return Math.min(Math.max(value, revealedProgress), 1);
}

export function ScrollLockedSectionController<Section extends string>({
  positions,
  revealDelaySeconds,
  keyMap,
  scrollDurationSeconds,
  runtimesRef,
  programmaticScrollRef,
}: ScrollLockedSectionControllerProps<Section>) {
  const activeLockedSectionRef = useRef<Section | null>(null);
  const lastWindowScrollYRef = useRef(0);
  const touchYRef = useRef<number | null>(null);

  const getRegisteredSections = useCallback(() => {
    return Array.from(runtimesRef.current.values());
  }, [runtimesRef]);

  const getActiveLockedSection = useCallback(() => {
    const activeSection = activeLockedSectionRef.current;

    if (!activeSection) { //No active locked section ref means no section has registered yet
      return null;
    }

    return runtimesRef.current.get(activeSection) ?? null;
  }, [runtimesRef]);

  const snapWindowToSectionLock = useCallback(
    (runtime: ScrollSectionRuntime<Section>) => {
      const lockY = runtime.lockYRef.current ?? runtime.getLockY();

      //If we're there at scrollY (lock point) already, return
      if (Math.abs(window.scrollY - lockY) <= 1) {
        return;
      }

      runtime.snapRef.current = true;

      window.scrollTo({
        top: lockY,
        left: 0,
        behavior: "auto",
      });

      lastWindowScrollYRef.current = lockY;

      requestAnimationFrame(() => {
        runtime.snapRef.current = false;
      });
    },
    [],
  );

  const unlockSectionScroll = useCallback(
    (runtime: ScrollSectionRuntime<Section>) => {
      runtime.lockedRef.current = false;
      touchYRef.current = null;

      if (activeLockedSectionRef.current === runtime.section) {
        activeLockedSectionRef.current = null;
      }
    },
    [],
  );

  const releaseSectionScroll = useCallback(
    (runtime: ScrollSectionRuntime<Section>, direction: LockDirection) => {
      if (!runtime.lockedRef.current) return;

      runtime.releasingRef.current = true;
      runtime.releasedDirectionRef.current = direction;

      setScrollSectionProgressImmediately(
        runtime,
        direction === "forward" ? 1 : runtime.revealedProgress,
      );

      unlockSectionScroll(runtime);

      //Allow scroll events to settle (act as debouncer before declaring lock release), then force the timeline back to 0 when we scroll past about section
      setTimeout(() => {
        runtime.releasingRef.current = false;

        if (direction === "backward" && window.scrollY <= runtime.startY) {
          runtime.releasedDirectionRef.current = null;
          setScrollSectionProgressImmediately(runtime, 0);
        }
      }, 0);
    },
    [unlockSectionScroll],
  );

  //Globally locking the window for about section
  const lockSectionScroll = useCallback(
    (runtime: ScrollSectionRuntime<Section>, direction: LockDirection) => {
      if (
        runtime.lockedRef.current ||
        runtime.releasingRef.current ||
        programmaticScrollRef.current
      ) {
        return;
      }

      const lockY = runtime.getLockY();
      const startProgress =
        direction === "forward" ? runtime.revealedProgress : 1;

      gsap.killTweensOf(window);

      runtime.lockYRef.current = lockY; //Exact global pixel y distance where about section locks
      runtime.lockedRef.current = true;
      activeLockedSectionRef.current = runtime.section;

      runtime.snapRef.current = true;

      window.scrollTo({
        top: lockY,
        left: 0,
        behavior: "auto",
      });

      lastWindowScrollYRef.current = lockY;
      setScrollSectionProgressImmediately(runtime, startProgress);

      requestAnimationFrame(() => {
        runtime.snapRef.current = false;
      });
    },
    [programmaticScrollRef],
  );

  //Locally advancing about section while global window is locked
  const advanceSectionScroll = useCallback(
    (runtime: ScrollSectionRuntime<Section>, deltaY: number) => {
      if (!runtime.lockedRef.current || programmaticScrollRef.current) return; //If our window is not locked at about section

      const distance = Math.max(runtime.getPxDuration(), 1);

      //normalize every user scroll in px as percentage of our timeline (e.g, scroll 2 px out of 10 px of total about distance, then progress is 0.2 through timeline)
      //Then add that to where we are in the timeline to advance us through it.
      const nextProgress = clampSectionProgress(
        runtime.progressRef.current + deltaY / distance,
        runtime.revealedProgress,
      );

      const reachedForwardEnd = nextProgress >= 1 && deltaY > 0;
      const reachedBackwardHandoff =
        nextProgress <= runtime.revealedProgress && deltaY < 0;

      //Do not create a smoothing tween at an ownership boundary because releaseSectionScroll() must own and force the exact final progress.
      if (reachedForwardEnd) {
        releaseSectionScroll(runtime, "forward");
        return;
      }

      if (reachedBackwardHandoff) {
        releaseSectionScroll(runtime, "backward");
        return;
      }

      runtime.progressRef.current = nextProgress;

      if (runtime.timelineRef.current) {
        gsap.to(runtime.timelineRef.current, {
          progress: nextProgress,
          duration: runtime.localProgressTweenDuration,
          ease: "ease.inOut",
          overwrite: true,
        });
      }
    },
    [programmaticScrollRef, releaseSectionScroll],
  );

  const getSectionScrollTarget = useCallback(
    (section: Section) => {
      const runtime = runtimesRef.current.get(section);

      if (runtime) {
        return runtime.getLockY();
      }

      return positions[section];
    },
    [positions, runtimesRef],
  );

  const resetSection = useCallback((runtime: ScrollSectionRuntime<Section>) => {
    setScrollSectionProgressImmediately(runtime, 0);
  }, []);

  //Scroll to a section
  const scrollTo = useCallback(
    (section: Section) => {
      const targetY = getSectionScrollTarget(section);
      const destinationRuntime = runtimesRef.current.get(section) ?? null;
      const revealDelay = revealDelaySeconds[section];
      const registeredSections = getRegisteredSections();

      gsap.killTweensOf(window);

      registeredSections.forEach((runtime) => {
        gsap.killTweensOf(runtime.timelineRef.current);
      });

      programmaticScrollRef.current = true;

      registeredSections.forEach((runtime) => {
        runtime.releasingRef.current = false;
        runtime.releasedDirectionRef.current = null;
        unlockSectionScroll(runtime);

        if (runtime !== destinationRuntime) {
          resetSection(runtime);
        }
      });

      if (destinationRuntime?.timelineRef.current) {
        setScrollSectionProgressImmediately(destinationRuntime, 0);

        gsap.to(destinationRuntime.timelineRef.current, {
          progress: destinationRuntime.revealedProgress,
          duration: Math.max(scrollDurationSeconds - revealDelay, 0),
          delay: revealDelay,
          ease: "ease.inOut",
          overwrite: "auto",
          onUpdate: () => {
            destinationRuntime.progressRef.current =
              destinationRuntime.timelineRef.current?.progress() ??
              destinationRuntime.revealedProgress;
          },
        });
      }

      gsap.to(window, {
        duration: scrollDurationSeconds,
        ease: "ease.inOut",
        overwrite: "auto",
        scrollTo: {
          y: targetY,
          autoKill: false,
        },
        onUpdate: () => {
          lastWindowScrollYRef.current = window.scrollY;

          registeredSections.forEach((runtime) => {
            if (runtime !== destinationRuntime) {
              resetSection(runtime);
            }
          });
        },
        onComplete: () => {
          lastWindowScrollYRef.current = targetY;
          programmaticScrollRef.current = false;

          if (destinationRuntime) {
            destinationRuntime.lockYRef.current = targetY;
            setScrollSectionProgressImmediately(
              destinationRuntime,
              destinationRuntime.revealedProgress,
            );
            lockSectionScroll(destinationRuntime, "forward");
            return;
          }

          registeredSections.forEach(resetSection);
        },
        onInterrupt: () => {
          lastWindowScrollYRef.current = window.scrollY;
          programmaticScrollRef.current = false;
        },
      });
    },
    [
      getRegisteredSections,
      getSectionScrollTarget,
      lockSectionScroll,
      programmaticScrollRef,
      resetSection,
      revealDelaySeconds,
      runtimesRef,
      scrollDurationSeconds,
      unlockSectionScroll,
    ],
  );

  //useEffect for actually applying the functions to event listeners
  useEffect(() => {
    function handleSectionKeyDown(event: KeyboardEvent) {
      const target = event.target;

      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const activeSection = getActiveLockedSection();

      if (activeSection?.lockedRef.current) {
        switch (event.key) {
          case "ArrowDown":
          case "PageDown":
          case " ":
            event.preventDefault();
            advanceSectionScroll(activeSection, window.innerHeight * 0.18);
            return;

          case "ArrowUp":
          case "PageUp":
            event.preventDefault();
            advanceSectionScroll(activeSection, -window.innerHeight * 0.18);
            return;

          default:
            break;
        }
      }

      const section = keyMap[event.key];

      if (section !== undefined) {
        scrollTo(section);
      }
    }

    window.addEventListener("keydown", handleSectionKeyDown);

    return () => {
      window.removeEventListener("keydown", handleSectionKeyDown);
    };
  }, [advanceSectionScroll, getActiveLockedSection, keyMap, scrollTo]);

  //useEffect for actually applying the functions to event listeners
  useEffect(() => {
    function handleWindowScroll() {
      const currentY = window.scrollY;
      const previousY = lastWindowScrollYRef.current;
      const movingForward = currentY > previousY;
      const movingBackward = currentY < previousY;
      const registeredSections = getRegisteredSections();

      if (programmaticScrollRef.current) {
        lastWindowScrollYRef.current = currentY;
        return;
      }

      const activeSection = getActiveLockedSection();

      if (activeSection?.snapRef.current) {
        lastWindowScrollYRef.current = currentY;
        return;
      }

      registeredSections.forEach((runtime) => {
        const lockY = runtime.getLockY();

        //Above a section's reveal range, its timeline must be exactly 0 and the section must remain completely hidden.
        //This also handles a single aggressive upward scroll event that jumps from below the lock point to above the entire section without stopping inside its reveal range.
        if (!runtime.lockedRef.current && currentY <= runtime.startY) {
          runtime.releasedDirectionRef.current = null;
          setScrollSectionProgressImmediately(runtime, 0);
          return;
        }

        //Below a section after it completed forward, its timeline must remain exactly 1 so ScrollTrigger cannot pull it back into a visible intermediate state.
        if (
          !runtime.lockedRef.current &&
          currentY > lockY &&
          runtime.releasedDirectionRef.current === "forward"
        ) {
          setScrollSectionProgressImmediately(runtime, 1);
        }

        //The forward release guard is intentionally not cleared merely because aggressive upward scrolling moved above the lock point.
        //It remains active until that section legitimately locks and releases backward, preventing ScrollTrigger from rewinding progress 1 into the visible reveal range.

        if (
          runtime.releasedDirectionRef.current === "backward" &&
          currentY > lockY + 12
        ) {
          runtime.releasedDirectionRef.current = null;
        }
      });

      if (activeSection?.lockedRef.current) {
        const lockY = activeSection.getLockY();
        const lockedY = activeSection.lockYRef.current ?? lockY;
        const deltaY = currentY - lockedY;

        if (Math.abs(deltaY) > 1) {
          snapWindowToSectionLock(activeSection);
          advanceSectionScroll(activeSection, deltaY);
        }

        lastWindowScrollYRef.current = lockedY;
        return;
      }

      if (movingForward) {
        const crossedSection = registeredSections
          .filter((runtime) => {
            const lockY = runtime.getLockY();

            return (
              previousY < lockY &&
              currentY >= lockY &&
              runtime.releasedDirectionRef.current !== "forward"
            );
          })
          .sort((first, second) => first.getLockY() - second.getLockY())[0];

        if (crossedSection) {
          const lockY = crossedSection.getLockY();
          const overshoot = currentY - lockY;

          lockSectionScroll(crossedSection, "forward");

          if (overshoot > 1) {
            requestAnimationFrame(() => {
              advanceSectionScroll(crossedSection, overshoot);
            });
          }

          return;
        }
      }

      if (movingBackward) {
        const crossedSection = registeredSections
          .filter((runtime) => {
            const lockY = runtime.getLockY();

            return (
              previousY > lockY &&
              currentY <= lockY &&
              currentY > runtime.startY &&
              runtime.releasedDirectionRef.current !== "backward"
            );
          })
          .sort((first, second) => second.getLockY() - first.getLockY())[0];

        if (crossedSection) {
          const lockY = crossedSection.getLockY();
          const overshoot = currentY - lockY;

          lockSectionScroll(crossedSection, "backward");

          if (overshoot < -1) {
            requestAnimationFrame(() => {
              advanceSectionScroll(crossedSection, overshoot);
            });
          }

          return;
        }
      }

      lastWindowScrollYRef.current = currentY;
    }

    lastWindowScrollYRef.current = window.scrollY;

    window.addEventListener("scroll", handleWindowScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [
    advanceSectionScroll,
    getActiveLockedSection,
    getRegisteredSections,
    lockSectionScroll,
    programmaticScrollRef,
    snapWindowToSectionLock,
  ]);

  //Applying the functions to event listeners
  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      const activeSection = getActiveLockedSection();

      if (!activeSection?.lockedRef.current || programmaticScrollRef.current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      advanceSectionScroll(activeSection, normalizeWheelDelta(event));
    }

    function handleTouchStart(event: TouchEvent) {
      const activeSection = getActiveLockedSection();

      if (!activeSection?.lockedRef.current || programmaticScrollRef.current) {
        return;
      }

      touchYRef.current = event.touches[0]?.clientY ?? null;
    }

    function handleTouchMove(event: TouchEvent) {
      const activeSection = getActiveLockedSection();

      if (!activeSection?.lockedRef.current || programmaticScrollRef.current) {
        return;
      }

      const currentY = event.touches[0]?.clientY;

      if (currentY === undefined || touchYRef.current === null) return;

      event.preventDefault();
      event.stopPropagation();

      const deltaY = touchYRef.current - currentY;

      touchYRef.current = currentY;

      advanceSectionScroll(activeSection, deltaY);
    }

    window.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    window.addEventListener("touchstart", handleTouchStart, {
      passive: false,
      capture: true,
    });

    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel, {
        capture: true,
      });

      window.removeEventListener("touchstart", handleTouchStart, {
        capture: true,
      });

      window.removeEventListener("touchmove", handleTouchMove, {
        capture: true,
      });
    };
  }, [advanceSectionScroll, getActiveLockedSection, programmaticScrollRef]);

  return null;
}
