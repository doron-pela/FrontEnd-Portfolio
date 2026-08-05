import gsap from "gsap";

import type { ScrollSectionRuntime } from "@/@types/scroll-locked-section.types";

//Immediately setting the section timeline to an exact boundary also kills any smoothing tween that may still be trying to move its progress.
//This prevents a previously-created local progress tween from surviving a release and making a section visible again after it should already be hidden at 0 or 1.
export function setScrollSectionProgressImmediately<Section extends string>(
  runtime: ScrollSectionRuntime<Section>,
  progress: number,
) {
  runtime.progressRef.current = progress;

  const timeline = runtime.timelineRef.current;

  if (!timeline) {
    return;
  }

  gsap.killTweensOf(timeline);
  timeline.progress(progress);
}
