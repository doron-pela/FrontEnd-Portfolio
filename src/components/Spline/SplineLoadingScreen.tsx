// src/components/Spline/SplineLoadingScreen.tsx
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

type SplineLoadingScreenProps = {
  sceneReady: boolean;
  onComplete: () => void;
};

type PerforationPoint = {
  x: number;
  y: number;
};

const LOADER_INTRO_DURATION_SECONDS = 1.42;

//Asymmetry keeps the reveal organic. These points are normalized viewport
//coordinates and are converted to exact SVG pixels immediately before exit.
const PERFORATION_POINTS: readonly PerforationPoint[] = [
  { x: 0.17, y: 0.25 },
  { x: 0.73, y: 0.18 },
  { x: 0.49, y: 0.47 },
  { x: 0.84, y: 0.61 },
  { x: 0.28, y: 0.75 },
  { x: 0.64, y: 0.83 },
] as const;

const CURSOR_TRAIL_POINTS = Array.from({ length: 7 });

export default function SplineLoadingScreen({
  sceneReady,
  onComplete,
}: SplineLoadingScreenProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const progressSignalRef = useRef<HTMLDivElement | null>(null);
  const exitStartedRef = useRef(false);
  const loopTweensRef = useRef<gsap.core.Tween[]>([]);
  const [introComplete, setIntroComplete] = useState(false);

  /*
    IMPORTANT ARCHITECTURE RULE:

    This component is only a fixed visual layer. It deliberately does NOT:
    - change html/body overflow,
    - call window.scrollTo(),
    - alter scroll restoration,
    - mount/unmount homepage sections,
    - touch ScrollTrigger,
    - change Spline variables,
    - hide Spline or <Outlet />.

    SplineScene owns the real page exactly as before. This layer simply covers it
    with a higher z-index until its own exit timeline calls onComplete().
  */

  //Cursor energy lives entirely inside the loader. It gives the waiting state a
  //responsive feel without forwarding pointer events to Spline or changing any
  //application state underneath the overlay.
  useEffect(() => {
    const shell = shellRef.current;
    const cursorGlow = cursorGlowRef.current;

    if (!shell || !cursorGlow) return;

    const trailPoints = Array.from(
      shell.querySelectorAll<HTMLElement>(".spline-loader-cursor-trail"),
    );

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const current = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    const target = {
      x: current.x,
      y: current.y,
    };

    const previous = trailPoints.map(() => ({
      x: current.x,
      y: current.y,
    }));

    let frame = 0;

    const handlePointerMove = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
    };

    const renderCursorField = () => {
      current.x += (target.x - current.x) * 0.19;
      current.y += (target.y - current.y) * 0.19;

      gsap.set(cursorGlow, {
        x: current.x,
        y: current.y,
      });

      let leaderX = current.x;
      let leaderY = current.y;

      trailPoints.forEach((point, index) => {
        const follower = previous[index];
        const followStrength = Math.max(0.1, 0.24 - index * 0.018);

        follower.x += (leaderX - follower.x) * followStrength;
        follower.y += (leaderY - follower.y) * followStrength;

        gsap.set(point, {
          x: follower.x,
          y: follower.y,
          scale: 1 - index * 0.085,
          opacity: Math.max(0.05, 0.34 - index * 0.042),
        });

        leaderX = follower.x;
        leaderY = follower.y;
      });

      frame = requestAnimationFrame(renderCursorField);
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    frame = requestAnimationFrame(renderCursorField);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  //The authored intro is independent from Spline's actual loading time. If the
  //scene is fast, ASSEMBLING / EXPERIENCE still gets a short readable entrance.
  //If the scene is slow, the low-cost optical/watery loops continue until onLoad.
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
      const fieldSweep = shell.querySelector<HTMLElement>(
        ".spline-loader-field-sweep",
      );
      const waterBloomA = shell.querySelector<HTMLElement>(
        ".spline-loader-water-bloom-a",
      );
      const waterBloomB = shell.querySelector<HTMLElement>(
        ".spline-loader-water-bloom-b",
      );
      const waterBloomC = shell.querySelector<HTMLElement>(
        ".spline-loader-water-bloom-c",
      );

      gsap.set(revealLines, { yPercent: 108 });
      gsap.set(fadeItems, { autoAlpha: 0, y: 10 });
      gsap.set(mechanic, { autoAlpha: 0, scale: 0.965, rotation: -1.5 });
      gsap.set(eyes, { scaleY: 0.12, transformOrigin: "50% 50%" });
      gsap.set(progressFillRef.current, {
        scaleX: 0.025,
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
          revealLines,
          {
            yPercent: 0,
            duration: 0.78,
            stagger: 0.065,
          },
          0.02,
        )
        .to(
          mechanic,
          {
            autoAlpha: 1,
            scale: 1,
            rotation: 0,
            duration: 0.82,
          },
          0.14,
        )
        .to(
          fadeItems,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.04,
          },
          0.2,
        )
        .to(
          eyes,
          {
            scaleY: 1,
            duration: 0.4,
            stagger: 0.055,
            ease: "back.out(1.9)",
          },
          0.58,
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
              duration: 2.1,
              ease: "power1.inOut",
              repeat: -1,
              repeatDelay: 0.22,
            },
          ),
        );
      }

      if (progressSignalRef.current) {
        loopTweensRef.current.push(
          gsap.to(progressSignalRef.current, {
            xPercent: 520,
            duration: 1.65,
            ease: "power2.inOut",
            repeat: -1,
            repeatDelay: 0.1,
          }),
        );
      }

      if (fieldSweep) {
        loopTweensRef.current.push(
          gsap.fromTo(
            fieldSweep,
            { xPercent: -125, autoAlpha: 0 },
            {
              xPercent: 125,
              autoAlpha: 0.9,
              duration: 3.1,
              ease: "power1.inOut",
              repeat: -1,
              repeatDelay: 0.4,
            },
          ),
        );
      }

      if (waterBloomA) {
        loopTweensRef.current.push(
          gsap.to(waterBloomA, {
            xPercent: 18,
            yPercent: -12,
            scale: 1.16,
            rotation: 14,
            duration: 7.2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          }),
        );
      }

      if (waterBloomB) {
        loopTweensRef.current.push(
          gsap.to(waterBloomB, {
            xPercent: -16,
            yPercent: 14,
            scale: 1.2,
            rotation: -18,
            duration: 8.6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          }),
        );
      }

      if (waterBloomC) {
        loopTweensRef.current.push(
          gsap.to(waterBloomC, {
            xPercent: 12,
            yPercent: 12,
            scale: 1.12,
            rotation: 10,
            duration: 6.8,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
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

  //Spline's onLoad is the only scene-readiness gate. Once both the real scene
  //and the short authored intro are ready, ripple impacts punch transparent holes
  //through the loader surface and those holes grow until the page underneath is
  //fully exposed. onComplete then makes SplineScene unmount ONLY this layer.
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
    const surface = shell.querySelector<SVGElement>(".spline-loader-surface");
    const eyes = shell.querySelectorAll<SVGElement>(".spline-loader-eye");
    const perforations = Array.from(
      shell.querySelectorAll<SVGCircleElement>(".spline-loader-perforation"),
    );
    const rippleRings = shell.querySelectorAll<HTMLElement>(
      ".spline-loader-ripple-ring",
    );
    const rippleCores = shell.querySelectorAll<HTMLElement>(
      ".spline-loader-ripple-core",
    );
    const cursorLayer = shell.querySelector<HTMLElement>(
      ".spline-loader-cursor-layer",
    );

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const finalRadius = Math.hypot(viewportWidth, viewportHeight) * 1.08;

    //The mask uses real viewport pixels so the perforations remain circular even
    //on very wide/tall screens instead of stretching into objectBoundingBox ellipses.
    perforations.forEach((circle, index) => {
      const point = PERFORATION_POINTS[index];

      if (!point) return;

      gsap.set(circle, {
        attr: {
          cx: point.x * viewportWidth,
          cy: point.y * viewportHeight,
          r: 0,
        },
      });
    });

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
        .to([content, cursorLayer], {
          autoAlpha: 0,
          duration: 0.12,
          ease: "none",
        })
        .to(surface, {
          autoAlpha: 0,
          duration: 0.18,
          ease: "none",
        });

      return () => {
        exit.kill();
      };
    }

    gsap.set(rippleRings, {
      autoAlpha: 0,
      scale: 0.18,
      transformOrigin: "50% 50%",
    });
    gsap.set(rippleCores, {
      autoAlpha: 0,
      scale: 0.4,
      transformOrigin: "50% 50%",
    });

    exit
      .to(progressFillRef.current, {
        scaleX: 1,
        duration: 0.34,
        ease: "power3.inOut",
      })
      .to(
        progressSignalRef.current,
        {
          autoAlpha: 0,
          duration: 0.16,
          ease: "power2.out",
        },
        "<0.12",
      )
      .to(
        eyes,
        {
          scaleX: 1.2,
          scaleY: 0.72,
          duration: 0.18,
          stagger: 0.03,
          ease: "power3.out",
        },
        "<0.02",
      )
      .to(
        [content, cursorLayer],
        {
          autoAlpha: 0,
          scale: 0.992,
          filter: "blur(2px)",
          duration: 0.38,
          ease: "power2.inOut",
        },
        "+=0.06",
      )
      .to(
        rippleCores,
        {
          autoAlpha: 0.78,
          scale: 1,
          duration: 0.16,
          stagger: 0.055,
          ease: "back.out(2.2)",
        },
        "-=0.05",
      )
      .to(
        rippleRings,
        {
          autoAlpha: 0.42,
          scale: 1,
          duration: 0.2,
          stagger: 0.055,
          ease: "power2.out",
        },
        "<",
      )
      .to(
        rippleRings,
        {
          autoAlpha: 0,
          scale: 3.4,
          duration: 0.72,
          stagger: 0.055,
          ease: "power2.out",
        },
        "<0.07",
      )
      .to(
        perforations,
        {
          attr: {
            r: (index: number) => 8 + (index % 3) * 3,
          },
          duration: 0.17,
          stagger: 0.055,
          ease: "power3.out",
        },
        "<0.03",
      )
      .to(
        perforations,
        {
          attr: {
            r: (index: number) => 52 + (index % 4) * 18,
          },
          duration: 0.46,
          stagger: 0.045,
          ease: "power3.inOut",
        },
        ">-0.06",
      )
      .to(
        perforations,
        {
          attr: {
            r: finalRadius,
          },
          duration: 1.12,
          stagger: 0.035,
          ease: "power4.inOut",
        },
        ">-0.1",
      )
      .to(
        rippleCores,
        {
          autoAlpha: 0,
          scale: 1.8,
          duration: 0.28,
          stagger: 0.025,
          ease: "power2.out",
        },
        "<0.18",
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
      style={{ touchAction: "none" }}
    >
      {/*
        One real opaque SVG surface covers the page. Black circles inside its
        mask become transparent holes during the final perforation animation.
      */}
      <svg
        aria-hidden="true"
        className="spline-loader-surface absolute inset-0 block h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <mask
            id="spline-loader-perforation-mask"
            height="100%"
            maskContentUnits="userSpaceOnUse"
            maskUnits="userSpaceOnUse"
            width="100%"
            x="0"
            y="0"
          >
            <rect fill="white" height="100%" width="100%" x="0" y="0" />

            {PERFORATION_POINTS.map((_, index) => (
              <circle
                className="spline-loader-perforation"
                cx="0"
                cy="0"
                fill="black"
                key={`perforation-${index}`}
                r="0"
              />
            ))}
          </mask>
        </defs>

        <rect
          fill="#E3E3E3"
          height="100%"
          mask="url(#spline-loader-perforation-mask)"
          width="100%"
          x="0"
          y="0"
        />
      </svg>

      {/*Soft moving blooms create a watery/caustic field without adding text.*/}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] overflow-hidden opacity-70"
      >
        <div className="spline-loader-water-bloom-a absolute -left-[10vw] top-[6vh] size-[clamp(20rem,46vw,48rem)] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.11)_31%,transparent_70%)] blur-[34px]" />
        <div className="spline-loader-water-bloom-b absolute -right-[12vw] top-[30vh] size-[clamp(18rem,40vw,42rem)] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.32)_0%,rgba(255,255,255,0.08)_34%,transparent_72%)] blur-[40px]" />
        <div className="spline-loader-water-bloom-c absolute bottom-[-20vh] left-[28vw] size-[clamp(22rem,48vw,52rem)] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.07)_38%,transparent_72%)] blur-[46px]" />
      </div>

      <div className="spline-loader-content-layer absolute inset-0 z-10 overflow-hidden will-change-[transform,opacity,filter]">
        {/*Fine drafting grid: static, subtle, and deliberately monochrome.*/}
        <div className="spline-loader-grid pointer-events-none absolute inset-0 opacity-[0.31]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#171717]/[0.06]" />
        <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#171717]/[0.06]" />

        <div className="absolute inset-y-0 left-0 w-full overflow-hidden opacity-55">
          <div className="spline-loader-field-sweep absolute inset-y-0 left-1/2 w-[18vw] min-w-28 -translate-x-1/2 bg-linear-to-r from-transparent via-white/28 to-transparent blur-xl" />
        </div>

        {/*ASSEMBLING / EXPERIENCE remains the single dominant textual element.*/}
        <div className="pointer-events-none absolute inset-x-[clamp(1rem,3.25vw,4rem)] top-1/2 z-10 -translate-y-1/2 select-none">
          <div className="overflow-hidden pb-[0.055em]">
            <div className="spline-loader-reveal-line whitespace-nowrap text-[clamp(4.15rem,11vw,12.8rem)] font-semibold uppercase leading-[0.74] tracking-[-0.082em]">
              Assembling
            </div>
          </div>
          <div className="mt-[clamp(0.34rem,0.62vw,0.72rem)] overflow-hidden pb-[0.08em]">
            <div className="spline-loader-reveal-line whitespace-nowrap text-[clamp(4.15rem,11vw,12.8rem)] font-semibold uppercase leading-[0.74] tracking-[-0.082em] text-transparent [-webkit-text-stroke:1px_#171717]">
              Experience
            </div>
          </div>
        </div>

        {/*Abstract optical unit retained from the original loader.*/}
        <div className="spline-loader-mechanic pointer-events-none absolute left-1/2 top-1/2 z-20 w-[clamp(10rem,18vw,17rem)] -translate-x-1/2 -translate-y-1/2 will-change-transform">
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
              strokeOpacity="0.14"
              strokeWidth="1"
              strokeDasharray="5 12 1 17"
            />
            <circle
              className="spline-loader-orbit-b"
              cx="180"
              cy="130"
              r="101"
              stroke="currentColor"
              strokeOpacity="0.18"
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

        {/*One quiet progress line remains as the only bottom UI.*/}
        <div className="spline-loader-fade-item absolute inset-x-[clamp(1rem,3.25vw,4rem)] bottom-[clamp(1.1rem,3vw,3rem)]">
          <div className="relative h-px overflow-hidden bg-[#171717]/14">
            <div
              ref={progressFillRef}
              className="absolute inset-y-0 left-0 w-full bg-[#171717] will-change-transform"
            />
            <div
              ref={progressSignalRef}
              className="absolute inset-y-0 left-0 w-[18%] bg-[#F4F2EB] will-change-transform"
            />
          </div>
        </div>
      </div>

      {/*Cursor streak / liquid focus. It belongs only to this loader layer.*/}
      <div
        ref={cursorGlowRef}
        aria-hidden="true"
        className="spline-loader-cursor-layer pointer-events-none absolute left-0 top-0 z-20 size-[clamp(6rem,10vw,10rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0.18)_24%,rgba(23,23,23,0.05)_44%,transparent_70%)] blur-[8px] mix-blend-soft-light"
      />

      <div
        aria-hidden="true"
        className="spline-loader-cursor-layer pointer-events-none absolute inset-0 z-20"
      >
        {CURSOR_TRAIL_POINTS.map((_, index) => (
          <span
            className="spline-loader-cursor-trail absolute left-0 top-0 size-[clamp(0.42rem,0.7vw,0.7rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35 bg-white/20 blur-[1px] will-change-transform"
            key={`cursor-trail-${index}`}
          />
        ))}
      </div>

      {/*Visible ripple rings sell the droplet-impact moment; the SVG mask above
          owns the actual transparent holes.*/}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30"
      >
        {PERFORATION_POINTS.map((point, index) => (
          <span
            className="absolute size-3 -translate-x-1/2 -translate-y-1/2"
            key={`ripple-${index}`}
            style={{
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
            }}
          >
            <span className="spline-loader-ripple-core absolute inset-[3px] rounded-full bg-[#171717]/75" />
            <span className="spline-loader-ripple-ring absolute inset-0 rounded-full border border-[#171717]/55" />
            <span className="spline-loader-ripple-ring absolute -inset-1 rounded-full border border-[#171717]/28" />
          </span>
        ))}
      </div>

      <style>{`
        .spline-loader-shell {
          background: transparent;
          font-variant-numeric: tabular-nums;
          isolation: isolate;
        }

        .spline-loader-grid {
          background-image:
            linear-gradient(rgba(23, 23, 23, 0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(23, 23, 23, 0.045) 1px, transparent 1px);
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
            opacity: 0.2;
          }

          .spline-loader-mechanic {
            width: clamp(9rem, 38vw, 12.5rem);
          }
        }
      `}</style>
    </div>
  );
}
