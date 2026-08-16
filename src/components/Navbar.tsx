import { useCallback, useEffect, useRef, type SVGProps } from "react";

import type { HomeSection } from "@/@types/home-section.types";
import {
  dispatchPortfolioSectionKey,
  type PortfolioSectionKey,
} from "@/utils/index-section-navigation";

type NavbarItem = {
  section: HomeSection;
  key: PortfolioSectionKey;
  label: string;
  shortLabel: string;
};

const NAV_ITEMS: readonly NavbarItem[] = [
  {
    section: "init",
    key: "0",
    label: "Home",
    shortLabel: "Home",
  },
  {
    section: "about",
    key: "1",
    label: "About me",
    shortLabel: "About",
  },
  {
    section: "experience",
    key: "2",
    label: "Front-End",
    shortLabel: "Front end work",
  },
  {
    section: "systems",
    key: "3",
    label: "Back-End",
    shortLabel: "Back end work",
  },
  {
    section: "contact",
    key: "4",
    label: "Contact me",
    shortLabel: "Contact",
  },
] as const;

type IconProps = SVGProps<SVGSVGElement>;

function HomeIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="m3.5 10.6 8.5-7 8.5 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
      <path
        d="M5.8 9.25V20h12.4V9.25M9.4 20v-6.2h5.2V20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
    </svg>
  );
}

function AboutIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <circle
        cx="12"
        cy="8"
        r="3.35"
        stroke="currentColor"
        strokeWidth="1.55"
      />
      <path
        d="M5.4 20c.52-4.05 2.82-6.07 6.6-6.07S18.08 15.95 18.6 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.55"
      />
      <path
        d="M19.2 4.7v3.2M17.6 6.3h3.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function FrontendIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <rect
        height="14.2"
        rx="2.1"
        stroke="currentColor"
        strokeWidth="1.5"
        width="18"
        x="3"
        y="4.2"
      />
      <path
        d="M8.2 9.2 5.8 11.6l2.4 2.4M15.8 9.2l2.4 2.4-2.4 2.4M13.4 7.9l-2.8 7.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
      <path
        d="M9.2 21h5.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function BackendIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <rect
        height="5.15"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.45"
        width="16"
        x="4"
        y="3.6"
      />
      <rect
        height="5.15"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.45"
        width="16"
        x="4"
        y="15.25"
      />
      <path
        d="M7 6.2h.01M10 6.2h.01M7 17.82h.01M10 17.82h.01M16 8.75v6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="16" cy="12" fill="currentColor" r="1.15" />
    </svg>
  );
}

function ContactIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M3.8 5.8h16.4v12.4H3.8z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m4.7 6.8 7.3 5.55 7.3-5.55"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M17.6 3.5h3M19.1 2v3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function SectionIcon({
  section,
  className,
}: {
  section: HomeSection;
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

    case "contact":
      return <ContactIcon className={className} />;
  }
}

export default function Navbar() {
  const navRef = useRef<HTMLElement | null>(null);

  const handleSectionNavigation = useCallback((item: NavbarItem) => {
    //Navbar is mounted by the homepage route itself. SplineScene does not mount
    //that route until its loading screen has completely finished, so this click
    //always has access to ScrollLockedSectionController and can dispatch the
    //exact same numeric key used by the existing keyboard-navigation path.
    dispatchPortfolioSectionKey(item.key);
  }, []);

  //The supplied liquid-glass reference derives its strongest specular response
  //from the glass normal / light relationship. Here the Spline canvas remains
  //the real page background, so the navbar tracks the pointer and feeds that
  //position into CSS radial highlights instead of trying to replace Spline with
  //a second WebGL background renderer.
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
      className="portfolio-nav fixed left-1/2 top-[clamp(0.5rem,1.15vh,0.78rem)] z-[500] -translate-x-1/2"
    >
      <style>{`
        .portfolio-nav {
          --nav-pointer-x: 50%;
          --nav-pointer-y: 22%;
          width: clamp(47rem, 52vw, 59rem);
          height: 4.85rem;
          padding: 0.4rem;
          border-radius: 999px;
          isolation: isolate;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        /*
          The outer pill owns the actual backdrop sampling. The reference shader
          supplied for this navbar bends RGB samples separately and combines
          specular + Fresnel lighting. A DOM overlay cannot directly sample the
          existing Spline WebGL canvas as that shader's u_bg texture without
          re-architecting the renderer, so the same optical cues are reproduced
          here with real backdrop filtering, chromatic edge separation and
          pointer-driven specular layers.
        */
        .portfolio-nav::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -4;
          border-radius: inherit;
          background: rgba(227, 227, 227, 0.28);
          -webkit-backdrop-filter:
            blur(20px)
            saturate(1.55)
            brightness(1.08)
            contrast(1.02);
          backdrop-filter:
            blur(20px)
            saturate(1.55)
            brightness(1.08)
            contrast(1.02);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.82),
            inset 0 -1px 0 rgba(23,23,23,0.10),
            inset 1.4px 0 1.4px rgba(255,70,135,0.14),
            inset -1.4px 0 1.4px rgba(74,178,255,0.15),
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
              rgba(255,255,255,0.92) 0%,
              rgba(255,255,255,0.28) 15%,
              rgba(255,255,255,0.065) 34%,
              transparent 58%
            ),
            radial-gradient(
              ellipse at 50% 120%,
              rgba(23,23,23,0.10) 0%,
              rgba(23,23,23,0.025) 43%,
              transparent 71%
            );
          opacity: 0.72;
          mix-blend-mode: screen;
        }

        .portfolio-nav__items {
          position: relative;
          z-index: 4;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          width: 100%;
          height: 100%;
          gap: 0.38rem;
        }

        .portfolio-nav__item {
          position: relative;
          display: flex;
          min-width: 0;
          height: 100%;
          align-items: center;
          justify-content: center;
          width: 100%;
          gap: 0.68rem;
          padding: 0 0.78rem;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(23,23,23,0.84);
          cursor: pointer;
          user-select: none;
          transition:
            transform 320ms cubic-bezier(.2,1.45,.36,1),
            color 230ms ease;
          will-change: transform;
        }

        /*
          Every nav item is itself a shallow water lens. The default state is
          nearly invisible; hover/focus increases the effective "glass mask".
          The red/blue inset pair is the restrained DOM analogue of the reference
          shader's RGB dispersion around a curved glass edge.
        */
        .portfolio-nav__item::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0.14rem;
          z-index: -1;
          border-radius: inherit;
          opacity: 0.08;
          transform: scale(0.86);
          background:
            radial-gradient(
              circle at 27% 13%,
              rgba(255,255,255,0.95) 0%,
              rgba(255,255,255,0.42) 11%,
              rgba(255,255,255,0.08) 31%,
              transparent 53%
            ),
            radial-gradient(
              circle at 70% 94%,
              rgba(23,23,23,0.13) 0%,
              rgba(23,23,23,0.025) 39%,
              transparent 65%
            ),
            rgba(255,255,255,0.08);
          -webkit-backdrop-filter:
            blur(7px)
            saturate(1.65)
            brightness(1.09);
          backdrop-filter:
            blur(7px)
            saturate(1.65)
            brightness(1.09);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.82),
            inset 0 -1px 0 rgba(23,23,23,0.13),
            inset 1.6px 0 1px rgba(255,72,144,0.19),
            inset -1.6px 0 1px rgba(65,173,255,0.20),
            0 6px 14px rgba(23,23,23,0.075);
          transition:
            opacity 280ms ease,
            transform 360ms cubic-bezier(.2,1.45,.36,1),
            box-shadow 280ms ease;
        }

        .portfolio-nav__item::after {
          content: "";
          pointer-events: none;
          position: absolute;
          left: 18%;
          top: 13%;
          z-index: 1;
          width: 38%;
          height: 20%;
          border-radius: 999px;
          opacity: 0;
          transform: translateY(2px) scaleX(0.7);
          background: rgba(255,255,255,0.82);
          filter: blur(4px);
          transition:
            opacity 250ms ease,
            transform 360ms cubic-bezier(.2,1.45,.36,1);
          mix-blend-mode: screen;
        }

        .portfolio-nav__item:hover,
        .portfolio-nav__item:focus-visible {
          color: rgba(23,23,23,0.96);
          transform: translateY(-2px) scale(1.055);
          outline: none;
        }

        .portfolio-nav__item:hover::before,
        .portfolio-nav__item:focus-visible::before {
          opacity: 1;
          transform: scale(1);
          box-shadow:
            inset 0 1.5px 0 rgba(255,255,255,0.95),
            inset 0 -1.5px 0 rgba(23,23,23,0.14),
            inset 1.8px 0 1.2px rgba(255,72,144,0.21),
            inset -1.8px 0 1.2px rgba(65,173,255,0.22),
            0 8px 20px rgba(23,23,23,0.095);
        }

        .portfolio-nav__item:hover::after,
        .portfolio-nav__item:focus-visible::after {
          opacity: 0.7;
          transform: translateY(0) scaleX(1);
        }

        /*
          iOS-like press response: the lens compresses first and then the normal
          spring transition restores it when the pointer is released.
        */
        .portfolio-nav__item:active {
          transform: translateY(0) scale(0.92);
          transition-duration: 90ms;
        }

        .portfolio-nav__icon {
          position: relative;
          z-index: 2;
          width: 1.9rem;
          height: 1.9rem;
          flex: 0 0 auto;
          filter:
            drop-shadow(0 1px 1px rgba(255,255,255,0.44))
            drop-shadow(0 2px 4px rgba(23,23,23,0.055));
        }

        /*
          The icon artwork uses SVG presentation attributes for its original
          strokeWidth values. Override the actual stroked child geometry here so
          the icons gain real visual weight rather than merely becoming darker.
        */
        .portfolio-nav__icon path,
        .portfolio-nav__icon rect,
        .portfolio-nav__icon circle {
          stroke-width: 1.9;
        }

        /*
          The icon artwork uses SVG presentation attributes for its original
          strokeWidth values. Override the actual stroked child geometry here so
          the icons gain real visual weight rather than merely becoming darker.
        */
        .portfolio-nav__icon path,
        .portfolio-nav__icon rect,
        .portfolio-nav__icon circle {
          stroke-width: 1.9;
        }

        .portfolio-nav__label {
          position: relative;
          z-index: 2;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            monospace;
          font-size: clamp(0.68rem, 0.66vw, 0.8rem);
          font-weight: 750;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /*
          Tablet / mobile become a five-lens icon dock. No visible text, but each
          button keeps its aria-label/title for keyboard and assistive use.
        */
        @media (max-width: 1180px) {
          .portfolio-nav {
            width: min(78vw, 32.5rem);
            height: 4.55rem;
            padding: 0.38rem;
          }

          .portfolio-nav__item {
            padding: 0;
            gap: 0;
          }

          .portfolio-nav__label {
            display: none;
          }

          .portfolio-nav__icon {
            width: 2.03rem;
            height: 2.03rem;
          }

          .portfolio-nav__item::before {
            inset: 0.2rem 0.34rem;
          }
        }

        @media (max-width: 680px) {
          .portfolio-nav {
            top: 0.5rem;
            width: min(calc(100vw - 0.85rem), 26rem);
            height: 4.2rem;
            padding: 0.34rem;
          }

          .portfolio-nav::before {
            background: rgba(227,227,227,0.34);
            -webkit-backdrop-filter:
              blur(24px)
              saturate(1.6)
              brightness(1.09);
            backdrop-filter:
              blur(24px)
              saturate(1.6)
              brightness(1.09);
          }

          .portfolio-nav__icon {
            width: 1.84rem;
            height: 1.84rem;
          }

          .portfolio-nav__item::before {
            inset: 0.18rem 0.22rem;
          }
        }

        @media (max-width: 390px) {
          .portfolio-nav {
            width: calc(100vw - 0.6rem);
            height: 4.05rem;
            padding: 0.32rem;
          }

          .portfolio-nav__icon {
            width: 1.72rem;
            height: 1.72rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .portfolio-nav__item,
          .portfolio-nav__item::before,
          .portfolio-nav__item::after {
            transition-duration: 0ms;
          }
        }
      `}</style>

      <div className="portfolio-nav__items">
        {NAV_ITEMS.map((item) => (
          <button
            aria-label={item.label}
            className="portfolio-nav__item"
            key={item.section}
            onClick={() => void handleSectionNavigation(item)}
            title={item.shortLabel}
            type="button"
          >
            <SectionIcon
              className="portfolio-nav__icon"
              section={item.section}
            />

            <span className="portfolio-nav__label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
