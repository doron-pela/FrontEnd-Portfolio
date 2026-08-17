import { useLayoutEffect, useRef } from "react";

import { HOME_DATA } from "@/data/home/data-home";

const HOME_RESUME_FADE_DISTANCE_PX = 320;

export default function ResumeDownloadButton() {
  const linkRef = useRef<HTMLAnchorElement | null>(null);

  //This is intentionally derived directly from the browser's real scrollY
  //rather than HomeSection state. "Home" here means exactly the visual base:
  //scrollY === 0. The button now does only one thing as Home is left: fade.
  useLayoutEffect(() => {
    const link = linkRef.current;

    if (!link) {
      return;
    }

    let frame = 0;

    const syncVisibility = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const progress = Math.min(
          Math.max(window.scrollY / HOME_RESUME_FADE_DISTANCE_PX, 0),
          1,
        );
        const opacity = 1 - progress;
        const isInteractive = opacity > 0.08;

        link.style.opacity = opacity.toFixed(4);
        link.style.pointerEvents = isInteractive ? "auto" : "none";
        link.style.visibility = opacity <= 0.001 ? "hidden" : "visible";
        link.tabIndex = isInteractive ? 0 : -1;
        link.setAttribute("aria-hidden", isInteractive ? "false" : "true");
      });
    };

    syncVisibility();

    window.addEventListener("scroll", syncVisibility, {
      passive: true,
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", syncVisibility);
    };
  }, []);

  return (
    <a
      ref={linkRef}
      aria-label={HOME_DATA.resume.ariaLabel}
      className="group pointer-events-none fixed bottom-[clamp(0.9rem,2.4vh,1.7rem)] right-[clamp(0.85rem,1vw,2.2rem)] z-[480] flex min-h-11 items-center gap-3 rounded-full border border-white/72 bg-white/58 px-[clamp(0.95rem,1.5vw,1.3rem)] py-3 font-mono text-[clamp(0.56rem,0.62vw,0.68rem)] font-bold uppercase tracking-[0.13em] text-[#171717]/78 opacity-0 shadow-[0_12px_34px_rgba(23,23,23,0.07)] backdrop-blur-[20px] transition-[background-color,box-shadow] duration-200 hover:bg-white/78 hover:shadow-[0_14px_38px_rgba(23,23,23,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/16 max-[680px]:bottom-3 max-[680px]:right-3 max-[680px]:min-h-10 max-[680px]:gap-2.5 max-[680px]:px-3.5 max-[680px]:py-2.5 max-[680px]:text-[0.53rem]"
      download={HOME_DATA.resume.downloadName}
      href={HOME_DATA.resume.href}
    >
      <span>{HOME_DATA.resume.label}</span>

      <svg
        aria-hidden="true"
        className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-y-0.5"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 4v11M7.5 11.5 12 16l4.5-4.5M5 20h14"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.65"
        />
      </svg>
    </a>
  );
}
