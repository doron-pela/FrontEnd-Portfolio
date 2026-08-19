import { useLayoutEffect, useRef } from "react";

const HOME_SIGNATURE_FADE_DISTANCE_PX = 320;
const HOME_ROLE_TITLE = "Fullstack software engineer";

export default function HomeRoleSignature() {
  const signatureRef = useRef<HTMLDivElement | null>(null);

  //The signature is part of the static Home/base composition, not a manual
  //scroll section. Its only animation is a direct scroll-derived opacity fade:
  //fully visible at scrollY 0 and fully hidden after the shared 320px range.
  useLayoutEffect(() => {
    const signature = signatureRef.current;

    if (!signature) {
      return;
    }

    let frame = 0;

    const syncVisibility = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const progress = Math.min(
          Math.max(window.scrollY / HOME_SIGNATURE_FADE_DISTANCE_PX, 0),
          1,
        );
        const opacity = 1 - progress;

        signature.style.opacity = opacity.toFixed(4);
        signature.style.visibility = opacity <= 0.001 ? "hidden" : "visible";
        signature.setAttribute(
          "aria-hidden",
          opacity <= 0.08 ? "true" : "false",
        );
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
    <>
      {/*
        The role line is intentionally treated like a personal signature rather
        than another interface label. Dancing Script gives the desktop version
        a handwritten/signature character while its variable 600 weight keeps
        the small text substantially more legible than the previous thin script.

        Desktop returns to the original approved composition beneath Pela.
        Tablet and mobile keep their existing responsive positioning unchanged.
      */}
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Pinyon+Script&display=swap");

        .home-role-signature-text {
          font-family:
            "Monotype Corsiva",
            "Pinyon Script",
            cursive;
          word-spacing: 0.3em;
        }

        @media (min-width: 1101px) {
          .home-role-signature-text {
            font-family:
              "Dancing Script",
              "Segoe Script",
              "Brush Script MT",
              cursive;
            font-weight: 600;
            letter-spacing: 0.015em;
            word-spacing: 1.2em;
          }
        }
      `}</style>

      <div
        ref={signatureRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-[23%] top-[71vh] z-[470] w-max -translate-x-1/2 opacity-0 text-center
          text-[rgba(56,56,56,0.48)] mix-blend-multiply will-change-[opacity]
          min-[1101px]:text-[rgba(32,32,32,0.62)]
          min-[701px]:max-[1100px]:left-[18vw] min-[701px]:max-[1100px]:top-[31vh] min-[701px]:max-[1100px]:w-[min(52vw,30rem)]
          min-[950px]:max-[1100px]:left-[40vw]
          max-[700px]:left-1/2 max-[700px]:top-[34vh] max-[700px]:w-[88vw] max-[700px]:text-center max-[700px]:mix-blend-normal"
      >
        <span
          className="home-role-signature-text inline-block whitespace-nowrap text-[clamp(1.28rem,1.2vw,2.45rem)] font-[500] leading-none tracking-[0.1em]
            min-[1101px]:text-[min(2vw,2.8vh)] min-[1101px]:tracking-[0.015em]"
        >
          {HOME_ROLE_TITLE}
        </span>
      </div>
    </>
  );
}
