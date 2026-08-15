// src/components/Spline/SplineLoadingScreen.tsx
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

type SplineLoadingScreenProps = {
  sceneReady: boolean;
  onComplete: () => void;
};

const LOADER_INTRO_DURATION_SECONDS = 1.55;

export default function SplineLoadingScreen({
  sceneReady,
  onComplete,
}: SplineLoadingScreenProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const progressSignalRef = useRef<HTMLDivElement | null>(null);
  const exitStartedRef = useRef(false);
  const loopTweensRef = useRef<gsap.core.Tween[]>([]);
  const [introComplete, setIntroComplete] = useState(false);

  //The portfolio itself is deliberately not mounted while this screen is active,
  //but the browser can still receive wheel/touch input. Temporarily lock overflow
  //without forcing scrollY anywhere, then restore the exact inline values that
  //were present before the loader mounted.
  useEffect(() => {
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  //The intro is intentionally independent of Spline's network/rendering time.
  //If Spline is extremely fast, the short authored sequence still gets to read;
  //if Spline is slow, the lightweight mechanical loops simply continue until
  //onLoad tells us the actual scene is ready.
  useEffect(() => {
    const shell = shellRef.current;

    if (!shell) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const context = gsap.context(() => {
      const revealLines = shell.querySelectorAll<HTMLElement>(
        ".spline-loader-reveal-line",
      );
      const fadeItems = shell.querySelectorAll<HTMLElement>(
        ".spline-loader-fade-item",
      );
      const mechanic = shell.querySelector<HTMLElement>(
        ".spline-loader-mechanic",
      );
      const eyes = shell.querySelectorAll<SVGElement>(".spline-loader-eye");
      const orbitA = shell.querySelector<SVGElement>(".spline-loader-orbit-a");
      const orbitB = shell.querySelector<SVGElement>(".spline-loader-orbit-b");
      const scanner = shell.querySelector<HTMLElement>(
        ".spline-loader-scanner",
      );
      const pulse = shell.querySelector<HTMLElement>(".spline-loader-pulse");

      gsap.set(revealLines, { yPercent: 112 });
      gsap.set(fadeItems, { autoAlpha: 0, y: 14 });
      gsap.set(mechanic, { autoAlpha: 0, scale: 0.965, rotation: -1.5 });
      gsap.set(eyes, { scaleY: 0.12, transformOrigin: "50% 50%" });
      gsap.set(progressFillRef.current, {
        scaleX: 0.035,
        transformOrigin: "left center",
      });
      gsap.set(progressSignalRef.current, { xPercent: -145 });

      const intro = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => setIntroComplete(true),
      });

      if (prefersReducedMotion) {
        intro
          .set(revealLines, { yPercent: 0 })
          .set(fadeItems, { autoAlpha: 1, y: 0 })
          .set(mechanic, { autoAlpha: 1, scale: 1, rotation: 0 })
          .set(eyes, { scaleY: 1 })
          .to(
            progressFillRef.current,
            {
              scaleX: 0.72,
              duration: 0.18,
            },
            0,
          );

        return;
      }

      intro
        .to(
          fadeItems,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.62,
            stagger: 0.055,
          },
          0.08,
        )
        .to(
          revealLines,
          {
            yPercent: 0,
            duration: 0.92,
            stagger: 0.085,
          },
          0.2,
        )
        .to(
          mechanic,
          {
            autoAlpha: 1,
            scale: 1,
            rotation: 0,
            duration: 0.9,
          },
          0.24,
        )
        .to(
          eyes,
          {
            scaleY: 1,
            duration: 0.44,
            stagger: 0.06,
            ease: "back.out(1.9)",
          },
          0.72,
        )
        .to(
          progressFillRef.current,
          {
            scaleX: 0.72,
            duration: LOADER_INTRO_DURATION_SECONDS,
            ease: "power2.out",
          },
          0,
        );

      if (orbitA) {
        loopTweensRef.current.push(
          gsap.to(orbitA, {
            rotation: 360,
            duration: 13,
            ease: "none",
            repeat: -1,
            transformOrigin: "50% 50%",
          }),
        );
      }

      if (orbitB) {
        loopTweensRef.current.push(
          gsap.to(orbitB, {
            rotation: -360,
            duration: 18,
            ease: "none",
            repeat: -1,
            transformOrigin: "50% 50%",
          }),
        );
      }

      if (scanner) {
        const scannerWindowHeight = scanner.parentElement?.clientHeight ?? 72;

        loopTweensRef.current.push(
          gsap.fromTo(
            scanner,
            { y: -1 },
            {
              y: scannerWindowHeight + 1,
              duration: 2.25,
              ease: "power1.inOut",
              repeat: -1,
              repeatDelay: 0.25,
            },
          ),
        );
      }

      if (progressSignalRef.current) {
        loopTweensRef.current.push(
          gsap.to(progressSignalRef.current, {
            xPercent: 520,
            duration: 1.8,
            ease: "power2.inOut",
            repeat: -1,
            repeatDelay: 0.12,
          }),
        );
      }

      if (pulse) {
        loopTweensRef.current.push(
          gsap.to(pulse, {
            scale: 1.42,
            autoAlpha: 0,
            duration: 1.45,
            ease: "power2.out",
            repeat: -1,
            repeatDelay: 0.2,
            transformOrigin: "50% 50%",
          }),
        );
      }
    }, shell);

    return () => {
      loopTweensRef.current.forEach((tween) => tween.kill());
      loopTweensRef.current = [];
      context.revert();
    };
  }, []);

  //Spline's onLoad is the actual readiness signal. Only after both that signal
  //and the authored intro have completed do we finish the line, power the robot
  //visor on, then split the two opaque curtains apart. The parent does not mount
  //<Outlet /> until this timeline's onComplete fires, so no portfolio UI can
  //flash underneath the loader before the handoff is visually complete.
  useEffect(() => {
    const shell = shellRef.current;

    if (!shell || !sceneReady || !introComplete || exitStartedRef.current) {
      return;
    }

    exitStartedRef.current = true;
    loopTweensRef.current.forEach((tween) => tween.kill());
    loopTweensRef.current = [];

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const content = shell.querySelector<HTMLElement>(
      ".spline-loader-content-layer",
    );
    const topCurtain = shell.querySelector<HTMLElement>(
      ".spline-loader-curtain-top",
    );
    const bottomCurtain = shell.querySelector<HTMLElement>(
      ".spline-loader-curtain-bottom",
    );
    const eyes = shell.querySelectorAll<SVGElement>(".spline-loader-eye");
    const readyLabel = shell.querySelector<HTMLElement>(
      ".spline-loader-ready-label",
    );

    const exit = gsap.timeline({
      onComplete,
    });

    if (prefersReducedMotion) {
      exit
        .to(progressFillRef.current, {
          scaleX: 1,
          duration: 0.12,
          ease: "none",
        })
        .set(content, { autoAlpha: 0 })
        .set(topCurtain, { yPercent: -101 })
        .set(bottomCurtain, { yPercent: 101 });

      return () => {
        exit.kill();
      };
    }

    exit
      .to(progressFillRef.current, {
        scaleX: 1,
        duration: 0.42,
        ease: "power3.inOut",
      })
      .to(
        eyes,
        {
          scaleX: 1.28,
          scaleY: 0.72,
          duration: 0.22,
          stagger: 0.035,
          ease: "power3.out",
        },
        "<0.08",
      )
      .fromTo(
        readyLabel,
        { autoAlpha: 0, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.28,
          ease: "power3.out",
        },
        "<0.04",
      )
      .to(
        content,
        {
          autoAlpha: 0,
          y: -10,
          scale: 0.994,
          duration: 0.34,
          ease: "power2.in",
        },
        "+=0.1",
      )
      .to(
        topCurtain,
        {
          yPercent: -101,
          duration: 0.9,
          ease: "power4.inOut",
        },
        "+=0.02",
      )
      .to(
        bottomCurtain,
        {
          yPercent: 101,
          duration: 0.9,
          ease: "power4.inOut",
        },
        "<",
      );

    return () => {
      exit.kill();
    };
  }, [introComplete, onComplete, sceneReady]);

  return (
    <div
      ref={shellRef}
      className="spline-loader-shell fixed inset-0 z-[9999] overflow-hidden text-[#171717]"
      role="status"
      aria-busy={!sceneReady}
      aria-live="polite"
      aria-label={sceneReady ? "3D scene ready" : "Loading 3D scene"}
    >
      {/*
        Two transform-only curtains form the actual opaque loading surface.
        Keeping them separate from the content layer lets the exit reveal the
        already-loaded Spline canvas without animating layout dimensions.
      */}
      <div className="spline-loader-curtain-top absolute inset-x-0 top-0 h-[50.2%] bg-[#E3E3E3] will-change-transform" />
      <div className="spline-loader-curtain-bottom absolute inset-x-0 bottom-0 h-[50.2%] bg-[#E3E3E3] will-change-transform" />

      <div className="spline-loader-content-layer absolute inset-0 overflow-hidden will-change-transform">
        {/*Fine drafting grid: static, subtle, and deliberately monochrome.*/}
        <div className="spline-loader-grid pointer-events-none absolute inset-0 opacity-[0.34]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#171717]/[0.07]" />
        <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#171717]/[0.07]" />

        <div className="absolute inset-x-[clamp(1.15rem,3vw,3.5rem)] top-[clamp(1rem,2.2vw,2.4rem)] flex items-start justify-between gap-6 font-mono text-[clamp(0.58rem,0.65vw,0.72rem)] uppercase tracking-[0.18em]">
          <div className="spline-loader-fade-item flex items-center gap-2.5">
            <span className="relative flex size-2 items-center justify-center">
              <span className="spline-loader-pulse absolute inset-0 rounded-full border border-[#171717]/35" />
              <span className="block size-1.5 rounded-full bg-[#171717]" />
            </span>
            <span>Doron / Portfolio System</span>
          </div>

          <div className="spline-loader-fade-item hidden text-right sm:block">
            <div>Scene 01 / Spline</div>
            <div className="mt-1 text-[#171717]/45">
              {sceneReady ? "Render state / ready" : "Render state / syncing"}
            </div>
          </div>
        </div>

        {/*Large masked typography keeps the loader tied to the portfolio's existing
            editorial FRONT/END scale without copying the content of that section.*/}
        <div className="pointer-events-none absolute inset-x-[clamp(1.15rem,3vw,3.5rem)] top-1/2 -translate-y-1/2 select-none">
          <div className="overflow-hidden pb-[0.05em]">
            <div className="spline-loader-reveal-line whitespace-nowrap text-[clamp(3.2rem,9vw,9.6rem)] font-semibold uppercase leading-[0.78] tracking-[-0.078em]">
              Assembling
            </div>
          </div>
          <div className="mt-[clamp(0.4rem,0.8vw,0.9rem)] overflow-hidden pb-[0.08em]">
            <div className="spline-loader-reveal-line whitespace-nowrap text-[clamp(3.2rem,9vw,9.6rem)] font-semibold uppercase leading-[0.78] tracking-[-0.078em] text-transparent [-webkit-text-stroke:1px_#171717]">
              Experience
            </div>
          </div>
        </div>

        {/*Abstract optical unit: a restrained robot/vision reference rendered as
            vector geometry so there are no extra image requests during startup.*/}
        <div className="spline-loader-mechanic pointer-events-none absolute left-1/2 top-1/2 z-20 w-[clamp(11rem,20vw,18.5rem)] -translate-x-1/2 -translate-y-1/2 will-change-transform">
          <svg
            aria-hidden="true"
            viewBox="0 0 360 260"
            className="block h-auto w-full overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="spline-loader-orbit-a"
              cx="180"
              cy="130"
              r="118"
              stroke="currentColor"
              strokeOpacity="0.16"
              strokeWidth="1"
              strokeDasharray="5 12 1 17"
            />
            <circle
              className="spline-loader-orbit-b"
              cx="180"
              cy="130"
              r="101"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="1"
              strokeDasharray="31 14 3 9"
            />

            <path
              d="M89 89L113 66H247L271 89V171L247 194H113L89 171V89Z"
              fill="#E3E3E3"
              stroke="currentColor"
              strokeWidth="1.25"
            />
            <path
              d="M106 104L122 88H238L254 104V156L238 172H122L106 156V104Z"
              stroke="currentColor"
              strokeOpacity="0.38"
              strokeWidth="1"
            />
            <path
              d="M73 111H89M73 149H89M271 111H287M271 149H287"
              stroke="currentColor"
              strokeOpacity="0.45"
              strokeWidth="1"
            />
            <path
              d="M144 65V50H216V65M144 195V210H216V195"
              stroke="currentColor"
              strokeOpacity="0.26"
              strokeWidth="1"
            />

            <rect
              x="130"
              y="116"
              width="42"
              height="27"
              rx="13.5"
              fill="currentColor"
              fillOpacity="0.08"
            />
            <rect
              x="188"
              y="116"
              width="42"
              height="27"
              rx="13.5"
              fill="currentColor"
              fillOpacity="0.08"
            />
            <rect
              className="spline-loader-eye"
              x="138"
              y="123"
              width="26"
              height="13"
              rx="6.5"
              fill="currentColor"
            />
            <rect
              className="spline-loader-eye"
              x="196"
              y="123"
              width="26"
              height="13"
              rx="6.5"
              fill="currentColor"
            />
            <circle
              cx="180"
              cy="130"
              r="3"
              fill="currentColor"
              fillOpacity="0.38"
            />
          </svg>

          <div className="absolute left-[25%] right-[25%] top-[29.5%] h-[40%] overflow-hidden rounded-[1.4rem] opacity-35">
            <div className="spline-loader-scanner h-px w-full bg-[#171717] shadow-[0_0_12px_rgba(23,23,23,0.18)] will-change-transform" />
          </div>
        </div>

        <div className="absolute inset-x-[clamp(1.15rem,3vw,3.5rem)] bottom-[clamp(1rem,2.4vw,2.6rem)] grid grid-cols-[1fr_auto] items-end gap-[clamp(1.2rem,4vw,5rem)]">
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-4 font-mono text-[clamp(0.56rem,0.62vw,0.69rem)] uppercase tracking-[0.17em]">
              <span className="spline-loader-fade-item">
                {sceneReady ? "Scene assembled" : "Loading 3D environment"}
              </span>
              <span className="spline-loader-ready-label invisible shrink-0 font-semibold">
                Ready / Enter
              </span>
            </div>

            <div className="spline-loader-fade-item relative h-px overflow-hidden bg-[#171717]/15">
              <div
                ref={progressFillRef}
                className="absolute inset-y-0 left-0 w-full bg-[#171717] will-change-transform"
              />
              <div
                ref={progressSignalRef}
                className="absolute inset-y-0 left-0 w-[22%] bg-[#F4F2EB] will-change-transform"
              />
            </div>
          </div>

          <div className="spline-loader-fade-item hidden min-w-[12rem] grid-cols-2 gap-x-8 gap-y-1.5 font-mono text-[0.58rem] uppercase tracking-[0.16em] md:grid">
            <span className="text-[#171717]/40">WebGL</span>
            <span className="text-right">Active</span>
            <span className="text-[#171717]/40">Camera</span>
            <span className="text-right">Responsive</span>
            <span className="text-[#171717]/40">Interface</span>
            <span className="text-right">Held</span>
          </div>
        </div>
      </div>

      <style>{`
        .spline-loader-shell {
          background: transparent;
          font-variant-numeric: tabular-nums;
          isolation: isolate;
        }

        .spline-loader-grid {
          background-image:
            linear-gradient(rgba(23, 23, 23, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(23, 23, 23, 0.05) 1px, transparent 1px);
          background-size: clamp(42px, 5vw, 78px) clamp(42px, 5vw, 78px);
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0, 0, 0, 0.72) 12%,
            rgba(0, 0, 0, 0.72) 88%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0, 0, 0, 0.72) 12%,
            rgba(0, 0, 0, 0.72) 88%,
            transparent 100%
          );
        }

        @media (max-width: 680px) {
          .spline-loader-grid {
            background-size: 42px 42px;
            opacity: 0.22;
          }
        }
      `}</style>
    </div>
  );
}
