import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

export const Route = createFileRoute("/")({
  component: HomePage,
});

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);

const SECTION_SCROLL_DURATION_SECONDS = 2.5;

const HOME_SECTION_STARTS = {
  about: 430,
  experience: 1400,
  systems: 2300,
  projects: 3300,
} as const;

type HomeSection = keyof typeof HOME_SECTION_STARTS;

const ABOUT_REVEALED_PROGRESS = 0.52;

const ABOUT_LINES = ["I'm a Product-minded", "software Engineer"];

const ABOUT_BODY =
  "I build fast, reliable software from interface to infrastructure, " +
  "and everything in-between. Backend workflows, motion, and product logic turn complex ideas into software that has a direct impact on the end-user.";

function splitTextIntoWords(text: string) {
  return text.split(" ").map((word) => word.split(""));
}

function HomePage() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);

  const bodyWords = useMemo(() => {
    return splitTextIntoWords(ABOUT_BODY);
  }, []);

  function getAboutDuration() {
    const contentHeight = planeRef.current?.scrollHeight ?? 0;
    const viewportHeight = window.innerHeight;

    return Math.max(contentHeight * 1.85, viewportHeight * 1.75);
  }

  function getSectionScrollTarget(section: HomeSection) {
    if (section === "about") {
      return (
        HOME_SECTION_STARTS.about + getAboutDuration() * ABOUT_REVEALED_PROGRESS
      );
    }

    return HOME_SECTION_STARTS[section];
  }

  function scrollToHomeSection(section: HomeSection) {
    const targetY = getSectionScrollTarget(section);

    gsap.killTweensOf(window);

    gsap.to(window, {
      duration: SECTION_SCROLL_DURATION_SECONDS,
      ease: "power1.Out",
      overwrite: "auto",
      scrollTo: {
        y: targetY,
        autoKill: false,
      },
    });
  }

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

      switch (event.key) {
        case "1":
          scrollToHomeSection("about");
          break;

        case "2":
          scrollToHomeSection("experience");
          break;

        case "3":
          scrollToHomeSection("systems");
          break;

        case "4":
          scrollToHomeSection("projects");
          break;

        default:
          break;
      }
    }

    window.addEventListener("keydown", handleSectionKeyDown);

    return () => window.removeEventListener("keydown", handleSectionKeyDown);
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const plane = planeRef.current;

      if (!section || !plane) return;

      const headingChars = gsap.utils.toArray<HTMLElement>(
        ".about-heading-char",
      );

      const bodyChars = gsap.utils.toArray<HTMLElement>(".about-body-char");
      const bodyWords = gsap.utils.toArray<HTMLElement>(".about-body-word");
      const rule = section.querySelector(".about-rule");

      function getDuration() {
        const contentHeight = plane?.scrollHeight;
        const viewportHeight = window.innerHeight;

        if (!contentHeight) return viewportHeight * 1.75;
        return Math.max(contentHeight * 1.85, viewportHeight * 1.75);
      }

      gsap.set(section, {
        autoAlpha: 0,
      });

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

      gsap.set(bodyWords, {
        whiteSpace: "nowrap",
      });

      gsap.set([...headingChars, ...bodyChars], {
        autoAlpha: 0,
        yPercent: 28,
        filter: "blur(7px)",
      });

      const timeline = gsap.timeline({
        defaults: {
          ease: "none",
        },
        scrollTrigger: {
          trigger: document.documentElement,
          start: HOME_SECTION_STARTS.about,
          end: () => HOME_SECTION_STARTS.about + getDuration(),
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      });

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
            duration: 0.86,
          },
          0.02,
        )
        .to(
          rule,
          {
            scaleX: 1,
            duration: 0.22,
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
            duration: 0.58,
          },
          0.11,
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
            duration: 0.62,
          },
          0.28,
        )
        .to(
          plane,
          {
            rotateY: -40,
            rotateX: 0.5,
            rotateZ: 0,
            y: -16,
            duration: 0.42,
          },
          0.68,
        )
        .to(
          section,
          {
            autoAlpha: 0,
            duration: 0.38,
          },
          1.28,
        );
    },
    {
      scope: sectionRef,
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
          className="absolute right-[10vw] top-[35vh] w-fit text-[#171717] mix-blend-multiply [transform-style:preserve-3d] will-change-[transform,opacity] max-[900px]:left-[7vw] max-[900px]:right-auto max-[900px]:top-[18vh] max-[900px]:w-[min(86vw,34rem)] max-[900px]:[mix-blend-mode:normal]"
        >
          <div className="mb-[1.15rem] flex items-center gap-4 font-mono text-[clamp(0.66rem,0.7vw,0.78rem)] uppercase tracking-[0.18em] text-[rgba(23,23,23,0.48)]">
            <span>ABOUT / 01</span>
            <span className="about-rule block h-px w-[min(10vw,8rem)] bg-[rgba(23,23,23,0.28)]" />
          </div>

          <h1
            className="m-0 font-sans text-[clamp(2rem,3vw,7.65rem)] font-semibold leading-[0.96] tracking-[-0.085em] text-balance max-[900px]:text-[clamp(2.65rem,13vw,5.4rem)]"
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

          <p
            className="mt-[1.45rem] w-[37rem] max-w-[37rem] font-sans text-[clamp(0.94rem,1.05vw,1.08rem)] font-normal leading-[1.8] tracking-[-0.025em] text-[rgba(23,23,23,0.64)] [overflow-wrap:normal] [word-break:normal] max-[900px]:max-w-[29rem] max-[900px]:text-[0.95rem]"
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
                    className="about-body-char inline-block will-change-[transform,opacity,filter]"
                    key={`${wordIndex}-${charIndex}`}
                  >
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </p>
        </div>
      </section>

      <div
        className="pointer-events-none h-[260vh] max-[900px]:h-[240vh]"
        aria-hidden="true"
      />
    </>
  );
}
