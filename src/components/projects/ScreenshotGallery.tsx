import gsap from "gsap";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ProjectScreenshotGalleryOrientation,
  RenderableProjectScreenshot,
} from "./screenshot-gallery.utils";

type PackedMasonryItem = {
  screenshot: RenderableProjectScreenshot;
  index: number;
  height: number;
};

type PackedMasonryColumn = {
  width: number;
  items: PackedMasonryItem[];
};

type ProjectScreenshotGalleryProps = {
  orientation: ProjectScreenshotGalleryOrientation;
  projectTitle: string;
  screenshots: readonly RenderableProjectScreenshot[];
};

type GalleryMotionMetrics = {
  gallery: HTMLDivElement;
  hasMeaningfulOverflow: boolean;
  maxScrollLeft: number;
  peekDistance: number;
  totalVirtualDistance: number;
};

const PROJECT_GALLERY_MASONRY_GAP_PX = 6;
const PROJECT_GALLERY_OVERFLOW_EPSILON_PX = 6;
const PROJECT_GALLERY_MOBILE_QUERY = "(max-width: 680px)";
const PROJECT_GALLERY_DESKTOP_QUERY = "(min-width: 1181px)";

//Desktop-only gallery reveal tuning. Frontend begins translated toward the
//copy from the RIGHT and reveals LEFT into place. Backend is the reflected
//composition: it begins translated LEFT underneath the copy and reveals RIGHT.
//In both modalities the wrapper reveal happens before native screenshot scroll,
//so there is no clipping/direction discontinuity at the reveal handoff.
const PROJECT_GALLERY_DESKTOP_PEEK_PERCENT = 31;

//A small amount of drag hysteresis prevents tiny pointer noise from needlessly
//writing scrollLeft / transform values before the user has actually dragged.
const PROJECT_GALLERY_DRAG_DEAD_ZONE_PX = 1.5;

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
      effectiveHeight - PROJECT_GALLERY_MASONRY_GAP_PX * (groupSize - 1),
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

function LiquidGlass({
  children,
  className = "",
  orientation,
}: {
  children?: ReactNode;
  className?: string;
  orientation: ProjectScreenshotGalleryOrientation;
}) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const hoverFrameRef = useRef<number | null>(null);
  const latestPointerRef = useRef({ x: 0, y: 0 });

  const resetSurface = useCallback(() => {
    const surface = surfaceRef.current;

    if (!surface) return;

    surface.style.setProperty("--glass-rotate-x", "0deg");
    surface.style.setProperty("--glass-rotate-y", "0deg");
  }, []);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      //Touch already has a direct horizontal drag path and does not benefit from
      //a hover-only perspective calculation. Skipping it removes needless layout
      //reads on mobile/tablet while keeping the desktop mouse effect intact.
      if (event.pointerType === "touch") {
        return;
      }

      latestPointerRef.current = {
        x: event.clientX,
        y: event.clientY,
      };

      if (hoverFrameRef.current !== null) {
        return;
      }

      hoverFrameRef.current = requestAnimationFrame(() => {
        hoverFrameRef.current = null;

        const surface = surfaceRef.current;

        if (!surface) return;

        const rect = surface.getBoundingClientRect();

        if (rect.width <= 1 || rect.height <= 1) {
          return;
        }

        const { x, y } = latestPointerRef.current;
        const normalizedX = ((x - rect.left) / rect.width) * 2 - 1;
        const normalizedY = ((y - rect.top) / rect.height) * 2 - 1;
        const clampedX = Math.max(-1, Math.min(1, normalizedX));
        const clampedY = Math.max(-1, Math.min(1, normalizedY));

        surface.style.setProperty("--glass-rotate-x", `${clampedY * -2.7}deg`);
        surface.style.setProperty("--glass-rotate-y", `${clampedX * 3.05}deg`);
      });
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (hoverFrameRef.current !== null) {
        cancelAnimationFrame(hoverFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`${orientation}-liquid-glass project-gallery-liquid-glass relative isolate ${className}`}
      onPointerLeave={resetSurface}
      onPointerMove={handlePointerMove}
      ref={surfaceRef}
    >
      <div
        className={`${orientation}-liquid-content project-gallery-liquid-content relative z-10 h-full w-full overflow-hidden rounded-[inherit]`}
      >
        {children}
      </div>
    </div>
  );
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

export default function ProjectScreenshotGallery({
  orientation,
  projectTitle,
  screenshots,
}: ProjectScreenshotGalleryProps) {
  const galleryShellRef = useRef<HTMLDivElement | null>(null);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const leftTugRef = useRef<HTMLButtonElement | null>(null);
  const rightTugRef = useRef<HTMLButtonElement | null>(null);

  const galleryRevealProgressRef = useRef(1);
  const galleryMotionRef = useRef({ value: 0 });
  const galleryMetricsRef = useRef<GalleryMotionMetrics | null>(null);
  const shouldInitializeDesktopPeekRef = useRef(true);
  const isDesktopPeekModeRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isGalleryAnimatingRef = useRef(false);

  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartScrollLeftRef = useRef(0);
  const dragStartVirtualOffsetRef = useRef(0);
  const latestDragXRef = useRef(0);
  const dragFrameRef = useRef<number | null>(null);
  const scrollSyncFrameRef = useRef<number | null>(null);
  const geometryFrameRef = useRef<number | null>(null);

  const [imageRatios, setImageRatios] = useState<Record<number, number>>({});
  const pendingImageRatiosRef = useRef<Record<number, number>>({});
  const settledImageIndexesRef = useRef<Set<number>>(new Set());
  const [galleryHeight, setGalleryHeight] = useState(0);
  const [isMobileGallery, setIsMobileGallery] = useState(false);

  const isMirrored = orientation === "backend";

  const measureGalleryMotionMetrics = useCallback(() => {
    const gallery = galleryRef.current;

    if (!gallery) {
      galleryMetricsRef.current = null;
      return null;
    }

    const maxScrollLeft = Math.max(
      gallery.scrollWidth - gallery.clientWidth,
      0,
    );
    const hasMeaningfulOverflow =
      maxScrollLeft > PROJECT_GALLERY_OVERFLOW_EPSILON_PX;
    const peekDistance =
      isDesktopPeekModeRef.current && hasMeaningfulOverflow
        ? gallery.clientWidth * (PROJECT_GALLERY_DESKTOP_PEEK_PERCENT / 100)
        : 0;

    const metrics: GalleryMotionMetrics = {
      gallery,
      hasMeaningfulOverflow,
      maxScrollLeft,
      peekDistance,
      totalVirtualDistance: peekDistance + maxScrollLeft,
    };

    galleryMetricsRef.current = metrics;
    return metrics;
  }, []);

  const getGalleryMotionMetrics = useCallback(() => {
    return galleryMetricsRef.current ?? measureGalleryMotionMetrics();
  }, [measureGalleryMotionMetrics]);

  const setGalleryRevealProgress = useCallback(
    (progress: number) => {
      const clampedProgress = Math.min(Math.max(progress, 0), 1);

      //Frontend begins tucked to the RIGHT and travels LEFT into view.
      //Backend is the physical mirror: it begins tucked LEFT and travels RIGHT.
      //The media itself is never scaleX-flipped; only the gallery's spatial
      //coordinate system changes orientation.
      const peekTranslatePercent =
        (isMirrored ? -1 : 1) *
        PROJECT_GALLERY_DESKTOP_PEEK_PERCENT *
        (1 - clampedProgress);

      galleryRevealProgressRef.current = clampedProgress;
      //Store the reveal translation on the shell so both the screenshot
      //wrapper and the opening-arrow track inherit the exact same motion. The
      //opening arrow therefore rides the real exposed edge of the translated
      //gallery instead of being statically pinned to the outer viewport.
      galleryShellRef.current?.style.setProperty(
        "--project-gallery-peek-x",
        `${peekTranslatePercent}%`,
      );
    },
    [isMirrored],
  );

  const getGalleryVirtualOffset = useCallback(
    (metricsOverride?: GalleryMotionMetrics | null) => {
      const metrics = metricsOverride ?? getGalleryMotionMetrics();

      if (!metrics) return 0;

      if (metrics.peekDistance <= 0) {
        return metrics.gallery.scrollLeft;
      }

      //Frontend's desktop virtual track is:
      //  revealDistance + scrollLeft(0 -> max).
      //Backend mirrors that around the Y axis:
      //  revealDistance + (max -> 0).
      return (
        galleryRevealProgressRef.current * metrics.peekDistance +
        (isMirrored
          ? metrics.maxScrollLeft - metrics.gallery.scrollLeft
          : metrics.gallery.scrollLeft)
      );
    },
    [getGalleryMotionMetrics, isMirrored],
  );

  const setTugVisibility = useCallback(
    (ref: RefObject<HTMLButtonElement | null>, visible: boolean) => {
      const button = ref.current;

      if (!button) return;

      //Visibility is intentionally owned imperatively. Do not also provide
      //data-visible/disabled/tabIndex props in JSX: a normal React rerender can
      //otherwise overwrite the DOM state after this high-frequency gallery
      //controller has already decided that an arrow should be clickable.
      button.dataset.visible = visible ? "true" : "false";
    },
    [],
  );

  const syncTugVisibility = useCallback(
    (metricsOverride?: GalleryMotionMetrics | null) => {
      const metrics = metricsOverride ?? getGalleryMotionMetrics();

      if (!metrics) return;

      const virtualOffset = getGalleryVirtualOffset(metrics);
      const canMoveBackward =
        metrics.hasMeaningfulOverflow &&
        virtualOffset > PROJECT_GALLERY_OVERFLOW_EPSILON_PX;
      const canMoveForward =
        metrics.hasMeaningfulOverflow &&
        virtualOffset <
          metrics.totalVirtualDistance - PROJECT_GALLERY_OVERFLOW_EPSILON_PX;

      //Wide-desktop Backend is the exact horizontal mirror of Frontend. Its
      //LEFT arrow is therefore the forward/open control and its RIGHT arrow is
      //the backward/close control. Below the desktop peek breakpoint there is
      //no mirrored reveal stage, so arrows retain ordinary left/right meaning.
      if (isDesktopPeekModeRef.current && isMirrored) {
        setTugVisibility(leftTugRef, canMoveForward);
        setTugVisibility(rightTugRef, canMoveBackward);
        return;
      }

      setTugVisibility(leftTugRef, canMoveBackward);
      setTugVisibility(rightTugRef, canMoveForward);
    },
    [
      getGalleryMotionMetrics,
      getGalleryVirtualOffset,
      isMirrored,
      setTugVisibility,
    ],
  );

  const applyGalleryVirtualOffset = useCallback(
    (nextOffset: number, metricsOverride?: GalleryMotionMetrics | null) => {
      const metrics = metricsOverride ?? getGalleryMotionMetrics();

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

      //Stage 1: reveal the translated gallery without scrolling screenshots.
      //Frontend pins native scroll to the left edge; Backend pins to the
      //reflected right edge. Nothing clips before the wrapper is fully visible.
      if (clampedOffset <= metrics.peekDistance) {
        setGalleryRevealProgress(clampedOffset / metrics.peekDistance);
        metrics.gallery.scrollLeft = isMirrored ? metrics.maxScrollLeft : 0;
        return;
      }

      //Stage 2: continue the same physical motion after the wrapper reveal.
      //Frontend increases scrollLeft; Backend decreases it from maxScrollLeft.
      //That keeps the mirrored modality continuous through the handoff.
      setGalleryRevealProgress(1);
      metrics.gallery.scrollLeft = isMirrored
        ? metrics.maxScrollLeft - (clampedOffset - metrics.peekDistance)
        : clampedOffset - metrics.peekDistance;
    },
    [getGalleryMotionMetrics, isMirrored, setGalleryRevealProgress],
  );

  const initializeGalleryPosition = useCallback(
    (metrics: GalleryMotionMetrics) => {
      if (!metrics.hasMeaningfulOverflow || metrics.peekDistance <= 0) {
        setGalleryRevealProgress(1);
        shouldInitializeDesktopPeekRef.current = true;
        return;
      }

      if (!shouldInitializeDesktopPeekRef.current) {
        return;
      }

      metrics.gallery.scrollLeft = isMirrored ? metrics.maxScrollLeft : 0;
      setGalleryRevealProgress(0);
      shouldInitializeDesktopPeekRef.current = false;
    },
    [isMirrored, setGalleryRevealProgress],
  );

  const syncNativeGalleryPosition = useCallback(() => {
    const metrics = getGalleryMotionMetrics();

    if (!metrics) return;

    initializeGalleryPosition(metrics);

    //Custom drag/GSAP animation already owns the virtual track. A native scroll
    //event caused by those writes should only refresh affordance visibility and
    //must never run the desktop reveal-conversion logic a second time.
    if (isDraggingRef.current || isGalleryAnimatingRef.current) {
      syncTugVisibility(metrics);
      return;
    }

    if (metrics.peekDistance > 0 && galleryRevealProgressRef.current < 1) {
      const attemptedScroll = isMirrored
        ? metrics.maxScrollLeft - metrics.gallery.scrollLeft
        : metrics.gallery.scrollLeft;

      if (attemptedScroll > PROJECT_GALLERY_OVERFLOW_EPSILON_PX) {
        metrics.gallery.scrollLeft = isMirrored ? metrics.maxScrollLeft : 0;
        applyGalleryVirtualOffset(
          galleryRevealProgressRef.current * metrics.peekDistance +
            attemptedScroll,
          metrics,
        );
      }
    }

    syncTugVisibility(metrics);
  }, [
    applyGalleryVirtualOffset,
    getGalleryMotionMetrics,
    initializeGalleryPosition,
    isMirrored,
    syncTugVisibility,
  ]);

  const scheduleNativeGallerySync = useCallback(() => {
    if (scrollSyncFrameRef.current !== null) {
      return;
    }

    scrollSyncFrameRef.current = requestAnimationFrame(() => {
      scrollSyncFrameRef.current = null;
      syncNativeGalleryPosition();
    });
  }, [syncNativeGalleryPosition]);

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

  const scrollGallery = useCallback(
    (direction: "left" | "right") => {
      const metrics = getGalleryMotionMetrics();

      if (!metrics || !metrics.hasMeaningfulOverflow) return;

      const { gallery, totalVirtualDistance } = metrics;

      //Mobile keeps its true one-shot-per-view carousel behavior. Tablet keeps
      //the normal horizontal scroller. The two-stage reveal belongs to desktop.
      if (!isDesktopPeekModeRef.current) {
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
      const currentOffset = getGalleryVirtualOffset(metrics);

      //Frontend's forward/open action is the RIGHT arrow. Backend mirrors that
      //control language: its forward/open action is the LEFT arrow. Both still
      //advance the same normalized virtual track, so click motion stays exactly
      //continuous with dragging and with the reveal-to-native-scroll handoff.
      const isForwardAction = isMirrored
        ? direction === "left"
        : direction === "right";
      const targetOffset = Math.min(
        Math.max(currentOffset + (isForwardAction ? distance : -distance), 0),
        totalVirtualDistance,
      );

      gsap.killTweensOf(galleryMotionRef.current);
      galleryMotionRef.current.value = currentOffset;
      isGalleryAnimatingRef.current = true;

      gsap.to(galleryMotionRef.current, {
        value: targetOffset,
        duration: 0.52,
        ease: "power3.inOut",
        overwrite: true,
        onUpdate: () => {
          applyGalleryVirtualOffset(galleryMotionRef.current.value, metrics);
        },
        onComplete: () => {
          isGalleryAnimatingRef.current = false;
          syncTugVisibility(metrics);
        },
        onInterrupt: () => {
          isGalleryAnimatingRef.current = false;
          syncTugVisibility(metrics);
        },
      });
    },
    [
      applyGalleryVirtualOffset,
      getGalleryMotionMetrics,
      getGalleryVirtualOffset,
      isMirrored,
      isMobileGallery,
      syncTugVisibility,
    ],
  );

  const resetGalleryHoverState = useCallback(() => {
    const shell = galleryShellRef.current;

    if (!shell) return;

    const surfaces = shell.querySelectorAll<HTMLElement>(
      ".project-gallery-liquid-glass",
    );

    surfaces.forEach((surface) => {
      surface.style.setProperty("--glass-rotate-x", "0deg");
      surface.style.setProperty("--glass-rotate-y", "0deg");
    });
  }, []);

  const flushDragFrame = useCallback(() => {
    dragFrameRef.current = null;

    const gallery = galleryRef.current;
    const startX = dragStartXRef.current;
    const metrics = getGalleryMotionMetrics();

    if (!gallery || startX === null || !metrics || !isDraggingRef.current) {
      return;
    }

    const travel = latestDragXRef.current - startX;

    if (Math.abs(travel) < PROJECT_GALLERY_DRAG_DEAD_ZONE_PX) {
      return;
    }

    if (isDesktopPeekModeRef.current) {
      //Treat reveal distance + real native scroll as one continuous virtual
      //track. Frontend advances when dragging LEFT. Backend is the exact
      //horizontal mirror and advances when dragging RIGHT.
      applyGalleryVirtualOffset(
        dragStartVirtualOffsetRef.current + (isMirrored ? travel : -travel),
        metrics,
      );
    } else {
      //Tablet/mobile retain the ordinary gallery gesture in both sections.
      //The Backend reflection is a desktop composition effect, not RTL mode.
      gallery.scrollLeft = dragStartScrollLeftRef.current - travel;
    }

    syncTugVisibility(metrics);
  }, [
    applyGalleryVirtualOffset,
    getGalleryMotionMetrics,
    isMirrored,
    syncTugVisibility,
  ]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const gallery = galleryRef.current;

      if (!gallery) return;

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      gsap.killTweensOf(galleryMotionRef.current);
      isGalleryAnimatingRef.current = false;
      isDraggingRef.current = true;
      dragPointerIdRef.current = event.pointerId;
      dragStartXRef.current = event.clientX;
      latestDragXRef.current = event.clientX;
      dragStartScrollLeftRef.current = gallery.scrollLeft;
      dragStartVirtualOffsetRef.current = getGalleryVirtualOffset();

      galleryShellRef.current?.setAttribute("data-dragging", "true");
      resetGalleryHoverState();
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [getGalleryVirtualOffset, resetGalleryHoverState],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (
        !isDraggingRef.current ||
        dragPointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      latestDragXRef.current = event.clientX;

      if (dragFrameRef.current !== null) {
        return;
      }

      dragFrameRef.current = requestAnimationFrame(flushDragFrame);
    },
    [flushDragFrame],
  );

  const finishDragging = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (
        dragPointerIdRef.current !== null &&
        dragPointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      latestDragXRef.current = event.clientX;

      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
        flushDragFrame();
      }

      isDraggingRef.current = false;
      dragPointerIdRef.current = null;
      dragStartXRef.current = null;
      galleryShellRef.current?.setAttribute("data-dragging", "false");
      resetGalleryHoverState();

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      scheduleNativeGallerySync();
    },
    [flushDragFrame, resetGalleryHoverState, scheduleNativeGallerySync],
  );

  useEffect(() => {
    const mobileQuery = window.matchMedia(PROJECT_GALLERY_MOBILE_QUERY);
    const desktopQuery = window.matchMedia(PROJECT_GALLERY_DESKTOP_QUERY);

    const syncGalleryMode = () => {
      isDesktopPeekModeRef.current = desktopQuery.matches;
      setIsMobileGallery(mobileQuery.matches);
      shouldInitializeDesktopPeekRef.current = true;
      galleryMetricsRef.current = null;

      requestAnimationFrame(() => {
        const metrics = measureGalleryMotionMetrics();

        if (!metrics) return;

        initializeGalleryPosition(metrics);
        syncTugVisibility(metrics);
      });
    };

    syncGalleryMode();
    mobileQuery.addEventListener("change", syncGalleryMode);
    desktopQuery.addEventListener("change", syncGalleryMode);

    return () => {
      mobileQuery.removeEventListener("change", syncGalleryMode);
      desktopQuery.removeEventListener("change", syncGalleryMode);
    };
  }, [
    initializeGalleryPosition,
    measureGalleryMotionMetrics,
    syncTugVisibility,
  ]);

  useEffect(() => {
    const gallery = galleryRef.current;

    if (!gallery) return;

    const syncGalleryGeometry = () => {
      if (geometryFrameRef.current !== null) {
        cancelAnimationFrame(geometryFrameRef.current);
      }

      geometryFrameRef.current = requestAnimationFrame(() => {
        geometryFrameRef.current = null;
        const nextHeight = gallery.clientHeight;

        setGalleryHeight((current) =>
          Math.abs(current - nextHeight) < 0.5 ? current : nextHeight,
        );

        galleryMetricsRef.current = null;
        const metrics = measureGalleryMotionMetrics();

        if (!metrics) return;

        initializeGalleryPosition(metrics);
        syncTugVisibility(metrics);
      });
    };

    syncGalleryGeometry();

    const resizeObserver = new ResizeObserver(syncGalleryGeometry);
    resizeObserver.observe(gallery);

    return () => {
      if (geometryFrameRef.current !== null) {
        cancelAnimationFrame(geometryFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [
    initializeGalleryPosition,
    measureGalleryMotionMetrics,
    syncTugVisibility,
  ]);

  //The gallery viewport itself may not resize when the masonry columns change
  //width, so explicitly re-measure overflow after the settled ratio/layout pass.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      galleryMetricsRef.current = null;
      const metrics = measureGalleryMotionMetrics();

      if (!metrics) return;

      initializeGalleryPosition(metrics);
      syncTugVisibility(metrics);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    galleryHeight,
    imageRatios,
    initializeGalleryPosition,
    isMobileGallery,
    measureGalleryMotionMetrics,
    syncTugVisibility,
  ]);

  useEffect(() => {
    const gallery = galleryRef.current;

    if (!gallery) return;

    gsap.killTweensOf(galleryMotionRef.current);
    isGalleryAnimatingRef.current = false;
    shouldInitializeDesktopPeekRef.current = true;
    galleryRevealProgressRef.current = 1;
    galleryMetricsRef.current = null;
    galleryShellRef.current?.style.setProperty(
      "--project-gallery-peek-x",
      "0%",
    );

    const frame = requestAnimationFrame(() => {
      const metrics = measureGalleryMotionMetrics();

      if (!metrics) return;

      if (isDesktopPeekModeRef.current && isMirrored) {
        gallery.scrollLeft = metrics.maxScrollLeft;
      } else {
        gallery.scrollLeft = 0;
      }

      initializeGalleryPosition(metrics);
      syncTugVisibility(metrics);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    initializeGalleryPosition,
    isMirrored,
    orientation,
    projectTitle,
    measureGalleryMotionMetrics,
    syncTugVisibility,
  ]);

  useEffect(() => {
    return () => {
      gsap.killTweensOf(galleryMotionRef.current);

      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current);
      }
      if (scrollSyncFrameRef.current !== null) {
        cancelAnimationFrame(scrollSyncFrameRef.current);
      }
      if (geometryFrameRef.current !== null) {
        cancelAnimationFrame(geometryFrameRef.current);
      }
    };
  }, []);

  const masonryColumns = useMemo(
    () => buildPackedMasonryColumns(screenshots, imageRatios, galleryHeight),
    [galleryHeight, imageRatios, screenshots],
  );

  const renderedMasonryColumns = useMemo(
    () => (isMirrored ? [...masonryColumns].reverse() : masonryColumns),
    [isMirrored, masonryColumns],
  );

  if (screenshots.length === 0) {
    return null;
  }

  const renderScreenshotMedia = (
    screenshot: RenderableProjectScreenshot,
    index: number,
  ) => (
    <div
      className={`${orientation}-project-shot project-gallery-shot h-full min-h-0 w-full`}
    >
      <LiquidGlass
        className="h-full min-h-0 w-full rounded-[clamp(0.68rem,0.9vw,0.95rem)]"
        orientation={orientation}
      >
        <img
          alt={screenshot.alt}
          className="block h-full w-full select-none object-cover"
          decoding="async"
          draggable={false}
          loading={index < 2 ? "eager" : "lazy"}
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
      </LiquidGlass>
    </div>
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
    <div
      className={`${orientation}-project-gallery-shell project-gallery-shell relative h-full min-h-0 w-full overflow-visible`}
      data-dragging="false"
      data-orientation={orientation}
      ref={galleryShellRef}
    >
      <style>{`
        .project-gallery-shell {
          --project-gallery-peek-x: 0%;
          contain: layout style;
        }

        .project-gallery-clip {
          contain: paint;
        }

        .project-gallery-liquid-glass {
          --glass-rotate-x: 0deg;
          --glass-rotate-y: 0deg;

          background: rgba(255, 255, 255, 0.025);
          backface-visibility: hidden;
          transform:
            perspective(900px)
            rotateX(var(--glass-rotate-x))
            rotateY(var(--glass-rotate-y))
            translateZ(0);
          transform-origin: center center;
          transform-style: preserve-3d;
          transition: transform 135ms cubic-bezier(.18,.78,.2,1);
          will-change: transform;
          box-shadow:
            inset 1px 1px 0 rgba(255, 255, 255, 0.5),
            inset -1px -1px 0 rgba(255, 255, 255, 0.1);
        }

        /*
          The section timeline owns this wrapper's x/y/scale. The complete
          screenshot surface lives one level deeper and owns the hover tilt, so
          the image, rounded corners and optical edge all bend as one object
          without a stationary outer frame clipping the transformed media.
        */
        .project-gallery-shot {
          transform-origin: center center;
          overflow: visible;
        }

        .project-gallery-liquid-content {
          backface-visibility: hidden;
          transform: translateZ(0);
        }

        /*
          During a drag the gallery motion itself is the visual priority. Freeze
          the hover tilt and its transition so the compositor is not resolving a
          second transform animation on every screenshot while scrollLeft moves.
        */
        .project-gallery-shell[data-dragging="true"] .project-gallery-liquid-glass {
          --glass-rotate-x: 0deg !important;
          --glass-rotate-y: 0deg !important;
          transition: none;
        }

        .project-gallery-liquid-glass::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 20;
          border-radius: inherit;
          padding: 1px;
          background:
            linear-gradient(
              115deg,
              rgba(255, 255, 255, 0.7),
              rgba(180, 226, 255, 0.16) 24%,
              rgba(255, 255, 255, 0.08) 48%,
              rgba(255, 190, 221, 0.12) 74%,
              rgba(255, 255, 255, 0.46)
            );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.58;
        }

        .project-gallery-scroll {
          -webkit-overflow-scrolling: touch;
          user-select: none;
        }

        .project-gallery-scroll::-webkit-scrollbar {
          display: none;
        }

        @media (min-width: 1181px) {
          .project-gallery-peek,
          .project-gallery-opening-tug-track {
            transform: translate3d(var(--project-gallery-peek-x), 0, 0);
            will-change: transform;
          }
        }

        /*
          The arrows remain click-only controls; dragging is still owned by the
          gallery surface. On wide desktop the OPENING arrow lives on a separate
          transform track that inherits the gallery's exact peek translation,
          so it rides the exposed leading edge of the screenshot wall itself.
          The CLOSING arrow stays at the details-side edge where the old opening
          control lived, preventing it from floating in the empty outer space.
        */
        .project-gallery-opening-tug-track {
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 40;
        }

        .project-gallery-tug {
          position: absolute;
          top: 50%;
          z-index: 40;
          display: flex;
          width: clamp(2rem, 2.55vw, 2.55rem);
          height: clamp(2rem, 2.55vw, 2.55rem);
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.42);
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.42);
          color: rgba(23, 23, 23, 0.72);
          box-shadow: 0 8px 28px rgba(23, 23, 23, 0.08);
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(-50%) scale(0.94);
          transition:
            opacity 150ms ease,
            transform 170ms cubic-bezier(.2,.8,.2,1),
            background-color 150ms ease;
        }

        .project-gallery-tug-left {
          left: 0;
          transform: translate(-55%, -50%) scale(0.94);
        }

        .project-gallery-tug-right {
          right: 0;
          transform: translate(55%, -50%) scale(0.94);
        }

        .project-gallery-tug[data-visible="true"] {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .project-gallery-tug-left[data-visible="true"] {
          transform: translate(-55%, -50%) scale(1);
        }

        .project-gallery-tug-right[data-visible="true"] {
          transform: translate(55%, -50%) scale(1);
        }

        .project-gallery-tug[data-visible="true"]:hover {
          background: rgba(255, 255, 255, 0.62);
          transform: translateY(-50%) scale(1.05);
        }

        .project-gallery-tug-left[data-visible="true"]:hover {
          transform: translate(-55%, -50%) scale(1.05);
        }

        .project-gallery-tug-right[data-visible="true"]:hover {
          transform: translate(55%, -50%) scale(1.05);
        }

        .project-gallery-tug:focus-visible {
          outline: 2px solid rgba(23, 23, 23, 0.18);
          outline-offset: 2px;
        }

        @media (min-width: 1181px) {
          /*
            Frontend opens with the RIGHT arrow, but that arrow belongs on the
            translated gallery's exposed LEFT tip. Backend mirrors this exactly:
            its LEFT opening arrow belongs on the exposed RIGHT tip. Keep a tiny
            inset so the circular control visibly sits ON the screenshot edge.
          */
          .project-gallery-opening-tug-track[data-orientation="frontend"]
            .project-gallery-tug-open {
            left: clamp(0.2rem, 0.35vw, 0.35rem);
            right: auto;
            transform: translateY(-50%) scale(0.94);
          }

          .project-gallery-opening-tug-track[data-orientation="frontend"]
            .project-gallery-tug-open[data-visible="true"] {
            transform: translateY(-50%) scale(1);
          }

          .project-gallery-opening-tug-track[data-orientation="frontend"]
            .project-gallery-tug-open[data-visible="true"]:hover {
            transform: translateY(-50%) scale(1.05);
          }

          .project-gallery-opening-tug-track[data-orientation="backend"]
            .project-gallery-tug-open {
            left: auto;
            right: clamp(0.2rem, 0.35vw, 0.35rem);
            transform: translateY(-50%) scale(0.94);
          }

          .project-gallery-opening-tug-track[data-orientation="backend"]
            .project-gallery-tug-open[data-visible="true"] {
            transform: translateY(-50%) scale(1);
          }

          .project-gallery-opening-tug-track[data-orientation="backend"]
            .project-gallery-tug-open[data-visible="true"]:hover {
            transform: translateY(-50%) scale(1.05);
          }

          /*
            The reverse/closing control takes over the ORIGINAL opening-control
            location next to the project details: right side for Frontend, left
            side for Backend. Its arrow direction itself never changes.
          */
          .project-gallery-shell[data-orientation="frontend"]
            > .project-gallery-tug-close {
            left: auto;
            right: 0;
            transform: translate(55%, -50%) scale(0.94);
          }

          .project-gallery-shell[data-orientation="frontend"]
            > .project-gallery-tug-close[data-visible="true"] {
            transform: translate(55%, -50%) scale(1);
          }

          .project-gallery-shell[data-orientation="frontend"]
            > .project-gallery-tug-close[data-visible="true"]:hover {
            transform: translate(55%, -50%) scale(1.05);
          }

          .project-gallery-shell[data-orientation="backend"]
            > .project-gallery-tug-close {
            left: 0;
            right: auto;
            transform: translate(-55%, -50%) scale(0.94);
          }

          .project-gallery-shell[data-orientation="backend"]
            > .project-gallery-tug-close[data-visible="true"] {
            transform: translate(-55%, -50%) scale(1);
          }

          .project-gallery-shell[data-orientation="backend"]
            > .project-gallery-tug-close[data-visible="true"]:hover {
            transform: translate(-55%, -50%) scale(1.05);
          }
        }

        @media (max-width: 680px) {
          .project-gallery-tug {
            width: 2rem;
            height: 2rem;
          }

          .project-gallery-tug-left,
          .project-gallery-tug-left[data-visible="true"],
          .project-gallery-tug-left[data-visible="true"]:hover {
            left: 0.45rem;
            transform: translate(0, -50%) scale(1);
          }

          .project-gallery-tug-right,
          .project-gallery-tug-right[data-visible="true"],
          .project-gallery-tug-right[data-visible="true"]:hover {
            right: 0.45rem;
            transform: translate(0, -50%) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .project-gallery-liquid-glass {
            transform: none;
            transition: none;
          }

          .project-gallery-tug {
            transition: none;
          }
        }
      `}</style>

      <div className="project-gallery-clip absolute inset-0 overflow-hidden max-[680px]:rounded-[0.9rem]">
        <div
          className={`${orientation}-project-gallery-peek project-gallery-peek relative h-full min-h-0 w-full`}
        >
          <div
            aria-label={`${projectTitle} screenshot gallery`}
            className={`${orientation}-project-gallery project-gallery-scroll pointer-events-auto h-full min-h-0 w-full cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain active:cursor-grabbing`}
            onLostPointerCapture={finishDragging}
            onPointerCancel={finishDragging}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDragging}
            onScroll={scheduleNativeGallerySync}
            ref={galleryRef}
            role="region"
            style={{
              scrollbarWidth: "none",
              //Desktop/tablet proximity snapping fought custom pointer dragging.
              //Only the phone carousel needs mandatory one-card-at-a-time snap.
              scrollSnapType: isMobileGallery ? "x mandatory" : "none",
              //Horizontal movement is owned by this component; vertical touch
              //movement remains available to the page/section scroll controller.
              touchAction: "pan-y",
            }}
            tabIndex={0}
          >
            {isMobileGallery ? (
              <div
                className="flex h-full min-w-full items-stretch"
                style={{ gap: `${PROJECT_GALLERY_MASONRY_GAP_PX}px` }}
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
                className={`flex h-full w-max min-w-full items-stretch ${
                  isMirrored ? "justify-start" : "justify-end"
                }`}
                style={{
                  gap: `${PROJECT_GALLERY_MASONRY_GAP_PX}px`,
                }}
              >
                {renderedMasonryColumns.map((column, columnIndex) => (
                  <div
                    className="flex h-full shrink-0 flex-col"
                    key={`masonry-column-${columnIndex}`}
                    style={{
                      gap: `${PROJECT_GALLERY_MASONRY_GAP_PX}px`,
                      width: `${column.width}px`,
                    }}
                  >
                    {column.items.map((item) =>
                      wrapScreenshot(item.screenshot, item.index, {
                        height: `${item.height}px`,
                        width: "100%",
                      }),
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="project-gallery-opening-tug-track"
        data-orientation={orientation}
      >
        <button
          aria-label={`Reveal ${projectTitle} screenshots`}
          className={`project-gallery-tug project-gallery-tug-open ${
            isMirrored
              ? "project-gallery-tug-left"
              : "project-gallery-tug-right"
          } pointer-events-auto cursor-pointer`}
          onClick={() => scrollGallery(isMirrored ? "left" : "right")}
          ref={isMirrored ? leftTugRef : rightTugRef}
          type="button"
        >
          <GalleryArrowIcon direction={isMirrored ? "right" : "left"} />
        </button>
      </div>

      <button
        aria-label={`Move ${projectTitle} screenshots back`}
        className={`project-gallery-tug project-gallery-tug-close ${
          isMirrored ? "project-gallery-tug-right" : "project-gallery-tug-left"
        } pointer-events-auto cursor-pointer`}
        onClick={() => scrollGallery(isMirrored ? "right" : "left")}
        ref={isMirrored ? rightTugRef : leftTugRef}
        type="button"
      >
        <GalleryArrowIcon direction={isMirrored ? "left" : "right"} />
      </button>
    </div>
  );
}
