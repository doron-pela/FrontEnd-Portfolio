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

//These points are both the waiting-state "seed anchors" and the final real mask
//perforations. While Spline loads, each visible seed orbits a little around its
//anchor. When readiness arrives, every seed glides home to its anchor and that
//same point becomes the center of a real perforation through the loader surface.
const PERFORATION_POINTS: readonly PerforationPoint[] = [
  { x: 0.17, y: 0.25 },
  { x: 0.73, y: 0.18 },
  { x: 0.49, y: 0.47 },
  { x: 0.84, y: 0.61 },
  { x: 0.28, y: 0.75 },
  { x: 0.64, y: 0.83 },
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

  //The waiting state stays minimal, but it is no longer static. Six tiny
  //surface-tension seeds orbit gently around their eventual perforation anchors
  //while a few large soft light blooms move underneath them. There is still no
  //headline, system copy, progress UI, robot SVG, or status text to read.
  useEffect(() => {
    const shell = shellRef.current;

    if (!shell) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const context = gsap.context(() => {
      const seeds = shell.querySelectorAll<HTMLElement>(".spline-loader-seed");
      const seedCores = shell.querySelectorAll<HTMLElement>(
        ".spline-loader-ripple-core",
      );
      const seedRings = shell.querySelectorAll<HTMLElement>(
        ".spline-loader-ripple-ring",
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
        transformOrigin: "50% 50%",
      });

      gsap.set(seedCores, {
        autoAlpha: 0,
        scale: 0.42,
        transformOrigin: "50% 50%",
      });

      gsap.set(seedRings, {
        autoAlpha: 0,
        scale: 0.55,
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
            autoAlpha: 0.38,
            scale: 1,
          })
          .set(seedRings, {
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
            autoAlpha: 0.4,
            scale: 1,
            duration: 0.42,
            stagger: 0.075,
          },
          0.05,
        )
        .to(
          seedRings,
          {
            autoAlpha: 0.14,
            scale: 1,
            duration: 0.5,
            stagger: 0.075,
          },
          0.12,
        )
        .to(
          {},
          {
            duration: LOADER_INTRO_DURATION_SECONDS,
          },
          0,
        );

      //The dots do not become a conventional spinner. Each one traces a small,
      //slightly imperfect elliptical orbit around its own future perforation
      //anchor. Different radii, directions, phases and durations keep the six
      //marks feeling like suspended droplets rather than synchronized UI dots.
      const baseOrbitRadius = Math.min(
        Math.max(window.innerWidth * 0.012, 10),
        20,
      );

      seeds.forEach((seed, index) => {
        const state = {
          angle: (index / Math.max(seeds.length, 1)) * Math.PI * 2,
        };
        const direction = index % 2 === 0 ? 1 : -1;
        const radiusX = baseOrbitRadius * (0.72 + (index % 3) * 0.2);
        const radiusY = baseOrbitRadius * (0.48 + ((index + 1) % 3) * 0.16);
        const setX = gsap.quickSetter(seed, "x", "px");
        const setY = gsap.quickSetter(seed, "y", "px");
        const setRotation = gsap.quickSetter(seed, "rotation", "deg");

        loopTweensRef.current.push(
          gsap.to(state, {
            angle: state.angle + direction * Math.PI * 2,
            duration: 3.7 + index * 0.42,
            ease: "none",
            repeat: -1,
            onUpdate: () => {
              const organicRadius =
                1 + Math.sin(state.angle * 2.15 + index * 0.83) * 0.12;

              setX(Math.cos(state.angle) * radiusX * organicRadius);
              setY((Math.sin(state.angle) * radiusY) / organicRadius);
              setRotation(Math.sin(state.angle + index) * 8);
            },
          }),
        );
      });

      //The orbiting cores still breathe independently so motion exists at two
      //scales: positional drift from the parent seed and tiny surface tension at
      //the center. It stays intentionally quiet and never becomes a progress UI.
      loopTweensRef.current.push(
        gsap.to(seedCores, {
          scale: 0.72,
          autoAlpha: 0.22,
          duration: 1.15,
          stagger: {
            each: 0.18,
            repeat: -1,
            yoyo: true,
          },
          ease: "sine.inOut",
        }),
      );

      loopTweensRef.current.push(
        gsap.fromTo(
          seedRings,
          {
            scale: 0.72,
            autoAlpha: 0.14,
          },
          {
            scale: 2.7,
            autoAlpha: 0,
            duration: 1.7,
            stagger: {
              each: 0.24,
              repeat: -1,
            },
            ease: "power2.out",
          },
        ),
      );

      //A single broad sweep is enough to keep the otherwise-flat field from
      //feeling frozen. It is deliberately low contrast.
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
              autoAlpha: 0.42,
              duration: 4.4,
              ease: "sine.inOut",
              repeat: -1,
              repeatDelay: 0.8,
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

  //Spline's onLoad remains the only real readiness signal. Once both that signal
  //and the tiny minimum intro have completed, the six moving seeds glide back to
  //their exact anchors, settle like droplets touching a surface, and then become
  //actual perforations whose SVG mask holes grow until nothing opaque remains.
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

    const ambientLayer = shell.querySelector<HTMLElement>(
      ".spline-loader-ambient-layer",
    );
    const surface = shell.querySelector<SVGElement>(".spline-loader-surface");
    const perforations = Array.from(
      shell.querySelectorAll<SVGCircleElement>(".spline-loader-perforation"),
    );
    const seeds = shell.querySelectorAll<HTMLElement>(".spline-loader-seed");
    const rippleRings = shell.querySelectorAll<HTMLElement>(
      ".spline-loader-ripple-ring",
    );
    const rippleCores = shell.querySelectorAll<HTMLElement>(
      ".spline-loader-ripple-core",
    );

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

    //Do not snap the dancing seeds back to their anchors when readiness arrives.
    //Their looping tweens are already stopped above, leaving every seed wherever
    //it happened to be in its orbit. The exit timeline now eases each one home.
    //Only after that convergence is nearly complete do the true mask holes begin.
    exit
      .to(
        ambientLayer,
        {
          autoAlpha: 0,
          filter: "blur(5px)",
          duration: 0.72,
          ease: "sine.inOut",
        },
        0,
      )
      .to(
        seeds,
        {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.72,
          stagger: 0.035,
          ease: "power3.inOut",
        },
        0,
      )
      //Normalize the tiny droplet cores as the moving seeds settle. Because we
      //tween from their current looped values, there is no visual reset/pop.
      .to(
        rippleCores,
        {
          autoAlpha: 0.72,
          scale: 1,
          duration: 0.48,
          stagger: 0.03,
          ease: "sine.inOut",
        },
        0.16,
      )
      .to(
        rippleRings,
        {
          autoAlpha: 0.2,
          scale: 1,
          duration: 0.48,
          stagger: 0.03,
          ease: "sine.inOut",
        },
        0.16,
      )
      //The settled droplets create one broad, very smooth surface ripple. The
      //real mask perforations begin during this ripple rather than after it, so
      //the opening reads as one continuous liquid event instead of three steps.
      .to(
        rippleRings,
        {
          autoAlpha: 0,
          scale: 4.2,
          duration: 1.05,
          stagger: 0.04,
          ease: "power2.out",
        },
        0.48,
      )
      //Grow directly from zero to a meaningful droplet aperture. A longer
      //sine-in-out tween removes the old pinhole -> droplet snap.
      .to(
        perforations,
        {
          attr: {
            r: (index: number) => 68 + (index % 4) * 18,
          },
          duration: 0.92,
          stagger: 0.04,
          ease: "sine.inOut",
        },
        0.58,
      )
      //The apertures then accelerate gently into one another. The overlap keeps
      //their edges moving continuously while the underlying Spline scene emerges.
      .to(
        perforations,
        {
          attr: {
            r: finalRadius,
          },
          duration: 1.48,
          stagger: 0.025,
          ease: "power3.inOut",
        },
        ">-0.18",
      )
      .to(
        rippleCores,
        {
          autoAlpha: 0,
          scale: 1.65,
          duration: 0.48,
          stagger: 0.02,
          ease: "sine.out",
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
        These six tiny marks are the entire visible loader UI. During the wait
        each seed circles softly around its anchor while its rings breathe. Once
        Spline is ready, every seed glides back to this CSS left/top coordinate,
        settles, ripples, and becomes the real perforation in the SVG mask.
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
            <span className="spline-loader-ripple-core absolute inset-[3px] rounded-full bg-[#171717]/75 opacity-0" />
            <span className="spline-loader-ripple-ring absolute inset-0 rounded-full border border-[#171717]/42 opacity-0" />
            <span className="spline-loader-ripple-ring absolute -inset-1 rounded-full border border-[#171717]/18 opacity-0" />
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
