import { useCallback, type SVGProps } from "react";

import type { HomeSection } from "@/@types/home-section.types";
import {
  NAV_ITEMS,
  type NavbarItem,
  type NavbarSection,
} from "@/data/home/navigation/data-navigation";
import { dispatchPortfolioSectionKey } from "@/utils/index-section-navigation";

type NavbarProps = {
  currentSection: HomeSection;
  onSkillsOpen: () => void;
};

type IconProps = SVGProps<SVGSVGElement>;

function HomeIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m4.5 10.4 7.5-6.1 7.5 6.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M6.4 9.3v9.9h11.2V9.3M9.4 19.2v-5.7h5.2v5.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function AboutIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <circle
        cx="11.3"
        cy="8"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5.1 19.6c.48-3.9 2.54-5.85 6.2-5.85s5.72 1.95 6.2 5.85"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <path
        d="M18.9 4.7v3.5M17.15 6.45h3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function FrontendIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <rect
        height="13.8"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
        width="17.2"
        x="3.4"
        y="4.3"
      />
      <path
        d="m8.6 9.1-2.45 2.45L8.6 14M15.4 9.1l2.45 2.45L15.4 14M13.35 7.8l-2.7 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
      <path
        d="M9 21h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function BackendIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <rect
        height="5.15"
        rx="1.55"
        stroke="currentColor"
        strokeWidth="1.55"
        width="16"
        x="4"
        y="3.7"
      />
      <rect
        height="5.15"
        rx="1.55"
        stroke="currentColor"
        strokeWidth="1.55"
        width="16"
        x="4"
        y="15.15"
      />
      <path
        d="M7 6.28h.01M10 6.28h.01M7 17.72h.01M10 17.72h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M16.3 8.9v6.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.45"
      />
      <circle cx="16.3" cy="12" fill="currentColor" r="1.15" />
    </svg>
  );
}

function SkillsIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m12 3.7 2.3 4.68 5.16.75-3.73 3.63.88 5.14L12 15.48 7.39 17.9l.88-5.14-3.73-3.63 5.16-.75L12 3.7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M7 21h10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.55"
      />
    </svg>
  );
}

function ContactIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M3.8 6h16.4v12H3.8z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
      <path
        d="m4.7 7 7.3 5.45L19.3 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
      <path
        d="M17.6 3.4h3M19.1 1.9v3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function SectionIcon({
  section,
  className,
}: {
  section: NavbarSection;
  className?: string;
}) {
  switch (section) {
    case "init":
      return <HomeIcon className={className} />;

    case "about":
      return <AboutIcon className={className} />;

    case "experience":
      return <FrontendIcon className={className} />;

    case "systems":
      return <BackendIcon className={className} />;

    case "skills":
      return <SkillsIcon className={className} />;

    case "contact":
      return <ContactIcon className={className} />;
  }
}

export default function Navbar({ currentSection, onSkillsOpen }: NavbarProps) {
  const handleSectionNavigation = useCallback(
    (item: NavbarItem) => {
      if (item.section === "skills") {
        onSkillsOpen();
        return;
      }

      if (currentSection === item.section) {
        return;
      }

      //Navbar is mounted by the homepage route itself. SplineScene does not mount
      //that route until its loading screen has completely finished, so section
      //clicks always have access to ScrollLockedSectionController and dispatch
      //the exact same numeric key used by the existing keyboard-navigation path.
      dispatchPortfolioSectionKey(item.key);
    },
    [currentSection, onSkillsOpen],
  );

  return (
    <nav
      aria-label="Portfolio sections"
      className="portfolio-nav fixed left-1/2 top-[clamp(0.45rem,1vh,0.68rem)] z-[500] -translate-x-1/2"
    >
      <style>{`
        .portfolio-nav {
          width: clamp(50rem, 58vw, 64rem);
          height: 3.72rem;
          padding: 0.27rem;
          border-radius: 999px;
          isolation: isolate;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        /*
          Material first, reflections second. The shell is not a flat #000 fill:
          several extremely dark value bands model a rounded black object before
          any white specular highlight is added. This borrows the useful part of
          the supplied 3D-ball reference without importing its many noisy facets.
        */
        .portfolio-nav::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -4;
          border-radius: inherit;
          background:
            radial-gradient(
              78% 140% at 13% -24%,
              rgba(255,255,255,0.075) 0%,
              rgba(255,255,255,0.022) 34%,
              transparent 62%
            ),
            radial-gradient(
              72% 125% at 88% 120%,
              rgba(255,255,255,0.045) 0%,
              rgba(255,255,255,0.012) 38%,
              transparent 65%
            ),
            linear-gradient(
              180deg,
              rgb(8,8,8) 0%,
              rgb(2,2,2) 23%,
              rgb(0,0,0) 57%,
              rgb(0,0,0) 74%,
              rgb(5,5,5) 100%
            );
          box-shadow:
            inset 0 10px 16px -15px rgba(255,255,255,0.34),
            inset 0 -12px 18px -17px rgba(255,255,255,0.16),
            0 10px 26px rgba(0,0,0,0.2),
            0 2px 7px rgba(0,0,0,0.14);
        }

        /*
          Specular light now lives on a complete inset copy of the navbar's own
          pill surface. That is the important geometric constraint: the light is
          clipped by the same curvature as the object instead of being drawn as a
          free-standing strip. Two localized environment catches are enough to
          suggest polished black material without filling the middle with lines.
        */
        .portfolio-nav::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0.14rem 0.16rem 0.18rem;
          z-index: -2;
          border-radius: inherit;
          background:
            radial-gradient(
              62% 118% at 7% -28%,
              rgba(255,255,255,0.62) 0%,
              rgba(255,255,255,0.34) 13%,
              rgba(255,255,255,0.14) 30%,
              rgba(255,255,255,0.035) 46%,
              transparent 61%
            ),
            radial-gradient(
              31% 92% at 99% 7%,
              rgba(255,255,255,0.3) 0%,
              rgba(255,255,255,0.12) 21%,
              rgba(255,255,255,0.03) 40%,
              transparent 59%
            );
          opacity: 0.82;
        }

        .portfolio-nav__items {
          position: relative;
          z-index: 4;
          display: grid;
          width: 100%;
          height: 100%;
          gap: 0.24rem;
        }

        .portfolio-nav__item {
          position: relative;
          display: flex;
          min-width: 0;
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          gap: 0.46rem;
          padding: 0 0.5rem;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(255,255,255,0.9);
          cursor: pointer;
          perspective: 260px;
          user-select: none;
          transition:
            transform 260ms cubic-bezier(.2,1.2,.36,1),
            color 180ms ease;
          will-change: transform;
        }

        /*
          The active item uses the same material model at a smaller scale. Its
          body is still black; slightly stronger tonal modelling makes it read
          as a raised glossy capsule without turning it grey or luminous.
        */
        .portfolio-nav__item::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0.09rem;
          z-index: -1;
          border-radius: inherit;
          opacity: 0;
          background:
            radial-gradient(
              90% 145% at 18% -35%,
              rgba(255,255,255,0.12) 0%,
              rgba(255,255,255,0.035) 37%,
              transparent 65%
            ),
            linear-gradient(
              180deg,
              rgb(12,12,12) 0%,
              rgb(5,5,5) 25%,
              rgb(2,2,2) 58%,
              rgb(7,7,7) 100%
            );
          box-shadow:
            inset 0 8px 12px -13px rgba(255,255,255,0.36),
            inset 0 -9px 13px -13px rgba(255,255,255,0.11),
            0 2px 6px rgba(0,0,0,0.36);
          transition: opacity 190ms ease;
        }

        /*
          The active sheen follows the active capsule itself. It occupies a full
          inset rounded surface, then localized gradients determine where light
          is visible. This keeps the highlight curved at the ends and straight
          through the centre without ever becoming a rectangular patch.
        */
        .portfolio-nav__item::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0.14rem;
          z-index: 1;
          border-radius: inherit;
          opacity: 0;
          background:
            radial-gradient(
              72% 116% at 8% -28%,
              rgba(255,255,255,0.72) 0%,
              rgba(255,255,255,0.4) 14%,
              rgba(255,255,255,0.17) 31%,
              rgba(255,255,255,0.04) 46%,
              transparent 61%
            ),
            radial-gradient(
              34% 90% at 99% 8%,
              rgba(255,255,255,0.26) 0%,
              rgba(255,255,255,0.085) 24%,
              transparent 55%
            );
          transition: opacity 190ms ease;
        }

        /*
          Hover intentionally does NOT create a second capsule or any light patch.
          It only lifts the content slightly so the hovered destination is clear
          without visually competing with the persistent active state.
        */
        @media (hover: hover) and (pointer: fine) {
          .portfolio-nav__item:hover:not([aria-current="page"]) {
            color: rgba(255,255,255,1);
            transform: translateY(-1px);
          }

          .portfolio-nav__item:hover:not([aria-current="page"])
            .portfolio-nav__icon-shell {
            color: rgba(255,255,255,1);
            transform:
              perspective(240px)
              rotateX(-4deg)
              rotateY(2deg)
              translate3d(0,-1.5px,4px);
          }
        }

        .portfolio-nav__item:focus-visible {
          color: rgba(255,255,255,1);
          outline: 1px solid rgba(255,255,255,0.32);
          outline-offset: -2px;
        }

        .portfolio-nav__item[aria-current="page"] {
          color: rgba(255,255,255,1);
        }

        .portfolio-nav__item[aria-current="page"]::before {
          opacity: 1;
        }

        .portfolio-nav__item[aria-current="page"]::after {
          opacity: 0.78;
        }

        .portfolio-nav__item:active {
          transform: translateY(0) scale(0.975);
          transition-duration: 90ms;
        }

        /*
          The icon remains unbounded. Its wrapper is only a 3D transform target;
          there is no visible icon tile, glass square or clipping container.
        */
        .portfolio-nav__icon-shell {
          position: relative;
          z-index: 2;
          display: grid;
          width: 1.62rem;
          height: 1.62rem;
          flex: 0 0 auto;
          place-items: center;
          color: rgba(255,255,255,0.92);
          perspective: 240px;
          transform:
            perspective(240px)
            rotateX(0deg)
            rotateY(0deg)
            translate3d(0,0,0);
          transform-style: preserve-3d;
          transition:
            transform 260ms cubic-bezier(.2,1.25,.36,1),
            color 180ms ease;
          will-change: transform;
        }

        .portfolio-nav__icon {
          position: relative;
          z-index: 3;
          width: 1.34rem;
          height: 1.34rem;
          overflow: visible;
          color: currentColor;
          shape-rendering: geometricPrecision;
          filter:
            drop-shadow(0 -0.65px 0 rgba(255,255,255,0.92))
            drop-shadow(0 1.15px 0 rgba(23,23,23,0.22))
            drop-shadow(0 2.15px 0 rgba(23,23,23,0.10));
          transform: translateZ(5px);
          transition:
            filter 220ms ease,
            color 220ms ease;
        }

        .portfolio-nav__icon path,
        .portfolio-nav__icon rect,
        .portfolio-nav__icon circle,
        .portfolio-nav__icon ellipse,
        .portfolio-nav__icon line,
        .portfolio-nav__icon polyline,
        .portfolio-nav__icon polygon {
          vector-effect: non-scaling-stroke;
        }

        .portfolio-nav__item:active .portfolio-nav__icon-shell {
          transform:
            perspective(240px)
            rotateX(2deg)
            rotateY(-1deg)
            translate3d(0,0,1px);
        }

        .portfolio-nav__label {
          position: relative;
          z-index: 2;
          display: inline-block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family:
            "Avenir Next",
            "Segoe UI",
            "Helvetica Neue",
            Arial,
            sans-serif;
          font-size: clamp(0.59rem, 0.58vw, 0.69rem);
          font-stretch: expanded;
          font-weight: 650;
          letter-spacing: 0.012em;
          line-height: 1;
          text-transform: none;
          transform: scaleX(1.055);
          transform-origin: center;
        }

        .portfolio-nav__tooltip {
          pointer-events: none;
          position: absolute;
          left: 50%;
          top: calc(100% + 0.58rem);
          z-index: 30;
          width: max-content;
          max-width: 12rem;
          transform: translate(-50%, -4px) scale(0.96);
          transform-origin: top center;
          border: 1px solid rgba(255,255,255,0.75);
          border-radius: 0.68rem;
          background: rgba(255,255,255,0.76);
          -webkit-backdrop-filter:
            blur(22px)
            saturate(1.18)
            brightness(1.04);
          backdrop-filter:
            blur(22px)
            saturate(1.18)
            brightness(1.04);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.88),
            inset 0 -1px 0 rgba(23,23,23,0.07),
            0 9px 24px rgba(23,23,23,0.09);
          opacity: 0;
          visibility: hidden;
          padding: 0.43rem 0.58rem;
          color: rgba(23,23,23,0.88);
          font-family:
            "Avenir Next",
            "Segoe UI",
            "Helvetica Neue",
            Arial,
            sans-serif;
          font-size: 0.68rem;
          font-weight: 620;
          letter-spacing: 0.01em;
          line-height: 1;
          text-align: center;
          text-transform: none;
          white-space: nowrap;
          transition:
            opacity 180ms ease,
            transform 220ms cubic-bezier(.2,1.2,.36,1),
            visibility 180ms ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .portfolio-nav__item:focus-visible .portfolio-nav__tooltip {
            opacity: 1;
            visibility: visible;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @media (max-width: 1180px) {
          .portfolio-nav {
            width: min(82vw, 32rem);
            height: 3.55rem;
            padding: 0.26rem;
          }

          .portfolio-nav__items {
            gap: 0.18rem;
          }

          .portfolio-nav__item {
            gap: 0;
            padding: 0;
          }

          .portfolio-nav__label {
            display: none;
          }

          .portfolio-nav__icon-shell {
            width: 1.66rem;
            height: 1.66rem;
          }

          .portfolio-nav__icon {
            width: 1.38rem;
            height: 1.38rem;
          }

          .portfolio-nav__item::before,
          .portfolio-nav__item::after {
            inset: 0.1rem 0.2rem;
          }
        }

        @media (max-width: 680px) {
          .portfolio-nav {
            top: 0.42rem;
            width: min(calc(100vw - 0.5rem), 25.5rem);
            height: 3.34rem;
            padding: 0.23rem;
          }

          .portfolio-nav__icon-shell {
            width: 1.58rem;
            height: 1.58rem;
          }

          .portfolio-nav__icon {
            width: 1.31rem;
            height: 1.31rem;
          }

          .portfolio-nav__tooltip {
            display: none;
          }
        }

        @media (max-width: 390px) {
          .portfolio-nav {
            width: calc(100vw - 0.42rem);
            height: 3.18rem;
            padding: 0.21rem;
          }

          .portfolio-nav__icon-shell {
            width: 1.5rem;
            height: 1.5rem;
          }

          .portfolio-nav__icon {
            width: 1.24rem;
            height: 1.24rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .portfolio-nav__item,
          .portfolio-nav__item::before,
          .portfolio-nav__item::after,
          .portfolio-nav__icon-shell,
          .portfolio-nav__tooltip {
            transition-duration: 0ms;
          }
        }
      `}</style>

      <div
        className="portfolio-nav__items"
        style={{
          gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))`,
        }}
      >
        {NAV_ITEMS.map((item) => (
          <button
            aria-current={item.section === currentSection ? "page" : undefined}
            aria-label={item.shortLabel}
            className="portfolio-nav__item"
            key={item.section}
            onClick={() => void handleSectionNavigation(item)}
            type="button"
          >
            <span className="portfolio-nav__icon-shell">
              <SectionIcon
                className="portfolio-nav__icon"
                section={item.section}
              />
            </span>

            <span className="portfolio-nav__label">{item.label}</span>

            {/* <span
              aria-hidden="true"
              className="portfolio-nav__tooltip"
              role="tooltip"
            >
              {item.shortLabel}
            </span> */}
          </button>
        ))}
      </div>
    </nav>
  );
}
