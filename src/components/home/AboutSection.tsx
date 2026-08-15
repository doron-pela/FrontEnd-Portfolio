import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { HomeSection } from "@/@types/home-section.types";
import type {
  ManualScrollSectionProps,
  ScrollSectionRuntime,
} from "@/@types/scroll-locked-section.types";
import { setScrollSectionProgressImmediately } from "@/utils/scroll-locked-section.utils";

// import reactLogo from "../assets/react.svg";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ABOUT_GSAP_HMR_REVISION = import.meta.hot
  ? (import.meta.hot.data.aboutGsapRevision =
      (import.meta.hot.data.aboutGsapRevision ?? 0) + 1)
  : 0;

// const ABOUT_TIMELINE = {
//   contentStart: 0.46,
//   contentDuration: 0.78,
//   exitDuration: 0.1,
//   exitBlur: 7,
// } as const;

const ABOUT_REVEAL_SCROLL_DISTANCE = 555;
const ABOUT_REVEALED_PROGRESS = 0.19;
const ABOUT_LOCAL_PROGRESS_TWEEN_DURATION = 0.14;

//The outer About section owns the persistent responsive composition offset.
//The inner plane still owns only its local 3D reveal motion (42px -> 0).
//Keeping those responsibilities separate prevents the plane's reveal tween
//from immediately overwriting the responsive Y position.
const ABOUT_MOBILE_MAX_WIDTH = 650;
const ABOUT_NON_MOBILE_SECTION_Y = 0;
const ABOUT_MOBILE_SECTION_Y = 0;
// 0.19; //From 0 to 0.19 of the timeline, about is revealing... after 0.19 until 1, global scroll is locked.
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

export function AboutSection({
  startY,
  registerSection,
  programmaticScrollRef,
}: ManualScrollSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const aboutTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const aboutProgressRef = useRef(ABOUT_REVEALED_PROGRESS);
  const aboutLockedRef = useRef(false);
  const aboutReleasingRef = useRef(false);
  const aboutLockYRef = useRef<number | null>(null);
  const aboutSnapRef = useRef(false);
  const aboutReleasedDirectionRef = useRef<"forward" | "backward" | null>(null);

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
    return startY + ABOUT_REVEAL_SCROLL_DISTANCE;
  }, [startY]);

  const runtimeRef = useRef<ScrollSectionRuntime<HomeSection> | null>(null);

  if (!runtimeRef.current) {
    runtimeRef.current = {
      section: "about",
      startY,
      revealedProgress: ABOUT_REVEALED_PROGRESS,
      timelineRef: aboutTimelineRef,
      progressRef: aboutProgressRef,
      lockedRef: aboutLockedRef,
      releasingRef: aboutReleasingRef,
      lockYRef: aboutLockYRef,
      snapRef: aboutSnapRef,
      releasedDirectionRef: aboutReleasedDirectionRef,
      getPxDuration: getAboutPxDuration,
      getLockY: getAboutLockY,
      localProgressTweenDuration: ABOUT_LOCAL_PROGRESS_TWEEN_DURATION,
    };
  }

  const runtime = runtimeRef.current;
  runtime.startY = startY;
  runtime.getPxDuration = getAboutPxDuration;
  runtime.getLockY = getAboutLockY;

  useEffect(() => {
    return registerSection(runtime); //Globally register current section's runtime
  }, [registerSection, runtime]);

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
        section,
      );
      const bodyChars = gsap.utils.toArray<HTMLElement>(
        ".about-body-char",
        section,
      );
      const bodyWordElements = gsap.utils.toArray<HTMLElement>(
        ".about-body-word",
        section,
      );
      const blurItems = gsap.utils.toArray<HTMLElement>(
        ".about-blur-item",
        section,
      );
      const rule = section.querySelector(".about-rule");

      function getInternalScrollDistance() {
        return Math.max(content.scrollHeight - viewport.clientHeight, 0); //The entire distance the viewport element can scroll to reach the end of its child content.
      }

      function getContentTravelDistance() {
        return getInternalScrollDistance(); // + 16% of the viewport/window's inner height just to pad it a little
      }

      const mobileAboutQuery = window.matchMedia(
        `(max-width: ${ABOUT_MOBILE_MAX_WIDTH}px)`,
      );

      //The section is the persistent composition layer. Unlike the plane, its
      //timeline never tweens x/y, so this responsive offset remains intact
      //through the whole About sequence instead of being overwritten at 0.02.
      const syncAboutSectionPosition = () => {
        gsap.set(section, {
          y: mobileAboutQuery.matches
            ? ABOUT_MOBILE_SECTION_Y
            : ABOUT_NON_MOBILE_SECTION_Y,
        });
      };

      gsap.set(section, {
        autoAlpha: 0,
        filter: "blur(0px)",
      });

      syncAboutSectionPosition();
      mobileAboutQuery.addEventListener("change", syncAboutSectionPosition);

      //The About section alone owns this tilted 3D text plane. Its Y remains
      //local reveal motion only: the plane starts 42px lower and settles at 0.
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
          0, //position parameter
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
          0.02, //position parameter (start tween at.. in total time)
        )
        .to(
          rule,
          {
            scaleX: 1,
            duration: 0.16,
          },
          0.08, //position parameter (start tween at.. in total time)
        )
        .to(
          headingChars,
          {
            autoAlpha: 1,
            filter: "blur(0px)",
            stagger: 0.008,
            duration: 0.05, //To make heading characters appear faster, I reduced the duration
          },
          0, //position parameter (start tween at.. in total time)
        )
        .to(
          bodyChars,
          {
            autoAlpha: 1,
            filter: "blur(0px)",
            stagger: 0.004,
            duration: 0.1,
          },
          0.2, //position parameter (start tween at.. in total time)
        )
        .to(
          content,
          {
            y: () => -getContentTravelDistance(),
            duration: 0.78,
          },
          0.35, //position parameter (start tween at.. in total time)
        )
        .to(
          section,
          {
            filter: "blur(7px)",
            autoAlpha: 0,
            duration: 0.7,
          },
          ">", //position parameter to start this tween after the previous one ends
        );

      //When paused: true on a tween/timeline, the time becomes virtual time, cause it wont play that

      //The total gsap timeline duration is always the farthest ending tween's end time. In this case, total time is 1.83s after calculating
      console.log(timeline.duration());

      //Each position parameter in gsap timeline represents virtual time in the timeline out of the total timeline's duration.
      // e.g 0.35 is 0.35 seconds out of 1.83, 0.2 is 0.2 seconds out of 1.83, etc. The progress is the percentage quotient.

      ScrollTrigger.create({
        trigger: document.documentElement, //The trigger element for the animation.
        start: startY, //The start point. Given in this format -> "value(of trigger element) value(of viewport)". When - of element, meets - of viewport, then we start.
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
            programmaticScrollRef.current
          ) {
            return;
          }

          const releasedDirection = aboutReleasedDirectionRef.current;

          // After releasing About moving forward, ScrollTrigger must not rewind 1 back to 0.3; return.
          if (releasedDirection === "forward") {
            setScrollSectionProgressImmediately(runtime, 1);
            return;
          }

          // After releasing about moving backward, only allow ScrollTrigger to continue moving backward from 0.3 toward 0.
          //Otherwise, return
          if (releasedDirection === "backward" && self.direction > 0) {
            return;
          }

          const progress = self.progress * ABOUT_REVEALED_PROGRESS;

          setScrollSectionProgressImmediately(runtime, progress);

          // Once the backward reveal range is completely exited,
          // reset the release guard.
          if (releasedDirection === "backward" && self.progress <= 0) {
            aboutReleasedDirectionRef.current = null;
            setScrollSectionProgressImmediately(runtime, 0);
          }
        },
      });

      return () => {
        mobileAboutQuery.removeEventListener(
          "change",
          syncAboutSectionPosition,
        );
        aboutTimelineRef.current = null;
      };
    },
    {
      scope: sectionRef,
      dependencies: [
        getAboutLockY,
        getAboutPxDuration,
        startY,
        ABOUT_GSAP_HMR_REVISION,
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      data-scroll-locked-section="about"
      // Remove pointer events to interract with content and debug
      className="absolute z-20 top-0 left-0 w-full
      "
    >
      <div
        ref={planeRef}
        className="absolute right-[9vw] top-[32vh] w-fit text-[#171717] mix-blend-multiply [transform-style:preserve-3d] will-change-[transform,opacity]
          max-[900px]:right-0 max-[900px]:top-[15vh] max-[900px]:w-[min(70vw,34rem)] max-[900px]:mix-blend-normal
          min-[651px]:max-[900px]:top-[30vh]
          min-[900px]:max-[1600px]:top-[40vh]
          min-[900px]:max-[1600px]:right-0
          max-[650px]:left-[44vw] max-[650px]:right-0 max-[650px]:w-auto"
      >
        <div
          ref={viewportRef}
          className="relative h-[min(45vh,40rem)] w-[min(42vw,42rem)] max-[900px]:h-[min(52vh,32rem)] max-[900px]:w-[min(90vw,34rem)] max-[650px]:h-[min(44vh,24rem)] max-[650px]:w-full overflow-y-clip"
        >
          <div className="pointer-events-none absolute w-full right-0 bottom-0 z-20 h-20 bg-linear-to-t from-[#e3e3e3]/95 via-[#e3e3e3]/48 to-transparent max-[900px]:w-[90%] max-[900px]:-right-[10%] max-[650px]:right-0 max-[650px]:w-full " />

          <div className="relative h-full">
            {/* If the content disappears too fast, pad the bottom */}
            <div
              ref={contentRef}
              className="absolute right-10 z-10 pt-12 will-change-transform
                min-[651px]:max-[700px]:mr-[10vw]
                max-[650px]:right-0 max-[650px]:mr-0 max-[650px]:w-full
                pb-[40vh]"
            >
              <div className="about-blur-item">
                <div className="mb-[1.15rem] flex items-center gap-4 font-mono text-[clamp(0.66rem,0.7vw,0.78rem)] uppercase tracking-[0.18em] text-[rgba(23,23,23,0.48)] max-[650px]:justify-end">
                  <span>ABOUT / 01</span>
                  <span className="about-rule block h-px w-[min(10vw,8rem)] bg-[rgba(23,23,23,0.28)]" />
                </div>
                <h1
                  className="m-0 font-sans text-[clamp(2rem,3.5vw,9.65rem)] font-semibold leading-[0.96] tracking-[-0.085em] text-balance pointer-events-auto max-[650px]:ml-auto max-[650px]:w-fit max-[650px]:text-right max-[650px]:text-[clamp(1.75rem,7vw,2rem)]"
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
                className="about-blur-item mt-[2.45rem] mx-auto max-w-[32rem] font-[Garamond,_'Baskerville_Old_Face',_'Times_New_Roman',_serif] text-[clamp(0.94rem,1.2vw,1.5rem)]
                  font-normal leading-[1.8] tracking-[-0.025em] text-[rgba(23,23,23,0.64)] [overflow-wrap:normal] [word-break:normal]
                  max-[900px]:w-[min(90vw,30rem)] max-[900px]:text-[0.95rem] max-[900px]:max-w-[15rem] max-[900px]:text-right
                  max-[650px]:ml-auto max-[650px]:mr-0 max-[650px]:w-full max-[650px]:max-w-[15rem]"
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
  );
}
