import { useEffect, useState } from "react";

type HomeScrollIndicatorProps = {
  active: boolean;
};

const HOME_SCROLL_INDICATOR_IDLE_DELAY_MS = 3000;
const HOME_SCROLL_INDICATOR_TOP_THRESHOLD_PX = 24;
const HOME_SCROLL_INDICATOR_DESKTOP_QUERY = "(min-width: 1101px)";

const HOME_SCROLL_INTENT_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  " ",
  "Home",
  "End",
  "0",
  "1",
  "2",
  "3",
  "4",
]);

export default function HomeScrollIndicator({
  active,
}: HomeScrollIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    const desktopQuery = window.matchMedia(HOME_SCROLL_INDICATOR_DESKTOP_QUERY);
    let idleTimeout: ReturnType<typeof setTimeout> | null = null;

    const clearIdleTimeout = () => {
      if (idleTimeout !== null) {
        clearTimeout(idleTimeout);
        idleTimeout = null;
      }
    };

    const scheduleIndicator = () => {
      clearIdleTimeout();
      setVisible(false);

      //The hint belongs only to the true desktop Home/base composition. Once
      //the user has materially started scrolling, do not let inactivity place
      //it over the fading/transitioning Home artwork or any later section.
      if (
        !desktopQuery.matches ||
        window.scrollY > HOME_SCROLL_INDICATOR_TOP_THRESHOLD_PX
      ) {
        return;
      }

      idleTimeout = setTimeout(() => {
        if (
          desktopQuery.matches &&
          window.scrollY <= HOME_SCROLL_INDICATOR_TOP_THRESHOLD_PX
        ) {
          setVisible(true);
        }
      }, HOME_SCROLL_INDICATOR_IDLE_DELAY_MS);
    };

    const handleActivity = () => {
      scheduleIndicator();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!HOME_SCROLL_INTENT_KEYS.has(event.key)) {
        return;
      }

      scheduleIndicator();
    };

    scheduleIndicator();

    //Only meaningful interaction resets the idle timer. Ordinary pointermove is
    //deliberately excluded so tiny mouse movement cannot postpone the indicator
    //forever while the user is simply looking at the Home composition.
    window.addEventListener("pointerdown", handleActivity, {
      passive: true,
    });
    window.addEventListener("wheel", handleActivity, {
      passive: true,
    });
    window.addEventListener("touchstart", handleActivity, {
      passive: true,
    });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleActivity, {
      passive: true,
    });
    desktopQuery.addEventListener("change", handleActivity);

    return () => {
      clearIdleTimeout();
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("wheel", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleActivity);
      desktopQuery.removeEventListener("change", handleActivity);
    };
  }, [active]);

  return (
    <div
      aria-hidden="true"
      className="home-scroll-indicator pointer-events-none fixed left-[23%] top-[72vh] z-[470] max-[1100px]:hidden"
      data-visible={visible ? "true" : "false"}
    >
      <style>{`
        .home-scroll-indicator {
          opacity: 0;
          visibility: hidden;
          transform: translate3d(-50%, 0.65rem, 0) scale(0.96);
          transition:
            opacity 360ms ease,
            transform 440ms cubic-bezier(.2,.9,.25,1),
            visibility 360ms ease;
          will-change: opacity, transform;
        }

        .home-scroll-indicator[data-visible="true"] {
          opacity: 1;
          visibility: visible;
          transform: translate3d(-50%, 0, 0) scale(1);
        }

        .home-scroll-indicator__surface {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.48rem 0.52rem 0.48rem 0.9rem;
          border: 1px solid rgba(255,255,255,0.72);
          border-radius: 9999px;
          background: rgba(241,241,241,0.3);
          -webkit-backdrop-filter:
            blur(16px)
            saturate(1.16)
            brightness(1.04);
          backdrop-filter:
            blur(16px)
            saturate(1.16)
            brightness(1.04);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.82),
            inset 0 -1px 0 rgba(23,23,23,0.075),
            0 8px 24px rgba(23,23,23,0.07);
          color: rgba(23,23,23,0.68);
          isolation: isolate;
        }

        .home-scroll-indicator__surface::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 1px;
          z-index: -1;
          border-radius: inherit;
          background:
            radial-gradient(
              circle at 24% 8%,
              rgba(255,255,255,0.8),
              rgba(255,255,255,0.12) 38%,
              transparent 62%
            );
          opacity: 0.72;
        }

        .home-scroll-indicator__label {
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            "Liberation Mono",
            monospace;
          font-size: clamp(0.56rem, 0.58vw, 0.67rem);
          font-weight: 650;
          letter-spacing: 0.13em;
          line-height: 1;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .home-scroll-indicator__arrow-shell {
          display: grid;
          width: 1.78rem;
          height: 1.78rem;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid rgba(23,23,23,0.09);
          border-radius: 9999px;
          background: rgba(255,255,255,0.32);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.8),
            0 3px 10px rgba(23,23,23,0.045);
        }

        .home-scroll-indicator__arrow {
          width: 0.9rem;
          height: 0.9rem;
          animation: home-scroll-indicator-arrow 1.8s ease-in-out infinite;
        }

        @keyframes home-scroll-indicator-arrow {
          0%,
          100% {
            transform: translate3d(0, -1.5px, 0);
            opacity: 0.62;
          }

          50% {
            transform: translate3d(0, 2.5px, 0);
            opacity: 1;
          }
        }

        @media (max-width: 1100px) {
          .home-scroll-indicator {
            display: none !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-scroll-indicator {
            transition: none;
          }

          .home-scroll-indicator__arrow {
            animation: none;
          }
        }
      `}</style>

      <div className="home-scroll-indicator__surface">
        <span className="home-scroll-indicator__label">
          Scroll down to advance
        </span>

        <span className="home-scroll-indicator__arrow-shell">
          <svg
            aria-hidden="true"
            className="home-scroll-indicator__arrow"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              d="M10 3.5v11M5.8 10.8 10 15l4.2-4.2"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.55"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
