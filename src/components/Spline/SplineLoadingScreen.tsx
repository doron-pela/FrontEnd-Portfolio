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

//The loader no longer needs a long authored introduction because there is no
//headline or explanatory UI to read. This short minimum simply prevents an
//instant flash when Spline happens to resolve unusually quickly.
const LOADER_INTRO_DURATION_SECONDS = 0.82;

//These points remain the final real mask perforation anchors. During loading,
//the visible dots temporarily leave those anchors and gather into ONE shared
//circular flow around the viewport center. They still chase one another around
//the same orbit, but each dot has a tiny deterministic radial/angular drift so
//the motion feels organic instead of mechanically perfect. When Spline is ready,
//each dot returns to its own anchor, disappears completely, and only the mask
//holes expand.
const PERFORATION_POINTS: readonly PerforationPoint[] = [
  { x: 0.17, y: 0.25 },
  { x: 0.73, y: 0.18 },
  { x: 0.49, y: 0.47 },
  { x: 0.84, y: 0.61 },
  { x: 0.28, y: 0.75 },
  { x: 0.64, y: 0.83 },
] as const;

type OrbitVariation = {
  radiusBias: number;
  radialWobble: number;
  radialFrequency: number;
  radialPhase: number;
  angularWobble: number;
  angularFrequency: number;
  angularPhase: number;
};

//These values are intentionally authored instead of generated with Math.random().
//True per-frame randomness would create tiny discontinuities and visible jitter.
//Each seed therefore gets its own stable "personality": it drifts a few percent
//inward/outward and a degree or two ahead/behind the ideal circular path while
//remaining unmistakably part of the same shared orbit.
const ORBIT_VARIATIONS: readonly OrbitVariation[] = [
  {
    radiusBias: -0.012,
    radialWobble: 0.026,
    radialFrequency: 1.21,
    radialPhase: 0.4,
    angularWobble: 0.022,
    angularFrequency: 0.83,
    angularPhase: 0.2,
  },
  {
    radiusBias: 0.015,
    radialWobble: 0.021,
    radialFrequency: 1.47,
    radialPhase: 1.1,
    angularWobble: 0.026,
    angularFrequency: 1.11,
    angularPhase: 2,
  },
  {
    radiusBias: -0.005,
    radialWobble: 0.032,
    radialFrequency: 0.91,
    radialPhase: 2.3,
    angularWobble: 0.018,
    angularFrequency: 1.37,
    angularPhase: 0.8,
  },
  {
    radiusBias: 0.009,
    radialWobble: 0.024,
    radialFrequency: 1.63,
    radialPhase: 3.4,
    angularWobble: 0.03,
    angularFrequency: 0.74,
    angularPhase: 1.7,
  },
  {
    radiusBias: -0.016,
    radialWobble: 0.028,
    radialFrequency: 1.16,
    radialPhase: 4.5,
    angularWobble: 0.024,
    angularFrequency: 1.29,
    angularPhase: 2.8,
  },
  {
    radiusBias: 0.012,
    radialWobble: 0.02,
    radialFrequency: 1.38,
    radialPhase: 5.2,
    angularWobble: 0.028,
    angularFrequency: 0.96,
    angularPhase: 4,
  },
] as const;

export default function SplineLoadingScreen({
  sceneReady,
  onComplete,
}: SplineLoadingScreenProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const exitStartedRef = useRef(false);
  const loopTweensRef = useRef<gsap.core.Tween[]>([]);
  const [introComplete, setIntroComplete] = useState(false);

  /*
    IMPORTANT ARCHITECTURE RULE:

    This component remains ONLY a visual overlay. It deliberately does NOT:
    - change html/body overflow,
    - call window.scrollTo(),
    - alter route/history restoration,
    - mount/unmount homepage sections,
    - touch ScrollTrigger,
    - change Spline variables,
    - hide Spline or <Outlet />.

    SplineScene continues to own the real page and its restoration behavior.
    This component only covers that already-live page until onComplete().
  */

  //The waiting state stays minimal, but the motion is now deliberately legible.
  //Instead of six almost-static local orbits, the dots gather into one large
  //shared circular flow around the viewport center. Their spacing remains close
  //enough to read as one choreography, while tiny per-dot radial/angular drift
  //keeps the movement from feeling mathematically rigid.
  useEffect(() => {
    const shell = shellRef.current;

    if (!shell) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const context = gsap.context(() => {
      const seeds = Array.from(
        shell.querySelectorAll<HTMLElement>(".spline-loader-seed"),
      );
      const seedCores = shell.querySelectorAll<HTMLElement>(
        ".spline-loader-ripple-core",
      );
      const seedGlows = shell.querySelectorAll<HTMLElement>(
        ".spline-loader-seed-glow",
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

      gsap.set(seeds, {
        x: 0,
        y: 0,
        rotation: 0,
        autoAlpha: 1,
        transformOrigin: "50% 50%",
      });

      gsap.set(seedCores, {
        autoAlpha: 0,
        scale: 0.42,
        transformOrigin: "50% 50%",
      });

      gsap.set(seedGlows, {
        autoAlpha: 0,
        scale: 0.7,
        transformOrigin: "50% 50%",
      });

      const intro = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
        onComplete: () => setIntroComplete(true),
      });

      if (prefersReducedMotion) {
        intro
          .set(seedCores, {
            autoAlpha: 0.5,
            scale: 1,
          })
          .set(seedGlows, {
            autoAlpha: 0.12,
            scale: 1,
          })
          .to({}, { duration: 0.12 });

        return;
      }

      intro
        .to(
          seedCores,
          {
            autoAlpha: 0.62,
            scale: 1,
            duration: 0.36,
            stagger: 0.055,
          },
          0.03,
        )
        .to(
          seedGlows,
          {
            autoAlpha: 0.16,
            scale: 1,
            duration: 0.42,
            stagger: 0.055,
          },
          0.08,
        )
        .to(
          {},
          {
            duration: LOADER_INTRO_DURATION_SECONDS,
          },
          0,
        );

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const shortestViewportSide = Math.min(viewportWidth, viewportHeight);

      //This is intentionally much larger than the previous 10–20px local orbit.
      //At common laptop sizes the circle is ~200px in radius; on phones it still
      //has enough room (~90–120px) to read unmistakably as a real shared orbit.
      const orbitRadius = Math.min(
        Math.max(shortestViewportSide * 0.23, 92),
        220,
      );
      const orbitCenterX = viewportWidth * 0.5;
      const orbitCenterY = viewportHeight * 0.48;

      const orbitState = {
        angle: -Math.PI / 2,
        mix: 0,
      };

      //Precompute every value that never changes during the orbit. This keeps the
      //hot render loop focused on a few trigonometric calculations and transform
      //writes instead of repeatedly resolving anchors, variations and setters.
      const seedMotion = seeds.map((seed, index) => {
        const point = PERFORATION_POINTS[index];
        const variation = ORBIT_VARIATIONS[index % ORBIT_VARIATIONS.length];

        if (!point || !variation) {
          return null;
        }

        return {
          anchorX: point.x * viewportWidth,
          anchorY: point.y * viewportHeight,
          variation,
          x: gsap.quickSetter(seed, "x", "px"),
          y: gsap.quickSetter(seed, "y", "px"),
          rotation: gsap.quickSetter(seed, "rotation", "deg"),
        };
      });

      function renderSharedOrbit() {
        const globalRadiusPulse = 1 + Math.sin(orbitState.angle * 2) * 0.045;
        const seedCount = Math.max(seedMotion.length, 1);

        for (let index = 0; index < seedMotion.length; index += 1) {
          const motion = seedMotion[index];

          if (!motion) {
            continue;
          }

          const { variation } = motion;
          const basePhase =
            orbitState.angle + (index / seedCount) * Math.PI * 2;

          //The seed still follows the shared circle, but its own low-frequency
          //radial wobble lets it gently breathe inward/outward around that line.
          const localRadiusScale =
            1 +
            variation.radiusBias +
            Math.sin(
              orbitState.angle * variation.radialFrequency +
                variation.radialPhase,
            ) *
              variation.radialWobble;

          //A separate angular wobble lets it drift a degree or two ahead/behind
          //its mathematically perfect slot. Because this is sinusoidal rather
          //than random-per-frame, the veer remains continuous and silky smooth.
          const localPhase =
            basePhase +
            Math.sin(
              orbitState.angle * variation.angularFrequency +
                variation.angularPhase,
            ) *
              variation.angularWobble;

          const localRadius =
            orbitRadius * globalRadiusPulse * localRadiusScale;
          const targetX = orbitCenterX + Math.cos(localPhase) * localRadius;
          const targetY = orbitCenterY + Math.sin(localPhase) * localRadius;

          motion.x((targetX - motion.anchorX) * orbitState.mix);
          motion.y((targetY - motion.anchorY) * orbitState.mix);

          //Keep the tiny tangent-facing rotation aligned with the seed's local
          //path rather than the idealized base circle.
          motion.rotation((localPhase * 180) / Math.PI + 90);
        }
      }

      //Gather the six scattered anchor dots into the shared circular band quickly
      //enough that even a fast Spline load visibly communicates the choreography.
      loopTweensRef.current.push(
        gsap.to(orbitState, {
          mix: 1,
          duration: 0.52,
          ease: "power3.inOut",
          onUpdate: renderSharedOrbit,
        }),
      );

      //All dots still share ONE master angle state. Their base spacing keeps the
      //chase readable, while each authored wobble signature makes that spacing
      //and radius breathe by a very small amount throughout the orbit.
      loopTweensRef.current.push(
        gsap.to(orbitState, {
          angle: orbitState.angle + Math.PI * 2,
          duration: 3.15,
          ease: "none",
          repeat: -1,
          onUpdate: renderSharedOrbit,
        }),
      );

      //The visible dot itself breathes slightly while its parent performs the
      //large shared orbit. This is intentionally secondary to the positional dance.
      loopTweensRef.current.push(
        gsap.to(seedCores, {
          scale: 1.22,
          autoAlpha: 0.82,
          duration: 0.72,
          stagger: {
            each: 0.11,
            repeat: -1,
            yoyo: true,
          },
          ease: "sine.inOut",
        }),
      );

      loopTweensRef.current.push(
        gsap.to(seedGlows, {
          scale: 1.7,
          autoAlpha: 0.04,
          duration: 1.05,
          stagger: {
            each: 0.13,
            repeat: -1,
            yoyo: true,
          },
          ease: "sine.inOut",
        }),
      );

      //The broad ambient field remains deliberately secondary. The shared orbit
      //is now the loader's dominant visible activity.
      if (fieldSweep) {
        loopTweensRef.current.push(
          gsap.fromTo(
            fieldSweep,
            {
              xPercent: -135,
              autoAlpha: 0,
            },
            {
              xPercent: 135,
              autoAlpha: 0.3,
              duration: 4.8,
              ease: "sine.inOut",
              repeat: -1,
              repeatDelay: 0.9,
            },
          ),
        );
      }

      if (waterBloomA) {
        loopTweensRef.current.push(
          gsap.to(waterBloomA, {
            xPercent: 13,
            yPercent: -9,
            scale: 1.12,
            duration: 8.4,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          }),
        );
      }

      if (waterBloomB) {
        loopTweensRef.current.push(
          gsap.to(waterBloomB, {
            xPercent: -12,
            yPercent: 11,
            scale: 1.15,
            duration: 9.6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          }),
        );
      }

      if (waterBloomC) {
        loopTweensRef.current.push(
          gsap.to(waterBloomC, {
            xPercent: 9,
            yPercent: 10,
            scale: 1.1,
            duration: 7.8,
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

  //Spline's onLoad remains the only real readiness signal. When it arrives, the
  //shared orbit freezes at its current phase. Every dot then glides back to its
  //own original perforation anchor. The visible dots disappear COMPLETELY before
  //the mask begins opening, so the reveal is only clean expanding apertures.
  useEffect(() => {
    const shell = shellRef.current;

    if (!shell || !sceneReady || !introComplete || exitStartedRef.current) {
      return;
    }

    exitStartedRef.current = true;

    //Killing these tweens freezes the shared orbit exactly where it is. GSAP
    //leaves the current inline transforms intact, which lets the return-home
    //animation begin from the real visible positions with no snapping.
    loopTweensRef.current.forEach((tween) => tween.kill());
    loopTweensRef.current = [];

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ambientLayer = shell.querySelector<HTMLElement>(
      ".spline-loader-ambient-layer",
    );
    const surface = shell.querySelector<SVGElement>(".spline-loader-surface");
    const perforations = Array.from(
      shell.querySelectorAll<SVGCircleElement>(".spline-loader-perforation"),
    );
    const seeds = shell.querySelectorAll<HTMLElement>(".spline-loader-seed");

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const finalRadius = Math.hypot(viewportWidth, viewportHeight) * 1.08;

    //Use real viewport pixels so the mask circles remain genuinely circular on
    //wide and tall displays rather than stretching with the SVG aspect ratio.
    perforations.forEach((circle, index) => {
      const point = PERFORATION_POINTS[index];

      if (!point) {
        return;
      }

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
        .set(seeds, {
          autoAlpha: 0,
        })
        .to(ambientLayer, {
          autoAlpha: 0,
          duration: 0.1,
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

    exit
      //The six dots stop chasing one another and peel away from the shared orbit,
      //returning to the exact anchor locations that will become the mask holes.
      .to(
        seeds,
        {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.88,
          stagger: 0.028,
          ease: "power3.inOut",
        },
        0,
      )
      .to(
        ambientLayer,
        {
          autoAlpha: 0,
          filter: "blur(6px)",
          duration: 0.9,
          ease: "sine.inOut",
        },
        0,
      )
      //The markers are gone BEFORE perforation starts. From this point onward
      //nothing visible sits on top of the openings.
      .to(
        seeds,
        {
          autoAlpha: 0,
          scale: 0.58,
          duration: 0.2,
          stagger: 0.018,
          ease: "power2.in",
        },
        0.72,
      )
      //One continuous expansion. No visible dot, no ripple ring, no staged
      //pinhole. The only thing the eye sees now is the background appearing
      //through six circles whose radii smoothly grow until they overlap.
      .to(
        perforations,
        {
          attr: {
            r: finalRadius,
          },
          duration: 1.72,
          stagger: 0.032,
          ease: "sine.inOut",
        },
        0.94,
      );

    return () => {
      exit.kill();
    };
  }, [introComplete, onComplete, sceneReady]);

  return (
    <div
      ref={shellRef}
      className="spline-loader-shell fixed inset-0 z-[9999] overflow-hidden"
      role="status"
      aria-busy={!sceneReady}
      aria-live="polite"
      aria-label={sceneReady ? "3D scene ready" : "Loading 3D scene"}
      style={{ touchAction: "none" }}
    >
      {/*
        The SVG is now purely structural. It contains no decorative illustration:
        it is simply the opaque #E3E3E3 surface and the six true transparent
        perforations that reveal the already-running Spline scene underneath.
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

      {/*
        Very low-energy ambient movement only. These layers are intentionally
        soft enough that the eye mostly reads an empty loading surface.
      */}
      <div
        aria-hidden="true"
        className="spline-loader-ambient-layer pointer-events-none absolute inset-0 z-10 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-45">
          <div className="spline-loader-water-bloom-a absolute -left-[12vw] top-[2vh] size-[clamp(20rem,45vw,47rem)] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.08)_33%,transparent_71%)] blur-[42px]" />
          <div className="spline-loader-water-bloom-b absolute -right-[14vw] top-[31vh] size-[clamp(18rem,39vw,41rem)] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.27)_0%,rgba(255,255,255,0.06)_36%,transparent_73%)] blur-[46px]" />
          <div className="spline-loader-water-bloom-c absolute bottom-[-22vh] left-[27vw] size-[clamp(21rem,46vw,50rem)] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.23)_0%,rgba(255,255,255,0.05)_39%,transparent_74%)] blur-[50px]" />
        </div>

        <div className="absolute inset-0 overflow-hidden opacity-35">
          <div className="spline-loader-field-sweep absolute inset-y-0 left-1/2 w-[16vw] min-w-24 -translate-x-1/2 bg-linear-to-r from-transparent via-white/24 to-transparent blur-2xl" />
        </div>
      </div>

      {/*
        These six dots are the entire visible loader UI. They temporarily leave
        these anchor coordinates, gather into one shared central circular flow,
        and chase one another with a tiny amount of individual veer. Once Spline
        is ready they return here, disappear, and the invisible SVG mask circles
        at these same anchors simply expand.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30"
      >
        {PERFORATION_POINTS.map((point, index) => (
          <span
            className="spline-loader-seed absolute size-3 -translate-x-1/2 -translate-y-1/2"
            key={`loader-seed-${index}`}
            style={{
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
            }}
          >
            <span className="spline-loader-seed-glow absolute -inset-1 rounded-full bg-[#171717]/10 blur-[3px] opacity-0" />
            <span className="spline-loader-ripple-core absolute inset-[3px] rounded-full bg-[#171717]/82 opacity-0" />
          </span>
        ))}
      </div>

      <style>{`
        .spline-loader-shell {
          background: transparent;
          isolation: isolate;
        }
      `}</style>
    </div>
  );
}
