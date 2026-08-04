import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import reactLogo from "../assets/react.svg";

export const Route = createFileRoute("/")({
  component: HomePage,
});

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

const GSAP_HMR_REVISION = import.meta.hot
  ? (import.meta.hot.data.gsapRevision =
      (import.meta.hot.data.gsapRevision ?? 0) + 1)
  : 0;

//When the sections begin to show
const HOME_SECTIONS = {
  init: 0,
  about: 820,
  experience: 2550,
  systems: 4408,
  projects: 5900,
} as const;

type HomeSection = keyof typeof HOME_SECTIONS;
type AboutLockDirection = "forward" | "backward";

const SECTION_REVEAL_DELAY_SECONDS = {
  init: 1,
  about: 1.5,
  experience: 1,
  systems: 1,
  projects: 1,
};

// const ABOUT_TIMELINE = {
//   contentStart: 0.46,
//   contentDuration: 0.78,
//   exitDuration: 0.1,
//   exitBlur: 7,
// } as const;

const ABOUT_REVEAL_SCROLL_DISTANCE = 555;
const SECTION_SCROLL_DURATION_SECONDS = 3;
const ABOUT_REVEALED_PROGRESS = 0.19;
// 0.30; //From 0 to 0.36 of the timeline, about is revealing... after 0.36 until 1, global scroll is locked. 
                                      //The point in the about timeline (0-1) when the about is fully visible
                                      //More content to the about section means more timeline stretch. So we need to REDUCE this value as we add content so we lock at the same visual point.

                                      
const ABOUT_LINES = ["I'm a Product-minded", "software Engineer"];

const ABOUT_BODY =
  "I build fast, reliable software from interface to infrastructure, " +
  "and everything in-between. Backend workflows, motion, and product logic turn complex ideas into software that has a direct impact on the end-user. " +
  "and everything in-between. Backend workflows, motion, and product logic turn complex ideas into software that has a direct impact on the end-user. " +
  "and everything in-between. Backend workflows, motion, and product logic turn complex ideas into software that has a direct impact on the end-user. ";

  

function splitTextIntoWords(text: string) {
  return text.split(" ").map((word) => word.split(""));
} 

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

  //The total scrollable distance the view port can travel
  const getAboutInternalScrollDistance = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;

    //To prevent errors like Cannot read properties of null, for when the element's refs are null on first mount.
    if (!viewport || !content) {
      return window.innerHeight;
    }

    return Math.max(content.scrollHeight - viewport.clientHeight, 0);
  }, []);

  //About's timeline's total pxs distance (from its 0 to its 1)
  const getAboutPxDuration = useCallback(() => {
    return Math.max(getAboutInternalScrollDistance(), 1);
  }, [getAboutInternalScrollDistance]);

  //Global Y px height when about locks
  const getAboutLockY = useCallback(() => {
    return HOME_SECTIONS.about + ABOUT_REVEAL_SCROLL_DISTANCE;
  }, []);

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

    //If we're there at scrollY (lock point) already, return
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

  const unlockAboutScroll = useCallback(() => {
    aboutLockedRef.current = false;
    touchYRef.current = null;
  }, []);

  const releaseAboutScroll = useCallback(
    (direction: AboutLockDirection) => {
      if (!aboutLockedRef.current) return;

      aboutReleasingRef.current = true;
      aboutReleasedDirectionRef.current = direction;

      aboutTimelineRef.current?.progress(
        direction === "forward" ? 1 : ABOUT_REVEALED_PROGRESS,
      );

      unlockAboutScroll();

      //Allow scroll events to settle (act as debouncer before declaring lock release), then force the timeline back to 0 when we scroll past about section
      setTimeout(() => {
        aboutReleasingRef.current = false;

        if (direction === "backward" && window.scrollY <= HOME_SECTIONS.about) {
          aboutProgressRef.current = 0;
          aboutTimelineRef.current?.progress(0);
        }
      }, 0);
    },
    [unlockAboutScroll],
  );

  //Globally locking the window for about section
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

      aboutLockYRef.current = lockY; //Exact global pixel y distance where about section locks
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

  //Locally advancing about section while global window is locked
  const advanceAboutScroll = useCallback(
    (deltaY: number) => {
      if (!aboutLockedRef.current || aboutProgrammaticScrollRef.current) return; //If our window is not locked at about section

      const distance = Math.max(getAboutPxDuration(), 1);

      //normalize every user scroll in px as percentage of our timeline (e.g, scroll 2 px out of 10 px of total about distance, then progress is 0.2 through timeline)
      //Then add that to where we are in the timeline to advance us through it.
      const nextProgress = clampAboutProgress(
        aboutProgressRef.current + deltaY / distance,
      );

      aboutProgressRef.current = nextProgress;

      if (aboutTimelineRef.current) {
        gsap.to(aboutTimelineRef.current, {
          progress: nextProgress,
          duration: 0.14,
          ease: "ease.inOut",
          overwrite: true,
        });
      }

      if (nextProgress >= 1 && deltaY > 0) {
        releaseAboutScroll("forward");
      }

      if (nextProgress <= ABOUT_REVEALED_PROGRESS && deltaY < 0) {
        releaseAboutScroll("backward");
      }
    },
    [getAboutPxDuration, releaseAboutScroll],
  );

  //Scroll to a section
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
      unlockAboutScroll();

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

  //useEffect for actually applying the functions to event listeners
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

  //Applying the functions to event listeners
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
        return Math.max(content.scrollHeight - viewport.clientHeight, 0); //The entire distance the viewport element can scroll to reach the end of its child content.
      }

      function getContentTravelDistance() {
        return getInternalScrollDistance(); // + 16% of the viewport/window's inner height just to pad it a little
      }

      gsap.set(section, {
        autoAlpha: 0,
        filter: "blur(0px)",
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
            rotateY: -45,
            rotateX: 1.5,
            rotateZ: -1,
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
            filter: "blur(0px)",
            stagger: 0.008,
            duration: 0.05, //To make heading characters appear faster, I reduced the duration
          },
          0,
        )
        .to(
          bodyChars,
          {
            autoAlpha: 1,
            filter: "blur(0px)",
            stagger: 0.004,
            duration: 0.1,
          },
          0.2,
        )
        .to(
          content,
          {
            y: () => -getContentTravelDistance(),
            duration: 0.78,
          },
          0.35,
        )
        .to(
          section,
          {
            filter: "blur(7px)",
            autoAlpha: 0,
            duration: .7,
          },
          ">",
        );

      ScrollTrigger.create({
        trigger: document.documentElement, //The trigger element for the animation.
        start: HOME_SECTIONS.about, //The start point. Given in this format -> "value(of trigger element) value(of viewport)". When - of element, meets - of viewport, then we start.
        //Default value for start on all scroll triggers is "top bottom" meaning "top (of trigger element) hits bottom (of viewport)"
        end: getAboutLockY, //When - of element, meets - of viewport, then we end.
        //Default value for end on all scroll triggers is "bottom top"... "bottom bottom" when scrub is true.
        // markers: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (
            aboutLockedRef.current ||
            aboutReleasingRef.current ||
            aboutProgrammaticScrollRef.current
          ) {
            return;
          }

          const releasedDirection = aboutReleasedDirectionRef.current;

          // After releasing About moving forward, ScrollTrigger must not rewind 1 back to 0.3; return.
          if (releasedDirection === "forward") {
            return;
          }

          // After releasing about moving backward, only allow ScrollTrigger to continue moving backward from 0.3 toward 0.
          //Otherwise, return
          if (releasedDirection === "backward" && self.direction > 0) {
            return;
          }

          const progress = self.progress * ABOUT_REVEALED_PROGRESS;

          aboutProgressRef.current = progress;
          aboutTimelineRef.current?.progress(progress);

          // Once the backward reveal range is completely exited,
          // reset the release guard.
          if (releasedDirection === "backward" && self.progress <= 0) {
            aboutReleasedDirectionRef.current = null;
          }
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
        getAboutPxDuration,
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
        // Remove pointer events to interract with content and debug
        className="absolute z-20 top-0 left-0 w-full pointer-events-none"
      >
        <div
          ref={planeRef}
          className="absolute right-[9vw] top-[32vh] w-fit text-[#171717] mix-blend-multiply [transform-style:preserve-3d] will-change-[transform,opacity] 
          max-[900px]:right-0 max-[900px]:top-[15vh] max-[900px]:w-[min(70vw,34rem)] max-[900px]:mix-blend-normal
          min-[900px]:max-[1600px]:top-[40vh]
          min-[900px]:max-[1600px]:right-0
          max-[500px]:right-[7%]"
        >
          <div
            ref={viewportRef}
            className="relative h-[min(45vh,40rem)] w-[min(42vw,42rem)] max-[900px]:h-[min(52vh,32rem)] max-[900px]:w-[min(90vw,34rem)] overflow-y-clip"
          >
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 bg-linear-to-t from-[#e3e3e3]/95 via-[#e3e3e3]/48 to-transparent backdrop-blur-[1px]" />

            <div className="relative h-full">
              {/* If the content disappears too fast, pad it on the bottom */}
              <div
                ref={contentRef}
                className="absolute right-10 z-10 pt-12 will-change-transform
                max-[700px]:mr-[10vw]
                max-[450px]:mr-[5vw]
                pb-[40vh]
                "
              >
                <div className="about-blur-item">
                  <div className="mb-[1.15rem] flex items-center gap-4 font-mono text-[clamp(0.66rem,0.7vw,0.78rem)] uppercase tracking-[0.18em] text-[rgba(23,23,23,0.48)]">
                    <span>ABOUT / 01</span>
                    <span className="about-rule block h-px w-[min(10vw,8rem)] bg-[rgba(23,23,23,0.28)]" />
                  </div>
                  <h1
                    className="m-0 font-sans text-[clamp(2rem,3.5vw,9.65rem)] font-semibold leading-[0.96] tracking-[-0.085em] text-balance"
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
                  className="about-blur-item mt-[2.45rem] mx-auto max-w-[37rem] font-[Garamond,_'Baskerville_Old_Face',_'Times_New_Roman',_serif] text-[clamp(0.94rem,1.2vw,1.5rem)]
                  font-normal leading-[1.8] tracking-[-0.025em] text-[rgba(23,23,23,0.64)] [overflow-wrap:normal] [word-break:normal]
                  max-[900px]:w-[min(90vw,30rem)] max-[900px]:text-[0.95rem] max-[900px]:max-w-[15rem] max-[900px]:text-right"
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

                {/* <div className="size-60 mt-[3.5rem] flex items-center justify-center gap-6 max-[900px]:justify-end">
                  <img
                    src={reactLogo}
                    alt="React Logo"
                    className="size-full object-contain"
                  />
                </div>
                <div className="size-60 mt-[3.5rem] flex items-center justify-center gap-6 max-[900px]:justify-end">
                  <img
                    src={reactLogo}
                    alt="React Logo"
                    className="size-full object-contain"
                  />
                </div>
                <div className="size-60 mt-[3.5rem] flex items-center justify-center gap-6 max-[900px]:justify-end">
                  <img
                    src={reactLogo}
                    alt="React Logo"
                    className="size-full object-contain"
                  />
                </div>
                <div className="size-60 mt-[3.5rem] flex items-center justify-center gap-6 max-[900px]:justify-end">
                  <img
                    src={reactLogo}
                    alt="React Logo"
                    className="size-full object-contain"
                  />
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
