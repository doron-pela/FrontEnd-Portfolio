import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";

import type { HomeSection } from "@/@types/home-section.types";
import type {
  ManualScrollSectionProps,
  ScrollSectionRuntime,
} from "@/@types/scroll-locked-section.types";
import { setScrollSectionProgressImmediately } from "@/utils/scroll-locked-section.utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const CONTACT_GSAP_HMR_REVISION = import.meta.hot
  ? (import.meta.hot.data.contactGsapRevision =
      (import.meta.hot.data.contactGsapRevision ?? 0) + 1)
  : 0;

const CONTACT_REVEAL_SCROLL_DISTANCE = 520;

//Safe pre-timeline fallback only. Once the GSAP timeline exists, the exact
//handoff is derived from "locked-story" so key 4 and organic scrolling arrive
//at precisely the same fully assembled Contact composition.
const CONTACT_REVEALED_PROGRESS = 0.22;

const CONTACT_LOCAL_PROGRESS_TWEEN_DURATION = 0.3;
const CONTACT_LOCKED_STORY_TIME = 1.34;

//Contact has no child route or internal project carousel. Its local locked story
//is intentionally shorter than Frontend/Backend, but long enough for the optical
//glass, links and primary email signal to resolve into a deliberate final state.
const CONTACT_LOCKED_SCROLL_VIEWPORTS = 0.88;

const CONTACT_EMAIL = "alepnorod@gmail.com";
const CONTACT_EMAIL_HREF =
  "mailto:alepnorod@gmail.com?subject=Hello%20Doron&body=Hi%20Doron%2C%0A%0AI%20came%20across%20your%20portfolio%20and%20wanted%20to%20get%20in%20touch.%0A%0A";
const CONTACT_WHATSAPP_HREF = "https://wa.me/2349064108594";
const CONTACT_CALL_HREF = "tel:+233257880061";

type SocialKind = "linkedin" | "github" | "instagram";

const SOCIAL_LINKS: readonly {
  kind: SocialKind;
  label: string;
  href: string;
}[] = [
  {
    kind: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/doron-pela-48aa62170/",
  },
  {
    kind: "github",
    label: "GitHub",
    href: "https://github.com/doron-pela/",
  },
  {
    kind: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/doron_pela/",
  },
] as const;

function ArrowUpRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[1.08rem]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg
        aria-hidden="true"
        className="size-[1rem]"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="m6.5 12.4 3.35 3.35L17.8 7.8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="size-[1rem]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect
        height="10"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1.4"
        width="10"
        x="9"
        y="9"
      />
      <path
        d="M15.5 9V6.5A1.5 1.5 0 0 0 14 5H6.5A1.5 1.5 0 0 0 5 6.5V14A1.5 1.5 0 0 0 6.5 15.5H9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

//Recognizable brand marks with explicit fills. These do not inherit the muted
//text color of the surrounding Contact UI, so LinkedIn, GitHub and Instagram
//remain visually identifiable even when the rest of the section is monochrome.
function SocialBrandMark({ kind }: { kind: SocialKind }) {
  if (kind === "linkedin") {
    return (
      <svg aria-hidden="true" className="block size-full" viewBox="0 0 24 24">
        <path
          d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.047c.475-.9 1.636-1.85 3.37-1.85 3.602 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126ZM7.119 20.452H3.555V9h3.564v11.452Z"
          fill="#0A66C2"
        />
      </svg>
    );
  }

  if (kind === "github") {
    return (
      <svg aria-hidden="true" className="block size-full" viewBox="0 0 24 24">
        <path
          d="M12 .297C5.373.297 0 5.67 0 12.297c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.386-1.333-1.755-1.333-1.755-1.089-.745.084-.729.084-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.605-2.665-.304-5.466-1.333-5.466-5.932 0-1.31.468-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.003.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.805 5.625-5.475 5.922.43.371.814 1.103.814 2.222 0 1.606-.015 2.896-.015 3.289 0 .319.216.694.825.576C20.565 22.092 24 17.596 24 12.297 24 5.67 18.627.297 12 .297Z"
          fill="#181717"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="block size-full" viewBox="0 0 24 24">
      <defs>
        <radialGradient
          id="contact-instagram-gradient"
          cx="0"
          cy="0"
          r="1"
          gradientTransform="translate(4 23) rotate(-48) scale(28)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFD600" />
          <stop offset="0.3" stopColor="#FF7A00" />
          <stop offset="0.56" stopColor="#FF0169" />
          <stop offset="0.8" stopColor="#D300C5" />
          <stop offset="1" stopColor="#7638FA" />
        </radialGradient>
      </defs>

      <rect
        fill="url(#contact-instagram-gradient)"
        height="24"
        rx="6"
        width="24"
      />
      <rect
        fill="none"
        height="13"
        rx="3.8"
        stroke="#FFFFFF"
        strokeWidth="1.55"
        width="13"
        x="5.5"
        y="5.5"
      />
      <circle
        cx="12"
        cy="12"
        fill="none"
        r="3.2"
        stroke="#FFFFFF"
        strokeWidth="1.55"
      />
      <circle cx="16.75" cy="7.55" fill="#FFFFFF" r="0.95" />
    </svg>
  );
}

function WhatsAppBrandMark() {
  return (
    <svg aria-hidden="true" className="block size-full" viewBox="0 0 24 24">
      <circle cx="12" cy="12" fill="#25D366" r="12" />
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.496.099-.198.05-.372-.025-.521-.075-.148-.67-1.611-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.009-.371-.011-.57-.011-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.693.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z"
        fill="#FFFFFF"
      />
      <path
        d="M12.04 3.82a8.13 8.13 0 0 0-6.94 12.36L4 20.2l4.12-1.08a8.12 8.12 0 1 0 3.92-15.3Zm0 14.88a6.75 6.75 0 0 1-3.44-.94l-.25-.15-2.44.64.65-2.38-.16-.25A6.77 6.77 0 1 1 12.04 18.7Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

function PhoneMark() {
  return (
    <svg
      aria-hidden="true"
      className="block size-full"
      fill="none"
      viewBox="0 0 40 40"
    >
      <circle cx="20" cy="20" fill="#171717" r="20" />
      <path
        d="m14.3 10.8 3.15 4.78c.4.6.32 1.39-.2 1.9l-1.5 1.43c1.68 3.4 3.96 5.68 7.36 7.36l1.43-1.5c.51-.52 1.3-.6 1.9-.2l4.7 3.12c.6.4.85 1.17.57 1.84-.61 1.49-2.09 2.63-3.78 2.82-3.5.41-8.48-2.03-12.4-5.95-3.92-3.92-6.36-8.9-5.95-12.4.19-1.69 1.33-3.17 2.82-3.78.67-.28 1.44-.03 1.9.58Z"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default function ContactSection({
  startY,
  registerSection,
  programmaticScrollRef,
}: ManualScrollSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const contactTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const contactProgressRef = useRef(CONTACT_REVEALED_PROGRESS);
  const contactLockedRef = useRef(false);
  const contactReleasingRef = useRef(false);
  const contactLockYRef = useRef<number | null>(null);
  const contactSnapRef = useRef(false);
  const contactReleasedDirectionRef = useRef<"forward" | "backward" | null>(
    null,
  );

  const runtimeRef = useRef<ScrollSectionRuntime<HomeSection> | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  const getContactPxDuration = useCallback(() => {
    const revealedProgress =
      runtimeRef.current?.revealedProgress ?? CONTACT_REVEALED_PROGRESS;
    const lockedProgressRange = Math.max(1 - revealedProgress, 0.0001);

    return (
      (window.innerHeight * CONTACT_LOCKED_SCROLL_VIEWPORTS) /
      lockedProgressRange
    );
  }, []);

  const getContactLockY = useCallback(() => {
    return startY + CONTACT_REVEAL_SCROLL_DISTANCE;
  }, [startY]);

  if (!runtimeRef.current) {
    runtimeRef.current = {
      section: "contact",
      startY,
      revealedProgress: CONTACT_REVEALED_PROGRESS,
      timelineRef: contactTimelineRef,
      progressRef: contactProgressRef,
      lockedRef: contactLockedRef,
      releasingRef: contactReleasingRef,
      lockYRef: contactLockYRef,
      snapRef: contactSnapRef,
      releasedDirectionRef: contactReleasedDirectionRef,
      getPxDuration: getContactPxDuration,
      getLockY: getContactLockY,
      localProgressTweenDuration: CONTACT_LOCAL_PROGRESS_TWEEN_DURATION,
    };
  }

  const runtime = runtimeRef.current;
  runtime.startY = startY;
  runtime.getPxDuration = getContactPxDuration;
  runtime.getLockY = getContactLockY;

  useEffect(() => {
    return registerSection(runtime);
  }, [registerSection, runtime]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setEmailCopied(true);

      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }

      copiedTimeoutRef.current = setTimeout(() => {
        setEmailCopied(false);
      }, 1400);
    } catch {
      setEmailCopied(false);
    }
  }, []);

  //Only the refractive highlight reacts to the pointer. The pane itself never
  //tilts or follows the cursor, which keeps the Contact composition quiet while
  //still giving the glass a convincing iOS-like optical response.
  useEffect(() => {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      if (!panel) {
        return;
      }

      const rect = panel.getBoundingClientRect();

      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        panel.style.setProperty("--contact-pointer-x", "50%");
        panel.style.setProperty("--contact-pointer-y", "43%");
        return;
      }

      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;

      panel.style.setProperty("--contact-pointer-x", `${x}%`);
      panel.style.setProperty("--contact-pointer-y", `${y}%`);
    }

    function resetPointerLight() {
      if (!panel) {
        return;
      }

      panel.style.setProperty("--contact-pointer-x", "50%");
      panel.style.setProperty("--contact-pointer-y", "43%");
    }

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("blur", resetPointerLight);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetPointerLight);
      resetPointerLight();
    };
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const panel = panelRef.current;

      if (!section || !panel) {
        return;
      }

      const titleLines = gsap.utils.toArray<HTMLElement>(
        ".contact-title-line",
        section,
      );
      const revealItems = gsap.utils.toArray<HTMLElement>(
        ".contact-reveal-item",
        section,
      );
      const phoneLinks = gsap.utils.toArray<HTMLElement>(
        ".contact-phone-link",
        section,
      );
      const socialItems = gsap.utils.toArray<HTMLElement>(
        ".contact-social-item",
        section,
      );
      const halo = section.querySelector<HTMLElement>(".contact-halo");
      const hairline = section.querySelector<HTMLElement>(".contact-hairline");
      const emailSweep = section.querySelector<HTMLElement>(
        ".contact-email-sweep",
      );
      const prism = section.querySelector<HTMLElement>(".contact-prism");
      const lens = section.querySelector<HTMLElement>(".contact-lens");

      if (!halo || !hairline || !emailSweep || !prism || !lens) {
        return;
      }

      gsap.set(section, {
        autoAlpha: 0,
        filter: "blur(0px)",
      });

      //The pane resolves from a narrow horizontal aperture, then becomes clear.
      //The important difference from the previous pass is that the composition
      //is already positioned at its higher optical center before this begins.
      gsap.set(panel, {
        autoAlpha: 0,
        y: 18,
        scale: 0.94,
        filter: "blur(18px)",
        clipPath: "inset(44% 2% 44% 2% round 2.4rem)",
      });

      gsap.set(titleLines, {
        yPercent: 116,
        xPercent: (index) => (index === 0 ? -3.5 : 3.5),
      });

      gsap.set(revealItems, {
        autoAlpha: 0,
        y: 14,
      });

      gsap.set(phoneLinks, {
        autoAlpha: 0,
        x: (index) => (index === 0 ? -22 : 22),
      });

      gsap.set(socialItems, {
        autoAlpha: 0,
        scale: 0.68,
        y: 10,
        rotation: (index) => (index - 1) * 4,
        transformOrigin: "50% 50%",
      });

      gsap.set(halo, {
        scale: 0.68,
        autoAlpha: 0,
        transformOrigin: "50% 50%",
      });

      gsap.set(lens, {
        scale: 0.7,
        autoAlpha: 0,
        transformOrigin: "50% 50%",
      });

      //The divider now draws from the center outwards, which makes the contact
      //surface feel assembled rather than simply left-aligned onto the screen.
      gsap.set(hairline, {
        scaleX: 0,
        transformOrigin: "center center",
      });

      gsap.set(emailSweep, {
        xPercent: -145,
        autoAlpha: 0,
      });

      gsap.set(prism, {
        xPercent: -150,
        autoAlpha: 0,
        rotation: -10,
      });

      const timeline = gsap.timeline({
        paused: true,
        defaults: {
          ease: "none",
        },
      });

      contactTimelineRef.current = timeline;

      timeline
        .addLabel("reveal", 0)
        .to(
          section,
          {
            autoAlpha: 1,
            duration: 0.05,
          },
          0,
        )
        .to(
          halo,
          {
            autoAlpha: 0.48,
            scale: 1,
            duration: 0.78,
            ease: "power3.out",
          },
          0.01,
        )
        .to(
          lens,
          {
            autoAlpha: 0.62,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
          },
          0.02,
        )
        .to(
          panel,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            clipPath: "inset(-16% -12% -16% -12% round 3rem)",
            duration: 0.82,
            ease: "power4.out",
          },
          0.03,
        )
        //A single broad refractive streak crosses the pane while the material
        //opens. It provides the richer timeline requested without adding UI.
        .to(
          prism,
          {
            xPercent: 165,
            autoAlpha: 0.82,
            duration: 0.92,
            ease: "power3.inOut",
          },
          0.08,
        )
        .to(
          titleLines,
          {
            yPercent: 0,
            xPercent: 0,
            duration: 0.68,
            stagger: 0.065,
            ease: "power4.out",
          },
          0.12,
        )
        .to(
          hairline,
          {
            scaleX: 1,
            duration: 0.52,
            ease: "power3.inOut",
          },
          0.4,
        )
        .to(
          revealItems,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.46,
            stagger: 0.052,
            ease: "power3.out",
          },
          0.46,
        )
        .to(
          phoneLinks,
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.06,
            ease: "power4.out",
          },
          0.6,
        )
        .to(
          socialItems,
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            rotation: 0,
            duration: 0.44,
            stagger: 0.06,
            ease: "back.out(2)",
          },
          0.72,
        )
        .addLabel("locked-story", CONTACT_LOCKED_STORY_TIME)
        //Locked continuation: no new elements appear. The existing optical
        //material becomes cleaner and one final signal travels through the email.
        .to(
          lens,
          {
            scale: 1.13,
            autoAlpha: 0.78,
            duration: 0.68,
            ease: "power2.inOut",
          },
          CONTACT_LOCKED_STORY_TIME,
        )
        .to(
          halo,
          {
            scale: 1.18,
            autoAlpha: 0.58,
            duration: 0.68,
            ease: "power2.inOut",
          },
          CONTACT_LOCKED_STORY_TIME,
        )
        .to(
          emailSweep,
          {
            xPercent: 175,
            autoAlpha: 0.72,
            duration: 0.64,
            ease: "power2.inOut",
          },
          CONTACT_LOCKED_STORY_TIME + 0.06,
        );

      const lockedStoryTime =
        timeline.labels["locked-story"] ?? CONTACT_LOCKED_STORY_TIME;

      runtime.revealedProgress =
        lockedStoryTime / Math.max(timeline.duration(), 0.0001);

      contactProgressRef.current = runtime.revealedProgress;

      ScrollTrigger.create({
        trigger: document.documentElement,
        start: startY,
        end: getContactLockY,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (
            contactLockedRef.current ||
            contactReleasingRef.current ||
            programmaticScrollRef.current
          ) {
            return;
          }

          const releasedDirection = contactReleasedDirectionRef.current;

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
            contactReleasedDirectionRef.current = null;
            setScrollSectionProgressImmediately(runtime, 0);
          }
        },
      });

      return () => {
        contactTimelineRef.current = null;
      };
    },
    {
      scope: sectionRef,
      dependencies: [
        getContactLockY,
        getContactPxDuration,
        startY,
        CONTACT_GSAP_HMR_REVISION,
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      data-scroll-locked-section="contact"
      className="pointer-events-none absolute inset-0 z-50 overflow-hidden text-[#171717]"
    >
      <style>{`
        .contact-panel {
          --contact-pointer-x: 50%;
          --contact-pointer-y: 43%;
          isolation: isolate;
          overflow: hidden;
          padding:
            clamp(1.75rem,2.45vw,2.65rem)
            clamp(2rem,2.9vw,3.1rem);
          border-radius: 1.9rem;
          background: rgba(227,227,227,0.52);
          -webkit-backdrop-filter:
            blur(48px)
            saturate(1.2)
            brightness(1.035);
          backdrop-filter:
            blur(48px)
            saturate(1.2)
            brightness(1.035);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.72),
            inset 0 -1px 0 rgba(255,255,255,0.12),
            0 28px 90px rgba(23,23,23,0.055);
        }

        .contact-panel-content {
          position: relative;
          z-index: 10;
          min-width: 0;
        }

        /*
          No conventional border. The CONTACT PANEL ITSELF owns backdrop-filter
          so the Spline scene is sampled and heavily diffused before the content
          is painted. The child surface only adds a quiet milky optical layer.
        */
        .contact-panel-surface {
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 0;
          border-radius: inherit;
          background: rgba(255,255,255,0.035);
        }

        .contact-panel-surface::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: rgba(255,255,255,0.11);
          opacity: 0.62;
        }

        .contact-panel-light {
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 1;
          border-radius: inherit;
          opacity: 0.34;
          background:
            radial-gradient(
              circle at var(--contact-pointer-x) var(--contact-pointer-y),
              rgba(255,255,255,0.94) 0%,
              rgba(255,255,255,0.21) 20%,
              transparent 46%
            );
          mix-blend-mode: screen;
        }

        .contact-lens {
          pointer-events: none;
          background:
            radial-gradient(
              ellipse at center,
              rgba(255,255,255,0.38) 0%,
              rgba(255,255,255,0.1) 31%,
              transparent 67%
            );
          filter: blur(22px);
        }

        .contact-halo {
          background:
            radial-gradient(
              circle,
              rgba(255,255,255,0.62) 0%,
              rgba(255,255,255,0.19) 27%,
              rgba(255,255,255,0.045) 48%,
              transparent 72%
            );
          filter: blur(29px);
        }

        .contact-prism {
          pointer-events: none;
          position: absolute;
          top: -40%;
          bottom: -40%;
          left: 0;
          width: 25%;
          z-index: 2;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.18),
              rgba(255,255,255,0.8),
              rgba(255,255,255,0.12),
              transparent
            );
          filter: blur(15px);
          mix-blend-mode: screen;
        }

        .contact-email-link {
          position: relative;
          overflow: hidden;
        }

        .contact-email-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 1px;
          background: rgba(23,23,23,0.25);
          transform: scaleX(0.18);
          transform-origin: left center;
          transition: transform 350ms cubic-bezier(.2,.8,.2,1);
        }

        .contact-email-link:hover::after {
          transform: scaleX(1);
        }

        .contact-email-arrow {
          transition: transform 260ms cubic-bezier(.2,.8,.2,1);
        }

        .contact-email-link:hover .contact-email-arrow {
          transform: translate(3px, -3px);
        }

        .contact-phone-link,
        .contact-social-link,
        .contact-copy-button {
          transition:
            transform 210ms cubic-bezier(.2,.8,.2,1),
            background-color 210ms ease,
            color 210ms ease,
            opacity 210ms ease;
        }

        .contact-phone-link:hover,
        .contact-social-link:hover,
        .contact-copy-button:hover {
          transform: translateY(-2px);
        }

        .contact-email-sweep {
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.9),
              transparent
            );
          filter: blur(5px);
          mix-blend-mode: screen;
        }

        /*
          Brand SVGs are explicit-color marks. Do not let opacity/currentColor
          from the surrounding monochrome interface desaturate them.
        */
        .contact-social-mark,
        .contact-phone-mark {
          opacity: 1 !important;
          filter: drop-shadow(0 4px 10px rgba(23,23,23,0.09));
          isolation: isolate;
        }

        .contact-social-mark svg,
        .contact-phone-mark svg {
          display: block;
          opacity: 1 !important;
        }

        /*
          1476 × 1024 and other wide laptop/desktop compositions:
          bigger, higher and optically centered in the negative Spline space.
        */
        @media (min-width: 1101px) {
          .contact-panel {
            width: min(40vw, 40rem);
          }

          .contact-panel-light {
            opacity: 0.26;
          }
        }

        /*
          Around 906 × 1024 / 774 × 1024 and compact desktop/tablet:
          the panel remains lower in the scene, but its frost becomes dense enough
          that the robot / Spline forms survive only as diffused light and mass
          behind the readable contact content.
        */
        @media (max-width: 1100px) {
          .contact-panel {
            width: min(70vw, 36rem);
            padding:
              clamp(1.65rem,3.6vw,2.25rem)
              clamp(1.75rem,4vw,2.5rem);
            border-radius: 0;
            background: transparent;
            -webkit-backdrop-filter: none;
            backdrop-filter: none;
            box-shadow: none;
            overflow: visible;
          }

          .contact-panel-surface {
            inset: -13% -10%;
            border-radius: 28%;
            background: rgba(227,227,227,0.68);
            -webkit-backdrop-filter:
              blur(66px)
              saturate(1.2)
              brightness(1.035);
            backdrop-filter:
              blur(66px)
              saturate(1.2)
              brightness(1.035);
            filter: blur(18px);
            -webkit-mask-image:
              radial-gradient(
                ellipse at center,
                #000 49%,
                rgba(0,0,0,0.94) 64%,
                rgba(0,0,0,0.62) 78%,
                rgba(0,0,0,0.2) 90%,
                transparent 100%
              );
            mask-image:
              radial-gradient(
                ellipse at center,
                #000 49%,
                rgba(0,0,0,0.94) 64%,
                rgba(0,0,0,0.62) 78%,
                rgba(0,0,0,0.2) 90%,
                transparent 100%
              );
            box-shadow: none;
          }

          .contact-panel-surface::before {
            background: rgba(255,255,255,0.13);
            opacity: 0.5;
          }

          .contact-panel-light {
            inset: -8% -6%;
            opacity: 0.2;
          }

          /*
            The bright travelling prism looks beautiful on desktop, where the
            surface has room to breathe. On tablet/mobile it exposes the exact
            geometry of the contact pane, so the diffused frost takes over.
          */
          .contact-prism {
            display: none;
          }
        }

        /*
          Around 584 × 1024 / 454 × 1024 / 390 × 844:
          still a centered floating object, never a bottom sheet. The center sits
          around 58vh and the glass becomes more diffuse because Spline geometry
          physically overlaps the same visual region.
        */
        @media (max-width: 680px) {
          .contact-panel {
            width: min(88vw, 28rem);
            padding: 1.45rem 1.25rem 1.35rem;
          }

          .contact-panel-surface {
            inset: -11% -8%;
            background: rgba(227,227,227,0.78);
            -webkit-backdrop-filter:
              blur(78px)
              saturate(1.22)
              brightness(1.04);
            backdrop-filter:
              blur(78px)
              saturate(1.22)
              brightness(1.04);
            filter: blur(22px);
          }

          .contact-panel-surface::before {
            opacity: 0.46;
          }

          .contact-panel-light {
            opacity: 0.12;
          }

          .contact-halo {
            filter: blur(40px);
          }
        }

        @media (max-width: 520px) {
          .contact-panel {
            width: min(90vw, 23rem);
            padding: 1.35rem 1.05rem 1.2rem;
          }

          .contact-direct-grid {
            grid-template-columns: minmax(0,1fr);
          }
        }

        @media (max-width: 420px) {
          .contact-panel {
            width: min(91vw, 21.5rem);
            padding: 1.2rem 0.95rem 1.1rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .contact-email-link::after,
          .contact-email-arrow,
          .contact-phone-link,
          .contact-social-link,
          .contact-copy-button {
            transition: none;
          }
        }
      `}</style>

      {/*
        Desktop keeps the Contact object near the center of the wide negative
        Spline field. Tablet/mobile intentionally move its CENTER down to roughly
        64–65vh. Because the narrower composition is also taller, this places the
        visible panel naturally in the lower-middle of the scene without turning
        it into a bottom sheet.
      */}
      <div
        aria-hidden="true"
        className="contact-halo absolute left-1/2 top-[43%] z-0 size-[clamp(28rem,52vw,55rem)] -translate-x-1/2 -translate-y-1/2 rounded-full max-[1100px]:top-[64%] max-[800px]:top-[65%] max-[680px]:top-[65%] max-[420px]:top-[64%] max-[680px]:size-[118vw]"
      />

      <div
        aria-hidden="true"
        className="contact-lens absolute left-1/2 top-[43%] z-[1] size-[clamp(18rem,36vw,38rem)] -translate-x-1/2 -translate-y-1/2 rounded-full max-[1100px]:top-[64%] max-[800px]:top-[65%] max-[680px]:top-[65%] max-[420px]:top-[64%]"
      />

      <div
        ref={panelRef}
        className="contact-panel pointer-events-auto absolute left-1/2 top-[43%] z-10 -translate-x-1/2 -translate-y-1/2 max-[1100px]:top-[64%] max-[800px]:top-[65%] max-[680px]:top-[65%] max-[420px]:top-[64%]"
      >
        <div aria-hidden="true" className="contact-panel-surface" />
        <div aria-hidden="true" className="contact-panel-light" />
        <div aria-hidden="true" className="contact-prism" />

        <div className="contact-panel-content">
          <div className="select-none">
            <div className="overflow-hidden pb-[0.04em]">
              <div className="contact-title-line font-sans text-[clamp(2.6rem,4.4vw,5.2rem)] font-semibold uppercase leading-[0.78] tracking-[-0.085em] min-[681px]:max-[1180px]:text-[clamp(2.35rem,3.8vw,3rem)] min-[681px]:max-[1180px]:leading-[0.8] min-[901px]:max-[1180px]:text-[clamp(1.95rem,4vh,2.2rem)] min-[901px]:max-[1180px]:leading-[0.78] max-[680px]:text-[clamp(2.8rem,11.5vw,3.5rem)] max-[680px]:leading-[0.75]">
                Get in
              </div>
            </div>

            <div className="overflow-hidden pb-[0.09em]">
              <div className="contact-title-line font-sans text-[clamp(2.6rem,4.4vw,5.2rem)] font-semibold uppercase leading-[0.78] tracking-[-0.085em] text-transparent [-webkit-text-stroke:1px_#171717] min-[681px]:max-[1180px]:text-[clamp(2.35rem,3.8vw,3rem)] min-[681px]:max-[1180px]:leading-[0.8] min-[901px]:max-[1180px]:text-[clamp(1.95rem,4vh,2.2rem)] min-[901px]:max-[1180px]:leading-[0.78] max-[680px]:text-[clamp(2.8rem,11.5vw,3.5rem)] max-[680px]:leading-[0.75]">
                Touch
              </div>
            </div>
          </div>

          <div className="contact-reveal-item relative mt-[clamp(1rem,1.45vw,1.35rem)] h-px overflow-hidden bg-[#171717]/13">
            <div className="contact-hairline absolute inset-0 bg-[#171717]/62" />
          </div>

          {/*Primary action*/}
          <div className="contact-reveal-item mt-[clamp(1rem,1.5vw,1.35rem)] flex items-center gap-3">
            <a
              className="contact-email-link group relative flex min-w-0 flex-1 items-center justify-between gap-4 py-3.5"
              href={CONTACT_EMAIL_HREF}
            >
              <span className="truncate font-sans text-[clamp(1.15rem,1.45vw,1.5rem)] font-medium tracking-[-0.04em] max-[1180px]:text-[clamp(1rem,1.7vw,1.25rem)] max-[680px]:text-[clamp(1rem,4.7vw,1.25rem)]">
                {CONTACT_EMAIL}
              </span>

              <span className="contact-email-arrow shrink-0 text-[#171717]/68">
                <ArrowUpRightIcon />
              </span>

              <span className="contact-email-sweep pointer-events-none absolute inset-y-0 left-0 w-[40%]" />
            </a>

            <button
              aria-label={emailCopied ? "Email copied" : "Copy email address"}
              className="contact-copy-button flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#171717]/[0.065] text-[#171717]/62 hover:bg-[#171717]/[0.105] hover:text-[#171717] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/15 max-[680px]:size-10"
              onClick={() => void copyEmail()}
              type="button"
            >
              <CopyIcon copied={emailCopied} />
            </button>
          </div>

          {/*Direct channels. Explicit marks make the function of each control
            readable before the smaller labels/numbers are even parsed.*/}
          <div className="contact-direct-grid contact-reveal-item mt-[clamp(0.9rem,1.2vw,1.1rem)] grid grid-cols-2 gap-3 max-[420px]:gap-2">
            <a
              className="contact-phone-link flex min-h-[4.65rem] items-center gap-3.5 rounded-[1.2rem] bg-[#171717]/[0.045] px-4 py-3.5 hover:bg-[#171717]/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/14 max-[680px]:min-h-[4.15rem] max-[680px]:gap-2.5 max-[680px]:rounded-[1rem] max-[680px]:px-3 max-[420px]:px-2.5"
              href={CONTACT_WHATSAPP_HREF}
              rel="noreferrer"
              target="_blank"
            >
              <span className="contact-phone-mark block size-10 shrink-0 max-[680px]:size-9">
                <WhatsAppBrandMark />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[clamp(0.57rem,0.62vw,0.68rem)] uppercase tracking-[0.15em] text-[#171717]/44 max-[1180px]:text-[0.52rem] max-[680px]:text-[0.46rem]">
                  WhatsApp
                </span>
                <span className="mt-1 block truncate font-sans text-[clamp(0.76rem,0.82vw,0.92rem)] font-medium leading-[1.55] text-[#171717]/82 max-[1180px]:text-[0.74rem] max-[680px]:text-[0.7rem]">
                  +234 906 410 8594
                </span>
              </span>

              <span className="shrink-0 text-[#171717]/58 max-[420px]:hidden">
                <ArrowUpRightIcon />
              </span>
            </a>

            <a
              className="contact-phone-link flex min-h-[4.65rem] items-center gap-3.5 rounded-[1.2rem] bg-[#171717]/[0.045] px-4 py-3.5 hover:bg-[#171717]/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/14 max-[680px]:min-h-[4.15rem] max-[680px]:gap-2.5 max-[680px]:rounded-[1rem] max-[680px]:px-3 max-[420px]:px-2.5"
              href={CONTACT_CALL_HREF}
            >
              <span className="contact-phone-mark block size-10 shrink-0 max-[680px]:size-9">
                <PhoneMark />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[clamp(0.57rem,0.62vw,0.68rem)] uppercase tracking-[0.15em] text-[#171717]/44 max-[1180px]:text-[0.52rem] max-[680px]:text-[0.46rem]">
                  Call
                </span>
                <span className="mt-1 block truncate font-sans text-[clamp(0.76rem,0.82vw,0.92rem)] font-medium leading-[1.55] text-[#171717]/82 max-[1180px]:text-[0.74rem] max-[680px]:text-[0.7rem]">
                  +233 257 880 061
                </span>
              </span>

              <span className="shrink-0 text-[#171717]/58 max-[420px]:hidden">
                <ArrowUpRightIcon />
              </span>
            </a>
          </div>

          {/*Large brand links. The SVG marks carry their own real brand colors and
            therefore remain visually distinct from the monochrome portfolio UI.*/}
          <div className="contact-reveal-item mt-[clamp(0.95rem,1.25vw,1.2rem)] grid grid-cols-3 gap-3 max-[420px]:gap-2">
            {SOCIAL_LINKS.map((social) => (
              <a
                aria-label={social.label}
                className="contact-social-item contact-social-link flex min-h-[4.35rem] min-w-0 items-center gap-3 rounded-[1.1rem] bg-[#171717]/[0.035] px-3.5 py-3 hover:bg-[#171717]/[0.065] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/14 max-[680px]:min-h-[4rem] max-[680px]:flex-col max-[680px]:justify-center max-[680px]:gap-1.5 max-[680px]:rounded-[1rem] max-[680px]:px-2 max-[420px]:min-h-[3.85rem]"
                href={social.href}
                key={social.label}
                rel="noreferrer"
                target="_blank"
                title={social.label}
              >
                <span className="contact-social-mark block size-10 shrink-0 max-[680px]:size-9">
                  <SocialBrandMark kind={social.kind} />
                </span>

                <span className="truncate font-mono text-[clamp(0.57rem,0.62vw,0.68rem)] uppercase tracking-[0.13em] text-[#171717]/58 max-[1180px]:text-[0.52rem] max-[680px]:text-[0.46rem]">
                  {social.label}
                </span>
              </a>
            ))}
          </div>

          <div className="contact-reveal-item mt-[clamp(0.8rem,1vw,1rem)] flex items-center justify-end">
            <span
              aria-live="polite"
              className="font-mono text-[0.5rem] uppercase tracking-[0.13em] text-[#171717]/42"
            >
              {emailCopied ? "Email copied" : "Doron Pela"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
