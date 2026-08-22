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

        /*
          Match the navbar's shell model: a deep-black capsule with one top-down
          reflection spanning the full inset pill. Because the highlight layer
          shares the parent's exact radius, the reflection stays straight across
          the middle and bends only where the control itself bends.
        */
        .home-scroll-indicator__surface {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.48rem 0.52rem 0.48rem 0.9rem;
          border: 0;
          border-radius: 9999px;
          background:
            radial-gradient(
              92% 145% at 16% -35%,
              rgba(255,255,255,0.07) 0%,
              rgba(255,255,255,0.018) 38%,
              transparent 65%
            ),
            linear-gradient(
              180deg,
              rgb(8,8,8) 0%,
              rgb(2,2,2) 25%,
              rgb(0,0,0) 60%,
              rgb(5,5,5) 100%
            );
          box-shadow:
            inset 0 8px 13px -14px rgba(255,255,255,0.3),
            inset 0 -10px 14px -14px rgba(255,255,255,0.12),
            0 8px 24px rgba(0,0,0,0.2);
          color: rgba(255,255,255,0.9);
          isolation: isolate;
        }

        .home-scroll-indicator__surface::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 2px;
          z-index: 1;
          border-radius: inherit;
          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.4) 0%,
              rgba(255,255,255,0.23) 15%,
              rgba(255,255,255,0.095) 31%,
              rgba(255,255,255,0.028) 43%,
              rgba(255,255,255,0.006) 51%,
              transparent 60%
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.28);
          opacity: 0.72;
        }

        .home-scroll-indicator__label {
          position: relative;
          z-index: 2;
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

        /*
          Keep the arrow control visually subordinate to the glossy parent.
          It is now a simple black inset button rather than a second reflective
          object competing with the scroll-indicator surface.
        */
        .home-scroll-indicator__arrow-shell {
          position: relative;
          z-index: 2;
          display: grid;
          width: 1.78rem;
          height: 1.78rem;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 9999px;
          background: rgb(0,0,0);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.055),
            0 3px 10px rgba(0,0,0,0.24);
          color: rgba(255,255,255,0.94);
          isolation: isolate;
        }

        .home-scroll-indicator__arrow {
          position: relative;
          z-index: 2;
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
