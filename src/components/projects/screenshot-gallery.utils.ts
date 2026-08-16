import type { CSSProperties } from "react";

export type ProjectScreenshot = {
  src: string | null;
  alt: string;
  objectPosition?: CSSProperties["objectPosition"];
  aspectRatio?: number;
};

export type RenderableProjectScreenshot = ProjectScreenshot & { src: string };

export type ProjectScreenshotGalleryOrientation = "frontend" | "backend";

export function hasScreenshotSource(
  screenshot: ProjectScreenshot,
): screenshot is RenderableProjectScreenshot {
  return Boolean(screenshot.src);
}
