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
        Monotype Corsiva remains the primary face because it produces the exact
        desktop look shown in the approved screenshot. Pinyon Script stays loaded
        as a controlled web-font fallback before the generic cursive fallback.

        Responsive composition follows the Spline scene itself rather than
        trying to keep one fixed screen coordinate across all camera bases:
        - desktop: centered immediately beneath the Pela surname/signature,
        - tablet: positioned above the large D,
        - mobile: centered in the open space above the hero composition.

        Desktop deliberately avoids a rem-based clamp floor. While the Spline
        scene remains in its desktop camera state, vw/vh sizing scales with the
        browser's CSS viewport and therefore preserves the same visual proportion
        through normal desktop resizing and browser zoom such as 100% -> 125%.
        The height-aware min() also prevents very wide/short desktop windows from
        making the role line disproportionately large relative to the Spline name.
      */}
      <style>{`@import url("https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap");`}</style>

      <div
        ref={signatureRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-[52%] top-[55.5vh] z-[470] w-max -translate-x-1/2 opacity-0 text-center 
        text-[rgba(56,56,56,0.48)]
         mix-blend-multiply will-change-[opacity]
          min-[701px]:max-[1100px]:left-[18vw] min-[701px]:max-[1100px]:top-[31vh] min-[701px]:max-[1100px]:w-[min(52vw,30rem)]
          min-[950px]:max-[1100px]:left-[40vw]
          max-[700px]:left-1/2 max-[700px]:top-[34vh] max-[700px]:w-[88vw] max-[700px]:text-center max-[700px]:mix-blend-normal"
      >
        <span
          className="inline-block whitespace-nowrap text-[clamp(1.28rem,1.2vw,2.45rem)] font-[500] leading-none tracking-[0.1em]
            min-[1101px]:text-[min(1.1vw,2.8vh)] min-[1101px]:tracking-[0.015em]"
          style={{
            fontFamily: '"Monotype Corsiva", "Pinyon Script", cursive',
            wordSpacing: "0.3em"
          }}
        >
          {HOME_ROLE_TITLE}
        </span>
      </div>
    </>
  );
}
