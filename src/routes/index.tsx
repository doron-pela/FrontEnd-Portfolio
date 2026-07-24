import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

export const Route = createFileRoute("/")({
  component: HomePage,
});

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

const GSAP_HMR_REVISION = import.meta.hot
  ? (import.meta.hot.data.gsapRevision =
      (import.meta.hot.data.gsapRevision ?? 0) + 1)
  : 0;

const HOME_SECTIONS = {
  init: 0,
  about: 520,
  experience: 2550,
  systems: 4408,
  projects: 5900,
} as const;

type HomeSection = keyof typeof HOME_SECTIONS;
type AboutLockDirection = "forward" | "backward";

const SECTION_REVEAL_DELAY_SECONDS = {
  init: 1,
  about: 1,
  experience: 1,
  systems: 1,
  projects: 1,
};
const SECTION_SCROLL_DURATION_SECONDS = 3;
const ABOUT_REVEALED_PROGRESS = 0.36;

const ABOUT_LINES = ["I'm a Product-minded", "software Engineer"];

const ABOUT_BODY =
  "I build fast, reliable software from interface to infrastructure, " +
  "and everything in-between. Backend workflows, motion, and product logic turn complex ideas into software that has a direct impact on the end-user. " +
  "I move between user-facing interaction, backend workflows, system structure, and product thinking with the goal of making software feel clear, useful, and deliberate. " +
  "I care about the details people see, the logic they never have to think about, and the engineering choices that make the final product feel reliable.";

function splitTextIntoWords(text: string) {
  return text.split(" ").map((word) => word.split(""));
}

function normalizeWheelDelta(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * window.innerHeight;
  }

  return event.deltaY;
}

function clampAboutProgress(value: number) {
  return Math.min(Math.max(value, ABOUT_REVEALED_PROGRESS), 1);
}

function HomePage() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const aboutTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const aboutProgressRef = useRef(ABOUT_REVEALED_PROGRESS);
  const aboutLockedRef = useRef(false);
  const aboutReleasingRef = useRef(false);
  const aboutProgrammaticScrollRef = useRef(false);
  const aboutLockYRef = useRef<number | null>(null);
  const aboutSnapRef = useRef(false);
  const aboutReleasedDirectionRef = useRef<AboutLockDirection | null>(null);
  const lastWindowScrollYRef = useRef(0);
  const touchYRef = useRef<number | null>(null);

  const bodyWords = useMemo(() => {
    return splitTextIntoWords(ABOUT_BODY);
  }, []);

  const getAboutInternalScrollDistance = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;

    if (!viewport || !content) {
      return window.innerHeight;
    }

    return Math.max(content.scrollHeight - viewport.clientHeight, 0);
  }, []);

  const getAboutDuration = useCallback(() => {
    const internalScrollDistance = getAboutInternalScrollDistance();

    return (
      window.innerHeight * 1 + internalScrollDistance * 1 + window.innerHeight
    );
  }, [getAboutInternalScrollDistance]);

  const getAboutLockY = useCallback(() => {
    return HOME_SECTIONS.about + getAboutDuration() * ABOUT_REVEALED_PROGRESS;
  }, [getAboutDuration]);

  const getSectionScrollTarget = useCallback(
    (section: HomeSection) => {
      if (section === "about") {
        return getAboutLockY();
      }

      return HOME_SECTIONS[section];
    },
    [getAboutLockY],
  );

  const snapWindowToAboutLock = useCallback(() => {
    const lockY = aboutLockYRef.current ?? getAboutLockY();

    if (Math.abs(window.scrollY - lockY) <= 1) {
      return;
    }

    aboutSnapRef.current = true;

    window.scrollTo({
      top: lockY,
      left: 0,
      behavior: "auto",
    });

    lastWindowScrollYRef.current = lockY;

    requestAnimationFrame(() => {
      aboutSnapRef.current = false;
    });
  }, [getAboutLockY]);

  const unlockAboutScroll = useCallback(
    (shouldSnapToLock = true) => {
      aboutLockedRef.current = false;
      touchYRef.current = null;

      if (shouldSnapToLock) {
        snapWindowToAboutLock();
      }
    },
    [snapWindowToAboutLock],
  );

  const releaseAboutScroll = useCallback(
    (direction: AboutLockDirection) => {
      if (!aboutLockedRef.current) return;

      aboutReleasingRef.current = true;
      aboutReleasedDirectionRef.current = direction;

      aboutTimelineRef.current?.progress(
        direction === "forward" ? 1 : ABOUT_REVEALED_PROGRESS,
      );

      unlockAboutScroll(true);

      window.setTimeout(() => {
        aboutReleasingRef.current = false;
      }, 180);
    },
    [unlockAboutScroll],
  );

  const lockAboutScroll = useCallback(
    (direction: AboutLockDirection) => {
      if (
        aboutLockedRef.current ||
        aboutReleasingRef.current ||
        aboutProgrammaticScrollRef.current
      ) {
        return;
      }

      const lockY = getAboutLockY();
      const startProgress =
        direction === "forward" ? ABOUT_REVEALED_PROGRESS : 1;

      gsap.killTweensOf(window);

      aboutLockYRef.current = lockY;
      aboutLockedRef.current = true;
      aboutProgressRef.current = startProgress;

      aboutSnapRef.current = true;

      window.scrollTo({
        top: lockY,
        left: 0,
        behavior: "auto",
      });

      lastWindowScrollYRef.current = lockY;
      aboutTimelineRef.current?.progress(startProgress);

      requestAnimationFrame(() => {
        aboutSnapRef.current = false;
      });
    },
    [getAboutLockY],
  );

  const advanceAboutScroll = useCallback(
    (deltaY: number) => {
      if (!aboutLockedRef.current || aboutProgrammaticScrollRef.current) return;

      const distance = Math.max(getAboutDuration(), 1);
      const nextProgress = clampAboutProgress(
        aboutProgressRef.current + deltaY / distance,
      );

      aboutProgressRef.current = nextProgress;
      aboutTimelineRef.current?.progress(nextProgress);

      snapWindowToAboutLock();

      if (nextProgress >= 1 && deltaY > 0) {
        releaseAboutScroll("forward");
      }

      if (nextProgress <= ABOUT_REVEALED_PROGRESS && deltaY < 0) {
        releaseAboutScroll("backward");
      }
    },
    [getAboutDuration, releaseAboutScroll, snapWindowToAboutLock],
  );

  const scrollTo = useCallback(
    (section: HomeSection) => {
      const targetY = getSectionScrollTarget(section);
      const isGoingToAbout = section === "about";
      const revealDelay = SECTION_REVEAL_DELAY_SECONDS[section];

      gsap.killTweensOf(window);
      gsap.killTweensOf(aboutTimelineRef.current);

      aboutProgrammaticScrollRef.current = true;
      aboutReleasingRef.current = false;
      aboutReleasedDirectionRef.current = null;
      unlockAboutScroll(false);

      if (!isGoingToAbout) {
        aboutProgressRef.current = 0;
        aboutTimelineRef.current?.progress(0);
      }

      if (isGoingToAbout && aboutTimelineRef.current) {
        aboutProgressRef.current = 0;
        aboutTimelineRef.current.progress(0);

        gsap.to(aboutTimelineRef.current, {
          progress: ABOUT_REVEALED_PROGRESS,
          duration: SECTION_SCROLL_DURATION_SECONDS - revealDelay,
          delay: revealDelay,
          ease: "ease.inOut",
          overwrite: "auto",
          onUpdate: () => {
            aboutProgressRef.current =
              aboutTimelineRef.current?.progress() ?? ABOUT_REVEALED_PROGRESS;
          },
        });
      }

      gsap.to(window, {
        duration: SECTION_SCROLL_DURATION_SECONDS,
        ease: "ease.inOut",
        overwrite: "auto",
        scrollTo: {
          y: targetY,
          autoKill: false,
        },
        onUpdate: () => {
          lastWindowScrollYRef.current = window.scrollY;

          if (!isGoingToAbout) {
            aboutProgressRef.current = 0;
            aboutTimelineRef.current?.progress(0);
          }
        },
        onComplete: () => {
          lastWindowScrollYRef.current = targetY;
          aboutProgrammaticScrollRef.current = false;

          if (isGoingToAbout) {
            aboutLockYRef.current = targetY;
            aboutProgressRef.current = ABOUT_REVEALED_PROGRESS;
            aboutTimelineRef.current?.progress(ABOUT_REVEALED_PROGRESS);
            lockAboutScroll("forward");
            return;
          }

          aboutProgressRef.current = 0;
          aboutTimelineRef.current?.progress(0);
        },
        onInterrupt: () => {
          lastWindowScrollYRef.current = window.scrollY;
          aboutProgrammaticScrollRef.current = false;
        },
      });
    },
    [getSectionScrollTarget, lockAboutScroll, unlockAboutScroll],
  );

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

      if (aboutLockedRef.current) {
        switch (event.key) {
          case "ArrowDown":
          case "PageDown":
          case " ":
            event.preventDefault();
            advanceAboutScroll(window.innerHeight * 0.18);
            return;

          case "ArrowUp":
          case "PageUp":
            event.preventDefault();
            advanceAboutScroll(-window.innerHeight * 0.18);
            return;

          default:
            break;
        }
      }

      switch (event.key) {
        case "0":
          scrollTo("init");
          break;

        case "1":
          scrollTo("about");
          break;

        case "2":
          scrollTo("experience");
          break;

        case "3":
          scrollTo("systems");
          break;

        case "4":
          scrollTo("projects");
          break;

        default:
          break;
      }
    }

    window.addEventListener("keydown", handleSectionKeyDown);

    return () => {
      window.removeEventListener("keydown", handleSectionKeyDown);
    };
  }, [advanceAboutScroll, scrollTo]);

  useEffect(() => {
    function handleWindowScroll() {
      const currentY = window.scrollY;
      const previousY = lastWindowScrollYRef.current;
      const lockY = getAboutLockY();
      const movingForward = currentY > previousY;
      const movingBackward = currentY < previousY;

      if (aboutProgrammaticScrollRef.current) {
        lastWindowScrollYRef.current = currentY;
        return;
      }

      if (aboutSnapRef.current) {
        lastWindowScrollYRef.current = currentY;
        return;
      }

      if (
        aboutReleasedDirectionRef.current === "forward" &&
        currentY < lockY - 12
      ) {
        aboutReleasedDirectionRef.current = null;
      }

      if (
        aboutReleasedDirectionRef.current === "backward" &&
        currentY > lockY + 12
      ) {
        aboutReleasedDirectionRef.current = null;
      }

      if (aboutLockedRef.current) {
        const lockedY = aboutLockYRef.current ?? lockY;
        const deltaY = currentY - lockedY;

        if (Math.abs(deltaY) > 1) {
          snapWindowToAboutLock();
          advanceAboutScroll(deltaY);
        }

        lastWindowScrollYRef.current = lockedY;
        return;
      }

      if (
        movingForward &&
        previousY < lockY &&
        currentY >= lockY &&
        aboutReleasedDirectionRef.current !== "forward"
      ) {
        const overshoot = currentY - lockY;

        lockAboutScroll("forward");

        if (overshoot > 1) {
          requestAnimationFrame(() => {
            advanceAboutScroll(overshoot);
          });
        }

        return;
      }

      if (
        movingBackward &&
        previousY > lockY &&
        currentY <= lockY &&
        aboutReleasedDirectionRef.current !== "backward"
      ) {
        const overshoot = currentY - lockY;

        lockAboutScroll("backward");

        if (overshoot < -1) {
          requestAnimationFrame(() => {
            advanceAboutScroll(overshoot);
          });
        }

        return;
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
    advanceAboutScroll,
    getAboutLockY,
    lockAboutScroll,
    snapWindowToAboutLock,
  ]);

  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      if (!aboutLockedRef.current || aboutProgrammaticScrollRef.current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      advanceAboutScroll(normalizeWheelDelta(event));
    }

    function handleTouchStart(event: TouchEvent) {
      if (!aboutLockedRef.current || aboutProgrammaticScrollRef.current) {
        return;
      }

      touchYRef.current = event.touches[0]?.clientY ?? null;
    }

    function handleTouchMove(event: TouchEvent) {
      if (!aboutLockedRef.current || aboutProgrammaticScrollRef.current) {
        return;
      }

      const currentY = event.touches[0]?.clientY;

      if (currentY === undefined || touchYRef.current === null) return;

      event.preventDefault();
      event.stopPropagation();

      const deltaY = touchYRef.current - currentY;

      touchYRef.current = currentY;

      advanceAboutScroll(deltaY);
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
  }, [advanceAboutScroll]);

  useGSAP(
    () => {
      const sectionElement = sectionRef.current;
      const planeElement = planeRef.current;
      const viewportElement = viewportRef.current;
      const contentElement = contentRef.current;

      if (
        !sectionElement ||
        !planeElement ||
        !viewportElement ||
        !contentElement
      ) {
        return;
      }

      const section = sectionElement;
      const plane = planeElement;
      const viewport = viewportElement;
      const content = contentElement;

      const headingChars = gsap.utils.toArray<HTMLElement>(
        ".about-heading-char",
      );
      const bodyChars = gsap.utils.toArray<HTMLElement>(".about-body-char");
      const bodyWordElements =
        gsap.utils.toArray<HTMLElement>(".about-body-word");
      const blurItems = gsap.utils.toArray<HTMLElement>(".about-blur-item");
      const rule = section.querySelector(".about-rule");

      function getInternalScrollDistance() {
        return Math.max(content.scrollHeight - viewport.clientHeight, 0);
      }

      function getContentTravelDistance() {
        return getInternalScrollDistance() + window.innerHeight * 0.16;
      }

      gsap.set(section, {
        autoAlpha: 0,
      });

      gsap.set(plane, {
        transformPerspective: 1400,
        transformOrigin: "center left",
        rotateY: -28,
        rotateX: 4,
        rotateZ: 0,
        y: 42,
        z: -120,
        autoAlpha: 0,
      });

      gsap.set(rule, {
        scaleX: 0,
        transformOrigin: "left center",
      });

      gsap.set(bodyWordElements, {
        whiteSpace: "nowrap",
      });

      gsap.set([...headingChars, ...bodyChars], {
        autoAlpha: 0,
        yPercent: 0,
        filter: "blur(7px)",
      });

      gsap.set(content, {
        y: 0,
      });

      gsap.set(blurItems, {
        filter: "blur(0px)",
        autoAlpha: 1,
      });

      const timeline = gsap.timeline({
        paused: true,
        defaults: {
          ease: "none",
        },
      });

      aboutTimelineRef.current = timeline;

      timeline
        .to(
          section,
          {
            autoAlpha: 1,
            duration: 0.08,
          },
          0,
        )
        .to(
          plane,
          {
            autoAlpha: 1,
            rotateY: -35,
            rotateX: 1.5,
            rotateZ: 0,
            y: 0,
            z: 0,
            duration: 0.28,
          },
          0.02,
        )
        .to(
          rule,
          {
            scaleX: 1,
            duration: 0.16,
          },
          0.08,
        )
        .to(
          headingChars,
          {
            autoAlpha: 1,
            yPercent: 0,
            filter: "blur(0px)",
            stagger: {
              each: 0.008,
              from: "start",
            },
            duration: 0.28,
          },
          0.1,
        )
        .to(
          bodyChars,
          {
            autoAlpha: 1,
            yPercent: 0,
            filter: "blur(0px)",
            stagger: {
              each: 0.004,
              from: "start",
            },
            duration: 0.36,
          },
          0.2,
        )
        .to(
          content,
          {
            y: () => -getContentTravelDistance(),
            duration: 0.78,
          },
          0.46,
        )
        .to(
          blurItems[0],
          {
            filter: "blur(7px)",
            autoAlpha: 0.3,
            duration: 0.32,
          },
          0.58,
        )
        .to(
          blurItems[1],
          {
            filter: "blur(5px)",
            autoAlpha: 0.48,
            duration: 0.38,
          },
          0.8,
        )
        .to(
          plane,
          {
            rotateY: -42,
            rotateX: 0.5,
            rotateZ: 0,
            y: -10,
            duration: 0.54,
          },
          0.68,
        )
        .to(
          section,
          {
            autoAlpha: 0,
            duration: 0.22,
          },
          1.28,
        );

      ScrollTrigger.create({
        trigger: document.documentElement,
        start: HOME_SECTIONS.about,
        end: getAboutLockY,
        scrub: 0.65,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (
            aboutLockedRef.current ||
            aboutReleasingRef.current ||
            aboutProgrammaticScrollRef.current
          ) {
            return;
          }

          const progress = self.progress * ABOUT_REVEALED_PROGRESS;

          aboutProgressRef.current = progress;
          aboutTimelineRef.current?.progress(progress);
        },
      });

      return () => {
        aboutTimelineRef.current = null;
      };
    },
    {
      scope: sectionRef,
      dependencies: [
        getAboutLockY,
        getAboutDuration,
        lockAboutScroll,
        GSAP_HMR_REVISION,
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <>
      <section
        ref={sectionRef}
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      >
        <div
          ref={planeRef}
          className="absolute right-[10vw] top-[35vh] w-fit text-[#171717] mix-blend-multiply [transform-style:preserve-3d] will-change-[transform,opacity] max-[900px]:left-[7vw] max-[900px]:right-auto max-[900px]:top-[18vh] max-[900px]:w-[min(70vw,34rem)] max-[900px]:mix-blend-normal"
        >
          <div
            ref={viewportRef}
            className="relative h-[min(38vh,24rem)] w-[min(42vw,42rem)] overflow-hidden max-[900px]:h-[min(52vh,32rem)] max-[900px]:w-[min(90vw,34rem)]"
          >
            {/* <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-16 bg-linear-to-b from-[#e3e3e3]/90 via-[#e3e3e3]/48 to-transparent backdrop-blur-[2px]" /> */}

            {/* <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-linear-to-t from-[#e3e3e3]/95 via-[#e3e3e3]/48 to-transparent backdrop-blur-[2px]" /> */}

            <div
              ref={contentRef}
              className="relative z-10 pb-[30vh] pt-12 will-change-transform"
            >
              <div className="about-blur-item">
                <div className="mb-[1.15rem] flex items-center gap-4 font-mono text-[clamp(0.66rem,0.7vw,0.78rem)] uppercase tracking-[0.18em] text-[rgba(23,23,23,0.48)]">
                  <span>ABOUT / 01</span>

                  <span className="about-rule block h-px w-[min(10vw,8rem)] bg-[rgba(23,23,23,0.28)]" />
                </div>

                <h1
                  className="m-0 font-sans text-[clamp(2rem,3vw,7.65rem)] font-semibold leading-[0.96] tracking-[-0.085em] text-balance max-[900px]:text-[clamp(2.65rem,10vw,5.4rem)]"
                  aria-label={ABOUT_LINES.join(" ")}
                >
                  {ABOUT_LINES.map((line, lineIndex) => (
                    <span className="block whitespace-nowrap" key={line}>
                      {line.split("").map((char, charIndex) => (
                        <span
                          className="about-heading-char inline-block will-change-[transform,opacity,filter]"
                          aria-hidden="true"
                          key={`${lineIndex}-${charIndex}`}
                        >
                          {char === " " ? "\u00A0" : char}
                        </span>
                      ))}
                    </span>
                  ))}
                </h1>
              </div>

              <p
                className="about-blur-item mt-[2.45rem] max-w-[37rem] font-sans text-[clamp(0.94rem,1.05vw,1.08rem)] font-normal leading-[1.8] tracking-[-0.025em] text-[rgba(23,23,23,0.64)] [overflow-wrap:normal] [word-break:normal] max-[900px]:max-w-[29rem] max-[900px]:w-[min(90vw,30rem)] max-[900px]:text-[0.95rem]"
                aria-label={ABOUT_BODY}
              >
                {bodyWords.map((word, wordIndex) => (
                  <span
                    className="about-body-word mr-[0.27em] inline-block whitespace-nowrap"
                    aria-hidden="true"
                    key={`${word.join("")}-${wordIndex}`}
                  >
                    {word.map((char, charIndex) => (
                      <span
                        // className="about-body-char inline-block will-change-[transform,opacity,filter]"
                        key={`${wordIndex}-${charIndex}`}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
