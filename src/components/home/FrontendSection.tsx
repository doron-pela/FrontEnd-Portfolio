// src/components/home/FrontendSection.tsx
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { HomeSection } from "@/@types/home-section.types";
import type {
  ManualScrollSectionProps,
  ScrollSectionRuntime,
} from "@/@types/scroll-locked-section.types";
import { setScrollSectionProgressImmediately } from "@/utils/scroll-locked-section.utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FRONTEND_GSAP_HMR_REVISION = import.meta.hot
  ? (import.meta.hot.data.frontendGsapRevision =
      (import.meta.hot.data.frontendGsapRevision ?? 0) + 1)
  : 0;

const FRONTEND_REVEAL_SCROLL_DISTANCE = 520;

//This is only the safe pre-timeline fallback. Once the timeline exists, the
//runtime handoff is calculated from the exact "locked-story" label so pressing
//2 and organic scrolling both stop with project 01 fully assembled.
const FRONTEND_REVEALED_PROGRESS = 0.2;

const FRONTEND_LOCAL_PROGRESS_TWEEN_DURATION = 0.3;
const FRONTEND_LOCKED_STORY_TIME = 1.4;

//Desktop-only gallery reveal tuning. At 50, an overflowing screenshot wall
//begins translated 50% toward the copy, so it initially reads as a peek.
//The reveal and the internal carousel scroll are intentionally sequential:
//the wall fully glides into view first, then its screenshots begin scrolling.
const FRONTEND_DESKTOP_GALLERY_PEEK_PERCENT = 57;

//Browser page zoom changes window.devicePixelRatio in Chromium/Firefox. We
//capture the DPR from the first mounted version of this section as the 1x
//reference and apply the inverse ratio only to textual UI layers. This keeps
//the existing viewport media queries fully in charge of responsive layout
//while preventing Ctrl +/- from making project copy and its spacing balloon
//or collapse independently of the intended composition.
const FRONTEND_BROWSER_ZOOM_MIN_COMPENSATION = 0.48;
const FRONTEND_BROWSER_ZOOM_MAX_COMPENSATION = 2.1;

type FrontendZoomAwareWindow = Window & {
  __frontendSectionBaseDevicePixelRatio?: number;
};

function getFrontendBaseDevicePixelRatio() {
  if (typeof window === "undefined") {
    return 1;
  }

  const zoomAwareWindow = window as FrontendZoomAwareWindow;

  if (!zoomAwareWindow.__frontendSectionBaseDevicePixelRatio) {
    zoomAwareWindow.__frontendSectionBaseDevicePixelRatio =
      window.devicePixelRatio || 1;
  }

  return zoomAwareWindow.__frontendSectionBaseDevicePixelRatio;
}

type ProjectScreenshot = {
  src: string | null;
  alt: string;
  objectPosition?: CSSProperties["objectPosition"];
  aspectRatio?: number;
};

type FrontendProject = {
  title: string;
  description: string | null;
  contribution: string | null;
  outcome: string | null;
  technologies: readonly string[];
  screenshots: readonly ProjectScreenshot[];
  liveUrl: string | null;
  repositoryUrl?: string | null;
};

const FRONTEND_PROJECTS: readonly FrontendProject[] = [
  {
    title: "OWD Web Platform",
    description:
      "A multi-surface company platform spanning public content, administration, permissions, editorial workflows and reusable product experiences.",
    contribution:
      "I built and integrated frontend systems across authentication, data-heavy admin workflows, responsive public pages and reusable content architecture.",
    outcome:
      "A coherent frontend that can grow without every new page becoming a one-off implementation.",
    technologies: ["React", "TypeScript", "TanStack", "Motion"],
    liveUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiGJLht7PMLiAUqQDL7ZgMtRelOBVbaXEYNLte-qqB2w&s=10",
    repositoryUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiGJLht7PMLiAUqQDL7ZgMtRelOBVbaXEYNLte-qqB2w&s=10",
    screenshots: [
      {
        src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiGJLht7PMLiAUqQDL7ZgMtRelOBVbaXEYNLte-qqB2w&s=10",
        alt: "OWD platform primary interface",
      },
      {
        src: "https://wallpaperaccess.com/full/630926.jpg",
        alt: "OWD platform secondary interface",
      },
      {
        src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZbtobzF1g7XjTcnL1fp4YyYGwebCCIK57-ASmI6J1PKugQDbxKhCuKMw&s=10",
        alt: "OWD platform supporting interface",
      },
      {
        src: "https://images.unsplash.com/photo-1722944982712-62e216333a31?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZXBpYyUyMHdhbGxwYXBlcnxlbnwwfHwwfHx8MA%3D%3D",
        alt: "OWD platform supporting interface",
      },
      {
        src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2Dr85yiVhJYE298y-uDnWIy0MB3dZzXV1gHNMHBXVyfOaOgaMy8c1RB_p&s=10",
        alt: "OWD platform supporting interface",
      },
      {
        src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4AdSp_ZkorulQ42jxu1YpWbn5Eqki-sifCmhKcVZF0A&s=10",
        alt: "OWD platform supporting interface",
      },
    ],
  },
  {
    title: "Spline Portfolio",
    description:
      "A portfolio where the 3D Spline scene remains the visual stage while browser scroll becomes a timeline through the site's content.",
    contribution:
      "I engineered the scroll-lock controller, GSAP section timelines, direction-aware handoffs and programmatic navigation around the persistent 3D scene.",
    outcome:
      "A single continuous environment instead of disconnected sections layered over an unrelated 3D background.",
    technologies: ["GSAP", "Spline", "ScrollTrigger", "React"],
    liveUrl: null,
    repositoryUrl: null,
    screenshots: [
      {
        src: null,
        alt: "Spline portfolio hero sequence",
        aspectRatio: 16 / 9,
      },
      {
        src: null,
        alt: "Spline portfolio scroll sequence",
        aspectRatio: 4 / 3,
      },
    ],
  },
  // {
  //   title: "Homepage Visual CMS",
  //   description:
  //     "A visual homepage editing experience where structured content remains type-safe while the administrator sees changes in the actual page composition.",
  //   contribution:
  //     "I worked on the editor architecture, live preview behavior, reusable section configuration and the bridge between structured values and presentation.",
  //   outcome:
  //     "Content editing feels visual without turning the production homepage into an unrestricted page builder.",
  //   technologies: ["React", "Puck", "TipTap", "TypeScript"],
  //   liveUrl: null,
  //   repositoryUrl: null,
  //   screenshots: [
  //     {
  //       src: null,
  //       alt: "Homepage visual editor canvas",
  //       aspectRatio: 16 / 10,
  //     },
  //     {
  //       src: null,
  //       alt: "Homepage visual editor controls",
  //       aspectRatio: 3 / 4,
  //     },
  //   ],
  // },
  // {
  //   title: "Products + Case Studies",
  //   description:
  //     "Reusable product and case-study experiences driven by structured API data instead of duplicated presentation content.",
  //   contribution:
  //     "I translated backend contracts into client models, reusable cards, detail screens, media treatment and testimonial mappings while preserving the designed UI.",
  //   outcome:
  //     "One source of truth can now power multiple polished client experiences and their administration surfaces.",
  //   technologies: ["React", "API", "Rich Text", "Schema"],
  //   liveUrl: null,
  //   repositoryUrl: null,
  //   screenshots: [
  //     {
  //       src: null,
  //       alt: "Product and case studies index",
  //       aspectRatio: 16 / 10,
  //     },
  //     {
  //       src: null,
  //       alt: "Product and case study detail",
  //       aspectRatio: 4 / 5,
  //     },
  //   ],
  // },
  // {
  //   title: "Events + Community",
  //   description:
  //     "Interactive event and publishing surfaces that combine discovery, registration intent, comments, reactions, filtering and rich content.",
  //   contribution:
  //     "I integrated the frontend data flows, optimistic interaction patterns, prefetch strategy, auth-aware routing and responsive presentation.",
  //   outcome:
  //     "The public experience remains immediate even when the workflows behind it involve authentication and server state.",
  //   technologies: ["React Query", "Routing", "Optimistic UI", "Prefetch"],
  //   liveUrl: null,
  //   repositoryUrl: null,
  //   screenshots: [
  //     {
  //       src: null,
  //       alt: "Events discovery interface",
  //       aspectRatio: 16 / 10,
  //     },
  //     {
  //       src: null,
  //       alt: "Community discussion interface",
  //       aspectRatio: 3 / 4,
  //     },
  //   ],
  // },
] as const;

const GRID_COLUMNS = Array.from({ length: 11 });
const GRID_ROWS = Array.from({ length: 7 });

function LiquidGlassDefinitions() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute h-0 w-0 overflow-hidden"
    >
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          height="140%"
          id="frontend-liquid-refraction"
          width="140%"
          x="-20%"
          y="-20%"
        >
          <feTurbulence
            baseFrequency="0.008 0.012"
            numOctaves="2"
            result="noise"
            seed="23"
            type="fractalNoise"
          />
          <feGaussianBlur in="noise" result="softNoise" stdDeviation="0.55" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            result="displaced"
            scale="11"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feColorMatrix
            in="displaced"
            type="matrix"
            values="
              1.015 0     0     0 0
              0     1.01  0     0 0
              0     0     1.025 0 0
              0     0     0     1 0
            "
          />
        </filter>

        <filter
          colorInterpolationFilters="sRGB"
          height="150%"
          id="frontend-liquid-refraction-strong"
          width="150%"
          x="-25%"
          y="-25%"
        >
          <feTurbulence
            baseFrequency="0.006 0.01"
            numOctaves="2"
            result="noise"
            seed="41"
            type="fractalNoise"
          />
          <feGaussianBlur in="noise" result="softNoise" stdDeviation="0.65" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            result="displaced"
            scale="17"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feColorMatrix
            in="displaced"
            type="matrix"
            values="
              1.025 0     0     0 0
              0     1.012 0     0 0
              0     0     1.04  0 0
              0     0     0     1 0
            "
          />
        </filter>
      </defs>
    </svg>
  );
}

function LiquidGlass({
  children,
  className = "",
  strength = "normal",
}: {
  children?: ReactNode;
  className?: string;
  strength?: "normal" | "strong";
}) {
  return (
    <div
      className={`frontend-liquid-glass relative isolate overflow-hidden ${className}`}
    >
      <span
        aria-hidden="true"
        className={`frontend-liquid-optics absolute inset-0 rounded-[inherit] ${
          strength === "strong"
            ? "frontend-liquid-optics-strong"
            : "frontend-liquid-optics-normal"
        }`}
      />
      <span
        aria-hidden="true"
        className="frontend-liquid-highlight absolute inset-0 rounded-[inherit]"
      />
      <div className="frontend-liquid-content relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}

type RenderableProjectScreenshot = ProjectScreenshot & { src: string };

type PackedMasonryItem = {
  screenshot: RenderableProjectScreenshot;
  index: number;
  height: number;
};

type PackedMasonryColumn = {
  width: number;
  items: PackedMasonryItem[];
};

const FRONTEND_MASONRY_GAP_PX = 6;
const FRONTEND_GALLERY_OVERFLOW_EPSILON_PX = 6;
const FRONTEND_MOBILE_GALLERY_QUERY = "(max-width: 680px)";

function isDesktopGalleryPeekMode() {
  return window.matchMedia("(min-width: 1181px)").matches;
}

function hasScreenshotSource(
  screenshot: ProjectScreenshot,
): screenshot is RenderableProjectScreenshot {
  return Boolean(screenshot.src);
}

function getKnownScreenshotRatio(
  screenshot: RenderableProjectScreenshot,
  index: number,
  imageRatios: Record<number, number>,
) {
  return imageRatios[index] ?? screenshot.aspectRatio ?? 16 / 10;
}

//Choose how many screenshots should share one vertical masonry column.
//The target width keeps columns compact while still allowing portrait,
//square and landscape media to coexist without forcing a rigid cell size.
function getMasonryGroupSize(ratios: readonly number[], startIndex: number) {
  const targetColumnWidthRatio = 0.78;
  const maxGroupSize = Math.min(3, ratios.length - startIndex);

  let bestSize = 1;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let size = 1; size <= maxGroupSize; size += 1) {
    const group = ratios.slice(startIndex, startIndex + size);
    const inverseRatioTotal = group.reduce(
      (total, ratio) => total + 1 / Math.max(ratio, 0.1),
      0,
    );
    const normalizedColumnWidth = 1 / inverseRatioTotal;

    let score = Math.abs(normalizedColumnWidth - targetColumnWidthRatio);

    //Discourage columns that become unnecessarily skinny or extremely wide.
    if (normalizedColumnWidth < 0.48) {
      score += (0.48 - normalizedColumnWidth) * 3;
    }

    if (normalizedColumnWidth > 1.24) {
      score += (normalizedColumnWidth - 1.24) * 3;
    }

    //Prefer the simpler grouping when two options are visually equivalent.
    score += (size - 1) * 0.018;

    if (score < bestScore) {
      bestScore = score;
      bestSize = size;
    }
  }

  return bestSize;
}

//This is a true packed horizontal masonry calculation rather than fixed
//grid spans. Every vertical column is solved from the screenshots' intrinsic
//aspect ratios so the images collectively consume the full available height.
//That removes the large lopsided holes a rigid bento grid can leave behind.
function buildPackedMasonryColumns(
  screenshots: readonly RenderableProjectScreenshot[],
  imageRatios: Record<number, number>,
  galleryHeight: number,
) {
  if (screenshots.length === 0) {
    return [] as PackedMasonryColumn[];
  }

  const effectiveHeight = Math.max(galleryHeight, 280);
  const ratios = screenshots.map((screenshot, index) =>
    getKnownScreenshotRatio(screenshot, index, imageRatios),
  );
  const columns: PackedMasonryColumn[] = [];

  let index = 0;

  while (index < screenshots.length) {
    const groupSize = getMasonryGroupSize(ratios, index);
    const groupRatios = ratios.slice(index, index + groupSize);
    const usableHeight = Math.max(
      effectiveHeight - FRONTEND_MASONRY_GAP_PX * (groupSize - 1),
      1,
    );
    const inverseRatioTotal = groupRatios.reduce(
      (total, ratio) => total + 1 / Math.max(ratio, 0.1),
      0,
    );
    const columnWidth = usableHeight / inverseRatioTotal;

    const items = groupRatios.map((ratio, groupIndex) => ({
      screenshot: screenshots[index + groupIndex],
      index: index + groupIndex,
      height: columnWidth / Math.max(ratio, 0.1),
    }));

    columns.push({
      width: columnWidth,
      items,
    });

    index += groupSize;
  }

  return columns;
}

function GalleryArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className="size-[clamp(0.9rem,1vw,1.05rem)]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ProjectScreenshotGallery({
  projectTitle,
  screenshots,
}: {
  projectTitle: string;
  screenshots: readonly RenderableProjectScreenshot[];
}) {
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const galleryPeekRef = useRef<HTMLDivElement | null>(null);
  const galleryRevealProgressRef = useRef(1);
  const galleryMotionRef = useRef({ value: 0 });
  const shouldInitializeDesktopPeekRef = useRef(true);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartScrollLeftRef = useRef(0);
  const dragStartVirtualOffsetRef = useRef(0);
  const [imageRatios, setImageRatios] = useState<Record<number, number>>({});
  const pendingImageRatiosRef = useRef<Record<number, number>>({});
  const settledImageIndexesRef = useRef<Set<number>>(new Set());
  const [galleryHeight, setGalleryHeight] = useState(0);
  const [isMobileGallery, setIsMobileGallery] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const getGalleryMotionMetrics = useCallback(() => {
    const gallery = galleryRef.current;

    if (!gallery) return null;

    const maxScrollLeft = Math.max(
      gallery.scrollWidth - gallery.clientWidth,
      0,
    );
    const hasMeaningfulOverflow =
      maxScrollLeft > FRONTEND_GALLERY_OVERFLOW_EPSILON_PX;
    const peekDistance =
      isDesktopGalleryPeekMode() && hasMeaningfulOverflow
        ? gallery.clientWidth * (FRONTEND_DESKTOP_GALLERY_PEEK_PERCENT / 100)
        : 0;

    return {
      gallery,
      hasMeaningfulOverflow,
      maxScrollLeft,
      peekDistance,
      totalVirtualDistance: peekDistance + maxScrollLeft,
    };
  }, []);

  const setGalleryRevealProgress = useCallback((progress: number) => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const peekTranslatePercent =
      FRONTEND_DESKTOP_GALLERY_PEEK_PERCENT * (1 - clampedProgress);

    galleryRevealProgressRef.current = clampedProgress;
    galleryPeekRef.current?.style.setProperty(
      "--frontend-gallery-peek-x",
      `${peekTranslatePercent}%`,
    );
  }, []);

  const getGalleryVirtualOffset = useCallback(() => {
    const metrics = getGalleryMotionMetrics();

    if (!metrics) return 0;

    if (metrics.peekDistance <= 0) {
      return metrics.gallery.scrollLeft;
    }

    return (
      galleryRevealProgressRef.current * metrics.peekDistance +
      metrics.gallery.scrollLeft
    );
  }, [getGalleryMotionMetrics]);

  const applyGalleryVirtualOffset = useCallback(
    (nextOffset: number) => {
      const metrics = getGalleryMotionMetrics();

      if (!metrics) return;

      const clampedOffset = Math.min(
        Math.max(nextOffset, 0),
        metrics.totalVirtualDistance,
      );

      if (metrics.peekDistance <= 0) {
        setGalleryRevealProgress(1);
        metrics.gallery.scrollLeft = clampedOffset;
        return;
      }

      //Stage 1: reveal the entire translated gallery without scrolling its
      //screenshots. Nothing can be clipped at the gallery's left edge yet.
      if (clampedOffset <= metrics.peekDistance) {
        setGalleryRevealProgress(clampedOffset / metrics.peekDistance);
        metrics.gallery.scrollLeft = 0;
        return;
      }

      //Stage 2: only after the gallery is fully revealed do the screenshots
      //begin moving through the viewport and therefore clipping at the left edge.
      setGalleryRevealProgress(1);
      metrics.gallery.scrollLeft = clampedOffset - metrics.peekDistance;
    },
    [getGalleryMotionMetrics, setGalleryRevealProgress],
  );

  const updateScrollControls = useCallback(() => {
    const metrics = getGalleryMotionMetrics();

    if (!metrics) return;

    const {
      gallery,
      hasMeaningfulOverflow,
      maxScrollLeft,
      peekDistance,
      totalVirtualDistance,
    } = metrics;

    if (!hasMeaningfulOverflow || peekDistance <= 0) {
      setGalleryRevealProgress(1);
    } else if (shouldInitializeDesktopPeekRef.current) {
      gallery.scrollLeft = 0;
      setGalleryRevealProgress(0);
      shouldInitializeDesktopPeekRef.current = false;
    }

    //If native horizontal scrolling somehow occurs while the desktop gallery
    //is still tucked, fold that attempted movement into the reveal first. This
    //preserves the same reveal-before-clipping invariant outside button clicks.
    if (
      peekDistance > 0 &&
      galleryRevealProgressRef.current < 1 &&
      gallery.scrollLeft > FRONTEND_GALLERY_OVERFLOW_EPSILON_PX
    ) {
      const attemptedScroll = gallery.scrollLeft;
      gallery.scrollLeft = 0;
      applyGalleryVirtualOffset(
        galleryRevealProgressRef.current * peekDistance + attemptedScroll,
      );
    }

    const virtualOffset =
      peekDistance > 0
        ? galleryRevealProgressRef.current * peekDistance + gallery.scrollLeft
        : gallery.scrollLeft;
    const nextCanScrollLeft =
      hasMeaningfulOverflow &&
      virtualOffset > FRONTEND_GALLERY_OVERFLOW_EPSILON_PX;
    const nextCanScrollRight =
      hasMeaningfulOverflow &&
      virtualOffset <
        totalVirtualDistance - FRONTEND_GALLERY_OVERFLOW_EPSILON_PX;

    //Avoid meaningless sub-pixel overflow from making an arrow blink in/out.
    if (maxScrollLeft <= FRONTEND_GALLERY_OVERFLOW_EPSILON_PX) {
      shouldInitializeDesktopPeekRef.current = true;
    }

    setCanScrollLeft((current) =>
      current === nextCanScrollLeft ? current : nextCanScrollLeft,
    );
    setCanScrollRight((current) =>
      current === nextCanScrollRight ? current : nextCanScrollRight,
    );
  }, [
    applyGalleryVirtualOffset,
    getGalleryMotionMetrics,
    setGalleryRevealProgress,
  ]);

  //Natural image dimensions can arrive one-by-one. Updating masonry state for
  //every individual image creates several rapid layout passes and can make a
  //near-full gallery bounce across the overflow threshold. Buffer the measured
  //ratios and commit them together once every screenshot in this gallery has
  //either loaded or failed. That gives the masonry one settled recalculation.
  const commitScreenshotRatio = useCallback(
    (index: number, ratio: number) => {
      pendingImageRatiosRef.current[index] = ratio;
      settledImageIndexesRef.current.add(index);

      if (settledImageIndexesRef.current.size < screenshots.length) {
        return;
      }

      const pendingRatios = pendingImageRatiosRef.current;

      setImageRatios((current) => {
        let changed = false;
        const next = { ...current };

        Object.entries(pendingRatios).forEach(([key, nextRatio]) => {
          const ratioIndex = Number(key);

          if (Math.abs((current[ratioIndex] ?? 0) - nextRatio) >= 0.001) {
            next[ratioIndex] = nextRatio;
            changed = true;
          }
        });

        return changed ? next : current;
      });
    },
    [screenshots.length],
  );

  const setScreenshotRatio = useCallback(
    (index: number, width: number, height: number) => {
      if (width <= 0 || height <= 0) {
        const fallbackRatio = screenshots[index]?.aspectRatio ?? 16 / 10;
        commitScreenshotRatio(index, fallbackRatio);
        return;
      }

      commitScreenshotRatio(index, width / height);
    },
    [commitScreenshotRatio, screenshots],
  );

  function scrollGallery(direction: "left" | "right") {
    const metrics = getGalleryMotionMetrics();

    if (!metrics) return;

    const { gallery, hasMeaningfulOverflow, totalVirtualDistance } = metrics;

    if (!hasMeaningfulOverflow) return;

    //Mobile keeps its true one-shot-per-view carousel behavior. Tablet keeps
    //the normal horizontal scroller. The two-stage reveal belongs to desktop.
    if (!isDesktopGalleryPeekMode()) {
      const distance = isMobileGallery
        ? gallery.clientWidth
        : Math.max(gallery.clientWidth * 0.78, 220);

      gallery.scrollBy({
        left: direction === "right" ? distance : -distance,
        behavior: "smooth",
      });
      return;
    }

    const distance = Math.max(gallery.clientWidth * 0.78, 220);
    const currentOffset = getGalleryVirtualOffset();
    const targetOffset = Math.min(
      Math.max(
        currentOffset + (direction === "right" ? distance : -distance),
        0,
      ),
      totalVirtualDistance,
    );

    gsap.killTweensOf(galleryMotionRef.current);
    galleryMotionRef.current.value = currentOffset;

    gsap.to(galleryMotionRef.current, {
      value: targetOffset,
      duration: 0.58,
      ease: "power3.inOut",
      overwrite: true,
      onUpdate: () => {
        applyGalleryVirtualOffset(galleryMotionRef.current.value);
      },
      onComplete: () => {
        updateScrollControls();
      },
    });
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia(FRONTEND_MOBILE_GALLERY_QUERY);

    const syncGalleryMode = () => {
      setIsMobileGallery(mediaQuery.matches);
    };

    syncGalleryMode();
    mediaQuery.addEventListener("change", syncGalleryMode);

    return () => {
      mediaQuery.removeEventListener("change", syncGalleryMode);
    };
  }, []);

  useEffect(() => {
    const gallery = galleryRef.current;

    if (!gallery) return;

    let frame = 0;

    const syncGalleryGeometry = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextHeight = gallery.clientHeight;

        setGalleryHeight((current) =>
          Math.abs(current - nextHeight) < 0.5 ? current : nextHeight,
        );
        updateScrollControls();
      });
    };

    syncGalleryGeometry();

    const resizeObserver = new ResizeObserver(syncGalleryGeometry);
    resizeObserver.observe(gallery);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [updateScrollControls]);

  //The gallery viewport itself may not resize when the masonry columns change
  //width, so explicitly re-measure overflow after the settled ratio/layout pass.
  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollControls);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [galleryHeight, imageRatios, isMobileGallery, updateScrollControls]);

  useEffect(() => {
    const gallery = galleryRef.current;

    if (!gallery) return;

    gsap.killTweensOf(galleryMotionRef.current);
    shouldInitializeDesktopPeekRef.current = true;
    galleryRevealProgressRef.current = 1;
    galleryPeekRef.current?.style.setProperty(
      "--frontend-gallery-peek-x",
      "0%",
    );

    gallery.scrollTo({
      left: 0,
      behavior: "auto",
    });

    requestAnimationFrame(updateScrollControls);
  }, [isMobileGallery, projectTitle, updateScrollControls]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gallery = galleryRef.current;

    if (!gallery) return;

    gsap.killTweensOf(galleryMotionRef.current);
    dragStartXRef.current = event.clientX;
    dragStartScrollLeftRef.current = gallery.scrollLeft;
    dragStartVirtualOffsetRef.current = getGalleryVirtualOffset();
    gallery.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gallery = galleryRef.current;
    const startX = dragStartXRef.current;

    if (!gallery || startX === null) return;

    const travel = event.clientX - startX;

    if (isDesktopGalleryPeekMode()) {
      //Treat reveal distance + real scrollLeft as one continuous virtual track.
      //Dragging left first exposes the hidden gallery, then scrolls screenshots
      //only after the gallery's left edge has been fully reached.
      applyGalleryVirtualOffset(dragStartVirtualOffsetRef.current - travel);
    } else {
      gallery.scrollLeft = dragStartScrollLeftRef.current - travel;
    }

    updateScrollControls();
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gallery = galleryRef.current;

    dragStartXRef.current = null;

    if (gallery?.hasPointerCapture(event.pointerId)) {
      gallery.releasePointerCapture(event.pointerId);
    }

    requestAnimationFrame(() => {
      updateScrollControls();
    });
  };

  if (screenshots.length === 0) {
    return null;
  }

  const masonryColumns = buildPackedMasonryColumns(
    screenshots,
    imageRatios,
    galleryHeight,
  );

  const renderScreenshotMedia = (
    screenshot: RenderableProjectScreenshot,
    index: number,
  ) => (
    <LiquidGlass
      className="frontend-project-shot h-full min-h-0 w-full rounded-[clamp(0.68rem,0.9vw,0.95rem)]"
      strength={index % 3 === 0 ? "strong" : "normal"}
    >
      <div className="absolute inset-[1px] overflow-hidden rounded-[inherit] bg-white/[0.025]">
        <img
          alt={screenshot.alt}
          className="h-full w-full select-none object-contain max-[680px]:object-cover"
          draggable={false}
          loading="lazy"
          onError={() => {
            setScreenshotRatio(index, 0, 0);
          }}
          onLoad={(event) => {
            setScreenshotRatio(
              index,
              event.currentTarget.naturalWidth,
              event.currentTarget.naturalHeight,
            );
          }}
          src={screenshot.src}
          style={{
            objectPosition: screenshot.objectPosition ?? "center",
          }}
        />
      </div>
    </LiquidGlass>
  );

  const wrapScreenshot = (
    screenshot: RenderableProjectScreenshot,
    index: number,
    style: CSSProperties,
  ) => {
    const media = renderScreenshotMedia(screenshot, index);

    return (
      <div
        className="min-h-0 min-w-0 shrink-0"
        key={`${screenshot.alt}-${index}`}
        style={style}
      >
        {media}
      </div>
    );
  };

  return (
    <div className="frontend-project-gallery-shell relative h-full min-h-0 w-full overflow-hidden">
      <div
        ref={galleryPeekRef}
        className="frontend-project-gallery-peek relative h-full min-h-0 w-full"
      >
        <div
          aria-label={`${projectTitle} screenshot gallery`}
          className="frontend-project-gallery pointer-events-auto h-full min-h-0 w-full cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain active:cursor-grabbing max-[680px]:rounded-[0.9rem]"
          onPointerCancel={stopDragging}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onScroll={updateScrollControls}
          ref={galleryRef}
          role="region"
          style={{
            scrollbarWidth: "none",
            scrollSnapType: isMobileGallery ? "x mandatory" : "x proximity",
            touchAction: "pan-x pan-y",
          }}
          tabIndex={0}
        >
          {isMobileGallery ? (
            <div
              className="flex h-full min-w-full items-stretch"
              style={{ gap: `${FRONTEND_MASONRY_GAP_PX}px` }}
            >
              {screenshots.map((screenshot, index) =>
                wrapScreenshot(screenshot, index, {
                  flex: "0 0 100%",
                  height: "100%",
                  scrollSnapAlign: "start",
                }),
              )}
            </div>
          ) : (
            <div
              className="flex h-full w-max min-w-full items-stretch justify-end"
              style={{
                gap: `${FRONTEND_MASONRY_GAP_PX}px`,
              }}
            >
              {masonryColumns.map((column, columnIndex) => (
                <div
                  className="flex h-full shrink-0 flex-col"
                  key={`masonry-column-${columnIndex}`}
                  style={{
                    gap: `${FRONTEND_MASONRY_GAP_PX}px`,
                    width: `${column.width}px`,
                  }}
                >
                  {column.items.map((item) =>
                    wrapScreenshot(item.screenshot, item.index, {
                      height: `${item.height}px`,
                      width: "100%",
                      scrollSnapAlign: item.index === 0 ? "start" : "center",
                    }),
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/*
        The arrows are the explicit horizontal-scrolling affordance. Wheel
        input is deliberately not intercepted here, so ordinary page/section
        scrolling keeps its previous behavior.
      */}
      {canScrollLeft ? (
        <button
          aria-label={`Scroll ${projectTitle} screenshots left`}
          className="pointer-events-auto cursor-pointer absolute left-[clamp(0.45rem,0.65vw,0.7rem)] top-1/2 z-30 flex size-[clamp(2rem,2.55vw,2.55rem)] -translate-y-1/2 items-center justify-center rounded-full border border-white/42 bg-white/42 text-[#171717]/72 shadow-[0_8px_28px_rgba(23,23,23,0.08)] backdrop-blur-[14px] transition-[transform,background-color,opacity] duration-200 hover:scale-105 hover:bg-white/62 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 max-[680px]:left-2 max-[680px]:size-8"
          onClick={() => scrollGallery("left")}
          type="button"
        >
          <GalleryArrowIcon direction="left" />
        </button>
      ) : null}

      {canScrollRight ? (
        <button
          aria-label={`Scroll ${projectTitle} screenshots right`}
          className="pointer-events-auto cursor-pointer absolute right-[clamp(0.45rem,0.65vw,0.7rem)] top-1/2 z-30 flex size-[clamp(2rem,2.55vw,2.55rem)] -translate-y-1/2 items-center justify-center rounded-full border border-white/42 bg-white/42 text-[#171717]/72 shadow-[0_8px_28px_rgba(23,23,23,0.08)] backdrop-blur-[14px] transition-[transform,background-color,opacity] duration-200 hover:scale-105 hover:bg-white/62 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/20 max-[680px]:right-2 max-[680px]:size-8"
          onClick={() => scrollGallery("right")}
          type="button"
        >
          <GalleryArrowIcon direction="right" />
        </button>
      ) : null}
    </div>
  );
}

export default function FrontendSection({
  startY,
  registerSection,
  programmaticScrollRef,
}: ManualScrollSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const frontendTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const frontendProgressRef = useRef(FRONTEND_REVEALED_PROGRESS);
  const frontendLockedRef = useRef(false);
  const frontendReleasingRef = useRef(false);
  const frontendLockYRef = useRef<number | null>(null);
  const frontendSnapRef = useRef(false);
  const frontendReleasedDirectionRef = useRef<"forward" | "backward" | null>(
    null,
  );

  //This section is a five-scene editorial sequence, so its local scroll distance is intentionally based on viewport travel rather than About's overflowing text height.
  const getFrontendPxDuration = useCallback(() => {
    return Math.max(window.innerHeight * 3.7, 3100);
  }, []);

  const getFrontendLockY = useCallback(() => {
    return startY + FRONTEND_REVEAL_SCROLL_DISTANCE;
  }, [startY]);

  const seekFrontendScene = useCallback(
    (sceneIndex: number) => {
      const timeline = frontendTimelineRef.current;

      if (
        !timeline ||
        !frontendLockedRef.current ||
        frontendReleasingRef.current ||
        programmaticScrollRef.current
      ) {
        return;
      }

      const labelTime = timeline.labels[`frontend-scene-${sceneIndex}`];

      if (labelTime === undefined) {
        return;
      }

      const targetProgress = labelTime / Math.max(timeline.duration(), 1);

      gsap.killTweensOf(timeline);

      gsap.to(timeline, {
        progress: targetProgress,
        duration: 0.55,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: () => {
          frontendProgressRef.current = timeline.progress();
        },
        onComplete: () => {
          frontendProgressRef.current = targetProgress;
        },
      });
    },
    [programmaticScrollRef],
  );

  const runtimeRef = useRef<ScrollSectionRuntime<HomeSection> | null>(null);

  if (!runtimeRef.current) {
    runtimeRef.current = {
      section: "experience",
      startY,
      revealedProgress: FRONTEND_REVEALED_PROGRESS,
      timelineRef: frontendTimelineRef,
      progressRef: frontendProgressRef,
      lockedRef: frontendLockedRef,
      releasingRef: frontendReleasingRef,
      lockYRef: frontendLockYRef,
      snapRef: frontendSnapRef,
      releasedDirectionRef: frontendReleasedDirectionRef,
      getPxDuration: getFrontendPxDuration,
      getLockY: getFrontendLockY,
      localProgressTweenDuration: FRONTEND_LOCAL_PROGRESS_TWEEN_DURATION,
    };
  }

  const runtime = runtimeRef.current;
  runtime.startY = startY;
  runtime.getPxDuration = getFrontendPxDuration;
  runtime.getLockY = getFrontendLockY;

  useEffect(() => {
    return registerSection(runtime);
  }, [registerSection, runtime]);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    // Browser zoom and device DPR are not the same thing. In particular,
    // DevTools mobile emulation can report a high DPR even though the mobile
    // media-query layout is already perfectly sized. Only apply inverse-DPR
    // compensation in a desktop interaction environment where Ctrl +/- is
    // actually relevant. Coarse-pointer / touch layouts always stay at 1x and
    // therefore remain governed exclusively by the existing responsive CSS.
    const desktopInteractionQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );

    let resolutionQuery: MediaQueryList | null = null;

    const syncBrowserZoomCompensation = () => {
      if (!desktopInteractionQuery.matches) {
        section.style.setProperty("--frontend-browser-zoom-compensation", "1");
        return;
      }

      // Capture the reference DPR only once we are actually in the desktop
      // interaction mode. This prevents a mobile-emulation DPR (2x/3x, etc.)
      // from ever becoming the reference used for desktop Ctrl +/- behavior.
      const baseDevicePixelRatio = getFrontendBaseDevicePixelRatio();
      const currentDevicePixelRatio = window.devicePixelRatio || 1;
      const browserZoomRatio =
        currentDevicePixelRatio / Math.max(baseDevicePixelRatio, 0.0001);
      const inverseZoom = 1 / Math.max(browserZoomRatio, 0.0001);
      const compensation = Math.min(
        Math.max(inverseZoom, FRONTEND_BROWSER_ZOOM_MIN_COMPENSATION),
        FRONTEND_BROWSER_ZOOM_MAX_COMPENSATION,
      );

      section.style.setProperty(
        "--frontend-browser-zoom-compensation",
        compensation.toFixed(4),
      );
    };

    const bindResolutionQuery = () => {
      resolutionQuery?.removeEventListener("change", handleResolutionChange);

      resolutionQuery = window.matchMedia(
        `(resolution: ${window.devicePixelRatio || 1}dppx)`,
      );
      resolutionQuery.addEventListener("change", handleResolutionChange);
    };

    function handleResolutionChange() {
      syncBrowserZoomCompensation();
      bindResolutionQuery();
    }

    function handleInteractionModeChange() {
      syncBrowserZoomCompensation();
      bindResolutionQuery();
    }

    syncBrowserZoomCompensation();
    bindResolutionQuery();

    window.addEventListener("resize", syncBrowserZoomCompensation, {
      passive: true,
    });
    desktopInteractionQuery.addEventListener(
      "change",
      handleInteractionModeChange,
    );

    return () => {
      window.removeEventListener("resize", syncBrowserZoomCompensation);
      desktopInteractionQuery.removeEventListener(
        "change",
        handleInteractionModeChange,
      );
      resolutionQuery?.removeEventListener("change", handleResolutionChange);
      section.style.removeProperty("--frontend-browser-zoom-compensation");
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    let frame = 0;

    const updateGlassParallax = (event: PointerEvent) => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const surfaces = Array.from(
          section.querySelectorAll<HTMLElement>(".frontend-liquid-glass"),
        );

        surfaces.forEach((surface) => {
          const rect = surface.getBoundingClientRect();

          if (
            rect.width <= 1 ||
            rect.height <= 1 ||
            rect.bottom < 0 ||
            rect.top > window.innerHeight
          ) {
            return;
          }

          const isScreenshotCard = surface.classList.contains(
            "frontend-project-shot",
          );
          const isPointerInside =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;

          //Screenshot media should feel physically interactive rather than
          //tilting merely because the pointer exists somewhere in the viewport.
          //Outside the card it settles flat; inside it gets a stronger 3D tilt.
          if (isScreenshotCard && !isPointerInside) {
            surface.style.setProperty("--glass-pointer-x", "50%");
            surface.style.setProperty("--glass-pointer-y", "50%");
            surface.style.setProperty("--glass-rotate-x", "0deg");
            surface.style.setProperty("--glass-rotate-y", "0deg");
            return;
          }

          const normalizedX =
            ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
          const normalizedY =
            ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;

          const clampedX = Math.max(-1, Math.min(1, normalizedX));
          const clampedY = Math.max(-1, Math.min(1, normalizedY));
          const highlightTravel = isScreenshotCard ? 22 : 16;
          const rotateXStrength = isScreenshotCard ? -2.7 : -1.15;
          const rotateYStrength = isScreenshotCard ? 3.05 : 1.3;

          surface.style.setProperty(
            "--glass-pointer-x",
            `${50 + clampedX * highlightTravel}%`,
          );
          surface.style.setProperty(
            "--glass-pointer-y",
            `${50 + clampedY * highlightTravel}%`,
          );
          surface.style.setProperty(
            "--glass-rotate-x",
            `${clampedY * rotateXStrength}deg`,
          );
          surface.style.setProperty(
            "--glass-rotate-y",
            `${clampedX * rotateYStrength}deg`,
          );
        });
      });
    };

    const resetGlassParallax = () => {
      const surfaces = Array.from(
        section.querySelectorAll<HTMLElement>(".frontend-liquid-glass"),
      );

      surfaces.forEach((surface) => {
        surface.style.setProperty("--glass-pointer-x", "50%");
        surface.style.setProperty("--glass-pointer-y", "50%");
        surface.style.setProperty("--glass-rotate-x", "0deg");
        surface.style.setProperty("--glass-rotate-y", "0deg");
      });
    };

    window.addEventListener("pointermove", updateGlassParallax, {
      passive: true,
    });
    window.addEventListener("blur", resetGlassParallax);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", updateGlassParallax);
      window.removeEventListener("blur", resetGlassParallax);
    };
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const stage = stageRef.current;
      const viewport = viewportRef.current;
      const content = contentRef.current;

      if (!section || !stage || !viewport || !content) {
        return;
      }

      const verticalGridLines = gsap.utils.toArray<HTMLElement>(
        ".frontend-grid-vertical",
        section,
      );
      const horizontalGridLines = gsap.utils.toArray<HTMLElement>(
        ".frontend-grid-horizontal",
        section,
      );
      const titleLines = gsap.utils.toArray<HTMLElement>(
        ".frontend-title-line",
        section,
      );
      const introItems = gsap.utils.toArray<HTMLElement>(
        ".frontend-intro-item",
        section,
      );
      const cards = gsap.utils.toArray<HTMLElement>(".frontend-card", section);
      const sceneNavButtons = gsap.utils.toArray<HTMLElement>(
        ".frontend-scene-nav-button",
        section,
      );
      const sceneNavDots = gsap.utils.toArray<HTMLElement>(
        ".frontend-scene-nav-dot",
        section,
      );
      const stack = section.querySelector<HTMLElement>(".frontend-stack");
      const cardNav = section.querySelector<HTMLElement>(".frontend-card-nav");
      if (cards.length !== FRONTEND_PROJECTS.length || !stack || !cardNav) {
        return;
      }

      const projectCopy = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".frontend-project-copy", card),
      );
      const projectRules = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".frontend-project-rule", card),
      );
      const projectGlass = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".frontend-liquid-glass", card),
      );
      const projectShots = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".frontend-project-shot", card),
      );
      const technologyText = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".frontend-technology-text", card),
      );
      const projectLinks = cards.map((card) =>
        gsap.utils.toArray<HTMLElement>(".frontend-project-link", card),
      );

      gsap.set(section, {
        autoAlpha: 0,
        filter: "blur(0px)",
      });

      //Unlike About, this section has no shared 3D tilt. Its visual language is a flat editorial interface system.
      gsap.set(stage, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
      });

      gsap.set(verticalGridLines, {
        scaleY: 0,
        transformOrigin: "top center",
        autoAlpha: 0,
      });

      gsap.set(horizontalGridLines, {
        scaleX: 0,
        transformOrigin: "left center",
        autoAlpha: 0,
      });

      gsap.set(titleLines, {
        yPercent: 115,
      });

      gsap.set(introItems, {
        autoAlpha: 0,
        y: 18,
      });

      gsap.set(stack, {
        autoAlpha: 0,
        x: 92,
      });

      gsap.set(cardNav, {
        autoAlpha: 0,
        x: 10,
      });

      //Each project still has a strict card-sized coordinate system. The card
      //itself is intentionally invisible; only its arranged children render.
      gsap.set(cards, {
        transformOrigin: "center center",
        autoAlpha: (index) => (index === 0 ? 1 : 0),
        xPercent: (index) => (index === 0 ? 0 : 8),
        y: (index) => (index === 0 ? 0 : 16),
        scale: (index) => (index === 0 ? 1 : 0.987),
        filter: "blur(0px)",
        zIndex: (index) => FRONTEND_PROJECTS.length - index,
      });

      projectCopy.forEach((items) => {
        gsap.set(items, {
          autoAlpha: 0,
          y: 18,
        });
      });

      projectRules.forEach((items) => {
        gsap.set(items, {
          scaleX: 0,
          transformOrigin: "left center",
        });
      });

      projectGlass.forEach((items) => {
        gsap.set(items, {
          autoAlpha: 0,
        });
      });

      projectShots.forEach((items) => {
        gsap.set(items, {
          y: 22,
          x: 12,
          scale: 0.985,
        });
      });

      technologyText.forEach((items) => {
        gsap.set(items, {
          autoAlpha: 0,
          y: 10,
        });
      });

      projectLinks.forEach((items) => {
        gsap.set(items, {
          autoAlpha: 0,
          y: 10,
        });
      });

      //Keep every navigator hit target fully opaque so its hover title remains
      //crisp. Active/inactive state is expressed only by the dot itself.
      gsap.set(sceneNavButtons, {
        autoAlpha: 1,
      });

      gsap.set(sceneNavDots, {
        autoAlpha: (index) => (index === 0 ? 1 : 0.58),
        scale: (index) => (index === 0 ? 1.28 : 0.82),
      });

      const timeline = gsap.timeline({
        paused: true,
        defaults: {
          ease: "none",
        },
      });

      frontendTimelineRef.current = timeline;

      const revealProject = (sceneIndex: number, startTime: number) => {
        timeline
          .to(
            projectCopy[sceneIndex] ?? [],
            {
              autoAlpha: 1,
              y: 0,
              stagger: 0.055,
              duration: 0.42,
              ease: "power3.out",
            },
            startTime,
          )
          .to(
            projectRules[sceneIndex] ?? [],
            {
              scaleX: 1,
              stagger: 0.07,
              duration: 0.4,
              ease: "power3.out",
            },
            startTime + 0.08,
          )
          .to(
            projectGlass[sceneIndex] ?? [],
            {
              autoAlpha: 1,
              stagger: 0.045,
              duration: 0.38,
              ease: "power2.out",
            },
            startTime + 0.1,
          )
          .to(
            projectShots[sceneIndex] ?? [],
            {
              x: 0,
              y: 0,
              scale: 1,
              stagger: 0.04,
              duration: 0.56,
              ease: "power4.out",
            },
            startTime + 0.1,
          )
          .to(
            technologyText[sceneIndex] ?? [],
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.34,
              ease: "power3.out",
            },
            startTime + 0.17,
          )
          .to(
            projectLinks[sceneIndex] ?? [],
            {
              autoAlpha: 1,
              y: 0,
              stagger: 0.06,
              duration: 0.34,
              ease: "power3.out",
            },
            startTime + 0.2,
          );
      };

      timeline
        .addLabel("reveal", 0)
        .to(
          section,
          {
            autoAlpha: 1,
            duration: 0.08,
          },
          0,
        )
        .to(
          verticalGridLines,
          {
            scaleY: 1,
            autoAlpha: 0.14,
            stagger: 0.016,
            duration: 0.5,
            ease: "power2.out",
          },
          0,
        )
        .to(
          horizontalGridLines,
          {
            scaleX: 1,
            autoAlpha: 0.14,
            stagger: 0.02,
            duration: 0.5,
            ease: "power2.out",
          },
          0.04,
        )
        .to(
          titleLines,
          {
            yPercent: 0,
            stagger: 0.08,
            duration: 0.56,
            ease: "power4.out",
          },
          0.1,
        )
        .to(
          introItems,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            ease: "power3.out",
          },
          0.25,
        )
        .to(
          stack,
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.62,
            ease: "power4.out",
          },
          0.3,
        )
        .to(
          cardNav,
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.36,
            ease: "power3.out",
          },
          0.48,
        );

      revealProject(0, 0.62);

      timeline
        .addLabel("locked-story", FRONTEND_LOCKED_STORY_TIME)
        .addLabel("frontend-scene-0", FRONTEND_LOCKED_STORY_TIME);

      const transitionStarts = [1.82, 2.96, 4.1, 5.24] as const;

      transitionStarts.forEach((transitionStart, transitionIndex) => {
        const sceneIndex = transitionIndex + 1;
        const previousCard = cards[sceneIndex - 1];
        const currentCard = cards[sceneIndex];

        if (!previousCard || !currentCard) return;

        timeline
          .to(
            previousCard,
            {
              xPercent: -14,
              y: -14,
              autoAlpha: 0,
              scale: 0.975,
              filter: "blur(4px)",
              duration: 0.62,
              ease: "power3.inOut",
            },
            transitionStart,
          )
          .to(
            currentCard,
            {
              xPercent: 0,
              y: 0,
              autoAlpha: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: 0.66,
              ease: "power3.inOut",
            },
            transitionStart,
          )
          .to(
            sceneNavButtons,
            {
              autoAlpha: 1,
              duration: 0.28,
            },
            transitionStart,
          )
          .to(
            sceneNavDots,
            {
              autoAlpha: (index) => (index === sceneIndex ? 1 : 0.58),
              scale: (index) => (index === sceneIndex ? 1.28 : 0.82),
              duration: 0.28,
              ease: "power2.inOut",
            },
            transitionStart,
          );

        revealProject(sceneIndex, transitionStart + 0.14);

        timeline.addLabel(
          `frontend-scene-${sceneIndex}`,
          transitionStart + 0.76,
        );
      });

      timeline
        .to(
          cards[FRONTEND_PROJECTS.length - 1],
          {
            xPercent: -10,
            y: -26,
            autoAlpha: 0,
            scale: 0.975,
            filter: "blur(4px)",
            duration: 0.5,
            ease: "power3.in",
          },
          6.42,
        )
        .to(
          titleLines,
          {
            x: (index) => (index === 0 ? -52 : 52),
            autoAlpha: 0,
            stagger: 0.05,
            duration: 0.46,
            ease: "power3.in",
          },
          6.98,
        )
        .to(
          cardNav,
          {
            autoAlpha: 0,
            x: 12,
            duration: 0.32,
            ease: "power2.in",
          },
          7.0,
        )
        .to(
          section,
          {
            autoAlpha: 0,
            filter: "blur(8px)",
            duration: 0.6,
            ease: "power2.in",
          },
          7.06,
        );

      const lockedStoryTime =
        timeline.labels["locked-story"] ?? FRONTEND_LOCKED_STORY_TIME;

      //Derive the handoff from the exact first-project-complete label instead
      //of keeping a magic normalized progress value. This makes key 2 land on
      //the same fully revealed state even when the timeline duration changes.
      runtime.revealedProgress =
        lockedStoryTime / Math.max(timeline.duration(), 0.0001);

      frontendProgressRef.current = runtime.revealedProgress;

      console.log("Frontend timeline duration:", timeline.duration());
      console.log("Frontend revealed progress:", runtime.revealedProgress);

      ScrollTrigger.create({
        trigger: document.documentElement,
        start: startY,
        end: getFrontendLockY,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (
            frontendLockedRef.current ||
            frontendReleasingRef.current ||
            programmaticScrollRef.current
          ) {
            return;
          }

          const releasedDirection = frontendReleasedDirectionRef.current;

          if (releasedDirection === "forward") {
            setScrollSectionProgressImmediately(runtime, 1);
            return;
          }

          if (releasedDirection === "backward" && self.direction > 0) {
            return;
          }

          const progress = self.progress * runtime.revealedProgress;

          setScrollSectionProgressImmediately(runtime, progress);

          if (releasedDirection === "backward" && self.progress <= 0) {
            frontendReleasedDirectionRef.current = null;
            setScrollSectionProgressImmediately(runtime, 0);
          }
        },
      });

      return () => {
        frontendTimelineRef.current = null;
      };
    },
    {
      scope: sectionRef,
      dependencies: [
        getFrontendLockY,
        getFrontendPxDuration,
        startY,
        FRONTEND_GSAP_HMR_REVISION,
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      data-scroll-locked-section="experience"
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden text-[#171717]"
    >
      <LiquidGlassDefinitions />

      <style>{`
        .frontend-liquid-glass {
          --glass-pointer-x: 50%;
          --glass-pointer-y: 50%;
          --glass-rotate-x: 0deg;
          --glass-rotate-y: 0deg;

          background: rgba(255, 255, 255, 0.025);
          transform:
            perspective(900px)
            rotateX(var(--glass-rotate-x))
            rotateY(var(--glass-rotate-y));
          transform-style: preserve-3d;
          transition:
            transform 220ms cubic-bezier(.2,.8,.2,1),
            background-color 220ms ease;
          box-shadow:
            inset 1.25px 1.25px 0 rgba(255, 255, 255, 0.72),
            inset -1px -1px 0 rgba(255, 255, 255, 0.16),
            inset 0 0 2px rgba(255, 255, 255, 0.34);
        }

        .frontend-project-shot {
          transform-origin: center center;
          transition:
            transform 170ms cubic-bezier(.18,.78,.2,1),
            background-color 180ms ease;
        }

        .frontend-liquid-optics {
          background: rgba(255, 255, 255, 0.018);
          -webkit-backdrop-filter:
            blur(5px)
            saturate(1.22)
            brightness(1.045)
            contrast(1.025);
          backdrop-filter:
            blur(5px)
            saturate(1.22)
            brightness(1.045)
            contrast(1.025);
          opacity: 0.92;
          isolation: isolate;
        }

        .frontend-liquid-optics-normal {
          filter: url(#frontend-liquid-refraction);
        }

        .frontend-liquid-optics-strong {
          filter: url(#frontend-liquid-refraction-strong);
        }

        .frontend-liquid-highlight {
          pointer-events: none;
          background:
            radial-gradient(
              circle at var(--glass-pointer-x) var(--glass-pointer-y),
              rgba(255, 255, 255, 0.7) 0%,
              rgba(255, 255, 255, 0.22) 13%,
              rgba(255, 255, 255, 0.04) 31%,
              transparent 50%
            ),
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.26),
              transparent 28%,
              transparent 72%,
              rgba(255, 255, 255, 0.12)
            );
          opacity: 0.58;
          mix-blend-mode: screen;
        }

        .frontend-liquid-glass::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 3;
          border-radius: inherit;
          padding: 1px;
          background:
            linear-gradient(
              115deg,
              rgba(255, 255, 255, 0.74),
              rgba(180, 226, 255, 0.18) 24%,
              rgba(255, 255, 255, 0.08) 48%,
              rgba(255, 190, 221, 0.14) 74%,
              rgba(255, 255, 255, 0.5)
            );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.62;
        }

        .frontend-project-gallery::-webkit-scrollbar {
          display: none;
        }

        .frontend-project-gallery-peek {
          --frontend-gallery-peek-x: 0%;
        }

        /*
          Use CSS zoom instead of transform: scale() so compensated text also
          consumes proportionally less/more layout space. The outer section and
          its media-query breakpoints are intentionally left untouched.
        */
        .frontend-browser-zoom-compensated {
          zoom: var(--frontend-browser-zoom-compensation, 1);
        }

        /*
          Touch/mobile layouts must remain exactly as authored by the existing
          media queries. This CSS guard mirrors the JS guard above and prevents
          device-emulation DPR from ever shrinking the tuned phone/tablet UI.
        */
        @media (hover: none), (pointer: coarse) {
          .frontend-browser-zoom-compensated {
            zoom: 1 !important;
          }
        }

        @media (min-width: 1181px) {
          .frontend-project-gallery-peek {
            transform: translate3d(var(--frontend-gallery-peek-x), 0, 0);
            will-change: transform;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .frontend-liquid-glass {
            transform: none;
            transition: none;
          }

          .frontend-liquid-highlight {
            background:
              linear-gradient(
                135deg,
                rgba(255, 255, 255, 0.28),
                transparent 48%,
                rgba(255, 255, 255, 0.1)
              );
          }
        }
      `}</style>

      <div
        ref={stageRef}
        className="absolute inset-0 will-change-[transform,opacity]"
      >
        <div
          ref={viewportRef}
          className="relative h-full w-full overflow-hidden"
        >
          <div ref={contentRef} className="relative h-full w-full">
            <div
              aria-hidden="true"
              className="absolute inset-[4vw] opacity-48 max-[680px]:inset-[5vw] max-[680px]:opacity-30"
            >
              {GRID_COLUMNS.map((_, index) => (
                <span
                  className="frontend-grid-vertical absolute top-0 h-full w-px bg-[#171717]/14"
                  key={`column-${index}`}
                  style={{ left: `${index * 10}%` }}
                />
              ))}

              {GRID_ROWS.map((_, index) => (
                <span
                  className="frontend-grid-horizontal absolute left-0 h-px w-full bg-[#171717]/14"
                  key={`row-${index}`}
                  style={{ top: `${index * 16.666}%` }}
                />
              ))}
            </div>

            {/*
                The visible project composition stays capped at 58vw on desktop
                so it remains on the right side of the Spline stage instead of
                colliding with the robot. The project copy has a stable right-side
                home whether screenshots exist or not; when media exists, it occupies
                the left side. On phone-sized viewports the Spline robot occupies
                the lower-left of the stage, so the entire section moves into a
                right-side safe column (27vw left gutter, 4vw right gutter) and
                reserves the top ~11vh for the future navbar.
              */}
            <div className="absolute bottom-[3.25vh] right-[4.35vw] top-[clamp(5.75rem,9vh,8.25rem)] z-20 flex min-h-0 w-[min(58vw,70rem)] flex-col gap-[clamp(0.95rem,1.55vh,1.35rem)] max-[1180px]:w-[min(76vw,46rem)] max-[900px]:bottom-[3.5vh] max-[900px]:right-[4.5vw] max-[900px]:top-[clamp(5.5rem,8.5vh,7rem)] max-[900px]:w-[91vw] max-[680px]:bottom-[4vh] max-[680px]:left-[27vw] max-[680px]:right-[4vw] max-[680px]:top-[clamp(5.75rem,11vh,7rem)] max-[680px]:w-auto max-[680px]:gap-[clamp(0.72rem,1.25vh,1rem)]">
              <div className="frontend-browser-zoom-compensated z-40 ml-auto flex w-full shrink-0 flex-col items-end text-right max-[1180px]:translate-y-[clamp(0.35rem,1.5vw,1.15rem)] max-[680px]:translate-y-0">
                <h2
                  className="m-0 font-sans text-[clamp(2.6rem,4.4vw,5.2rem)] font-semibold uppercase leading-[0.78] tracking-[-0.085em] max-[680px]:text-[clamp(2.8rem,11.5vw,3.5rem)] max-[680px]:leading-[0.75]"
                  aria-label="Frontend Engineering"
                >
                  <span className="block overflow-y-clip pb-[0.08em]">
                    <span className="frontend-title-line block will-change-transform">
                      Front
                    </span>
                  </span>
                  <span className="block overflow-y-clip pb-[0.08em]">
                    <span className="frontend-title-line block will-change-transform">
                      End
                    </span>
                  </span>
                </h2>

                <p className="frontend-intro-item mt-2 max-w-[24rem] font-mono text-[clamp(0.58rem,0.66vw,0.74rem)] uppercase leading-[1.6] tracking-[0.09em] text-[#171717]/44 max-[900px]:max-w-[18rem] max-[900px]:text-[0.5rem] max-[680px]:mt-2 max-[680px]:max-w-[16rem] max-[680px]:text-[0.47rem] max-[680px]:leading-[1.55]">
                  Selected frontend proof of work.
                </p>
              </div>

              <div className="frontend-stack relative z-30 min-h-0 w-full flex-1 overflow-visible will-change-[transform,opacity]">
                {FRONTEND_PROJECTS.map((project) => {
                  //A screenshot entry with src: null is only configuration or
                  //placeholder metadata. It must not reserve gallery space.
                  //When screenshots exist they render to the LEFT of the stable
                  //right-aligned copy on desktop. A small independent gap
                  //keeps the media visually related to the copy without
                  //forcing either side into a shared geometric "slot".
                  const screenshots =
                    project.screenshots.filter(hasScreenshotSource);
                  const hasScreenshots = screenshots.length > 0;

                  //Only render detail rows that actually have content. The
                  //divider belongs to the row itself, so an empty optional
                  //field can never leave behind an orphan h-px rule or label.
                  const projectDetails = [
                    { label: "Description", value: project.description },
                    { label: "My work", value: project.contribution },
                    { label: "Outcome", value: project.outcome },
                  ].filter(
                    (detail): detail is { label: string; value: string } =>
                      Boolean(detail.value?.trim()),
                  );

                  //The copy never changes sides. Screenshot availability only
                  //controls whether the left-side media region is rendered.

                  return (
                    <article
                      className="frontend-card absolute inset-0 overflow-visible bg-transparent will-change-[transform,opacity,filter]"
                      key={project.title}
                    >
                      {/*
                          The title is separated from the lower desktop row on
                          purpose. Gallery + details then share one flex row and
                          therefore one natural height. Adding technologies, links
                          or longer copy grows that row upward from the fixed bottom
                          edge and the gallery stretches with it automatically.
                        */}
                      <div className="flex h-full min-h-0 w-full flex-col justify-end max-[1180px]:justify-center max-[1180px]:-translate-y-[clamp(0.75rem,2.4vh,2rem)] max-[680px]:-translate-y-[clamp(0.35rem,1.2vh,0.75rem)]">
                        <div className="frontend-browser-zoom-compensated frontend-project-copy relative z-30 ml-auto w-full max-w-[23rem] text-right max-[1180px]:max-w-[31rem] max-[680px]:max-w-none">
                          <h3 className="ml-auto max-w-[23rem] text-[clamp(1.85rem,1.05vw,3.25rem)] font-semibold leading-[0.92] tracking-[-0.065em] max-[1180px]:max-w-[31rem] max-[1180px]:text-[clamp(1.55rem,2.7vw,1.9rem)] max-[680px]:max-w-full max-[680px]:text-[clamp(1.45rem,6.7vw,2rem)] max-[680px]:leading-[0.96]">
                            {project.title}
                          </h3>
                        </div>

                        <div className="mt-[clamp(1.15rem,1.75vh,1.55rem)] flex min-h-0 w-full items-stretch justify-end gap-[clamp(0.42rem,0.62vw,0.72rem)] max-[1180px]:flex-col max-[1180px]:items-end max-[1180px]:gap-[clamp(1rem,1.65vh,1.4rem)] max-[680px]:mt-[0.72rem] max-[680px]:gap-[clamp(0.88rem,1.45vh,1.12rem)]">
                          {hasScreenshots ? (
                            <div className="relative z-20 order-1 flex min-h-0 min-w-0 flex-1 self-stretch items-stretch overflow-hidden min-[1181px]:basis-[60%] min-[1181px]:min-h-[min(56vh,35rem)] max-[1180px]:order-2 max-[1180px]:ml-auto max-[1180px]:h-[min(27vh,17rem)] max-[1180px]:w-full max-[1180px]:max-w-[34rem] max-[1180px]:flex-none max-[1180px]:self-auto max-[900px]:h-[min(25vh,15.5rem)] max-[680px]:h-[min(19vh,11.25rem)] max-[680px]:max-w-none">
                              <div className="h-full min-h-0 w-full">
                                <ProjectScreenshotGallery
                                  projectTitle={project.title}
                                  screenshots={screenshots}
                                />
                              </div>
                            </div>
                          ) : null}

                          <div
                            className={`relative z-30 order-2 flex min-w-0 flex-col items-end text-right max-[1180px]:order-1 ${
                              hasScreenshots
                                ? "basis-[40%] max-w-[23rem] max-[1180px]:basis-auto max-[1180px]:w-full max-[1180px]:max-w-[31rem] max-[680px]:max-w-none"
                                : "w-full max-w-[31rem] max-[680px]:max-w-none"
                            }`}
                          >
                            <div className="frontend-browser-zoom-compensated flex w-full flex-col items-end">
                              {projectDetails.length > 0 ? (
                                <div className="frontend-project-copy ml-auto w-full max-w-[23rem] max-[1180px]:max-w-[31rem] max-[680px]:max-w-none">
                                  {projectDetails.map((detail, detailIndex) => (
                                    <div key={detail.label}>
                                      <div
                                        className={`frontend-project-rule h-px w-full ${
                                          detailIndex === 0
                                            ? "bg-[#171717]/18"
                                            : "bg-[#171717]/12"
                                        }`}
                                      />

                                      <div className="frontend-project-copy flex flex-col items-end gap-[clamp(0.45rem,0.7vh,0.62rem)] py-[clamp(0.92rem,1.35vh,1.18rem)] text-right max-[1180px]:gap-[0.32rem] max-[1180px]:py-[0.7rem] max-[680px]:gap-[0.3rem] max-[680px]:py-[0.66rem]">
                                        <span className="font-mono text-[clamp(0.57rem,0.62vw,0.68rem)] uppercase tracking-[0.16em] text-[#171717]/42 max-[1180px]:text-[0.52rem] max-[1180px]:tracking-[0.14em] max-[680px]:text-[0.46rem] max-[680px]:tracking-[0.14em]">
                                          {detail.label}
                                        </span>
                                        <p className="max-w-[22rem] font-[Garamond,_'Times_New_Roman',_serif] text-[clamp(1.16rem,1.3vw,1.42rem)] leading-[1.54] text-[#171717]/64 max-[1180px]:max-w-[30rem] max-[1180px]:text-[clamp(0.92rem,1.45vw,1.04rem)] max-[1180px]:leading-[1.45] max-[680px]:max-w-none max-[680px]:text-[0.86rem] max-[680px]:leading-[1.48]">
                                          {detail.value}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              <p className="frontend-technology-text ml-auto mt-[clamp(1rem,1.5vh,1.3rem)] w-full max-w-[23rem] text-right font-mono text-[clamp(0.76rem,0.82vw,0.92rem)] font-medium leading-[1.65] tracking-[0.035em] text-[#171717]/68 max-[1180px]:mt-[0.78rem] max-[1180px]:max-w-[31rem] max-[1180px]:text-[0.74rem] max-[680px]:mt-[0.72rem] max-[680px]:max-w-none max-[680px]:text-[0.7rem] max-[680px]:leading-[1.6]">
                                {project.technologies.join(", ")}
                              </p>

                              {/* Explicit project destinations live with the copy.
                                  The screenshot gallery itself is intentionally
                                  only a media/carousel interaction. */}
                              {(project.liveUrl || project.repositoryUrl) && (
                                <div className="frontend-project-copy ml-auto mt-[clamp(1.05rem,1.6vh,1.4rem)] flex w-full max-w-[23rem] flex-wrap items-center justify-end gap-x-[clamp(1.2rem,1.8vw,1.95rem)] gap-y-3 max-[1180px]:mt-[0.78rem] max-[1180px]:max-w-[31rem] max-[1180px]:gap-x-3 max-[1180px]:gap-y-2 max-[680px]:mt-[0.82rem] max-[680px]:max-w-none">
                                  {project.liveUrl ? (
                                    <a
                                      className="frontend-project-link pointer-events-auto inline-flex items-center justify-center rounded-full border border-[#171717]/14 bg-white/[0.08] px-[clamp(0.8rem,1vw,1.05rem)] py-[clamp(0.48rem,0.58vw,0.62rem)] font-mono text-[clamp(0.6rem,0.68vw,0.76rem)] uppercase tracking-[0.12em] text-[#171717]/72 backdrop-blur-[8px] transition-[transform,background-color,opacity] duration-200 hover:-translate-y-px hover:bg-white/20 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/16 max-[1180px]:px-3 max-[1180px]:py-2 max-[1180px]:text-[0.56rem] max-[680px]:text-[0.54rem]"
                                      href={project.liveUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      Visit live site ↗
                                    </a>
                                  ) : null}

                                  {project.repositoryUrl ? (
                                    <a
                                      className="frontend-project-link pointer-events-auto inline-flex items-center justify-center rounded-full border border-[#171717]/11 bg-white/[0.045] px-[clamp(0.8rem,1vw,1.05rem)] py-[clamp(0.48rem,0.58vw,0.62rem)] font-mono text-[clamp(0.6rem,0.68vw,0.76rem)] uppercase tracking-[0.12em] text-[#171717]/62 backdrop-blur-[8px] transition-[transform,background-color,opacity] duration-200 hover:-translate-y-px hover:bg-white/16 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/14 max-[1180px]:px-3 max-[1180px]:py-2 max-[1180px]:text-[0.56rem] max-[680px]:text-[0.54rem]"
                                      href={project.repositoryUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      Repository ↗
                                    </a>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/*
                Project navigation is intentionally dots-only. Every project gets
                one standalone black dot. On wide desktop viewports the dots form
                a vertical stack on the far-right edge, anchored from the bottom
                upward so they stay clear of the copy. Tablet/mobile keep the
                compact bottom row. Hovering or keyboard focusing reveals the
                project title; clicking seeks the local GSAP timeline directly to
                that project's fully assembled scene.
              */}
            <nav
              aria-label="Frontend project navigation"
              className="frontend-card-nav pointer-events-auto absolute bottom-[2.8vh] right-[4.35vw] z-[70] flex h-auto flex-row items-center justify-end gap-[clamp(0.42rem,0.62vw,0.64rem)] min-[1181px]:bottom-[3.25vh] min-[1181px]:right-[1.05vw] min-[1181px]:flex-col min-[1181px]:gap-[0.12rem] max-[900px]:bottom-[2.6vh] max-[900px]:right-[4.5vw] max-[680px]:bottom-[2.1vh] max-[680px]:right-[4vw] max-[680px]:gap-[0.42rem]"
            >
              {FRONTEND_PROJECTS.map((project, sceneIndex) => (
                <button
                  aria-label={`Show ${project.title}`}
                  className="frontend-scene-nav-button group relative flex size-9 cursor-pointer items-center justify-center outline-none min-[1181px]:size-8 max-[680px]:size-6"
                  key={project.title}
                  onClick={() => seekFrontendScene(sceneIndex)}
                  type="button"
                >
                  <span className="pointer-events-none absolute bottom-[calc(100%+0.52rem)] right-0 w-max max-w-[min(19rem,36vw)] translate-y-1 rounded-[0.72rem] border border-[#171717]/11 bg-[#f4f2eb]/96 px-[clamp(0.72rem,0.92vw,0.96rem)] py-[clamp(0.52rem,0.66vw,0.68rem)] text-left opacity-0 shadow-[0_10px_28px_rgba(23,23,23,0.08)] backdrop-blur-[12px] transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 min-[1181px]:bottom-auto min-[1181px]:right-[calc(100%+0.45rem)] min-[1181px]:top-1/2 min-[1181px]:-translate-y-1/2 min-[1181px]:group-hover:-translate-y-1/2 min-[1181px]:group-focus-visible:-translate-y-1/2 max-[680px]:hidden">
                    <span className="block font-sans text-[clamp(0.82rem,0.96vw,1.04rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-[#171717] max-[680px]:text-[0.76rem]">
                      {project.title}
                    </span>
                  </span>

                  <span className="frontend-scene-nav-dot block size-[0.58rem] shrink-0 rounded-full bg-[#171717] shadow-[0_0_0_1px_rgba(244,242,235,0.9)] will-change-transform max-[680px]:size-[0.46rem]" />
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
