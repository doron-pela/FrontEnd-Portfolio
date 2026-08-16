import { useCallback, useEffect, useRef, type SVGProps } from "react";

import {
  NAV_ITEMS,
  type NavbarItem,
  type NavbarSection,
} from "@/data/home/navigation/data-navigation";
import { dispatchPortfolioSectionKey } from "@/utils/index-section-navigation";

type NavbarProps = {
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

export default function Navbar({ onSkillsOpen }: NavbarProps) {
  const navRef = useRef<HTMLElement | null>(null);

  const handleSectionNavigation = useCallback(
    (item: NavbarItem) => {
      if (item.section === "skills") {
        onSkillsOpen();
        return;
      }

      //Navbar is mounted by the homepage route itself. SplineScene does not mount
      //that route until its loading screen has completely finished, so section
      //clicks always have access to ScrollLockedSectionController and dispatch
      //the exact same numeric key used by the existing keyboard-navigation path.
      dispatchPortfolioSectionKey(item.key);
    },
    [onSkillsOpen],
  );

  //Keep the liquid-glass shell responsive to pointer position. The page's actual
  //Spline canvas remains the background, while these CSS optical layers supply
  //specular response and depth without introducing another renderer.
  useEffect(() => {
    const nav = navRef.current;

    if (!nav) {
      return;
    }

    function resetOptics() {
      if (!nav) {
        return;
      }

      nav.style.setProperty("--nav-pointer-x", "50%");
      nav.style.setProperty("--nav-pointer-y", "22%");
    }

    function handlePointerMove(event: PointerEvent) {
      if (!nav) {
        return;
      }

      const rect = nav.getBoundingClientRect();

      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        resetOptics();
        return;
      }

      const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;

      nav.style.setProperty("--nav-pointer-x", `${x}%`);
      nav.style.setProperty("--nav-pointer-y", `${y}%`);
    }

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("blur", resetOptics);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetOptics);
      resetOptics();
    };
  }, []);

  return (
    <nav
      ref={navRef}
      aria-label="Portfolio sections"
      className="portfolio-nav fixed left-1/2 top-[clamp(0.45rem,1vh,0.68rem)] z-[500] -translate-x-1/2"
    >
      <style>{`
        .portfolio-nav {
          --nav-pointer-x: 50%;
          --nav-pointer-y: 22%;

          width: clamp(50rem, 58vw, 64rem);
          height: 3.72rem;
          padding: 0.27rem;
          border-radius: 999px;
          isolation: isolate;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        /*
          Restore the deeper liquid-glass shell from the earlier navbar, but keep
          the palette strictly monochrome. Depth comes from white/black Fresnel-
          like edges, pointer light and real backdrop blur rather than bright hue.
        */
        .portfolio-nav::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -4;
          border-radius: inherit;
          background: rgba(227, 227, 227, 0.29);
          -webkit-backdrop-filter:
            blur(21px)
            saturate(1.32)
            brightness(1.075)
            contrast(1.025);
          backdrop-filter:
            blur(21px)
            saturate(1.32)
            brightness(1.075)
            contrast(1.025);
          box-shadow:
            inset 0 1.2px 0 rgba(255,255,255,0.9),
            inset 0 -1.4px 0 rgba(23,23,23,0.13),
            inset 1.8px 0 1.4px rgba(255,255,255,0.24),
            inset -1.8px 0 1.4px rgba(23,23,23,0.08),
            0 9px 28px rgba(23,23,23,0.075),
            0 2px 7px rgba(23,23,23,0.045);
        }

        .portfolio-nav::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 1px;
          z-index: -2;
          border-radius: inherit;
          background:
            radial-gradient(
              circle at var(--nav-pointer-x) var(--nav-pointer-y),
              rgba(255,255,255,0.94) 0%,
              rgba(255,255,255,0.31) 15%,
              rgba(255,255,255,0.07) 35%,
              transparent 59%
            ),
            radial-gradient(
              ellipse at 50% 123%,
              rgba(23,23,23,0.13) 0%,
              rgba(23,23,23,0.035) 42%,
              transparent 71%
            );
          opacity: 0.76;
          mix-blend-mode: screen;
        }

        .portfolio-nav__items {
          position: relative;
          z-index: 4;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
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
          color: rgba(23,23,23,0.8);
          cursor: pointer;
          perspective: 260px;
          user-select: none;
          transition:
            transform 300ms cubic-bezier(.2,1.4,.36,1),
            color 220ms ease;
          will-change: transform;
        }

        /*
          Each nav item is still a shallow water lens. The old hover depth is
          retained, but its edge separation is now white/black only.
        */
        .portfolio-nav__item::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0.09rem;
          z-index: -1;
          border-radius: inherit;
          opacity: 0.065;
          transform: scale(0.88);
          background:
            radial-gradient(
              circle at 27% 13%,
              rgba(255,255,255,0.97) 0%,
              rgba(255,255,255,0.43) 11%,
              rgba(255,255,255,0.08) 31%,
              transparent 54%
            ),
            radial-gradient(
              circle at 72% 97%,
              rgba(23,23,23,0.15) 0%,
              rgba(23,23,23,0.035) 39%,
              transparent 66%
            ),
            rgba(255,255,255,0.075);
          -webkit-backdrop-filter:
            blur(8px)
            saturate(1.3)
            brightness(1.075);
          backdrop-filter:
            blur(8px)
            saturate(1.3)
            brightness(1.075);
          box-shadow:
            inset 0 1.1px 0 rgba(255,255,255,0.86),
            inset 0 -1.2px 0 rgba(23,23,23,0.13),
            inset 1.7px 0 1.2px rgba(255,255,255,0.27),
            inset -1.7px 0 1.2px rgba(23,23,23,0.09),
            0 5px 13px rgba(23,23,23,0.065);
          transition:
            opacity 260ms ease,
            transform 340ms cubic-bezier(.2,1.45,.36,1),
            box-shadow 260ms ease;
        }

        .portfolio-nav__item::after {
          content: "";
          pointer-events: none;
          position: absolute;
          left: 18%;
          top: 11%;
          z-index: 1;
          width: 36%;
          height: 18%;
          border-radius: 999px;
          opacity: 0;
          transform: translateY(2px) scaleX(0.72);
          background: rgba(255,255,255,0.83);
          filter: blur(3.5px);
          transition:
            opacity 230ms ease,
            transform 330ms cubic-bezier(.2,1.45,.36,1);
          mix-blend-mode: screen;
        }

        .portfolio-nav__item:hover,
        .portfolio-nav__item:focus-visible {
          color: rgba(23,23,23,0.98);
          transform: translateY(-1px) scale(1.012);
          outline: none;
        }

        .portfolio-nav__item:hover::before,
        .portfolio-nav__item:focus-visible::before {
          opacity: 1;
          transform: scale(1);
          box-shadow:
            inset 0 1.5px 0 rgba(255,255,255,0.98),
            inset 0 -1.5px 0 rgba(23,23,23,0.15),
            inset 1.9px 0 1.3px rgba(255,255,255,0.34),
            inset -1.9px 0 1.3px rgba(23,23,23,0.11),
            0 8px 21px rgba(23,23,23,0.1);
        }

        .portfolio-nav__item:hover::after,
        .portfolio-nav__item:focus-visible::after {
          opacity: 0.72;
          transform: translateY(0) scaleX(1);
        }

        .portfolio-nav__item:active {
          transform: translateY(0) scale(0.975);
          transition-duration: 90ms;
        }

        /*
          The icon is intentionally UNBOUNDED. This wrapper exists only as a
          transform target for the hover lift, not as a visible tile or badge.
          There is no background, border, radius, glass box or clipping around it.
        */
        .portfolio-nav__icon-shell {
          position: relative;
          z-index: 2;
          display: grid;
          width: 1.62rem;
          height: 1.62rem;
          flex: 0 0 auto;
          place-items: center;
          color: rgba(23,23,23,0.88);
          perspective: 240px;
          transform:
            perspective(240px)
            rotateX(0deg)
            rotateY(0deg)
            translate3d(0,0,0);
          transform-style: preserve-3d;
          transition:
            transform 300ms cubic-bezier(.2,1.35,.36,1),
            color 220ms ease;
          will-change: transform;
        }

        /*
          Keep the SVG itself razor-sharp. No blurred glass background and no
          scale-based enlargement. The zero-blur drop shadows create a tiny
          white crown and dark extrusion directly from the vector geometry.
        */
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

        /*
          The pop now comes from displacement and perspective, not magnification.
          That keeps the SVG geometry crisp while still making it feel like it
          physically lifts out of the liquid navbar on hover.
        */
        .portfolio-nav__item:hover .portfolio-nav__icon-shell,
        .portfolio-nav__item:focus-visible .portfolio-nav__icon-shell {
          color: rgba(10,10,10,0.98);
          transform:
            perspective(240px)
            rotateX(-10deg)
            rotateY(5deg)
            translate3d(0,-2.5px,8px);
        }

        .portfolio-nav__item:hover .portfolio-nav__icon,
        .portfolio-nav__item:focus-visible .portfolio-nav__icon {
          filter:
            drop-shadow(0 -0.8px 0 rgba(255,255,255,1))
            drop-shadow(0 1.35px 0 rgba(23,23,23,0.26))
            drop-shadow(0 3px 0 rgba(23,23,23,0.10));
        }

        .portfolio-nav__item:active .portfolio-nav__icon-shell {
          transform:
            perspective(240px)
            rotateX(2deg)
            rotateY(-1deg)
            translate3d(0,0,1px);
        }
        /*
          Visible labels keep their authored casing. The slight scaleX gives the
          lettering the wider horizontal feel requested without forcing another
          font dependency into the project.
        */
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

        /*
          Only the shortLabel is shown. No subtitle, no helper copy and no forced
          uppercase. This replaces the browser's unstyleable native title bubble.
        */
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
          .portfolio-nav__item:hover .portfolio-nav__tooltip,
          .portfolio-nav__item:focus-visible .portfolio-nav__tooltip {
            opacity: 1;
            visibility: visible;
            transform: translate(-50%, 0) scale(1);
          }
        }

        /*
          Tablet / mobile remain a six-icon dock. The text disappears, but the
          monochrome glass icons keep their depth and equal spacing.
        */
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

          .portfolio-nav__item::before {
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

          .portfolio-nav::before {
            background: rgba(227,227,227,0.34);
            -webkit-backdrop-filter:
              blur(23px)
              saturate(1.24)
              brightness(1.075);
            backdrop-filter:
              blur(23px)
              saturate(1.24)
              brightness(1.075);
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

      <div className="portfolio-nav__items">
        {NAV_ITEMS.map((item) => (
          <button
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

            <span
              aria-hidden="true"
              className="portfolio-nav__tooltip"
              role="tooltip"
            >
              {item.shortLabel}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
