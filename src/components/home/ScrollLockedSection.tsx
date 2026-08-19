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
  onCurrentSectionChange,
  restoreState = null,
}: ScrollLockedSectionControllerProps<Section>) {
  const activeLockedSectionRef = useRef<Section | null>(null);
  const currentSectionRef = useRef<Section | null>(null);
  const programmaticNavigationIdRef = useRef(0);
  const hasRestoredStateRef = useRef(false);
  const lastWindowScrollYRef = useRef(0);
  const touchYRef = useRef<number | null>(null);
  const resizingViewportRef = useRef(false);
  const resizeEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  //Browser/TanStack history restoration can establish window.scrollY before the
  //freshly mounted section runtimes have rebuilt their GSAP timelines. Until we
  //explicitly hydrate those runtimes from the restored Y, no scroll event is
  //allowed to be interpreted as organic boundary-crossing input.
  const controllerReadyRef = useRef(false);

  const getRegisteredSections = useCallback(() => {
    return Array.from(runtimesRef.current.values());
  }, [runtimesRef]);

  const publishCurrentSection = useCallback(
    (section: Section) => {
      if (currentSectionRef.current === section) {
        return;
      }

      currentSectionRef.current = section;
      onCurrentSectionChange?.(section);
    },
    [onCurrentSectionChange],
  );

  //Resolve the current global section from the same authored positions already
  //owned by this controller. This keeps Navbar state tied to real scroll state.
  const syncCurrentSectionForWindowY = useCallback(
    (windowY: number) => {
      let currentSection: Section | null = null;
      let currentSectionStartY = Number.NEGATIVE_INFINITY;

      for (const [section, startY] of Object.entries(positions) as Array<
        [Section, number]
      >) {
        if (startY <= windowY && startY >= currentSectionStartY) {
          currentSection = section;
          currentSectionStartY = startY;
        }
      }

      if (currentSection !== null) {
        publishCurrentSection(currentSection);
      }
    },
    [positions, publishCurrentSection],
  );

  const getActiveLockedSection = useCallback(() => {
    const activeSection = activeLockedSectionRef.current;

    if (!activeSection) {
      //No active locked section ref means no section has registered yet
      return null;
    }

    return runtimesRef.current.get(activeSection) ?? null;
  }, [runtimesRef]);

  //When one manual-scroll section owns the global lock, hard-hide every other
  //manual-scroll section at the DOM level. GSAP timelines only animate opacity /
  //visibility, so display:none cannot be undone by a ScrollTrigger refresh when
  //the viewport is resized. Passing null restores the normal timeline-driven UI.
  const isolateLockedSection = useCallback((activeSection: Section | null) => {
    const sectionElements = document.querySelectorAll<HTMLElement>(
      "[data-scroll-locked-section]",
    );

    sectionElements.forEach((element) => {
      const isActiveSection =
        element.dataset.scrollLockedSection === activeSection;

      element.style.display =
        activeSection !== null && !isActiveSection ? "none" : "";
    });
  }, []);

  //Opacity/visibility remain GSAP's responsibility INSIDE a section's reveal
  //range. Outside that range, the section should not participate in rendering at
  //all. This hard display gate makes the global window Y the final authority over
  //whether a manual section is even eligible to exist visually.
  //
  //That matters on browser-history remounts: ScrollTrigger may initialise at an
  //already-deep scroll position before its directional refs have been rebuilt.
  //Even if a stale onUpdate tries to place an old section at revealedProgress,
  //display:none prevents that completed section from appearing over the current
  //one.
  const syncSectionDisplayForWindowY = useCallback(
    (windowY: number, activeSection: Section | null = null) => {
      const sectionElements = document.querySelectorAll<HTMLElement>(
        "[data-scroll-locked-section]",
      );

      sectionElements.forEach((element) => {
        const sectionName = element.dataset.scrollLockedSection;
        const runtime = Array.from(runtimesRef.current.values()).find(
          (candidate) => candidate.section === sectionName,
        );

        if (!runtime) {
          element.style.display = "";
          return;
        }

        if (activeSection !== null) {
          element.style.display =
            runtime.section === activeSection ? "" : "none";
          return;
        }

        const lockY = runtime.getLockY();
        const isInsideGlobalRevealRange =
          windowY > runtime.startY && windowY <= lockY;

        element.style.display = isInsideGlobalRevealRange ? "" : "none";
      });
    },
    [runtimesRef],
  );

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

        //Do not blindly restore display for every manual section. Only sections
        //whose reveal range actually contains the current global Y are eligible
        //to exist once the active lock releases.
        syncSectionDisplayForWindowY(window.scrollY, null);
      }
    },
    [syncSectionDisplayForWindowY],
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
      publishCurrentSection(runtime.section);
      isolateLockedSection(runtime.section);

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
    [isolateLockedSection, programmaticScrollRef, publishCurrentSection],
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

  //When controller state is reconstructed at an already-established global
  //window Y, every non-active manual section must be rebuilt to the timeline
  //state that corresponds to that Y. Resetting every other section to 0 is only
  //correct when the restored window is above those sections. If the restored
  //window is already past a section's lock point, that section has logically
  //completed forward and must stay at progress 1 with the forward-release guard
  //restored so its ScrollTrigger cannot pull it back into the visible reveal
  //range. If the window is inside the reveal range, derive that reveal progress
  //directly from the global Y position.
  const settleSectionForWindowY = useCallback(
    (runtime: ScrollSectionRuntime<Section>, windowY: number) => {
      const lockY = runtime.getLockY();

      runtime.lockedRef.current = false;
      runtime.releasingRef.current = false;
      runtime.lockYRef.current = null;
      runtime.snapRef.current = false;

      if (windowY <= runtime.startY) {
        runtime.releasedDirectionRef.current = null;
        setScrollSectionProgressImmediately(runtime, 0);
        return;
      }

      if (windowY >= lockY) {
        runtime.releasedDirectionRef.current = "forward";
        setScrollSectionProgressImmediately(runtime, 1);
        return;
      }

      const revealDistance = Math.max(lockY - runtime.startY, 1);
      const revealRatio = Math.min(
        Math.max((windowY - runtime.startY) / revealDistance, 0),
        1,
      );

      runtime.releasedDirectionRef.current = null;
      setScrollSectionProgressImmediately(
        runtime,
        revealRatio * runtime.revealedProgress,
      );
    },
    [],
  );

  //Scroll to a section
  const scrollTo = useCallback(
    (section: Section) => {
      const targetY = getSectionScrollTarget(section);
      const destinationRuntime = runtimesRef.current.get(section) ?? null;
      const revealDelay = revealDelaySeconds[section];
      const registeredSections = getRegisteredSections();
      const navigationId = programmaticNavigationIdRef.current + 1;

      //Invalidate the callbacks belonging to any previous authored window
      //scroll BEFORE killing that tween. GSAP fires the previous tween's
      //onInterrupt synchronously when it is killed; without this generation
      //guard that stale callback can publish the intermediate window.scrollY
      //section after the newly clicked navbar destination.
      programmaticNavigationIdRef.current = navigationId;

      gsap.killTweensOf(window);

      registeredSections.forEach((runtime) => {
        gsap.killTweensOf(runtime.timelineRef.current);
      });

      programmaticScrollRef.current = true;
      controllerReadyRef.current = true;

      //Publish only after any older window tween has been invalidated/killed,
      //so the clicked destination is the final section signal for this
      //navigation request.
      publishCurrentSection(section);

      registeredSections.forEach((runtime) => {
        runtime.releasingRef.current = false;
        runtime.releasedDirectionRef.current = null;
        unlockSectionScroll(runtime);

        if (runtime !== destinationRuntime) {
          resetSection(runtime);
        }
      });

      //Programmatic navigation owns presentation while it is moving. Make only
      //the destination manual section available; going to a non-manual target
      //such as init keeps all manual sections hard-hidden.
      if (destinationRuntime) {
        isolateLockedSection(destinationRuntime.section);
      } else {
        syncSectionDisplayForWindowY(targetY, null);
      }

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
          if (programmaticNavigationIdRef.current !== navigationId) {
            return;
          }

          lastWindowScrollYRef.current = targetY;
          programmaticScrollRef.current = false;
          publishCurrentSection(section);

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
          syncSectionDisplayForWindowY(targetY, null);
        },
        onInterrupt: () => {
          //A newer navbar/key navigation may have intentionally killed this
          //tween. In that case the newer request owns both programmatic-scroll
          //state and the navbar destination, so this stale callback must not
          //publish the intermediate scroll position over it.
          if (programmaticNavigationIdRef.current !== navigationId) {
            return;
          }

          lastWindowScrollYRef.current = window.scrollY;
          programmaticScrollRef.current = false;

          //An interrupted authored scroll must not leave the destination's hard
          //isolation behind. Recompute eligibility from the actual window Y.
          syncSectionDisplayForWindowY(window.scrollY, null);
          syncCurrentSectionForWindowY(window.scrollY);
        },
      });
    },
    [
      getRegisteredSections,
      getSectionScrollTarget,
      lockSectionScroll,
      programmaticScrollRef,
      publishCurrentSection,
      resetSection,
      revealDelaySeconds,
      runtimesRef,
      scrollDurationSeconds,
      syncCurrentSectionForWindowY,
      syncSectionDisplayForWindowY,
      unlockSectionScroll,
      isolateLockedSection,
    ],
  );

  //Route restoration is intentionally separate from scrollTo(). Numeric key
  //navigation still performs the authored reveal/scroll animation. A route
  //return already has a known locked section + timeline scene, so rebuild that
  //controller state immediately instead of replaying the route from the top.
  useEffect(() => {
    if (!restoreState || hasRestoredStateRef.current) {
      return;
    }

    let restoreFrame = 0;
    let cancelled = false;

    const restoreWhenReady = () => {
      if (cancelled || hasRestoredStateRef.current) {
        return;
      }

      const destinationRuntime =
        runtimesRef.current.get(restoreState.section) ?? null;
      const destinationTimeline =
        destinationRuntime?.timelineRef.current ?? null;

      //Section runtimes register after their GSAP timeline exists. Route mounts
      //can reach this controller one frame earlier, so wait only until that
      //existing control surface is ready instead of creating a second store.
      if (!destinationRuntime || !destinationTimeline) {
        restoreFrame = requestAnimationFrame(restoreWhenReady);
        return;
      }

      const registeredSections = getRegisteredSections();
      const labelTime = restoreState.timelineLabel
        ? destinationTimeline.labels[restoreState.timelineLabel]
        : undefined;
      const labelProgress =
        labelTime === undefined
          ? undefined
          : labelTime / Math.max(destinationTimeline.duration(), 0.0001);
      const targetProgress = clampSectionProgress(
        restoreState.progress ??
          labelProgress ??
          destinationRuntime.revealedProgress,
        destinationRuntime.revealedProgress,
      );
      const targetY = destinationRuntime.getLockY();

      gsap.killTweensOf(window);

      registeredSections.forEach((runtime) => {
        gsap.killTweensOf(runtime.timelineRef.current);

        if (runtime === destinationRuntime) {
          runtime.releasingRef.current = false;
          runtime.releasedDirectionRef.current = null;
          runtime.lockedRef.current = false;
          runtime.lockYRef.current = null;
          runtime.snapRef.current = false;
          return;
        }

        //Do not blindly reset previous/next sections to 0 during a route return.
        //Reconstruct each one from the same global Y we are restoring so sections
        //already completed above the destination remain completed/hidden instead
        //of being revived by their ScrollTrigger at revealedProgress.
        settleSectionForWindowY(runtime, targetY);
      });

      //Own the synthetic route-restoration scroll so the global scroll handler
      //cannot mistake it for real wheel/touch input and advance the local story.
      programmaticScrollRef.current = true;
      destinationRuntime.lockYRef.current = targetY;
      destinationRuntime.lockedRef.current = true;
      activeLockedSectionRef.current = destinationRuntime.section;
      publishCurrentSection(destinationRuntime.section);
      isolateLockedSection(destinationRuntime.section);

      destinationRuntime.snapRef.current = true;

      window.scrollTo({
        top: targetY,
        left: 0,
        behavior: "auto",
      });

      lastWindowScrollYRef.current = targetY;
      setScrollSectionProgressImmediately(destinationRuntime, targetProgress);
      destinationRuntime.progressRef.current = targetProgress;
      hasRestoredStateRef.current = true;

      restoreFrame = requestAnimationFrame(() => {
        //Reassert both the completed state of every non-destination section and
        //the active DOM isolation after the synthetic scroll has committed. This
        //closes the small route-mount timing window where ScrollTrigger can run an
        //update between restoration setup and the next painted frame.
        getRegisteredSections().forEach((runtime) => {
          if (runtime !== destinationRuntime) {
            settleSectionForWindowY(runtime, targetY);
          }
        });

        isolateLockedSection(destinationRuntime.section);
        destinationRuntime.snapRef.current = false;
        programmaticScrollRef.current = false;
        controllerReadyRef.current = true;
      });
    };

    restoreFrame = requestAnimationFrame(restoreWhenReady);

    return () => {
      cancelled = true;
      cancelAnimationFrame(restoreFrame);

      programmaticScrollRef.current = false;
    };
  }, [
    getRegisteredSections,
    isolateLockedSection,
    programmaticScrollRef,
    publishCurrentSection,
    restoreState,
    runtimesRef,
    settleSectionForWindowY,
  ]);

  //Not every history/navigation restoration has a custom restoreState. Normal
  //TanStack/browser scroll restoration can remount this controller at an
  //already-established window.scrollY. ScrollTrigger then initialises against
  //that deep Y immediately, so every fresh runtime must be hydrated from the
  //global scroll coordinate BEFORE organic crossing logic is allowed to run.
  //
  //If the restored Y is exactly one manual section's lock point, infer that the
  //user was sitting inside that section and rebuild the lock at revealedProgress.
  //Explicit project restoreState takes precedence above because it can recover a
  //more precise local timeline label such as frontend-scene-N.
  useEffect(() => {
    if (restoreState || controllerReadyRef.current) {
      return;
    }

    let hydrationFrame = 0;
    let cancelled = false;

    const hydrateWhenReady = () => {
      if (cancelled || controllerReadyRef.current) {
        return;
      }

      const registeredSections = getRegisteredSections();

      //Wait for the section components to register their actual GSAP timelines.
      //Hydrating before that would only update refs and leave a later
      //ScrollTrigger creation free to overwrite the visual state again.
      if (
        registeredSections.length === 0 ||
        registeredSections.some((runtime) => !runtime.timelineRef.current)
      ) {
        hydrationFrame = requestAnimationFrame(hydrateWhenReady);
        return;
      }

      const restoredY = window.scrollY;
      const inferredLockedSection =
        registeredSections.find(
          (runtime) => Math.abs(restoredY - runtime.getLockY()) <= 2,
        ) ?? null;

      registeredSections.forEach((runtime) => {
        gsap.killTweensOf(runtime.timelineRef.current);

        if (runtime !== inferredLockedSection) {
          settleSectionForWindowY(runtime, restoredY);
        }
      });

      if (inferredLockedSection) {
        const lockY = inferredLockedSection.getLockY();

        inferredLockedSection.releasingRef.current = false;
        inferredLockedSection.releasedDirectionRef.current = null;
        inferredLockedSection.lockYRef.current = lockY;
        inferredLockedSection.lockedRef.current = true;
        inferredLockedSection.snapRef.current = false;

        activeLockedSectionRef.current = inferredLockedSection.section;

        setScrollSectionProgressImmediately(
          inferredLockedSection,
          inferredLockedSection.revealedProgress,
        );

        isolateLockedSection(inferredLockedSection.section);
        publishCurrentSection(inferredLockedSection.section);
        lastWindowScrollYRef.current = lockY;
      } else {
        activeLockedSectionRef.current = null;
        syncSectionDisplayForWindowY(restoredY, null);
        syncCurrentSectionForWindowY(restoredY);
        lastWindowScrollYRef.current = restoredY;
      }

      controllerReadyRef.current = true;
    };

    hydrationFrame = requestAnimationFrame(hydrateWhenReady);

    return () => {
      cancelled = true;
      cancelAnimationFrame(hydrationFrame);
    };
  }, [
    getRegisteredSections,
    isolateLockedSection,
    publishCurrentSection,
    restoreState,
    settleSectionForWindowY,
    syncCurrentSectionForWindowY,
    syncSectionDisplayForWindowY,
  ]);

  //Viewport resizing can make the browser adjust window.scrollY even though
  //the user did not intentionally scroll. While a manual-scroll section is
  //locked, keep that section isolated and keep the window snapped to its lock
  //point without converting resize-induced movement into timeline progress.
  useEffect(() => {
    function handleViewportResize() {
      resizingViewportRef.current = true;

      const activeSection = getActiveLockedSection();

      if (activeSection?.lockedRef.current) {
        isolateLockedSection(activeSection.section);
        snapWindowToSectionLock(activeSection);
      }

      if (resizeEndTimeoutRef.current) {
        clearTimeout(resizeEndTimeoutRef.current);
      }

      resizeEndTimeoutRef.current = setTimeout(() => {
        resizingViewportRef.current = false;

        const currentActiveSection = getActiveLockedSection();

        if (currentActiveSection?.lockedRef.current) {
          isolateLockedSection(currentActiveSection.section);
          snapWindowToSectionLock(currentActiveSection);
        }
      }, 120);
    }

    window.addEventListener("resize", handleViewportResize, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", handleViewportResize);

      if (resizeEndTimeoutRef.current) {
        clearTimeout(resizeEndTimeoutRef.current);
      }

      resizingViewportRef.current = false;
    };
  }, [getActiveLockedSection, isolateLockedSection, snapWindowToSectionLock]);

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

      //A restored native scroll position is not user input. Until the fresh
      //runtimes have been hydrated from that position, merely record the Y and
      //refuse to infer that the user organically crossed every lock point.
      if (!controllerReadyRef.current) {
        lastWindowScrollYRef.current = currentY;
        return;
      }

      if (programmaticScrollRef.current) {
        lastWindowScrollYRef.current = currentY;
        return;
      }

      const activeSection = getActiveLockedSection();

      if (activeSection?.lockedRef.current) {
        publishCurrentSection(activeSection.section);
      } else {
        syncCurrentSectionForWindowY(currentY);
        syncSectionDisplayForWindowY(currentY, null);
      }

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

        //A viewport resize can cause the browser to move scrollY even though the
        //user did not actually scroll. Never convert that geometry correction
        //into local section timeline progress. Keep the active section isolated
        //and snap the window back to its existing lock point instead.
        if (resizingViewportRef.current) {
          isolateLockedSection(activeSection.section);
          snapWindowToSectionLock(activeSection);

          lastWindowScrollYRef.current = lockedY;
          return;
        }

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

    if (!restoreState) {
      syncCurrentSectionForWindowY(window.scrollY);
    }

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
    isolateLockedSection,
    lockSectionScroll,
    programmaticScrollRef,
    publishCurrentSection,
    restoreState,
    snapWindowToSectionLock,
    syncCurrentSectionForWindowY,
    syncSectionDisplayForWindowY,
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
